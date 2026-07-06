# Project ASH VECTOR — Update V188

## Lockdown Escalation + Roll System

This patch builds on the Vector Lockdown survival event.

### Added

- Added a visible buff/debuff roll display during Vector Lockdown.
- Every modifier now flashes through a short roulette-style roll before locking in.
- Added negative lockdown modifiers so not every 5-second roll is a free upgrade.
- Added debuffs such as Jammed Barrel, Cracked Rounds, Magnetic Drag, Vector Recoil, Brittle Static, and Hostile Surge.
- Buff and debuff history is now shown in the lockdown HUD with check/warning markers.
- Added Threat Level display to the lockdown HUD.

### Tuning

- Vector Lockdown now gets harder as the 60-second event continues.
- Monster HP, speed, contact damage, and spawn pressure rise slightly over time.
- Monster count is still capped at 15 active enemies so the arena does not become unreadable.
- Late-event pressure can occasionally spawn a second monster if there is room under the cap.
- Projectile buffs still matter, but debuffs can slow fire rate, reduce damage, reduce shot speed, remove a projectile, reduce pierce, or bring the next spawn sooner.

### Files Changed

- `index.html`
- `js/game.js`
- `UPDATE_V188.md`
