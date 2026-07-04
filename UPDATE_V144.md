# ASH VECTOR Update V144

## Intro Fade + F-001 Boundary Block Pass

This patch fixes the intro video end-freeze and blocks the reported F-001 breakout spot near Fermilat/boss route.

### Changes
- Added stronger intro video end guards.
- Video now has ended, timeupdate, metadata, interval, and timeout fallbacks.
- If the browser freezes after video end/fullscreen, the menu is forced open.
- Fade time tightened so the menu appears faster.
- Added a last-resort menu recovery after the fade.
- Sealed the F-001 shelf/roof strip near Fermilat and the boss route.
- Sealed the top boss-yard strip where the player could get into a broken spot.
- Kept controller movement lock and sealed collision from V143.
- Bumped visible build to v0.9.54 and cache links to ?v=144.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V144.md
