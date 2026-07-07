# Project ASH VECTOR - Update V206

## Forced Vector Lockdown Reward Popup
- Fixed the reward screen not appearing after the random mini-game finishes.
- Added a persistent center-screen reward modal that is restored after `renderAll()` if the HUD tries to hide it.
- The popup stays open until Continue is pressed.
- The popup shows kills, Operator XP, Player XP, threat level, reward rolls, healing, recovered items, and saved buff stacks.

## Timing
- Keeps the randomized gap between events from V205.

## Files Changed
- `game-main/index.html`
- `game-main/css/style.css`
- `game-main/js/game.js`
- `game-main/UPDATE_V206.md`
