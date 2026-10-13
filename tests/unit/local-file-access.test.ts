import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canInspectLocalFileAccess,
  extensionSettingsUrl,
  isLocalFileAccessAllowed,
  isLocalFileUrl,
  openExtensionSettings,
} from '../../src/services/localFileAccess';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('local file access', () => {
  it('recognizes only file scheme URLs', () => {
    expect(isLocalFileUrl('file:///Users/researcher/paper.pdf')).toBe(true);
    expect(isLocalFileUrl('https://example.org/paper.pdf')).toBe(false);
    expect(isLocalFileUrl('not a URL')).toBe(false);
  });

  it('reports the user-controlled Chrome file access state', async () => {
    const isAllowedFileSchemeAccess = vi.fn(async () => true);
    vi.stubGlobal('chrome', {
      runtime: { id: 'paperflow-test' },
      extension: { isAllowedFileSchemeAccess },
    });

    expect(canInspectLocalFileAccess()).toBe(true);
    await expect(isLocalFileAccessAllowed()).resolves.toBe(true);
    expect(isAllowedFileSchemeAccess).toHaveBeenCalledOnce();
  });

  it('opens the current extension detail page for permission changes', () => {
    const create = vi.fn(async () => undefined);
    vi.stubGlobal('chrome', {
      runtime: { id: 'paperflow-test' },
      tabs: { create },
    });

    expect(extensionSettingsUrl()).toBe('chrome://extensions/?id=paperflow-test');
    openExtensionSettings();
    expect(create).toHaveBeenCalledWith({
      url: 'chrome://extensions/?id=paperflow-test',
    });
  });
});
