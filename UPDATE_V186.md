# Project ASH VECTOR — Update V186

## Vector Lockdown Countdown Fix

This patch fixes the random event flow and makes the player clearly warned before the survival room starts.

### Added

- Added a **10-second Vector Surge warning countdown** before Vector Lockdown starts.
- The warning now opens the same lockdown HUD before the event begins.
- The future sealed arena is previewed with yellow **WARN** border tiles during the countdown.
- When the countdown reaches zero, the warning border turns into the red **LOCK** sealed arena.

### Fixed / Tuned

- Vector Lockdown trigger logic is less restrictive so the event can actually appear during normal exploration.
- Cooldown reduced so testing the random event does not feel broken.
- Trigger chance increased slightly while still keeping it random.
- Lockdown start is now delayed cleanly instead of instantly sealing the room.
- If a battle or story scene opens during the warning, the warning safely cancels instead of breaking the event.

### Survival Tuning Kept

- Monsters remain capped at **15 active hostiles max**.
- Monsters use random existing in-game anomaly/monster sprites.
- Monsters move slower and spawn less aggressively.
- Player auto-fire continues using visible projectile shots.
- Projectile upgrades still focus on more shots, stronger shots, faster shots, speed, and piercing.

## Files Changed

```text
game-main/index.html
game-main/js/game.js
game-main/UPDATE_V186.md
```
