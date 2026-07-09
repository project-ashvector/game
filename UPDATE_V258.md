# Project ASH VECTOR - Update V258

## Full Map NPC Roam Pass

- Changed NPC roaming from a small home-radius wander to full-map roaming.
- NPCs now choose safe destinations across the playable level and slowly walk toward them.
- NPCs still avoid walls and important route tiles:
  - doors
  - portals
  - exits
  - terminals
  - chests
  - boss gates
  - anomaly tiles
  - healing stations
- NPCs still remain walkthrough contacts, so they cannot block the player.
- Roaming still pauses during dialogue, battle, pause menu, and Vector Lockdown.
- Updated build label to `v258 // FULL MAP NPC ROAM PASS`.

## Files Changed

- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V258.md`
