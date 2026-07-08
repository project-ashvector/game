# Project ASH VECTOR - Update V245

## Current Map Asset Eager Load Fix
- Fixed current-level map assets still showing as placeholder boxes/circles after the performance streaming passes.
- The game now eager-loads the full current level asset set when gameplay starts.
- Current-level eager load includes player/operator sprites, NPC sprites, anomaly/boss art, portals, terminals, chests, doors, med pickups, training objects, and level prop art.
- Later levels still stay deferred so the intro video is not slowed down by the entire game asset library.
- Stage changes also force-load the new current level before drawing it.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V245.md`
