export const LOCAL_FILE_ORIGIN = 'file:///*';

export function isLocalFileUrl(rawUrl: string): boolean {
  try {
    return new URL(rawUrl).protocol === 'file:';
  } catch {
    return false;
  }
}

export function canInspectLocalFileAccess(): boolean {
  return typeof chrome !== 'undefined'
    && Boolean(chrome.runtime?.id && chrome.extension?.isAllowedFileSchemeAccess);
}

export async function isLocalFileAccessAllowed(): Promise<boolean> {
  if (!canInspectLocalFileAccess()) return false;
  try {
    return await chrome.extension.isAllowedFileSchemeAccess();
  } catch {
    return false;
  }
}

export function extensionSettingsUrl(): string {
  const extensionId = typeof chrome !== 'undefined' ? chrome.runtime?.id : '';
  return extensionId
    ? `chrome://extensions/?id=${extensionId}`
    : 'chrome://extensions';
}

export function openExtensionSettings(): void {
  const url = extensionSettingsUrl();
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
    void chrome.tabs.create({ url });
    return;
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
