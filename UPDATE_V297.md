# Project ASH VECTOR — Update V297
## Vector Lockdown HUD, Reward Screen, and Mobile Joystick Rework

### Vector Lockdown interface
- Replaced the large side panel with a compact timer/status card in the top-right corner.
- Kept the game canvas at full size while the random event is active.
- Moved active weapon stats, abilities, buffs, and debuffs into a compact dock along the bottom of the screen.
- Removed the duplicated random modifier roulette panel on desktop and mobile.
- New modifiers now appear immediately in the bottom buff dock.
- Preserved HP, timer, threat, kills, hostile count, firing range, and shot status without covering gameplay.

### Reward screen
- Rebuilt the Lockdown reward menu with a simpler responsive layout.
- Added six clean summary tiles for kills, damage, XP, healing, and the next monster cap.
- Replaced stretched reward bars with compact item cards.
- Simplified saved-buff display.
- Kept the Continue button visible and functional on desktop, phone landscape, phone portrait, keyboard, touch, and controller.

### Mobile movement
- Reworked the joystick into a responsive analog-style control.
- The joystick knob now follows the player's finger correctly.
- Full joystick deflection moves at approximately the same speed as held keyboard movement.
- Added a dead zone and gradual speed response so slight touches do not launch the character across the map.
- Direction changes update immediately while the finger remains down.
- Releasing the joystick returns the knob to center and stops movement.

### Cache update
- Updated `index.html` references to load `css/style.css?v=297` and `js/game.js?v=297` so browsers do not keep the older interface files cached.

### Updated files
- `index.html`
- `css/style.css`
- `js/game.js`
- `UPDATE_V297.md`
