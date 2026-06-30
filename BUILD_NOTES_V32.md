# Project: ASH VECTOR v32 — Cryptic Idle Worlds Code Reuse

This build imports reusable systems and assets from the older `crypticidleworlds-main` project.

## Reused / adapted
- RuneScape-style XP table from `js/combat.js`.
- Skill matrix structure from `js/skills.js`.
- Combat skill focus selection: Striker Protocol, Force Module, Barrier Matrix, Neurohex, Synapsis Bowline.
- Non-combat skill placeholders for future systems: Anomaly Hunting, Cryptomining, Datafishing, Codecraft, Forgentics, System Hacking.
- Old skill icon assets copied into `assets/skills/`.
- Old region and battle background art copied into `assets/legacy/backgrounds/`.
- Legacy source files preserved under `legacy/crypticidleworlds/` for future reference.

## Gameplay changes
- Battles now award main Sync XP and the selected combat-style XP.
- Added `Progression Matrix` screen to menu/topbar.
- Saves now include `skillData` and `combatStyle`. Existing saves are upgraded safely on load.

## Not reused yet
The old project pages were a different idle-game structure, so they were preserved as reference rather than directly merged into the main game loop.
