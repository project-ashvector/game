# Project ASH VECTOR - Update V250

## Stability Checkpoint Pass
- Locked in the working V249 player sprite cache behavior.
- Updated the build label to `v250 // STABILITY CHECKPOINT PASS`.
- Added an in-code asset-loading safety note: canvas-drawn gameplay assets should stay eager/draw-time requested.
- Kept the reliable current-level and Vector Lockdown asset loading behavior from V248/V249.
- No gameplay, NPC, portal, save, controller, reward, or random event logic was changed.

## Important Asset Loading Rule
Do not re-enable browser lazy-loading for canvas-drawn gameplay images. The game should keep using eager/draw-time image requests for the player, NPCs, current-level map objects, anomalies, bosses, projectiles, buff icons, and Lockdown assets.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V250.md`
