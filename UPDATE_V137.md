# ASH VECTOR Update V137

## Map Boundary Fix Pass

This patch fixes the glitch where the player could escape the map and break the game.

### Changes
- Added hard map bounds checks before movement.
- Out-of-map tiles now always count as blocked.
- Player position is clamped/recovered if an old save or glitch puts Vyra outside the playable map.
- Added AVOS safety tether that moves the player back to a safe floor tile.
- Camera now clamps safely and cannot follow outside the map.
- Minimap rendering now protects against bad/out-of-bounds player positions.
- Mouse/touch map interactions now ignore out-of-map clicks.
- Route pathing now refuses out-of-map coordinates.
- Bumped visible build to v0.9.47 and cache links to ?v=137.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V137.md
