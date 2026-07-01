# Project: ASH VECTOR v0.7.2 Patch Only

## Vector Cell Art Hotfix
- Added the new final Vector Cell icon: `assets/items/imported/consumables/consumables/common/it-1043_vector_cell.png`.
- Updated the Vector Cell item record to use the new capsule art instead of the old bread icon.
- Renamed the imported `IT-1043` Bread registry entry to Vector Cell so it matches the actual item.
- Kept the old save migration: any legacy `Bread` stacks still convert into `Vector Cell` stacks.
- Bumped cache/version labels to `v0.7.2` and `js/game.js?v=72` so GitHub Pages loads the new script.

## Patch contents
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/assets/items/imported/consumables/consumables/common/it-1043_vector_cell.png`
- `game-main/UPDATE_V72.md`
