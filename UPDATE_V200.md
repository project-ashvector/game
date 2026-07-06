# Project ASH VECTOR - Update V200

## Build Header Fix
- Fixed the intro screen header that still showed `v1.0.04 // FREE ROAM LOCKDOWN PASS`.
- Updated the default HTML title and boot label to `v1.0.10 // BUFF EMBLEM HUD PASS`.
- Updated the UI kit label from `v1.0.04` to `v1.0.10`.
- Added `data-build-label` support so future update labels can be refreshed from `BUILD_VERSION` and `BUILD_TITLE`.
- Strengthened `syncBuildLabels()` so it updates the boot header, any build-label elements, and the browser title.

## Future Update Rule
- Every future patch should update:
  - `BUILD_VERSION`
  - `BUILD_TITLE`
  - root `index.html` script cache value
  - root `index.html` boot fallback label

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V200.md`
