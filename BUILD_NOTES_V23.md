# Build v23 — Data Registry Sprint

## Purpose
Preserve the approved assets and begin converting the project into a data-driven RPG structure.

## What changed
- Added canonical JSON records for AV-001, Rust Hound, Rust Mother, skills, items, Fracture 001 layout/events, and intro dialogue.
- Added `DATA_REGISTRY.md` explaining where future character/enemy/map data belongs.
- Kept all v22 master assets and source concept sheets intact.
- Kept the current browser prototype intact.

## Next implementation step
Wire `js/game.js` to read from the same content model internally, then later migrate to external JSON loading once GitHub Pages deployment is ready.
