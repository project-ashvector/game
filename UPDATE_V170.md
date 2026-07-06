# ASH VECTOR Update V170

## Playtest Character Unlock Hard Fix Pass

### Fix
The V169 Playtest button could fail or appear to do nothing depending on cached button binding / old save state.

### Added hard fix
- Playtest Console button now has a direct inline fallback click handler.
- Unlock All Characters now sets a persistent `qaUnlockAllCharacters` flag.
- `ensureCharacterState()` now respects that QA unlock flag, so characters stay unlocked after save/load/render.
- Unlock All Characters also grants enough character shards for every locked character as a backup.
- Added a second Playtest button: Grant Character Shards.
- QA status now shows character unlock count and whether QA character unlock is ON.

### Version
- Build bumped to v0.9.80.
- Cache bumped to ?v=170.

### Replace only
- index.html
- js/game.js
- UPDATE_V170.md
