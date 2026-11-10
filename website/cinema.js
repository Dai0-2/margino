// Native browser APIs only. Clips are staged product demos, never live account data.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = false;
const prefersReduced = () => reduce.matches || motionPaused;
const desktop = matchMedia('(min-width: 701px)');
let language = 'en';
try { language = localStorage.getItem('paperflow-site-language') === 'zh' ? 'zh' : 'en'; } catch { /* Storage is optional for this static site. */ }
const featureCopy = {
  source: {
    label: ['PAGE-AWARE AI', '溯源 AI'], title: ['An answer.<br>And a way back.', '得到答案。<br>也能回到原文。'],
    description: ['Select a passage. Ask a question. Follow a page-linked citation back to the source.', '选择一段原文，提出问题。沿着页码引用，返回原文核对。'], link: ['Explore source-linked AI', '了解溯源 AI'], href: '#source-ai',
  },
  annotation: {
    label: ['ANNOTATIONS', '批注'], title: ['Read it.<br>Make it yours.', '读进去。<br>留下你的思考。'],
    description: ['Highlight the idea. Leave a note exactly where it belongs. Your thinking stays on the paper.', '高亮关键想法，把笔记留在对应位置。你的思考，直接留在论文上。'], link: ['Explore the workspace', '了解论文工作区'], href: '#workspace',
  },
  memory: {
    label: ['PAPER MEMORY', '论文记忆'], title: ['A thought worth<br>coming back to.', '值得再次<br>回来的思路。'],
    description: ['Keep key ideas, saved notes, and previous questions together. Start again with context, not an empty chat.', '关键想法、笔记和之前的问题，都保存在一起。再次开始时，不再面对空白对话。'], link: ['Explore Paper Memory', '了解论文记忆'], href: '#memory',
  },
};
let selected = 'source';
const panel = document.querySelector('#highlight-panel');
const featureMedia = panel.querySelector('iframe');
const tabs = [...document.querySelectorAll('[data-feature]')];
function updateFeatureCopy() {
  const d = featureCopy[selected], i = language === 'zh' ? 1 : 0;
  document.querySelector('#feature-label').textContent = d.label[i];
  document.querySelector('#feature-title').innerHTML = d.title[i];
  document.querySelector('#feature-description').textContent = d.description[i];
  const link = document.querySelector('#feature-link');
  link.textContent = `${d.link[i]} ↗`; link.href = d.href;
}
function applyLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-en][data-zh]').forEach(el => { el.innerHTML = el.dataset[language]; });
  document.querySelector('.language-switch').textContent = language === 'zh' ? 'EN' : '中文';
  updateFeatureCopy();
  document.title = language === 'zh' ? 'Margino — 让 PDF 成为研究工作区' : 'Margino — Your PDF is the workspace';
}
document.querySelector('.language-switch').addEventListener('click', () => {
  language = language === 'en' ? 'zh' : 'en'; applyLanguage();
  try { localStorage.setItem('paperflow-site-language', language); } catch { /* Optional preference only. */ }
});
const mediaStates = new Map();
const film = document.querySelector('.film-dialog');
function syncVideo(frame) {
  const state = mediaStates.get(frame);
  const wanted = state.manual === true || (!prefersReduced() && state.manual !== false);
  state.playing = state.visible && !document.hidden && !film.open && wanted;
  frame.contentWindow?.postMessage({ type:'margino:demo-playback', playing:state.playing }, location.origin);
  state.button.textContent = state.playing ? 'Ⅱ' : '▶';
  state.button.setAttribute('aria-label', state.playing ? 'Pause demonstration' : 'Play demonstration');
}
for (const wrapper of document.querySelectorAll('[data-media]')) {
  const frame = wrapper.querySelector('iframe'), button = wrapper.querySelector('.media-toggle');
  mediaStates.set(frame, { visible:false, manual:null, playing:false, button });
  button.addEventListener('click', () => { const state = mediaStates.get(frame); state.manual = !state.playing; syncVideo(frame); });
  frame.addEventListener('load', () => syncVideo(frame));
}
addEventListener('message', event => {
  if (event.origin !== location.origin || event.data?.type !== 'margino:demo-ready') return;
  for (const [frame] of mediaStates) if (frame.contentWindow === event.source) syncVideo(frame);
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) { mediaStates.get(entry.target).visible = entry.isIntersecting; syncVideo(entry.target); }
  }, {threshold:.15});
  mediaStates.forEach((_, frame) => observer.observe(frame));
} else { mediaStates.forEach(state => { state.visible = true; }); }
function syncAll() { mediaStates.forEach((_, video) => syncVideo(video)); }
document.addEventListener('visibilitychange', syncAll);
reduce.addEventListener('change', () => { mediaStates.forEach(state => { state.manual = null; }); syncAll(); requestFrame(); });
function chooseFeature(name) {
  selected = name; updateFeatureCopy();
  for (const tab of tabs) { const active = tab.dataset.feature === name; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1; }
  panel.setAttribute('aria-labelledby', `tab-${name}`);
  panel.querySelector('.expand-demo').href = `showcase/?embed=${name}&v=sharp-1`;
  panel.querySelector('.expand-demo').setAttribute('aria-label', `Open full-size ${name} demonstration`);
  featureMedia.dataset.demo = name;
  featureMedia.src = `showcase/?embed=${name}&v=sharp-1`;
  featureMedia.title = `${featureCopy[name].description[0]} — illustrative animated interface`;
  mediaStates.get(featureMedia).manual = null;
  syncVideo(featureMedia);
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => chooseFeature(tab.dataset.feature));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); tabs[next].focus(); chooseFeature(tabs[next].dataset.feature); }
  });
});
let previousFocus;
const filmVideo = film.querySelector('video');
document.querySelector('[data-film-open]').addEventListener('click', event => {
  previousFocus = event.currentTarget;
  film.showModal(); syncAll();
  if (!filmVideo.getAttribute('src')) filmVideo.src = 'assets/motion/film-4k.mp4';
  filmVideo.play().catch(() => {}); // Native controls remain available if autoplay is blocked.
});
document.querySelector('.film-close').addEventListener('click', () => film.close());
film.addEventListener('click', event => { if (event.target === film) { const r = film.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) film.close(); } });
film.addEventListener('close', () => { filmVideo.pause(); syncAll(); previousFocus?.focus(); });
const story = document.querySelector('.workspace-story');
let frame = 0;
function paintStory() {
  frame = 0;
  if (prefersReduced() || !desktop.matches) { story.style.removeProperty('--join'); story.style.removeProperty('--fade'); return; }
  const rect = story.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, -rect.top / (rect.height - innerHeight)));
  const join = progress * progress * (3 - 2 * progress);
  story.style.setProperty('--join', join.toFixed(4));
  story.style.setProperty('--fade', (1 - join * .96).toFixed(4));
}
function requestFrame() { if (!frame) frame = requestAnimationFrame(paintStory); }
addEventListener('scroll', requestFrame, {passive:true});
addEventListener('resize', requestFrame); desktop.addEventListener('change', requestFrame);
applyLanguage(); requestFrame();

const motionSetting = document.querySelector('.motion-setting');
function paintMotionSetting() {
  const paused = prefersReduced();
  document.documentElement.classList.toggle('reduce-motion', paused);
  motionSetting.setAttribute('aria-pressed', String(paused));
  motionSetting.textContent = paused ? 'Motion paused' : 'Pause motion';
}
motionSetting.addEventListener('click', () => {
  motionPaused = !motionPaused;
  mediaStates.forEach(state => { state.manual = null; });
  paintMotionSetting(); syncAll(); requestFrame();
});
reduce.addEventListener('change', paintMotionSetting);
paintMotionSetting();
