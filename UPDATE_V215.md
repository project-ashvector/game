# Project ASH VECTOR - Update V215

## Controller Input Fix Pass
- Fixed the in-game controller movement lag by reducing the controller world-step lock from about one second to a responsive short step delay.
- Lowered the stick deadzone so analog movement starts reliably instead of feeling unresponsive.
- Reduced repeat delay for held D-pad/stick movement.
- Added fallback support for controllers that expose D-pad input through axes 6/7 instead of standard button indexes.
- Adjusted button handling so boot/menu/open-world inputs do not conflict.
- Select/View still opens Playtest after boot.
- Start/Menu opens the phone-style pause/menu panel in-game.
- South button confirms/interacts, East uses Med Patch/back, West uses Vector Cell, North pings objective.

## Build
- Updated build label to `v215 // CONTROLLER INPUT FIX PASS`.
- Updated cache busting to `?v=215`.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V215.md`
