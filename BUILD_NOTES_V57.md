# Build Notes v57 — Audio State + Death Fix

## Fixed
- Music state now returns to `intro.mp3` when opening/closing database/menu panels before gameplay starts.
- Opening inventory/database/operator/progression from gameplay still uses `pause.mp3`, then resumes `level1.mp3` on close.
- Removed developer mercy that forced Vyra back to 1 HP.
- Added a real defeat state when HP reaches 0.
- Death now triggers `assets/sound fx/death.mp3` and displays a defeat/retry panel.
- Encounter tuning pass so early enemies survive longer and can actually threaten the player.

## Updated
- Build labels updated to AVOS v0.5.7.
- JS/CSS cache-busting updated to v57.
