# Project ASH VECTOR - Update V249

## Player Sprite Cache Fix
- Fixed the player sometimes turning back into a block while walking or changing facing.
- Added a persistent last-good player sprite cache.
- Active operator walking, idle, rotation, and map sprites now eager-load together.
- If a new animation frame is still loading, the game draws the last working player sprite instead of the fallback block.
- Kept the reliable current-level asset loading from V248.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V249.md`
