# Project ASH VECTOR - Update V213

## Previous-Level Portal
- Added a new previous-level portal starting on F-002.
- Previous portals are placed in the boss zone, next to the boss marker when a nearby floor tile is available.
- The previous portal returns the player to the prior fracture and drops them near that level's exit when possible.
- F-001 has no previous portal.

## Portal Art
- Added the uploaded previous-level portal PNG as `assets/tilesets/custom/previous_level_portal.png`.
- Replaced the existing next-level exit portal art with the uploaded exit portal PNG at `assets/tilesets/custom/next_level_exit_portal.png`.
- Updated every stage pack using signpost exits to use the proper exit portal art.

## Engine Updates
- Added `R` as the map tile for previous portals.
- Added draw, minimap, interaction, collision, and map repair support for previous portals.
- Updated build label to `v1.2.13 // PREVIOUS PORTAL PASS`.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/assets/tilesets/custom/previous_level_portal.png`
- `game-main/assets/tilesets/custom/next_level_exit_portal.png`
- `game-main/UPDATE_V213.md`
