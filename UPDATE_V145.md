# ASH VECTOR Update V145

## Boot Gate Escape Fix Pass

This patch fixes getting stuck on the intro prompt screen.

### Changes
- Boot gate now has a 12-second fallback to main menu.
- If video playback is blocked, the game opens the main menu instead of returning to the stuck gate.
- Clicking/tapping the boot logo, start button, boot gate, or boot screen starts the intro.
- Escape on the boot gate skips straight to main menu.
- Skip button now uses a hard recovery route.
- Start intro button text is clearer.
- Bumped visible build to v0.9.55 and cache links to ?v=145.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V145.md
