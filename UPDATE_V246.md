# Project ASH VECTOR - Update V246

## Draw-Time Asset Load Fix
- Fixed current-map props/enemies/NPC/training objects staying as fallback boxes/circles after the performance streaming passes.
- New games now preload the current level before the first gameplay render.
- Map props now request their image at draw time if the preload missed them.
- NPCs, training objects, anomalies, and bosses now request their images directly while drawing, so they cannot stay stuck as placeholders.
- Added delayed render refreshes after gameplay starts so assets that finish decoding repaint the screen.
- Keeps later levels deferred so the intro video is not slowed down by full-game loading.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V246.md`
