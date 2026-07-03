# ASH VECTOR Update V111

## Death Recovery Pass

This patch upgrades the defeat flow so losing a battle is clearer and less annoying during testing.

### Changes
- Rebuilt defeat screen into a full Defeat Report.
- Shows defeated-by enemy name and file ID.
- Shows current fracture, anomaly progress, boss status, checkpoint status, and total defeats.
- Added AVOS recovery tips for Guard, Enemy Intent, Vector Cells, terminals, and heal stations.
- Retry now performs a Safe Reboot from checkpoint and restores HP/EP for smoother playtesting.
- Added Restart Current Fracture button.
- Retry fallback now restarts the current fracture if no checkpoint snapshot exists.
- Bumped visible build to v0.9.21 and cache links to ?v=111.

### Replace these files
- index.html
- js/game.js
- UPDATE_V111.md
