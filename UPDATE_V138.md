# ASH VECTOR Update V138

## Controller Stability Pass

This patch fixes controller input stopping after working briefly.

### Changes
- Controller polling loop now survives UI errors instead of dying silently.
- Added controller watchdog scanning every second.
- Reconnects pads if Chrome/browser refreshes the Gamepad API object.
- Resets stuck button/axis states on focus, blur, visibility changes, and reconnect.
- Handles stale or disconnected gamepad slots more safely.
- Victory reports can now be continued with controller confirm/start.
- Controller state now recovers if a menu, story overlay, battle overlay, or fullscreen mode changes.
- Bumped visible build to v0.9.48 and cache links to ?v=138.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V138.md
