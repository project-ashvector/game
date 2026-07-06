# Project ASH VECTOR — V184 Lockdown Survival Projectile Pass

## Changed

- Reworked Vector Lockdown into a clearer roguelike survival event.
- The event now visibly seals the arena with red LOCK border tiles and a pulsing boundary.
- Player cannot leave the sealed arena until the 60-second surge is survived.
- Added auto-projectile firing during lockdown.
- Monsters now flood in from the edge of the locked area and slowly chase the player.
- Contact with flood monsters damages the player, but does not start normal turn-based battle.
- Projectile upgrades now focus on roguelike-style combat growth:
  - more projectiles per volley
  - stronger projectile damage
  - faster fire rate
  - faster projectile speed
  - piercing shots
  - scatter shots
- Lockdown HUD now shows projectile count, damage, fire rate, kill count, and active hostiles.
- Survival rewards now scale partly with kills and reward upgrades.

## Files Changed

- `index.html`
- `css/style.css`
- `js/game.js`
- `UPDATE_V183.md`
- `UPDATE_V184.md`
