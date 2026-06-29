# Imported Item Library v29

This build imports the uploaded item library into the Project: ASH VECTOR master repo. The original folder organization is preserved under `assets/items/imported/`, while every PNG also receives a permanent `IT-####` item ID for use by the inventory, loot, shop, and crafting systems.

- Imported PNG assets: **143**
- Production-looking assets: **101**
- Placeholder assets retained for replacement: **42**

## Category Counts

- Armor: 42
- Consumables: 1
- Weapons: 100

## Rarity Counts

- Common: 33
- Uncommon: 27
- Rare: 27
- Epic: 22
- Legendary: 17
- Mythic: 17

## Replacement Rule

Do not rename item IDs once they are assigned. To upgrade art, replace the PNG at the same path or update the `asset` value in `data/items/imported_item_registry.json`.

## Next Gameplay Use

- Hook common materials into anomaly loot tables.
- Add weapon/armor stat bonuses.
- Add cache reward pools by rarity.
- Add shop/crafting menus after the Chapter 1 combat loop is stable.
