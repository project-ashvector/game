# Project: ASH VECTOR v33 — Code-Only Cryptic Idle Worlds Reuse

This build intentionally ignores legacy art/assets from the old Cryptic Idle Worlds project and only keeps/adapts reusable code ideas.

## Reused/adapted code concepts

- RuneScape-style XP table up to level 99.
- Skill/progression matrix structure.
- Combat-focused skill XP rewards.
- Enemy encounter data patterns.
- Combat log / repeated progression feedback style.
- Local save/autosave structure using browser localStorage.

## What changed in v33

- Removed `assets/legacy/` from the packaged build.
- Removed dependency on old `assets/skills/*.png` icons.
- Skill UI now uses built-in CSS glyph badges instead of imported legacy images.
- Training focus now affects combat:
  - Striker Protocol: base damage and crit bonus.
  - Force Module: stronger damage scaling.
  - Barrier Matrix: incoming damage reduction.
  - Neurohex: EP cost discount and protocol efficiency.
  - Synapsis Bowline: dodge and precision bonus.
- Added silent autosave every 30 seconds while the game is active.
- Preserved the old code samples under `legacy/crypticidleworlds/code/` for reference only.

## Important

No legacy assets from Cryptic Idle Worlds are required for the reused systems to work.
