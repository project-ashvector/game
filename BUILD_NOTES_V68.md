# Project: ASH VECTOR v0.6.8

## Respawn Training Loop
- Normal anomaly encounters now respawn after a 3 second delay.
- Bosses do not respawn automatically.
- Respawn timers defer if the player is standing on the respawn tile or still inside battle/story UI.
- Added per-stage anomaly kill tracking so players can grind XP, credits, skills, and drops.
- Mission anomaly objective is capped at 3/3 while total kills keep counting separately.
- F-002 encounter IDs were aligned to the existing imported creature roster. No new monster names were added.

## Test Notes
- Clear an anomaly, wait about 3 seconds, step away from the tile if needed, and the encounter should reappear.
- Kills and respawn queue are visible in the Fracture Status panel.
