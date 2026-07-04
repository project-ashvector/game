# ASH VECTOR Update V141

## Hard Map Lock Pass

This is a deeper collision rebuild for the map escape issue.

### Changes
- Rebuilt map collision around a spawn-connected flood-fill collision region.
- Vyra can only stand on safe tiles connected to the real playable route.
- Edge tiles are sanitized into walls on every stage load.
- Old saves are sanitized too, so bad saved map edges are corrected.
- Live map edges are checked during render and movement.
- Ragged map rows and missing-neighbor gaps are treated as void/blocked.
- Fixed setTile so array-based map rows update correctly again.
- Doors/chests/lore tiles can update without breaking collision.
- Controller movement is now much slower: one step per push, then slow held repeat.
- Controller direction jitter no longer bypasses movement cooldown.
- Controller deadzone increased again to reduce drift.
- Route pathing now uses the same flood-fill collision lock.
- Bumped visible build to v0.9.51 and cache links to ?v=141.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V141.md
