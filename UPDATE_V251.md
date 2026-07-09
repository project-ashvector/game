# Project ASH VECTOR - Update V251

## NPC Interaction Fix Pass
- Fixed NPC interaction feeling broken when NPC sprites are visible but the player is not standing on the exact adjacent tile.
- Keyboard `E`, controller confirm, and the phone Talk button now use a wider nearest-NPC interaction radius.
- NPC `PRESS E` prompt now appears from a slightly more forgiving range.
- Clicking/tapping the visible NPC sprite now talks to that NPC, not just the tiny tile at their feet.
- Tutorial tip popups no longer block map clicks/taps behind them; only their own buttons catch pointer input.
- Vector Lockdown still correctly blocks NPC talk while the random event is active.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V251.md`
