# Project ASH VECTOR — Update V195

## Lockdown Runtime Fix

This patch fixes the random Vector Lockdown crash from the full V194 build.

### Fixed

- Added the missing lockdown image-cache helper used by the event renderer.
- Fixed projectile asset paths so the game uses the actual uploaded filenames in `assets/projectiles/`.
- Preloads the projectile PNG files during the normal asset load pass.
- Lockdown monsters now prefer their real battle sprite first, then fall back safely if the image is missing.
- Added a runtime safety wrapper around the lockdown timer so a future event error cancels the mini-game instead of breaking the whole game.
- Warning mode no longer draws the old full-map arena seal box for free-roam lockdowns.
- Player lockdown HP bar now respects the temporary lockdown max HP value.
- Updated build labels to `v1.0.05`.

### Changed files

- `index.html`
- `js/game.js`
- `UPDATE_V195.md`
