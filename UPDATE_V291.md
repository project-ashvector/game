# Project ASH VECTOR — Update V291
## Smooth Held Movement Engine

This update replaces browser key-repeat movement with a dedicated held-input loop and reduces the rendering work performed while traveling.

### Movement fixes
- Arrow keys and WASD now use a controlled held-key movement loop.
- Browser/operating-system key-repeat timing no longer controls movement.
- Movement interpolation overlaps cleanly between tile steps for a smoother continuous feel.
- Multiple held directions switch predictably to the most recently pressed direction.
- Releasing a direction immediately stops that direction without queued repeat events.
- Blocked movement feedback remains rate-limited.

### Performance fixes
- Added a cached static terrain layer instead of rebuilding every ground and wall tile each frame.
- Cached objective-route pathfinding by player tile and objective state.
- Removed duplicate canvas redraws from movement events.
- Minimap and HUD refreshes are deferred and rate-limited while walking.
- Dynamic lighting rebuilds are throttled briefly during active movement.
- Fog, parallax veil, and particle density scale down only while moving, then return to the selected graphics quality.

### Updated file
- `js/game.js`

Install this update after V290, replacing the existing file in the same folder path.
