// Encode ORIGINAL 3840x2160 capture frames. No upscaling and no second lossy pass.
// FFMPEG_PATH=/path/to/ffmpeg node scripts/prepare-sharp-film.mjs /path/to/frames
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
const dir = process.argv[2];
if (!dir) throw new Error('Supply the folder containing 0000.jpg through 0671.jpg (4K, 24 fps).');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
for (let i=0;i<672;i++) if (!existsSync(path.join(dir, `${String(i).padStart(4,'0')}.jpg`))) throw new Error(`Missing frame ${i}`);
const probe = spawnSync(ffmpeg, ['-hide_banner','-i',path.join(dir,'0000.jpg'),'-frames:v','1','-f','null','-'], {encoding:'utf8'});
if (probe.status !== 0 || !/3840x2160/.test(probe.stderr)) throw new Error('Capture must be native 3840x2160. Do not upscale the old film.');
const out = 'website/assets/motion'; mkdirSync(out,{recursive:true});
const result = spawnSync(ffmpeg, ['-hide_banner','-loglevel','error','-y','-framerate','24','-i',path.join(dir,'%04d.jpg'),'-frames:v','672','-vf','scale=in_range=pc:out_range=tv','-color_range','tv','-an','-c:v','libx264','-preset','slow','-crf','14','-tune','stillimage','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/film-4k.mp4`],{stdio:'inherit'});
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Encoder exited ${result.status}`);
copyFileSync(path.join(dir,'0330.jpg'),`${out}/film-4k.jpg`);
console.log('Created original-resolution 3840x2160 / 24 fps / 28 s H.264 film and 4K poster.');
