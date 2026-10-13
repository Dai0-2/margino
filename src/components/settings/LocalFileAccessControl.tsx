import { Check, ExternalLink, FileKey2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { text } from '../../i18n';
import {
  canInspectLocalFileAccess,
  isLocalFileAccessAllowed,
  openExtensionSettings,
} from '../../services/localFileAccess';
import type { Language } from '../../types';

type FileAccessState = 'checking' | 'allowed' | 'blocked' | 'unavailable';

export function LocalFileAccessControl({ language }: { language: Language }) {
  const [state, setState] = useState<FileAccessState>(() => (
    canInspectLocalFileAccess() ? 'checking' : 'unavailable'
  ));
  const refresh = useCallback(() => {
    if (!canInspectLocalFileAccess()) {
      setState('unavailable');
      return;
    }
    void isLocalFileAccessAllowed().then((allowed) => {
      setState(allowed ? 'allowed' : 'blocked');
    });
  }, []);

  useEffect(() => {
    refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refresh]);

  if (state === 'unavailable') return null;

  return <div className="file-access-control" data-state={state}>
    <FileKey2 />
    <span>
      <strong>{text(language, 'Local PDF access', '本地 PDF 访问')}</strong>
      <small>{state === 'allowed'
        ? text(
          language,
          'Ready to open downloaded PDFs automatically.',
          '已可自动接管下载到本机的 PDF。',
        )
        : state === 'checking'
          ? text(language, 'Checking Chrome permission…', '正在检查 Chrome 权限…')
          : text(
            language,
            'Enable “Allow access to file URLs” in Chrome, then reload the PDF once.',
            '请在 Chrome 中开启“允许访问文件网址”，然后刷新一次 PDF。',
          )}</small>
    </span>
    {state === 'allowed'
      ? <Check className="file-access-ready" />
      : state === 'blocked' && <button type="button" onClick={openExtensionSettings}>
        <ExternalLink />
        {text(language, 'Open settings', '打开设置')}
      </button>}
  </div>;
}
