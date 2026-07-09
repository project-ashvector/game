# Project ASH VECTOR - Update V263

## NPC Roam Smoothness Pass
- Slowed NPC roaming ticks slightly so NPC movement does less background work.
- NPCs now pause more often between tiny room movements, making the map feel calmer.
- Lowered the random retarget chance so NPCs do not constantly pick new spots.
- Rebuilt the NPC placement/roam cache key so old crowded positions reset cleanly.
- Kept one-NPC-per-room behavior, walkthrough NPCs, dialogue, rewards, portals, saves, controller, combat, and asset loading unchanged.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V263.md`
