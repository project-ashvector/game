# Build Notes v59 — Music Watchdog + Title Resize Stabilization

## Fixed
- Removed the old `recovery.js` script from `index.html` so it can no longer override menu/version state or fight the main game router.
- Upgraded the music manager with a watchdog that restarts the requested looping track if the browser pauses/stalls it.
- Added recovery listeners for music `pause`, `ended`, and `stalled` events.
- Music now re-checks the active game state when the tab regains focus or receives input.
- Added final CSS overrides for the title/menu screen to prevent resize jumping, cropped logo behavior, and internal menu scroll.

## Music behavior
- Boot / main menu: `assets/music/intro.mp3`
- Gameplay: `assets/music/level1.mp3`
- In-game panels: `assets/music/pause.mp3`
- Normal battle: `assets/music/battle.mp3`
- Boss battle: `assets/music/boss.mp3`
- Defeat: music stops and `assets/sound fx/death.mp3` plays

## Notes
Browsers can still block music until the first click/key press. After that first interaction, v59 attempts to keep the correct looping track alive.
