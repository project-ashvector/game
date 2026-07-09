# Project ASH VECTOR - Update V252

## NPC Route Clear Fix Pass
- Fixed the F-001 Fermilat safe-position fallback that was outside the map and could resolve into the boss/entry route.
- Moved F-001 NPC fallback positions into open floor pockets so they do not block spawn, doors, boss entries, or main route lanes.
- NPC placement now avoids important route markers near doors, bosses, exits, return portals, terminals, chests, healing stations, lore objects, and anomaly tiles.
- NPC placement uses raw stage floor data instead of unstable runtime `canStandAt()` checks.
- Talk/interact now prefers nearby NPCs before training nodes, so pressing E / controller confirm / phone Talk does not grab a nearby object instead of the NPC.
- Increased the talk prompt range slightly for tall NPC sprites.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V252.md`
