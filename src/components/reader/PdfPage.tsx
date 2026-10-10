import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { TextLayer } from 'pdfjs-dist';
import type { PDFDocumentProxy, PageViewport, RenderTask } from 'pdfjs-dist';
import type { AnnotationTool } from '../../hooks/useAnnotationTool';
import type { AnnotationDraft } from '../../repositories/annotationRepository';
import type { Annotation, Language } from '../../types';
import { AnnotationLayer } from '../annotations/AnnotationLayer';

interface PdfPageProps {
  document: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  searchQuery: string;
  annotations: Annotation[];
  translationAnnotations?: Annotation[];
  annotationTool: AnnotationTool;
  annotationColor: string;
  selectedAnnotationId?: string;
  language: Language;
  translationStatus?: ReadonlyMap<string, string>;
  onViewportReady: (page: number, viewport: PageViewport) => void;
  onCreateAnnotation: (draft: AnnotationDraft) => Promise<Annotation>;
  onSelectAnnotation: (id: string) => void;
  onUpdateAnnotation: (
    annotationId: string,
    patch: Partial<Pick<Annotation, 'comment' | 'color'>>,
  ) => Promise<unknown>;
  onDeleteAnnotation: (annotationId: string) => Promise<void>;
  forceRender?: boolean;
}

interface PdfExternalLink {
  id: string;
  href: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

function externalLink(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function PdfPage({
  document,
  pageNumber,
  scale,
  searchQuery,
  annotations,
  translationAnnotations = [],
  annotationTool,
  annotationColor,
  selectedAnnotationId,
  language,
  translationStatus,
  onViewportReady,
  onCreateAnnotation,
  onSelectAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  forceRender = false,
}: PdfPageProps) {
  const root = useRef<HTMLDivElement>(null);
  const canvasLayer = useRef<HTMLDivElement>(null);
  const textLayerHost = useRef<HTMLDivElement>(null);
  const activeRenderTask = useRef<RenderTask | undefined>(undefined);
  const committedScale = useRef(scale);
  const [nearViewport, setNearViewport] = useState(pageNumber <= 2);
  const [size, setSize] = useState({ width: 612 * scale, height: 792 * scale });
  const [viewport, setViewport] = useState<PageViewport>();
  const [externalLinks, setExternalLinks] = useState<PdfExternalLink[]>([]);
  const [error, setError] = useState('');
  const totalScaleFactor = (viewport?.scale ?? scale) * (viewport?.userUnit ?? 1);

  useEffect(() => {
    if (forceRender) {
      setNearViewport(true);
      return;
    }
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { root: element.closest('.reader-scroll'), rootMargin: '1200px 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [forceRender]);

  useEffect(() => {
    if (!nearViewport) setSize({ width: 612 * scale, height: 792 * scale });
  }, [nearViewport, scale]);

  useLayoutEffect(() => {
    if (!nearViewport || !viewport || Math.abs(committedScale.current - scale) < .001) return;
    const ratio = scale / committedScale.current;
    const nextSize = {
      width: viewport.width * ratio,
      height: viewport.height * ratio,
    };
    const rootElement = root.current;
    if (rootElement) {
      rootElement.style.width = `${nextSize.width}px`;
      rootElement.style.height = `${nextSize.height}px`;
    }
    const visibleCanvas = canvasLayer.current?.querySelector('canvas');
    if (visibleCanvas) {
      visibleCanvas.style.width = `${nextSize.width}px`;
      visibleCanvas.style.height = `${nextSize.height}px`;
    }
    setSize(nextSize);
  }, [nearViewport, scale, viewport]);

  useEffect(() => {
    if (!nearViewport || !canvasLayer.current || !textLayerHost.current) return;
    let cancelled = false;
    let renderTask: RenderTask | undefined;
    let renderCompleted = false;
    let layer: TextLayer | undefined;
    const render = async () => {
      try {
        const previousRenderTask = activeRenderTask.current;
        if (previousRenderTask) {
          previousRenderTask.cancel();
          await previousRenderTask.promise.catch(() => undefined);
          if (activeRenderTask.current === previousRenderTask) {
            activeRenderTask.current = undefined;
          }
        }
        if (cancelled) return;
        const page = await document.getPage(pageNumber);
        if (cancelled) return;
        const pageAnnotations = await page.getAnnotations({ intent: 'display' }).catch(() => []);
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const links = pageAnnotations.flatMap((item, index): PdfExternalLink[] => {
          if (item.subtype !== 'Link' || !Array.isArray(item.rect) || item.rect.length !== 4) return [];
          const href = externalLink(item.url);
          if (!href || !item.rect.every((value: unknown) => typeof value === 'number' && Number.isFinite(value))) return [];
          const [x1, y1] = viewport.convertToViewportPoint(item.rect[0], item.rect[1]) as [number, number];
          const [x2, y2] = viewport.convertToViewportPoint(item.rect[2], item.rect[3]) as [number, number];
          return [{
            id: typeof item.id === 'string' ? item.id : `${pageNumber}-${index}`,
            href,
            left: Math.min(x1, x2),
            top: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
          }];
        });
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        const nextCanvas = window.document.createElement('canvas');
        const nextTextLayer = window.document.createElement('div');
        nextTextLayer.className = 'textLayer';
        nextCanvas.width = Math.floor(viewport.width * outputScale);
        nextCanvas.height = Math.floor(viewport.height * outputScale);
        nextCanvas.style.width = `${viewport.width}px`;
        nextCanvas.style.height = `${viewport.height}px`;
        renderTask = page.render({
          canvas: nextCanvas,
          viewport,
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
        });
        activeRenderTask.current = renderTask;
        const textContent = await page.getTextContent();
        if (cancelled) return;
        layer = new TextLayer({
          textContentSource: textContent,
          container: nextTextLayer,
          viewport,
        });
        await Promise.all([renderTask.promise, layer.render()]);
        renderCompleted = true;
        if (cancelled) return;
        const rootElement = root.current;
        const canvasLayerElement = canvasLayer.current;
        const textLayerElement = textLayerHost.current;
        if (!rootElement || !canvasLayerElement || !textLayerElement) return;
        rootElement.style.width = `${viewport.width}px`;
        rootElement.style.height = `${viewport.height}px`;
        canvasLayerElement.replaceChildren(nextCanvas);
        textLayerElement.replaceChildren(nextTextLayer);
        committedScale.current = scale;
        setSize({ width: viewport.width, height: viewport.height });
        setViewport(viewport);
        setExternalLinks(links);
        onViewportReady(pageNumber, viewport);
        setError('');
      } catch (reason) {
        if (!cancelled && !(reason instanceof Error && reason.name === 'RenderingCancelledException')) {
          setError(reason instanceof Error ? reason.message : 'Page rendering failed.');
        }
      } finally {
        if (renderTask) {
          if (!renderCompleted) renderTask.cancel();
          await renderTask.promise.catch(() => undefined);
          if (activeRenderTask.current === renderTask) {
            activeRenderTask.current = undefined;
          }
        }
      }
    };
    void render();
    return () => {
      cancelled = true;
      renderTask?.cancel();
      layer?.cancel();
    };
  }, [document, nearViewport, onViewportReady, pageNumber, scale]);

  return <section
    ref={root}
    id={`page-${pageNumber}`}
    className="pdf-page"
    data-page={pageNumber}
    aria-label={`Page ${pageNumber}`}
    style={{
      width: size.width,
      height: size.height,
      '--scale-factor': viewport?.scale ?? scale,
      '--user-unit': viewport?.userUnit ?? 1,
      '--total-scale-factor': totalScaleFactor,
      '--scale-round-x': '1px',
      '--scale-round-y': '1px',
    } as CSSProperties}
  >
    {nearViewport ? <>
      <div ref={canvasLayer} className="pdf-canvas-layer" />
      <div ref={textLayerHost} className="pdf-text-layer-host" />
      <div className="pdf-link-layer">
        {externalLinks.map((link) => <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open external link: ${link.href}`}
          title={link.href}
          style={{
            left: link.left,
            top: link.top,
            width: link.width,
            height: link.height,
          }}
        />)}
      </div>
      {viewport && <AnnotationLayer
        viewport={viewport}
        annotations={annotations}
        translationAnnotations={translationAnnotations}
        tool={annotationTool}
        color={annotationColor}
        selectedId={selectedAnnotationId}
        language={language}
        translationStatus={translationStatus}
        onCreate={(draft) => onCreateAnnotation({ ...draft, page: pageNumber })}
        onSelect={onSelectAnnotation}
        onUpdate={onUpdateAnnotation}
        onDelete={onDeleteAnnotation}
      />}
      {searchQuery && <div className="page-search-marker" title={`Search active: ${searchQuery}`} />}
      {error && <div className="page-render-error">{error}</div>}
    </> : <div className="page-placeholder">Page {pageNumber}</div>}
  </section>;
}
