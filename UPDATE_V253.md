# Project ASH VECTOR - Update V253

## NPC Walkthrough + Sprite Fix Pass
- NPCs no longer act as hard collision walls, so Fermilat cannot block an entry lane or route.
- Player can walk through NPC contacts and still press E/A/Talk when nearby.
- Moved F-001 Fermilat and other field contacts into side pockets away from the main route.
- Updated NPC placement cache version so old bad NPC positions get rebuilt.
- NPC sprites now request their PNG at draw time instead of relying only on background preload.
- Included current NPC sprite assets in the patch so Fermilat/MetalliK art is present.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/assets/npcs/fermilat.png`
- `game-main/assets/npcs/metallik.png`
- `game-main/assets/npcs/scavenger.png`
- `game-main/assets/npcs/medic.png`
- `game-main/assets/npcs/warden.png`
- `game-main/UPDATE_V253.md`
