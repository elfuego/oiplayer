# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm start            # Dev server on port 3000 (opens Chrome, hot reload)
npm run build        # Development build → /build
npm run dist         # Production build → /dist (hashed, minified)
```

There are no tests.

## Architecture

OIPlayer is a vanilla JavaScript (no dependencies) HTML5 audio/video player library. It auto-discovers all `<video>` and `<audio>` tags on the page and wraps them with custom controls.

### Source files

- `src/js/scripts.js` — Entry point; waits for DOM ready, queries all `video`/`audio` tags, instantiates `OIPlayer` on each.
- `src/js/oiplayer.js` — All core logic in one file (~667 lines):
  - `Player` — Abstract base class
  - `MediaPlayer extends Player` — HTML5 media API implementation; handles `canPlayType()` source selection and media events
  - `OIPlayer` — Main wrapper class; builds the `<figure class="oiplayer">` container, injects controls HTML, wires up event listeners, manages playback state
- `src/js/constants.js` — SVG icon strings exported as named constants
- `src/scss/styles.scss` — CSS custom properties for theming, layout
- `src/scss/_controls.scss` — Control bar styles

### How it works

1. `OIPlayer` wraps the native element in `<figure class="oiplayer">` and creates a `MediaPlayer` instance
2. `MediaPlayer` selects the best `<source>` using `canPlayType()` ("probably" > "maybe") and falls back to the `src` attribute
3. Controls (play/pause, progress, volume, fullscreen, time) are injected as HTML and connected via `requestAnimationFrame` for smooth scrubbing
4. State machine: `init` → `playing` ↔ `paused` → `ended`
5. A custom `oiplayerplay` event is fired when playback starts

### CSS theming

CSS custom properties control appearance: `--oiplayer-color`, `--oiplayer-background-color`, etc. Controls can be positioned at `bottom` (default) or `top` (fades out on mouse leave). Audio players have no fullscreen button and always show controls when a preview image is present.

### Build

Webpack bundles `src/js/scripts.js` and `src/scss/styles.scss` as separate outputs. Production (`npm run dist`) uses `TerserPlugin` and hashed filenames. Dev server watches `src/js/**/*` and `src/scss/**/*`.
