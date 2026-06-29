# Project: ASH VECTOR — Asset Manifest

This build consolidates the approved generated concept art and the playable game assets into one repository.

## Game-ready assets used by the current build

### Branding
- `assets/ui/game_logo.png`
- `assets/ui/emblem.png`
- `assets/ui/splash_logo.png`
- `assets/logos/main_logo.png`
- `assets/logos/emblem.png`
- `assets/logos/splash_logo.png`
- `assets/logos/favicon.png`

### Operator AV-001
- `assets/operators/av001/profile.png`
- `assets/operators/av001/portrait.png`
- `assets/operators/av001/battle.png`
- `assets/operators/av001/sprite_sheet.png`
- `assets/operators/av001/icon.png`

### Anomalies
- `assets/anomalies/an001_rust_hound/battle.png`
- `assets/anomalies/an001_rust_hound/icon.png`
- `assets/anomalies/boss001_rust_mother/battle.png`

### Fracture 001
- `assets/fractures/fracture001/background.png`
- `assets/fractures/fracture001/minimap.png`
- `assets/fractures/fracture001/tileset.png`
- `assets/battle_backgrounds/toxic_sewers_battle.png`

### Items
- `assets/items/med_patch.png`
- `assets/items/scrap_metal.png`
- `assets/items/corrupted_catalyst.png`
- `assets/items/keycard_lv1.png`
- `assets/items/archive_log_001.png`
- `assets/items/operator_shard_vyra.png`

## Master concept/reference sheets preserved in this repo

These are not all directly used by the game yet. They are the approved visual reference sheets used to derive future production files.

- `assets/source/concepts/branding/branding_pack_master.png`
- `assets/source/concepts/branding/branding_identity_sheet.png`
- `assets/source/concepts/operators/av001_master_sheet.png`
- `assets/source/concepts/ui/ui_master_sheet.png`
- `assets/source/concepts/fractures/fracture001_toxic_sewers_master_sheet.png`
- `assets/source/concepts/anomalies/an001_master_sheet.png`
- `assets/source/concepts/style_bible/style_guide_master.png`
- `assets/source/concepts/early_refs/gameplay_showcase_reference.png`
- `assets/source/concepts/early_refs/early_operator_sheet_reference.png`
- `assets/source/concepts/early_refs/early_profile_reference.png`
- `assets/source/concepts/early_refs/early_profile_ui_reference.png`

## Replacement rule

Keep filenames stable. When final art replaces a placeholder, overwrite the existing file path instead of changing the code.

Example:

`assets/operators/av001/portrait.png`

Replace that file with the final portrait image using the same filename. The game will load the new version automatically.


## v27 Imported Creature Library
- Imported 100 anomaly assets from `monsters.zip`.
- Imported 53 boss assets from `bosses.zip`.
- See `IMPORTED_CREATURE_LIBRARY_V27.md` for ID mapping and paths.
