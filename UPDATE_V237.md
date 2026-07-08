# Project ASH VECTOR - Update V237

## Audio Lazy Load Pass
- Reduced startup audio loading so the intro/menu do not compete with every level track.
- Intro and pause/menu music still preload early for fast boot/menu playback.
- Level, battle, and boss tracks now promote to full loading only when requested.
- Sound effects no longer all auto-preload during boot; they load on first use instead.
- Background art streaming now waits a little longer and uses smaller chunks to keep the intro smoother.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V237.md`
