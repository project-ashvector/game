# ASH VECTOR Update V180

## Boss Route Reachability Fix Pass

### Fixes
- Adds a mission-route repair/audit pass for every loaded level.
- Checks terminal, anomaly, boss, and exit tiles.
- If a target is unreachable because a wall/dead shelf blocks the route, the game opens only the needed wall tiles.
- Fixes the Level 1 boss-route dead block shown in the screenshot.
- Applies when:
  - starting a new game
  - continuing/loading a save
  - loading any level from the playtest menu
  - moving into later stages

### Safety
- Keeps boss, anomaly, terminal, exit, chest, heal, lore, and door tiles intact.
- Keeps closed doors functional.
- Keeps collision fallbacks, so missing/old saves do not break.
- Does not change character assets, item assets, or combat balance.

### Version
- Build bumped to v0.9.90.
- Cache bumped to ?v=180.

### Replace only
- index.html
- js/game.js
- UPDATE_V180.md
