# Project: ASH VECTOR v0.8.0 Patch Only

## Added
- Anomaly Research / Bestiary progression system.
- Every monster and boss kill now saves research progress by creature ID.
- Research ranks unlock at 1, 5, 10, 25, and 50 kills.
- Research rewards grant credits, Anomaly Hunting XP, and supplies.
- First kills unlock research entries in the Anomaly Index.
- Pre-battle scans now show prior kills and next research reward progress.
- Victory screen now shows research rank/progress.
- Fracture Status and HUD stats now show research totals.
- Anomaly Index now shows kills, research rank, next reward, and stage history per creature.

## Notes
- No new monsters were added. This uses the existing imported anomaly and boss library.
- No CSS changes and no new assets required.
- Save migration is automatic: existing saves get an empty research log and start tracking from this update forward.

## Patch contents
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V80.md`
