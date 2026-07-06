# ASH VECTOR Update V162

## Boot Menu Character Framework Fix Pass

### Root cause
V160/V161 moved the character system into the game, but the active operator constants were placed **after** `let state = newGameState()`.

`newGameState()` now uses `ACTIVE_OPERATOR_ID`, so the browser hit a JavaScript runtime error before the boot buttons could bind. That is why:
- Start intro did not work
- Skip to menu did not work
- The game looked frozen at the boot screen

### Fix
- Moved the operator framework above `state = newGameState()`.
- Kept the new Vyra replacement and character framework.
- Kept the legacy `assets/operators/vyra/` mirror support from V161.
- Bumped cache links to `?v=162`.
- Bumped build to `v0.9.72`.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V162.md
