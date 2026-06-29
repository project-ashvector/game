# Project: ASH VECTOR — Data Registry v23

This build begins separating game content into stable JSON-style data files. The current playable prototype still keeps some runtime definitions in `js/game.js`, but these files are now the canonical content records for future engine integration.

## Added data folders

- `data/operators/`
- `data/anomalies/`
- `data/bosses/`
- `data/items/`
- `data/skills/`
- `data/fractures/fracture001/`
- `data/dialogue/`

## Current records

- Operator: `data/operators/av001.json`
- Skills: `data/skills/av001_skills.json`
- Anomaly: `data/anomalies/an001_rust_hound.json`
- Boss: `data/bosses/boss001_rust_mother.json`
- Items: `data/items/items.json`
- Fracture layout: `data/fractures/fracture001/layout.json`
- Fracture events: `data/fractures/fracture001/events.json`
- Intro dialogue: `data/dialogue/fractures/fracture001_intro.json`

## Naming rule

Do not rename IDs or asset paths once code references them. Replace artwork by overwriting the existing PNG path.

Example: replace `assets/operators/av001/portrait.png`, do not rename it.
