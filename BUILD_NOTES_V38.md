# Build Notes v38 — Production Item Icon Pipeline

- Preserved the uploaded 1024×1024 item icons as master artwork in `assets/source/items/`.
- Generated optimized in-game item icons:
  - `assets/items/` now contains 128×128 optimized PNGs for direct UI use.
  - `assets/items/optimized_64/` contains 64×64 copies for future compact UI.
  - `assets/items/optimized_128/` contains 128×128 copies for high-DPI UI.
- Added the seven core Project: ASH VECTOR items to the live Inventory Database before the imported placeholder equipment records.
- Added styled inventory item slots with rarity borders, hover feedback, item icons, and recovered asset cards.

Core item records:
- IT-001 Med Patch
- IT-002 Scrap Metal
- IT-003 Corrupted Catalyst
- IT-004 Keycard LV1
- IT-005 Archive Log 001
- IT-006 Operator Shard: Vyra
- IT-007 Rust Core
