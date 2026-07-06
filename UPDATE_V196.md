# Project ASH VECTOR - Update V196

## Fixes
- Replaced the memory-dialog world object and Archive Log 001 inventory art with the new `memory_core.png` asset.
- Added a missing `ensureImageCached()` helper so Vector Lockdown no longer crashes when it tries to render enemy and projectile sprites.
- Corrected Lockdown projectile PNG paths to match the actual asset filenames in `assets/projectiles/`.
- Preloaded projectile and memory-core art so the random event draws more reliably.
- Added a Vector Lockdown runtime safety guard that auto-cancels the event instead of breaking the entire run if something goes wrong.
- Added player-state recovery during Lockdown so the player is restored to a valid tile if coordinates ever become invalid.
- Drew projectiles before the player and added a stronger Lockdown outline/shadow on the player so the operator stays visible during the mini-game.

## Files Changed
- `game-main/js/game.js`
- `game-main/assets/items/memory_core.png`
- `game-main/UPDATE_V196.md`
