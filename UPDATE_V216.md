# Project ASH VECTOR - Update V216

## Controller Input + Menu UI Pass
- Reduced controller movement delay again for more responsive in-game movement.
- Lowered analog/button thresholds for better generic controller detection.
- Added stronger controller focus support for popups, reward dialogs, story dialogs, pause menu, and normal overlays.
- Controller can now highlight and activate visible buttons inside the topmost popup/dialog instead of trying to move the player behind it.
- Start/confirm and back buttons are routed through the active dialog/menu first.
- Added cleaner, less cluttered menu styling and safer scrolling for large menus.
- Added visible controller selection outlines so it is clear what the controller will press.

## Files Changed
- `game-main/index.html`
- `game-main/css/style.css`
- `game-main/js/game.js`
- `game-main/UPDATE_V216.md`
