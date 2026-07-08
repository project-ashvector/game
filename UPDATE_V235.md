# Project ASH VECTOR - Update V235

## Intro Load Speed Pass
- Stopped the game from preloading every major image before the intro starts.
- Added a high-priority preload hint for `assets/video/intro.mp4`.
- Updated the intro video cache version to V235.
- Startup now boots the intro/menu first, then streams heavy assets in the background.
- Current-stage images load first when gameplay starts.
- Vector Lockdown projectile and buff assets now load after gameplay begins / before they are needed.
- Removed the extra startup `renderAll()` that was running while the game screen was hidden.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V235.md`
