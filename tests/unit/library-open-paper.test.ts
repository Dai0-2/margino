import { describe, expect, it } from 'vitest';
import { libraryPaperLaunchTarget } from '../../src/services/library/openPaper';

describe('library paper launch routing', () => {
  it('opens arXiv papers through the public host page', () => {
    const target = libraryPaperLaunchTarget({
      id: 'arxiv:2609.04172',
      arxivId: '2609.04172',
      title: 'Rethinking On-Policy Distillation',
      url: 'https://arxiv.org/pdf/2609.04172',
    });

    expect(target.kind).toBe('web');
    if (target.kind !== 'web') throw new Error('Expected a public web target.');
    const url = new URL(target.url);
    expect(url.origin).toBe('https://arxiv.org');
    expect(url.pathname).toBe('/abs/2609.04172');
    expect(url.searchParams.get('paperflowReader')).toBe('1');
  });

  it('normalizes saved arXiv abstract links to the PDF reader flow', () => {
    const target = libraryPaperLaunchTarget({
      id: 'arxiv:2609.04172',
      arxivId: '2609.04172',
      title: 'Paper title',
      url: 'https://www.arxiv.org/abs/2609.04172',
    });

    expect(target.kind).toBe('web');
    if (target.kind !== 'web') throw new Error('Expected a public web target.');
    expect(new URL(target.url).pathname).toBe('/abs/2609.04172');
  });

  it('opens ScienceDirect PDF links through the public article host page', () => {
    const source = 'https://www.sciencedirect.com/science/article/pii/S0924271626002649/pdfft'
      + '?pid=1-s2.0-S0924271626002649-main.pdf';
    const target = libraryPaperLaunchTarget({
      id: 'doi:10.1016/example',
      title: 'ScienceDirect paper',
      url: source,
    });

    expect(target.kind).toBe('web');
    if (target.kind !== 'web') throw new Error('Expected a public web target.');
    const url = new URL(target.url);
    expect(url.pathname).toBe('/science/article/pii/S0924271626002649');
    expect(url.searchParams.get('paperflowReader')).toBe('1');
    expect(url.searchParams.get('paperflowPdf')).toBe(source);
  });

  it('keeps non-arXiv papers in the extension reader', () => {
    const target = libraryPaperLaunchTarget({
      id: 'doi:10.1000/example',
      title: 'Example paper',
      url: 'https://example.org/paper.pdf',
    });

    expect(target.kind).toBe('extension');
    if (target.kind !== 'extension') throw new Error('Expected an extension target.');
    const url = new URL(target.path, 'chrome-extension://paperflow/');
    expect(url.pathname).toBe('/reader.html');
    expect(url.searchParams.get('paperId')).toBe('doi:10.1000/example');
    expect(url.searchParams.get('url')).toBe('https://example.org/paper.pdf');
  });
});
