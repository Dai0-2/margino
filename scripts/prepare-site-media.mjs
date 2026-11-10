// pnpm promo first, then: FFMPEG_PATH=/path/to/ffmpeg pnpm site:media
// Reuses the deterministic showcase, not live accounts or private paper data.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const input = process.argv[2] || 'artifacts/paperflow-promo.mp4';
const out = 'website/assets/motion';
mkdirSync(out, { recursive: true });
function run(args) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`ffmpeg exited ${r.status}`);
}
const clips = [
  ['film', 0, 28, 'scale=1920:1080'],
  ['reader', 3.5, 15.3, 'crop=1812:936:54:90,scale=1600:-2'],
  ['source', 7.1, 8.4, 'crop=1380:850:484:150,scale=1380:850'],
  ['annotation', 15.8, 3.2, 'crop=660:830:492:160,scale=660:830'],
  ['memory', 19.1, 2.5, 'crop=490:850:1374:150,scale=490:850'],
];
for (const [name, start, duration, filter] of clips) {
  run(['-ss', String(start), '-i', input, '-t', String(duration), '-vf', filter,
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', `${out}/${name}.mp4`]);
  run(['-ss', String(name === 'reader' ? 13.7 : start + duration * 0.6), '-i', input,
    '-frames:v', '1', '-vf', filter, '-q:v', '2', `${out}/${name}.jpg`]);
}
console.log('Prepared five H.264 clips and matching JPEG posters.');
