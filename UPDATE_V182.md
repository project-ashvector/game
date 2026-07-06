# ASH VECTOR Update V182

## Level 1 Boss Wing Hard Fix Pass

### Fixes
- Hard-fixes the expanded F-001 last-area route shown in the screenshot.
- Opens a real walkable approach into the final/boss wing.
- Places a clear locked gate on the route.
- Before requirements are met, the gate blocks the boss wing.
- After clearing the required anomalies, walking into the gate opens the boss route.
- Removes the bad multi-door stack that could keep the final area unreachable.
- Bumps the map version so old saved F-001 maps are rebuilt with this fix.

### Full-route safety
- Keeps the route audit for F-001 through F-012.
- Terminals and anomaly routes stay reachable.
- Boss and exit areas stay gated until requirements are met.
- Does not change combat balance, characters, item art, or training art.

### Version
- Build bumped to v0.9.92.
- Cache bumped to ?v=182.
- Map version bumped to force old saves to reload the corrected maps.

### Replace only
- index.html
- js/game.js
- UPDATE_V182.md
