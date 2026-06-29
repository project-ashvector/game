# Build Notes v30 — Placeholder Removal + Fixed Viewport

## Removed from active game/code
- Removed legacy `AN-001 Rust Hound` as the starter anomaly.
- Removed legacy `BOSS-001 Rust Mother` as the starter boss.
- Deleted old Rust Hound/Rust Mother active JSON records and asset folders.

## Replaced with imported library assets
- Chapter 1 anomaly encounter now uses `AN-001 Ashborn Revenant`.
- Chapter 1 boss encounter now uses `BOSS-001 Ashborn Revenant Lord`.
- The anomaly/boss database now renumbers imported assets so the imported library starts at AN-001/BOSS-001.

## Fixed-screen update
- Locked the game to a fixed app-style viewport.
- Prevented the browser page from scrolling during gameplay and database overlays.
- Moved scrolling into internal panels only.
- Added dark custom scrollbars so the database no longer shows a bright browser scrollbar.
