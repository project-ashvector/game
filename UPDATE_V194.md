# Project ASH VECTOR — V194 Free-Roam Lockdown Update

## Main changes

- Changed Vector Lockdown from a sealed arena event into a free-roam survival mini-game.
- The 10-second warning still appears before the event starts, but the player is no longer trapped inside a locked box.
- Raised the lockdown monster cap from 25 to 100.
- Added stronger wave scaling so the enemy count can build much higher over the 60-second event.
- Normal map interactions are paused during the event:
  - map anomaly/boss encounters
  - NPC conversations
  - training nodes
  - chests/caches
  - healing stations
  - lore pickups
  - doors/gates
  - exits/portals
- All normal interactions unlock again after the event ends or the player fails.
- Added a subtle red flashing edge hue during the active mini-game.
- Kept the yellow warning edge during the countdown.
- Made the random-event HUD smaller on desktop and mobile.
- Updated mobile HUD sizing again so the lockdown card blocks less of the play area.
- Updated build labels to v1.0.04.

## Changed files

```text
game-main/index.html
game-main/css/style.css
game-main/js/game.js
game-main/UPDATE_V194.md
```
