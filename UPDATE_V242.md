# Project ASH VECTOR - Update V242

## Deferred Asset Queue Pass
- Added a shared deferred image queue so background asset loading does not start multiple competing preload loops.
- Deferred assets now load in tiny idle-time batches instead of fighting gameplay, menus, or the intro video.
- Deferred image work pauses while the intro video / boot screen is active.
- Duplicate asset paths are skipped before loading, reducing repeated image object creation.
- Full background preload waits a little longer after the menu opens so the intro stays smoother.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V242.md`
