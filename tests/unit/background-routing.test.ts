import { describe, expect, it } from 'vitest';
import {
  arxivReaderHostUrl,
  hasRecentRedirectLoop,
  isArxivPdfUrl,
  isDirectPdfUrl,
  isScienceDirectPdfUrl,
  parseBackgroundRequest,
  readerPath,
  redirectGuardFor,
  scienceDirectReaderHostUrl,
} from '../../src/services/backgroundRouting';

describe('background routing', () => {
  it('recognizes direct PDF files and arXiv PDF routes', () => {
    expect(isDirectPdfUrl('https://example.org/paper.pdf?download=1')).toBe(true);
    expect(isDirectPdfUrl('http://example.org/PAPER.PDF#page=2')).toBe(true);
    expect(isDirectPdfUrl('https://arxiv.org/pdf/2604.13016#page=1.00')).toBe(true);
    expect(isDirectPdfUrl('https://www.arxiv.org/pdf/2507.16806v2')).toBe(true);
    expect(isDirectPdfUrl(
      'https://www.sciencedirect.com/science/article/pii/S0924271626002649/pdfft?pid=paper.pdf',
    )).toBe(true);
    expect(isDirectPdfUrl('file:///Users/researcher/Downloads/paper.pdf')).toBe(true);
    expect(isDirectPdfUrl('file:///Users/researcher/Downloads/PAPER.PDF#page=2')).toBe(true);
    expect(isDirectPdfUrl('https://arxiv.org/abs/2604.13016')).toBe(false);
    expect(isDirectPdfUrl('https://example.org/viewer?file=paper.pdf')).toBe(false);
    expect(isDirectPdfUrl('file:///Users/researcher/Downloads/notes.txt')).toBe(false);
    expect(isDirectPdfUrl('chrome-extension://example/reader.pdf')).toBe(false);
  });

  it('creates an arXiv host page that can restore the original PDF URL', () => {
    expect(isArxivPdfUrl('https://arxiv.org/pdf/2507.16806v2#page=4')).toBe(true);
    const host = new URL(arxivReaderHostUrl(
      'https://arxiv.org/pdf/2507.16806v2#page=4',
      'Paper title',
    )!);

    expect(host.origin).toBe('https://arxiv.org');
    expect(host.pathname).toBe('/abs/2507.16806v2');
    expect(host.searchParams.get('paperflowReader')).toBe('1');
    expect(host.searchParams.get('paperflowHash')).toBe('page=4');
    expect(host.searchParams.get('paperflowTitle')).toBe('Paper title');
  });

  it('creates a ScienceDirect host page that preserves the public PDF URL', () => {
    const source = 'https://www.sciencedirect.com/science/article/pii/S0924271626002649/pdfft'
      + '?md5=5e6707557b1d825451194b355575898e'
      + '&pid=1-s2.0-S0924271626002649-main.pdf';
    expect(isScienceDirectPdfUrl(source)).toBe(true);
    const host = new URL(scienceDirectReaderHostUrl(source, 'Paper title')!);

    expect(host.origin).toBe('https://www.sciencedirect.com');
    expect(host.pathname).toBe('/science/article/pii/S0924271626002649');
    expect(host.searchParams.get('paperflowReader')).toBe('1');
    expect(host.searchParams.get('paperflowPdf')).toBe(source);
    expect(host.searchParams.get('paperflowTitle')).toBe('Paper title');
    expect(isScienceDirectPdfUrl(
      'https://www.sciencedirect.com/science/article/pii/S0924271626002649',
    )).toBe(false);
  });

  it('marks Reader launches with a bounded redirect depth', () => {
    const path = readerPath(
      'https://example.org/paper.pdf',
      'Paper title',
      'default-handler',
    );
    const parameters = new URL(path, 'chrome-extension://paperflow/').searchParams;

    expect(parameters.get('paperflowSource')).toBe('default-handler');
    expect(parameters.get('paperflowDepth')).toBe('1');
    expect(parameters.get('autoLoad')).toBeNull();
  });

  it('stops a repeated redirect for the same tab and source URL', () => {
    const now = 10_000;
    const guard = redirectGuardFor('https://example.org/paper.pdf#page=4', now);

    expect(hasRecentRedirectLoop('https://example.org/paper.pdf#page=9', guard, now + 1_000))
      .toBe(true);
    expect(hasRecentRedirectLoop('https://example.org/other.pdf', guard, now + 1_000))
      .toBe(false);
    expect(hasRecentRedirectLoop('https://example.org/paper.pdf', guard, now + 16_000))
      .toBe(false);

    const localGuard = redirectGuardFor('file:///Users/researcher/paper.pdf#page=2', now);
    expect(hasRecentRedirectLoop(
      'file:///Users/researcher/paper.pdf#page=8',
      localGuard,
      now + 1_000,
    )).toBe(true);
  });

  it('creates a conflict screen that does not auto-load the PDF', () => {
    const path = readerPath(
      'https://example.org/paper.pdf',
      '',
      'default-handler',
      'pdf-handler-conflict',
    );
    const parameters = new URL(path, 'chrome-extension://paperflow/').searchParams;

    expect(parameters.get('warning')).toBe('pdf-handler-conflict');
    expect(parameters.get('autoLoad')).toBe('false');
  });

  it('validates background messages and web URL schemes', () => {
    expect(parseBackgroundRequest({ type: 'paperflow:sync-now' }))
      .toEqual({ type: 'paperflow:sync-now' });
    expect(parseBackgroundRequest({ type: 'paperflow:refresh-menus' }))
      .toEqual({ type: 'paperflow:refresh-menus' });
    expect(parseBackgroundRequest({
      type: 'paperflow:save-paper',
      url: 'https://example.org/paper.pdf',
      title: ' Paper ',
    })).toEqual({
      type: 'paperflow:save-paper',
      url: 'https://example.org/paper.pdf',
      title: 'Paper',
    });
    expect(parseBackgroundRequest({
      type: 'paperflow:reader-mounted',
      sourceUrl: 'https://arxiv.org/pdf/2507.16806',
    })).toEqual({
      type: 'paperflow:reader-mounted',
      sourceUrl: 'https://arxiv.org/pdf/2507.16806',
    });
    expect(parseBackgroundRequest({
      type: 'paperflow:reader-unmounting',
      sourceUrl: 'https://arxiv.org/pdf/2507.16806',
    })).toEqual({
      type: 'paperflow:reader-unmounting',
      sourceUrl: 'https://arxiv.org/pdf/2507.16806',
    });
    expect(parseBackgroundRequest({
      type: 'paperflow:reader-mounted',
      sourceUrl: 'https://www.sciencedirect.com/science/article/pii/S0924271626002649/pdfft'
        + '?pid=1-s2.0-S0924271626002649-main.pdf',
    })).toEqual({
      type: 'paperflow:reader-mounted',
      sourceUrl: 'https://www.sciencedirect.com/science/article/pii/S0924271626002649/pdfft'
        + '?pid=1-s2.0-S0924271626002649-main.pdf',
    });
    expect(parseBackgroundRequest({
      type: 'paperflow:reader-mounted',
      sourceUrl: 'https://example.org/paper.pdf',
    })).toBeUndefined();
    expect(parseBackgroundRequest({
      type: 'paperflow:save-paper',
      url: 'file:///private/paper.pdf',
    })).toBeUndefined();
    expect(parseBackgroundRequest({ type: 'paperflow:unknown' })).toBeUndefined();
  });
});
