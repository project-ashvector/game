# Project: ASH VECTOR — Update V91

## Tile Floor + QA Stage Selector Pass

Changed files only:
- `index.html`
- `js/game.js`
- `css/style.css`
- `UPDATE_V91.md`

## Fixes

- Updated the boot/loading version text so the top boot header and boot lines both show `v0.9.1`.
- Reworked floor rendering so walkable tiles use one consistent ground style per stage instead of random edge/corner tiles.
- Made wall tiles more solid so old slope/edge art does not bleed through and make maps look broken.
- Applied the same cleaner floor system to F-001, F-002, and F-003.
- Added a Playtest Console level picker so you can jump directly into F-001, F-002, or F-003.
- Added a QA unlock button for testing all currently available stages.
- Moved the mobile HP/EP HUD tight to the top safe area so it blocks less of the screen.

## Test Notes

Open the Playtest Console with the top button or F9, choose a level, then press **Load Selected Level**.
