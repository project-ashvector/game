# Build Notes V50 — Imported Level Art Pass

## What changed
- Imported and reorganized CraftPix asset packs into `assets/imported/`.
- Added a generated `data/asset_index.json` manifest for the new art library.
- Added custom generated Project Ash Vector map concepts and environment assets into `assets/maps/sector01/` and `assets/custom/`.
- Updated `js/game.js` to load real PNG environment assets for the field map instead of only drawing basic canvas placeholder blocks.
- Bumped boot version text to `Version 0.5.0 // ASSET IMPORT`.

## New asset folders
- `assets/imported/environment/ground/`
- `assets/imported/environment/trees/`
- `assets/imported/environment/bushes/`
- `assets/imported/environment/rocks/`
- `assets/imported/environment/fences/`
- `assets/imported/environment/bridges/`
- `assets/imported/props/`
- `assets/imported/items/medicine/`
- `assets/imported/items/crafting/`
- `assets/imported/effects/`
- `assets/maps/sector01/`
- `assets/custom/`

## Renderer changes
The map renderer now:
- draws imported grass/ground tile PNGs under the full map;
- draws rock/tree/bush PNGs on blocked tiles;
- draws PNGs for chests, med pickups, lore, terminal/start tile, door, and exit;
- places decorative map props such as tent, barrels, campfire, bridge, watchtower, fallen log, and dead tree.

## Next step
The next build should replace the placeholder maze layout with the actual Sector 01 outdoor layout using these organized assets.
