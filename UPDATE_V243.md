# Project ASH VECTOR - Update V243

## Sprite Load Priority Fix
- Fixed the V242 streaming regression where player/NPC/enemy sprites could stay as fallback shapes.
- Visible gameplay sprites now load eager/high priority instead of through the deferred queue.
- Current-stage critical assets now load immediately when gameplay starts or stages change.
- Current-stage anomaly and boss art now count as critical for the stage.
- Decorative scenery still streams in later so intro/menu performance stays improved.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V243.md`
