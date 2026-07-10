# Project ASH VECTOR — Update V290
## Held Movement Performance Fix

This patch fixes severe lag when holding an arrow key or WASD to move.

### Fixed
- Removed the duplicate player animation `requestAnimationFrame` loop created on every repeated movement input.
- Added a stable keyboard movement repeat limit so browser key-repeat cannot flood the game.
- Ordinary floor movement now refreshes only the field, minimap, and essential HUD instead of rebuilding every menu/database panel.
- Minimap and HUD refreshes are rate-limited while moving.
- Repeated movement into walls or map boundaries no longer spams full redraws, camera shake, and toast messages.
- Mobile joystick movement remains on its existing slower phone-specific cadence.

### Updated file
- `js/game.js`
