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
