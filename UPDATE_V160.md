# UPDATE_V160.md

## V160 — Character Framework + Full Vyra Replacement Pass

### Updated files
- index.html
- js/game.js
- assets/operators/av001/avatar.png
- assets/operators/av001/battle.png
- assets/operators/av001/battle_icon.png
- assets/operators/av001/expressions/alert.png
- assets/operators/av001/expressions/angry.png
- assets/operators/av001/expressions/determined.png
- assets/operators/av001/expressions/focused.png
- assets/operators/av001/expressions/neutral.png
- assets/operators/av001/expressions/smirk.png
- assets/operators/av001/icon.png
- assets/operators/av001/menu.png
- assets/operators/av001/operator_card.png
- assets/operators/av001/party_icon.png
- assets/operators/av001/portrait.png
- assets/operators/av001/profile.png
- assets/operators/av001/source_master.png
- assets/operators/av001/sprite_sheet.png
- assets/operators/av001/sprites/map_sprite.png
- assets/operators/av001/sprites/map_sprite_large.png
- assets/operators/av001/sprites/rotations/east.png
- assets/operators/av001/sprites/rotations/north-east.png
- assets/operators/av001/sprites/rotations/north-west.png
- assets/operators/av001/sprites/rotations/north.png
- assets/operators/av001/sprites/rotations/south-east.png
- assets/operators/av001/sprites/rotations/south-west.png
- assets/operators/av001/sprites/rotations/south.png
- assets/operators/av001/sprites/rotations/west.png
- assets/operators/av001/weapon.png

### What changed
- Added a lightweight operator framework in `js/game.js` so the active player character is no longer hardcoded everywhere.
- Added `currentOperator()`, `setActiveOperator()`, dynamic UI binding, and directional overworld sprite support.
- Replaced Vyra's operator art set across portrait, battle, menu, profile, icon, card, and map sprite assets using the new uploaded design.
- Updated story portraits, battle UI, roster text, and operator database visuals to read from the operator framework.
- Bumped build version/title to `0.9.70 // CHARACTER FRAMEWORK + FULL VYRA REPLACEMENT PASS`.

### Notes
- This patch only contains updated files.
- Future full-character swaps are now much easier because the game can point at a centralized operator definition instead of hardcoded asset references.
