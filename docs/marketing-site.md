# Margino marketing site — sharp rendering

The GitHub Pages homepage is buildless HTML/CSS/JavaScript in `website/`.
Preview: `python3 -m http.server 4188 --bind 127.0.0.1 --directory website`.
The Pages workflow deploys this directory on main pushes.

## Resolution-independent product demos

The homepage does **not** use the old compressed MP4s or a scaled screenshot for
its reader, source AI, annotations, Paper Memory or library surfaces. These are
same-origin HTML demo frames using `showcase/?embed=reader` (or `source`,
`annotation`, `memory`, `library`). Browser-rendered text, formulas and controls
rasterize at the visitor's display density. Reader answers have larger type.
Each surface offers a full-size link; small screens cannot make a complete
research interface legible at thumbnail size, so full-size inspection is useful.

The demo is illustrative, not a live extension session. No accounts, private
papers, API requests or user research data are involved. Demo controls are inert;
playback is controlled from the parent. PostMessage checks both source and origin.
Animation pauses offscreen, in background, when motion is disabled, or while the
film is open. Paused embeds stop their animation-frame loop. The library is static
DOM, with local horizontal scrolling on narrow screens. No-JavaScript visitors
receive static preview images rather than blank frames.

## Full film

The separate film is `assets/motion/film-4k.mp4`: 3840×2160, 24 fps, 28 seconds,
H.264/yuv420p, CRF 14, faststart, no audio. It is recorded at original 4K dimensions,
not upscaled from the previous 1080p export. The 4K JPEG poster is copied directly
from a captured frame. The film loads only when requested.

For deterministic capture, open `showcase/?scene=1&recording=1&capture=1` at
3840×2160. Enter frame * 1000 / 24 into the numeric `Recording timestamp` control
and capture frames 0000.jpg–0671.jpg. Use full-page screenshots: viewport-only
capture can crop the right edge in some browser backends. Verify actual file
dimensions, not merely `window.innerWidth`.

Encode once from original frames:

```sh
FFMPEG_PATH=/path/to/ffmpeg pnpm site:film4k /path/to/frames
```

The encoder checks native 4K input and missing frames, and does not upscale.
The older `pnpm promo` / `pnpm site:media` exports remain available for legacy
1080p files, but are not the current homepage's visual source.

## Preserved behavior

- Local fonts, white/paper-textured surfaces, bilingual copy, same brand and links.
- One scroll-driven paper/workspace scene, with a simple mobile layout.
- System reduced-motion preference plus explicit pause and per-demo controls.
- Existing privacy page, Chrome Web Store destination and extension functionality.

## QA

Check desktop and mobile overflow, native frame crop boundaries, legibility,
feature switching, play/pause, page visibility, reduced-motion controls,
full-size links and film playback. Inspect the standalone frame to confirm the
content is HTML text, not merely a higher-resolution bitmap. Screenshots saved
under ignored `outputs/` are QA evidence, not production assets.
