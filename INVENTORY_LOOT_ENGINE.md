# Project: ASH VECTOR — Inventory & Loot Engine v8

This build adds the first real inventory and loot framework.

## Item Categories

- Consumables: healing and buffs
- Catalysts: upgrade materials
- Key Items: story or dungeon progression
- Archives: lore collectibles
- Credits: currency
- Operator Shards: future gacha / upgrade progression
- Vault Items: rare cache and boss rewards

## Permanent Placeholder Filenames

These are final code paths. Replace the PNG file with final art later without editing code.

```text
assets/items/med_patch.png
assets/items/stale_energy_drink.png
assets/items/credit_chip.png
assets/items/scrap_metal.png
assets/items/corroded_wiring.png
assets/items/rust_core.png
assets/items/corrupted_catalyst.png
assets/items/rust_key.png
assets/items/keycard_lv1.png
assets/items/archive_log_001.png
assets/items/operator_shard_vyra.png
assets/items/legendary_vault_core.png
assets/items/toxic_core.png
```

## Loot Tables

The game now supports named loot tables:

```text
standard_cache
military_cache
corrupted_cache
legendary_vault
```

Chests currently roll from Standard Cache or Military Cache depending on progression. Later we can attach specific cache types to map events.

## Enemy Loot

Anomalies now drop multiple item types, including catalysts and Operator Shards.

Examples:

- Toxic Slime: Med Patch, Scrap Metal
- Rust Rat: Credit Chip, Corroded Wiring
- Cable Wraith: Stale Energy Drink, Rust Core
- Sewer King: Toxic Core, Corrupted Catalyst, Vyra Operator Shard

## Inventory Database Screen

The main menu now has **Inventory Database**. The in-game side panel also has a button to open it.

The database shows:

- Item icon
- Item category
- Item rarity
- Owned amount
- Description
- Final replaceable asset path

## Next System

Next recommended milestone: **Dialogue & Cutscene Engine v9**.
