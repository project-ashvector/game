# Project: ASH VECTOR — Playtest Sprint v28

## Focus
This sprint improves the two areas that were most visibly rough during testing:

1. Battle screen readability and scaling.
2. Creature library usability after importing the monster/boss asset packs.

## Changes

### Battle UI polish
- Reworked the battle overlay into a fixed 16:9 combat frame.
- Reduced large overlapping battle text.
- Added stronger battle panel spacing.
- Improved sprite containment so the operator/enemy art fits inside the combat area.
- Added responsive battle layout rules for smaller screens.

### Creature Database v1
- Added searchable Anomaly/Boss database UI.
- Added record filtering: All, Anomalies, Bosses, Chapter 1.
- Added creature count display.
- Added cleaner creature file preview with battle art, stats, loot, and asset path.
- Uses the imported creature library from v27.

## Test checklist
- Open Anomaly Index from the main menu.
- Search for a creature name.
- Filter Bosses only.
- Select several imported creatures and confirm their art loads.
- Enter a battle and confirm text no longer overlaps the battle title.
- Resize the browser and confirm combat remains inside the viewport.
