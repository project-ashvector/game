# Project ASH VECTOR - Update V248

## Reliable Asset Load Rollback Pass
- Fixed map objects and mini-game assets still showing fallback boxes/circles.
- Removed browser lazy-loading from all canvas-drawn image assets.
- Canvas draw calls now request missing images immediately instead of waiting for preload timing.
- Map props, terminals, portals, chests, NPCs, training objects, anomalies, bosses, projectiles, and buff icons now load reliably when needed.
- Vector Lockdown projectile and buff assets now preload immediately at event warning/start.
- Kept later-level background loading deferred, but current gameplay assets are reliable again.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V248.md`
