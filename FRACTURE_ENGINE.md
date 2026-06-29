# Project: ASH VECTOR — Fracture Engine v0.0.6

This build adds the first dungeon framework for **Fracture 001: Toxic Sewers**.

## What changed

- Larger explorable dungeon map
- Camera follows the Operator
- Tile event system
- Chests, keys, locked doors, save terminals, healing stations, lore terminals, exits
- Mini-map that reveals explored tiles
- Fracture Index database screen
- Final placeholder paths for future map art
- Browser save/load still works through localStorage

## Replaceable Fracture Assets

Keep these filenames the same when replacing placeholder art:

```text
assets/fractures/fracture001/background.png
assets/fractures/fracture001/minimap.png
assets/fractures/fracture001/tileset.png
data/fractures/fracture001/layout.json
data/fractures/fracture001/events.json
```

## Tile Legend

```text
# = wall
. = floor
C = chest
K = key
D = locked door
S = save terminal
H = healing station
L = lore terminal
E = anomaly encounter
B = boss encounter
X = exit
```

## Design Goal

Every future dungeon should become a new Fracture folder. The engine should keep getting more data-driven so adding Fracture 002 later means adding files, not rewriting the whole game.
