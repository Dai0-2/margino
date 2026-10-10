import type { PaperInfo } from '../../types';
import { arxivReaderHostUrl } from '../backgroundRouting';

export type LibraryPaperLaunchTarget =
  | { kind: 'web'; url: string }
  | { kind: 'extension'; path: string };

function arxivPdfUrl(paper: Pick<PaperInfo, 'arxivId' | 'url'>): string | undefined {
  let origin = 'https://arxiv.org';
  let identifier: string | undefined;

  try {
    const url = new URL(paper.url);
    if (url.hostname === 'arxiv.org' || url.hostname === 'www.arxiv.org') {
      origin = url.origin;
      identifier = url.pathname
        .match(/^\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)(?:\.pdf)?\/?$/i)?.[1];
    }
  } catch {
    // Fall back to the structured arXiv identifier below.
  }

  identifier ??= paper.arxivId
    ?.match(/^(\d{4}\.\d{4,5}(?:v\d+)?)$/i)?.[1];
  return identifier ? new URL(`/pdf/${identifier}`, origin).toString() : undefined;
}

export function libraryPaperLaunchTarget(
  paper: Pick<PaperInfo, 'id' | 'arxivId' | 'title' | 'url'>,
): LibraryPaperLaunchTarget {
  const sourceUrl = arxivPdfUrl(paper);
  const arxivHost = sourceUrl
    ? arxivReaderHostUrl(sourceUrl, paper.title)
    : undefined;
  if (arxivHost) return { kind: 'web', url: arxivHost };

  const parameters = new URLSearchParams({ paperId: paper.id });
  if (paper.url) parameters.set('url', paper.url);
  parameters.set('title', paper.title);
  return { kind: 'extension', path: `reader.html?${parameters}` };
}
