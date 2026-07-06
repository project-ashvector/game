# Project ASH VECTOR — Update V187

## Lockdown Combat + HP Pass

This update fixes the Vector Lockdown survival event so it feels like an actual roguelike combat room instead of monsters only chasing the player.

### Changed

- Fixed lockdown projectile movement so shots visibly travel from the active character instead of skipping across the arena too fast.
- Added safer projectile hit detection so shots can actually damage and kill lockdown monsters.
- Added varied projectile visuals:
  - arrow-like vector bolts
  - round energy shots
  - square charged shots
  - diamond vector shots
  - glowing trails behind shots
- Added an operator HP bar directly in the Vector Lockdown HUD.
- Added a small HP bar above the player during lockdown.
- Monsters now deal real contact damage when they hit the player.
- Player HP can now drop all the way to 0 during lockdown.
- Added a Vector Lockdown defeat state if the player dies during the event.
- Added an Emergency Reboot button after lockdown defeat.
- The defeat state tracks:
  - killer monster name
  - kills earned
  - damage taken
  - total deaths
- Updated build labels to `v0.9.97`.

### Notes

The goal of this pass is to make the lockdown loop clear:

1. Warning countdown starts.
2. Arena seals.
3. Real monsters enter slowly.
4. Character auto-fires visible projectiles.
5. Projectiles kill monsters.
6. Monsters can hit the player.
7. HP drops.
8. The player either survives for rewards or dies and reboots.
