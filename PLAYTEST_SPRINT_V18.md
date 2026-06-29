# Project: ASH VECTOR — Playtest Sprint v18

## Focus
Minimap, inventory item usage, and local configuration settings.

## Added
- Tactical minimap panel beside the main game canvas.
- Med Patch usage from the Equipment Database.
- Configuration overlay for scanlines, reduced motion, and large text.

## Test Path
1. Boot AVOS and start a new operation.
2. Confirm the minimap shows player, caches, enemies, boss, and exit.
3. Take damage in battle.
4. Use `Med Patch` from the Equipment Database and confirm HP increases.
5. Open Configuration from the main menu and toggle CRT/reduced motion/large text.
6. Save, reload, and confirm the run still works.

## Known Notes
- Art is still placeholder/production-sheet derived in places.
- Combat remains simple, but functional for vertical-slice testing.
- Settings are local UI toggles only; full audio settings come later.
