# Project ASH VECTOR — Update V295
## Vector Lockdown Fire Range

### Changes
- Vector Lockdown auto-fire now activates only when the nearest monster is within **8 map tiles** of the operator.
- Monsters outside the firing radius continue approaching without being shot.
- The operator begins firing immediately after a monster enters range.
- Out-of-range checks run at a lightweight cadence so they do not create extra lag.
- The Lockdown HUD now displays the firing range and whether a target is currently in range.
- Existing saves and active Lockdown data fall back safely to the new 8-tile range.

### Updated files
- `js/game.js`
- `UPDATE_V295.md`
