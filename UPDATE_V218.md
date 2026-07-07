# Project ASH VECTOR - Update V218

## Pause Music Fix
- Fixed pause menu music not staying on `pause.mp3`.
- `activeMusicForState()` now returns the pause track while the true pause menu is open.
- Fixed the audio watchdog from overriding `pause.mp3` back to the current level music while paused.
- Added a direct pause-theme helper that unlocks and starts the pause track when the pause menu opens.
- Resuming closes pause cleanly and returns to the correct active gameplay track.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V218.md`
