(() => {
  const sendMessage = (message) => {
    try {
      const pending = chrome.runtime.sendMessage(message);
      return pending && typeof pending.then === 'function'
        ? pending
        : Promise.resolve(pending);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  const parameters = new URLSearchParams(location.search);
  if (parameters.get('paperflowReader') !== '1') return;

  const identifier = location.pathname
    .match(/^\/science\/article\/pii\/([a-z0-9]+)\/?$/i)?.[1];
  const sourceValue = parameters.get('paperflowPdf');
  if (!identifier || !sourceValue) return;

  let source;
  try {
    source = new URL(sourceValue);
  } catch {
    return;
  }
  const sourceIdentifier = source.pathname
    .match(/^\/science\/article\/pii\/([a-z0-9]+)\/pdfft\/?$/i)?.[1];
  if (
    source.origin !== location.origin
    || sourceIdentifier?.toLowerCase() !== identifier.toLowerCase()
  ) {
    return;
  }

  const title = document.querySelector('h1')?.textContent
    ?.replace(/\s+/g, ' ')
    .trim()
    || parameters.get('paperflowTitle')
    || document.title;
  document.title = title;
  const reader = new URL(chrome.runtime.getURL('reader.html'));
  reader.searchParams.set('url', source.toString());
  reader.searchParams.set('title', title);
  reader.searchParams.set('paperflowSource', 'default-handler');
  reader.searchParams.set('paperflowDepth', '1');
  reader.searchParams.set('embedded', 'true');

  const frame = document.createElement('iframe');
  frame.id = 'paperflow-reader-frame';
  frame.title = 'Margino Reader';
  frame.src = reader.toString();
  frame.allow = 'clipboard-read; clipboard-write';
  frame.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483647',
    'width:100vw',
    'height:100vh',
    'border:0',
    'background:#fff',
  ].join(';');

  const restoreOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  document.body.append(frame);

  frame.addEventListener('error', () => {
    frame.remove();
    document.documentElement.style.overflow = restoreOverflow;
  }, { once: true });

  sendMessage({
    type: 'paperflow:reader-mounted',
    sourceUrl: source.toString(),
  }).then(() => {
    history.replaceState(history.state, '', source.toString());
  }).catch(() => {
    frame.remove();
    document.documentElement.style.overflow = restoreOverflow;
  });

  addEventListener('pagehide', () => {
    void sendMessage({
      type: 'paperflow:reader-unmounting',
      sourceUrl: source.toString(),
    }).catch(() => undefined);
  }, { once: true });
})();
