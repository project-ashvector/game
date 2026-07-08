# Project ASH VECTOR - Update V238

## Startup Render Throttle Pass
- Reduced extra full-screen redraw work while the intro video and boot screen are visible.
- `renderAll()` now exits early during boot/menu when the main game canvas is hidden.
- Added a scheduled light render helper so image-load and resize refreshes are coalesced instead of fighting the intro/video load.
- Updated intro video cache busting to `assets/video/intro.mp4?v=238`.
- Kept all gameplay, NPC, save, portal, controller, audio, and random event logic intact.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V238.md`
