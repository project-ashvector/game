# Project: ASH VECTOR — V92 Controller QA Patch

## Changed files
- `index.html`
- `js/game.js`
- `css/style.css`

## What changed
- Removed the big letter/ring markers from the actual level view so the stage art stays cleaner.
- Kept stage markers on the minimap/map UI so testing still has navigation help.
- Added Gamepad API support for connected controllers.
  - Auto-detects common Xbox, PlayStation, Switch, and generic controller labels.
  - Supports left stick/D-pad movement.
  - Supports controller actions for interact, healing, EP cell, objective ping, battle attacks, guard, and QA console access.
- Fixed QA level unlock testing.
  - `Unlock All Levels` now uses a QA bypass flag so render refreshes do not relock stages.
  - Added `Set Player Level` controls in the Playtest Console.
  - Added quick level buttons: Lv 5, Lv 12, Lv 25, Lv 99.
- Updated QA state readout to show player level, lock status for F-001/F-002/F-003, QA bypass status, and controller status.
- Updated build/load screen/cache versions to `v0.9.2`.
- Tightened the mobile HP/EP HUD closer to the very top edge and made it smaller/more transparent.
- Bumped map version to rebuild older saves onto the updated marker/controller QA pass.

## Controller defaults
- Move: left stick or D-pad.
- Main action / first attack: Xbox A, PlayStation Cross, Switch B.
- Back / guard / med patch: Xbox B, PlayStation Circle, Switch A.
- EP cell / second attack: Xbox X, PlayStation Square, Switch Y.
- Ping / overdrive: Xbox Y, PlayStation Triangle, Switch X.
- QA Console: Xbox View, PlayStation Share, Switch Minus.
