# Project ASH VECTOR - Update V257

## NPC Roaming Contact Pass
- Added slow ambient roaming for field NPC contacts.
- NPCs now keep safe home tiles but can wander a few tiles around them over time.
- Roaming avoids route-critical tiles, terminals, exits, portals, bosses, doors, chests, lore objects, healing stations, and anomaly tiles.
- NPCs remain walkthrough contacts, so they still cannot block corridors or entry paths.
- Roaming pauses during story/dialog, battle, true pause, hidden app state, and Vector Lockdown interaction lock.
- NPC talk/interact logic now uses their current roaming tile.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V257.md`
