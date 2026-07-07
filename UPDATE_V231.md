# Project ASH VECTOR - Update V231

## Save Safety Pass
- Added an Archive Safety panel to Configuration.
- Added readable save health checks for active save, autoslot, last backup, and emergency backup.
- Added one-click Emergency Backup.
- Added Emergency Backup restore.
- Added Verify Save Copies button.
- Added Safe Reset Active Save with a `RESET` confirmation.
- Safe Reset only clears the active/autosave copy and keeps numbered slots/emergency backup.
- Rewired the old reset button to use the safer reset flow.

## Build
- `v231 // SAVE SAFETY PASS`
- Cache busting updated to `?v=231`.

## Files Changed
- `game-main/index.html`
- `game-main/css/style.css`
- `game-main/js/game.js`
- `game-main/UPDATE_V231.md`
