# Project ASH VECTOR - Update V259

## Room NPC Roam Balance Pass
- Dialed NPC roaming back from full-map wandering to local room/zone wandering.
- NPCs are spread so each room/zone gets at most one NPC when possible.
- NPCs now move only a few tiles around their assigned room instead of searching the whole map.
- Slowed NPC roam ticks to reduce lag.
- Removed constant full-map destination scans during roaming.
- NPCs remain walkthrough contacts and still avoid key tiles like portals, doors, exits, terminals, chests, boss gates, anomalies, and healing stations.
- Roaming still pauses during dialogue, battle, pause, and Vector Lockdown.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V259.md`
