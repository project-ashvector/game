# Build Notes v31 — Creature Encounter Art Link

This build keeps the v30 fixed-screen cleanup and makes the imported creature library active in gameplay.

## Changes
- Fracture encounter tiles now pull real monster/boss art from the imported library.
- Map enemies now draw imported creature icons instead of generic circles.
- Battle encounters now use assigned imported creatures:
  - First anomaly: AN-001 Ashborn Revenant
  - Second anomaly: AN-007 Ashveil Spider
  - Third anomaly: AN-015 Bloodreaver Scarab
  - Boss gate: BOSS-001 Ashborn Revenant Lord
- The Anomaly Index now uses the same imported library and falls back to icon art if a battle image fails.
- Legacy Rust Hound / Rust Mother references remain removed from playable code.

## Test
1. Start a new game.
2. Move through Fracture 001.
3. Confirm enemy tiles show creature art.
4. Trigger an anomaly encounter.
5. Confirm the battle screen displays the selected imported creature.
6. Open Anomaly Index and confirm creature previews display.
