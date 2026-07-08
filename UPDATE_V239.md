# Project ASH VECTOR - Update V239

## NPC/Menu Cache Performance Pass
- Cached safe NPC placement per stage so NPC wall/spawn safety no longer rescans the map every frame.
- Current-stage asset streaming now only preloads NPC images used on that stage instead of every NPC in the whole game.
- Mission and Config menu heavy panels now render in small deferred chunks so overlays open faster.
- Playtest buff QA board now loads after the Playtest menu opens instead of blocking the menu.
- Kept intro video cache updated to `assets/video/intro.mp4?v=239`.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V239.md`
