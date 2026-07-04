# ASH VECTOR Update V143

## Collision Loading Fix Pass

This patch fixes the forever-loading/freezing issue caused by V142.

### Changes
- Fixed V142 collision normalization causing heavy repeated map rebuilding.
- Collision normalization is now idempotent and cached.
- Flood-fill collision no longer rebuilds the full map on every tile check.
- Kept sealed border collision protection.
- Kept spawn-connected playable region protection.
- Kept controller hard movement lockout.
- Controller movement remains slow and controlled.
- Collision watchdog reduced from 250ms to 900ms to avoid refresh/load strain.
- Bumped visible build to v0.9.53 and cache links to ?v=143.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V143.md
