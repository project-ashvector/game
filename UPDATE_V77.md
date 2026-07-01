# Project: ASH VECTOR v0.7.7 Patch Only

## Fixes
- Added sound effects for monster and boss attacks.
- Enemy attacks now use the existing slash SFX bank, with boss hits pitched lower/heavier.
- Enemy attack sound triggers even if Vyra dodges, so combat no longer feels silent on enemy turns.

## Added
- New **Guard** battle action.
  - Press **G** or click **Guard** during battle.
  - Blocks about half of the next incoming hit.
  - Restores 2 EP.
  - Trains Defense XP.
- Battle keyboard hotkeys:
  - **1-4** = combat protocols
  - **G** = Guard
  - **R** = Vector Cell
- Updated cache/build labels to `v0.7.7` and `game.js?v=77`.

## Patch contents
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V77.md`
