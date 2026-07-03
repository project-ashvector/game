# ASH VECTOR Update V113

## Protocol Challenge Pass

This is a larger systems update. It adds optional milestone gameplay on top of the current route, battle, story, checkpoint, and mission systems.

### New Systems
- Added a full AVOS Protocol Challenge Board inside Mission Briefing.
- Added five cross-fracture milestone challenges:
  - Cache Runner
  - Signal Technician
  - Anomaly Cleanup
  - Boss Breaker
  - Fracture Stabilizer
- Added claimable rewards for credits, Sync XP, Vector Cells, Med Patches, Rust Cores, Catalysts, Archive Logs, and Vyra Shards.
- Added a Route Intel panel in Mission Briefing showing:
  - fracture clear progress
  - boss core count
  - research progress
  - checkpoint status
  - per-stage open/locked/cleared state
- Objective tracker now shows Protocol Challenge reward readiness.
- Mission progress now shows checkpoint and challenge status.
- Victory Report now shows Protocol Challenge summary.
- Playtest Console now includes Reset Protocol Challenges.

### Gameplay Hooks
- Opening caches advances Cache Runner.
- Syncing terminals advances Signal Technician.
- Defeating anomalies advances Anomaly Cleanup.
- Defeating bosses advances Boss Breaker.
- Extracting/completing fractures advances Fracture Stabilizer.

### Build
- Bumped visible build to v0.9.23.
- Bumped cache links to ?v=113.

### Replace these files
- index.html
- js/game.js
- UPDATE_V113.md
