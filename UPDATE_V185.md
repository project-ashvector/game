# Project ASH VECTOR — V185 Lockdown Monster Tuning

This patch tightens the Vector Lockdown survival event based on gameplay testing.

## Changed

- Lockdown enemies now use random real anomaly monster assets already in the game instead of orange placeholder dots.
- Lockdown enemies move much slower so the event feels survivable and readable.
- Enemy spawn pacing is reduced.
- Maximum active lockdown monsters is capped at 15.
- Enemies are easier to kill during lockdown and should visibly die from projectile hits.
- Projectiles now use different visible shot styles/colors so it is clear the character is firing at the monsters.
- Projectile upgrades now focus on roguelike-style projectile growth:
  - more projectiles
  - stronger projectiles
  - faster fire rate
  - faster projectile speed
  - pierce
- Lockdown HUD now explains the active monster cap.
- Monster contact damage is lower and slower.

## Files Changed

- `js/game.js`
