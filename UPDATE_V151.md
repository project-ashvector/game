# ASH VECTOR Update V151

## NPC Proximity Crash Fix Pass

### Root cause
Going near any NPC broke the game because the NPC draw prompt accidentally used training-node variables:
- locked
- req

Those variables only exist for skilling nodes. When an NPC got close enough to show its prompt, the renderer threw an error.

### Changes
- Fixed NPC prompt text to always show PRESS E.
- Removed the bad locked/req reference from NPC rendering.
- Added NPC draw safety so one NPC render issue cannot crash the whole game.
- Made nearby NPC checks safer.
- Bumped visible build to v0.9.61 and cache links to ?v=151.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V151.md
