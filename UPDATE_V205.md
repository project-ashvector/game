# Project ASH VECTOR - Update V205

## Vector Lockdown Reward Popup Reliability
- Added a dedicated full-screen reward modal that appears after every completed Vector Lockdown.
- The modal shows Operator XP, player XP, kills, threat level, reward rolls, healing, recovered items, and saved buff stacks.
- The reward modal stays open until the player presses Continue.
- The older HUD reward card is still populated as a fallback.

## Random Event Timing
- Added a randomized cooldown window between Vector Lockdown events.
- After completion, failure, cancellation, or abort, the next event window is scheduled randomly between about 90 and 210 seconds.
- New saves also get a short randomized initial delay so Lockdown does not trigger immediately.

## Files Changed
- `game-main/index.html`
- `game-main/css/style.css`
- `game-main/js/game.js`
- `game-main/UPDATE_V205.md`
