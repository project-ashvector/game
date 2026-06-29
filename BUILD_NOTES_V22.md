# Build v22 — Master Asset Consolidation

## Purpose
This build fixes the asset workflow problem: concept art and game files now live inside one master repository.

## What changed
- Added `assets/source/concepts/` for approved master sheets.
- Preserved approved branding, UI, Operator, Anomaly, Fracture, and style guide references.
- Added `assets/logos/` aliases for logo files.
- Added `ASSET_MANIFEST.md` to track game-ready assets and master references.
- Kept the current playable browser build intact.

## Current status
The game is still a local playable browser prototype, but the repository now contains the approved art direction references so future builds do not lose assets.
