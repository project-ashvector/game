# Project ASH VECTOR - Update V217

## True Pause Fix
- Fixed the pause menu so it now actually pauses gameplay instead of only opening a menu.
- Opening Pause freezes player movement, mobile hold movement, respawns, random Vector Lockdown triggers, Lockdown warning countdowns, Lockdown combat timers, enemies, projectiles, and event duration.
- Closing Pause shifts timed systems forward so the player does not lose event time while paused.
- Controller Start/Menu now opens Pause during gameplay and closes Pause when already inside the Pause menu.
- Keyboard Escape or P opens Pause during gameplay.
- Closing overlays from the pause flow resumes the game cleanly.

## Files Changed
- `game-main/index.html`
- `game-main/css/style.css`
- `game-main/js/game.js`
- `game-main/UPDATE_V217.md`
