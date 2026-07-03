# ASH VECTOR Update V140

## Hard Collision Controller Pass

This patch fixes the remaining controller speed and map escape issues.

### Changes
- Fixed the V139 controller burst bug that allowed movement every animation frame.
- Controller movement delay is much slower now.
- Controller analog deadzone is higher to stop drift.
- Held stick/D-pad movement now waits the full cooldown between steps.
- Outer map edges are now always blocked, even if a map row accidentally has floor there.
- Player can only stand on valid interior walkable tiles.
- Ragged/uneven row edge protection prevents slipping through map seams.
- Stage maps are sanitized so edge tiles become walls during load.
- Safety tether refuses unsafe edge tiles.
- Route pathing uses the same hard collision rules.
- Bumped visible build to v0.9.50 and cache links to ?v=140.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V140.md
