# Project: ASH VECTOR

Developer Build v21 — Real Engine Sprint 1

A static browser RPG prototype for GitHub Pages. This build includes a real playable canvas engine: AVOS boot, menu, tile movement, camera follow, collision, interactables, turn-based combat, loot, inventory, minimap, save/load, mission objectives, and QA tools.

## Run locally
Open `index.html` in a browser.

## Controls
- Arrow keys: move
- Enter: boot/menu access
- F9: QA console
- Mobile buttons are included under the game canvas

## Final repository name recommendation
`project-ashvector`

## Asset replacement rule
The placeholder images are already named as final production files. Replace files in place, keeping filenames the same.

Examples:
- `assets/operators/av001/portrait.png`
- `assets/operators/av001/battle.png`
- `assets/operators/av001/sprite_sheet.png`
- `assets/anomalies/an001_ashborn_revenant/battle.png`
- `assets/fractures/fracture001/tileset.png`
- `assets/battle_backgrounds/toxic_sewers_battle.png`

## Current chapter path
AVOS Boot → Main Menu → Fracture 001 Toxic Sewers → Terminal → 3 anomalies → Boss Gate → Ashborn Revenant Lord → Exit.


## v22 Asset Consolidation

This repository now keeps both the playable game files and the approved production concept sheets. See `ASSET_MANIFEST.md` for the current game-ready assets and the master reference images stored under `assets/source/concepts/`.

When replacing art, keep the same filename and path so the game code does not need to change.

## Current Build: v23 Data Registry Sprint

This build keeps the playable browser prototype and all approved master concept assets from v22, then adds stable data records under `data/` so Operators, Anomalies, Items, Skills, Fractures, and Dialogue have permanent homes.

Start testing by opening `index.html` locally in a browser. Final GitHub upload should wait until the vertical slice is tested.


## v25 Asset Note
This build restores the proper v10 visual assets into the newest playable project. The latest code uses production IDs such as `assets/operators/av001/` and `assets/anomalies/an001_ashborn_revenant/`, but the older v10 folders are also preserved for reference so approved artwork is not lost.


## v26 Fix Notes
- Arrow keys now control the Operator without moving the browser page.
- Desktop gameplay viewport is locked to the screen to prevent cropping when moving down.
- UI text now wraps and scales better on smaller displays.


## v27 — Imported Creature Library

- Imported 100 monsters as ASH VECTOR anomaly assets.
- Imported 53 bosses as ASH VECTOR boss assets.
- Added registry JSON files for future database/encounter integration.
- Kept existing Chapter 1 Ashborn Revenant/Ashborn Revenant Lord assets intact.


## Latest Build Notes — v28
Battle UI polish and searchable creature database are now included. Start from `index.html`, open Anomaly Index, and test battle readability at different browser sizes.


## v29 Item Library Import

This build imports the uploaded item pack into the master project:

- 143 item PNGs added under `assets/items/imported/`
- Permanent `IT-####` IDs assigned
- `data/items/imported_item_registry.json` added
- Inventory Database now includes search/filter for imported weapons, equipment, consumables, and materials
- Placeholder item art is preserved in the correct paths so it can be replaced later without breaking code
