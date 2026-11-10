# Margino marketing site

The GitHub Pages homepage is a buildless HTML/CSS/JavaScript site in `website/`.
The cinematic refresh keeps the extension, privacy page, technical identifiers,
and existing Chrome Web Store destination unchanged.

## Preview

From the repository root:

```sh
python3 -m http.server 4188 --bind 127.0.0.1 --directory website
```

Open `http://127.0.0.1:4188/`. The Pages workflow deploys `website/` on main pushes.

## Design and motion

- White and textured light-gray surfaces, local Inter fonts, restrained blue CTA.
- A reader clip in the hero, three keyboard-accessible feature tabs, and a
  separate 28-second product film in a native dialog.
- One sticky paper/workspace consolidation, driven by scroll position and CSS
  transforms. Mobile and reduced-motion layouts remain ordinary document flow.
- Videos load when visible, pause offscreen/in background/while the film is open,
  and have explicit playback controls. Posters remain usable without JavaScript.
- The system's reduced-motion preference disables automatic playback. The footer
  also lets visitors pause motion; explicit video play remains available.
- Library tables retain readable width with local horizontal scrolling on mobile.

`cinema.js` owns the page interactions; `cinema.css` owns the new visual system.
The old landing files remain for historical reuse, but are not loaded by the homepage.

## Rebuild media

The clips are **illustrative product demonstrations** from the existing showcase,
not a live recording of a user's library or a response-speed benchmark. No
third-party SuperMimic media is reused. AI provider/model availability varies.

```sh
pnpm promo
# Requires ffmpeg on PATH, or FFMPEG_PATH=/absolute/path/to/ffmpeg:
pnpm site:media
```

`site:media` consumes `artifacts/paperflow-promo.mp4`; an alternative master file
can be passed directly to `node scripts/prepare-site-media.mjs /path/to/master.mp4`.
It creates the complete film, reader, source, annotation and memory clips plus
JPEG posters in `website/assets/motion/`. H.264/yuv420p, faststart, no audio.
Keep filenames stable or update all corresponding posters and dynamic sources.

For exact-frame capture, `showcase/?scene=1&recording=1&capture=1` exposes a tiny
numeric input labelled `Recording timestamp`. Enter milliseconds through normal
browser input, then capture the 1920×1080 viewport. This bypasses wall-clock timing;
the shipped master was captured at 24 fps for 28 seconds.

## Validation of the refresh

- Browser checks at 1920×1080, 1440px desktop and 390×844 mobile: no page-level
  horizontal overflow; local library scrolling is intentional.
- Feature switching, English/Chinese toggle, playback, full-film modal,
  background-video pause and footer reduced-motion mode checked in the browser.
- Full film decoded and played in browser: 28 seconds. JavaScript syntax and
  local asset/anchor checks passed.
- The exact operating-system reduced-motion setting was not changed during QA;
  the shared reduced-motion behavior was exercised with the footer control.
- Mobile uses the same lightweight clips rather than separately directed mobile
  footage. Full-reader text is small on a phone; feature close-ups provide detail.
