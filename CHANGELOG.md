# Changelog

## v26 - Viewport and Controls Fix
- Prevented arrow keys from scrolling the browser page during gameplay.
- Locked the desktop game viewport so the canvas no longer gets cropped by page scroll.
- Improved responsive text/button wrapping for smaller screens.
- Added safer canvas focus behavior when starting the game.

# Changelog

## v21 — Real Engine Sprint 1
- Added actual `css/style.css` and `js/game.js` files instead of relying on missing references.
- Implemented playable tile-map renderer on canvas.
- Added camera follow, collision, interactable tiles, chests, terminals, healing station, lore terminal, locked boss gate, and exit.
- Added real turn-based battle loop with four protocols, enemy turns, XP, level-ups, loot, and credits.
- Added minimap rendering, save/load via localStorage, inventory use, QA console, settings toggles, and mission objectives.
- Created replaceable production placeholder PNG assets in their final folders/filenames.

## v20 and earlier
Planning, documentation, production direction, and prototype scaffolding for Project: ASH VECTOR.

## v22 — Master Asset Consolidation
- Added approved concept/reference sheets into `assets/source/concepts/`.
- Added `ASSET_MANIFEST.md` for stable asset tracking.
- Added `assets/logos/` aliases for logo files.
- Kept playable build files intact while preserving production art references.

## v23 — Data Registry Sprint
- Added stable JSON-style content records for Operator AV-001, AN-001 Rust Hound, BOSS-001 Rust Mother, items, skills, Fracture 001 layout/events, and intro dialogue.
- Added DATA_REGISTRY.md and BUILD_NOTES_V23.md.
- Preserved all consolidated master assets from v22.


## v25 — Asset Usage Fix
- Restored the proper v10 logo pack into active latest build paths.
- Updated latest CSS so the v10 `menu_background.png` is actually used on the main menu.
- Restored v10 Operator, Anomaly, Fracture, item, and battle background assets into active v23/v24 paths.
- Added favicon link to `index.html`.
- Preserved legacy v10 folders for reference while keeping latest production IDs active.


## v27 — Imported Creature Library

- Imported 100 monsters as ASH VECTOR anomaly assets.
- Imported 53 bosses as ASH VECTOR boss assets.
- Added registry JSON files for future database/encounter integration.
- Kept existing Chapter 1 Rust Hound/Rust Mother assets intact.
