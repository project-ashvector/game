# Project ASH VECTOR - Update V197

## Vector Lockdown Reward Popup
- Added a stronger end-of-event reward popup after surviving Vector Lockdown.
- The popup now clearly shows Operator XP, player XP, kills, threat level, damage taken, reward rolls, recovered items, and stacked abilities.
- Added a Continue button so the reward screen stays visible until the player closes it.

## Stackable Mini-Game Abilities
- Added stackable abilities to the Vector Lockdown roll pool.
- Abilities can roll more than once and grow stronger each stack.
- Added:
  - Blood Circuit: heals a small percent of max HP when killing enemies.
  - Static Crit Loop: increases projectile crit chance.
  - Chain Static: shots can chain damage to another nearby enemy.
  - Reactive Armor: contact hits reflect damage back to the monster.
  - Gravity Leak: nearby monsters are slowed.
  - Orbiting Scrap: periodic orbit hits damage nearby monsters.
  - Cache Magnet: increases final event XP and reward rolls.

## Polish / Stability
- Ability rolls now show stack counts in the HUD.
- Reward XP scales with kills, threat level, and Cache Magnet stacks.
- Build label updated to v1.0.07.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V197.md`
