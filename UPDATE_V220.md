# Project ASH VECTOR - Update V220

## NPC Spawn Safety Pass
- Fixed NPC placement so NPCs no longer sit inside spawn or appear stuck in wall tiles after map edits.
- NPCs now resolve to the nearest safe, walkable tile away from the player spawn before drawing and before interaction checks.
- Added collision-aware NPC placement fallback so future map edits are less likely to break NPC locations.
- Kept NPC dialogue/reward logic untouched. This is a visual/placement safety patch only.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V220.md`
