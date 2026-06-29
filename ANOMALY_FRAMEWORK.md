# Project: ASH VECTOR — Anomaly Framework v0.0.5

This build adds the reusable monster/enemy system. In ASH VECTOR, enemies are called **Anomalies**. Each Anomaly has final replaceable asset paths, stats, combat lines, loot, threat level, and index/database text.

## Final folder pattern

```text
assets/anomalies/<anomaly_id>/
  battle.png
  icon.png
  profile.png
  death.png
  attack.png
```

The current playable prototype still mirrors art in `assets/enemies/` for compatibility, but the final naming standard is `assets/anomalies/`.

## Current Anomalies

- `toxic_slime` — low threat sewer mutation.
- `rust_rat` — armored scavenger vermin.
- `cable_wraith` — haunted cable organism.
- `sewer_king` — Sector 001 boss-class anomaly.

## Replacement rule

When final art is generated, replace the file with the same name. Do not change the code. Example:

```text
assets/anomalies/toxic_slime/battle.png
```

## Future expansion

Every future monster can be added by creating:

1. An asset folder.
2. A JSON entry or file.
3. A map spawn reference.

The engine is being built so new enemies plug in without rewriting the battle system.
