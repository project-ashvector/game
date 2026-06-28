# Project: ASH VECTOR

**Version 0.0.1 — Developer Build**

A static browser RPG prototype built for GitHub Pages. This build includes the first version of the **ASH VECTOR Operating System (AVOS)** intro, classified boot sequence, database-style main menu, dungeon movement, battles, XP, inventory, save/load, and replaceable placeholder assets.

## Included in this build

- AVOS boot screen with typed terminal startup
- CRT scanline effect and screen glitch effect
- Cursor blinking
- Small generated UI beep sounds after user interaction
- Fade/transition into the main database menu
- Main Menu / Database screen:
  - Continue Operation
  - Initialize Operator
  - Archive Database
  - Operator Files
  - Anomaly Index
  - Configuration
- Playable Sector 001: Toxic Sewers
- Arrow key / WASD movement
- Mobile movement buttons
- Chests, key, door, NPC warning, enemies, boss
- Turn-based battle system with 4 combat protocols
- XP / Synchronization leveling
- Inventory / Equipment Database
- Save/load using browser localStorage
- Organized folder structure for replacing art later

## GitHub Pages setup

1. Create a repository named something like `project-ashvector`.
2. Upload all files from this folder.
3. Go to **Settings → Pages**.
4. Set source to **Deploy from a branch**.
5. Choose `main` branch and `/root`.
6. Open the GitHub Pages URL after it deploys.

## Asset replacement system

The placeholders are already named like final assets. Replace files without changing code.

Example:

```text
assets/characters/vyra/portrait.png
assets/characters/vyra/battle.png
assets/characters/vyra/sprite_sheet.png
assets/enemies/toxic_slime/battle.png
assets/battle_backgrounds/toxic_sewers_battle.png
assets/ui/game_logo.png
```

## Controls

- Move: Arrow keys or WASD
- Start/access: Enter or tap/click
- Return to database menu: Escape
- Mobile: On-screen directional buttons

## Current game title

**Project: ASH VECTOR**

GitHub repository names cannot use a colon, so use something like `project-ashvector` for the repo name.


## UI Kit v0.0.2

This build includes the first reusable ASH VECTOR interface layer: CRT panels, database cards, protocol buttons, health/sync bars, operator cards, anomaly cards, and replaceable placeholder UI files in `assets/ui/`. See `UI_KIT.md` for the naming guide.


## v0.0.4 — Operator Framework

- Added Operator Database screen.
- Added `assets/operators/vyra/` final replaceable art paths.
- Added `data/operators/vyra.json`.
- Added gacha-ready Operator Archive card.
- Added battle mini portrait layout.
- Added `OPERATOR_FRAMEWORK.md`.


## v0.0.5 — Anomaly Framework

Added the ASH VECTOR Anomaly Index, reusable anomaly data structure, final monster asset folder naming, anomaly JSON records, and threat database UI. Current anomalies now use `assets/anomalies/<id>/` so final monster art can be replaced without editing code.


## v0.0.6 — Fracture Engine

This build includes the first Fracture/Dungeon framework:

- Camera-follow exploration
- Fracture 001: Toxic Sewers
- Fracture Index database screen
- Mini-map reveal system
- Chests, keys, locked doors, save terminals, healing stations, lore terminals, anomaly triggers, boss trigger, and exit tile
- Data/asset folders for `assets/fractures/fracture001/` and `data/fractures/fracture001/`

Upload the full contents of this ZIP to GitHub Pages. Each ZIP version is a full project, not a patch.


## v7 Update — Combat Engine v2 + Inventory & Loot Engine v8

Added upgraded RPG battle framework: 4 Protocol buttons, enemy skills, guard, battle items, critical hits, dodge chance, Burn/Shock/Corruption/Freeze statuses, victory rewards, loot, XP Synchronization screen, and updated battle documentation.


## v8 Update — Inventory & Loot Engine

This build adds a proper inventory database, categorized items, loot tables, cache rewards, archive collectibles, currency placeholders, catalyst materials, and Operator Shards for the future gacha/upgrade system. All item placeholder image filenames are final so future art can be swapped in without touching code.

New documentation: `INVENTORY_LOOT_ENGINE.md`.
