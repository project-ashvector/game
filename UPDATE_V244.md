# Project ASH VECTOR - Update V244

## Current Level Asset Load Pass
- Fixed the map assets being delayed too much after the performance streaming changes.
- The game now immediately loads the full visual asset set for the current level only.
- Current-level assets include:
  - player/operator sprites
  - NPC sprites on that level
  - current map ground/wall/prop art
  - terminals, doors, portals, chests, med pickups, lore props
  - current-stage anomaly and boss art
- Later levels still stay deferred so the intro video and menu do not get buried under full-game loading.
- Stage changes now load that stage's full map/art set right away.
- Kept the intro video priority and cache update at `assets/video/intro.mp4?v=244`.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V244.md`
