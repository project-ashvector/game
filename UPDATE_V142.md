# ASH VECTOR Update V142

## Sealed Collision Pass

This patch is a stronger fix for the remaining map escape issue.

### Changes
- Normalizes every live map into a rectangular grid.
- Adds a two-tile sealed wall border around every map.
- Unknown/blank tiles are converted into walls.
- Player movement is only allowed inside the spawn-connected collision region.
- Full 8-neighbor void guard blocks diagonal/edge seam slipping.
- Collision is rechecked during movement, render, and a 250ms watchdog.
- Controller movement now has a hard 1.05 second lockout inside tryMove itself.
- Controller held movement now waits over one second between steps.
- Controller deadzone increased again.
- Route pathing uses the same sealed collision rules.
- Bumped visible build to v0.9.52 and cache links to ?v=142.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V142.md
