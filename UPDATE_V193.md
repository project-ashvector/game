# Project ASH VECTOR — V193 Lockdown Polish Mega Pass

## Build
- Updated visible build labels to **v1.0.03**.
- This patch is meant to be applied after V192.

## Vector Lockdown Gameplay
- Added event difficulty tiers:
  - Minor Lockdown
  - Vector Surge
  - Ash Collapse
  - Red Alert
- Difficulty now scales from stage/player progression.
- Hostile pressure ramps more cleanly through the 60 seconds.
- Monster cap stays at **25**, but the active wave limit ramps from smaller waves toward the full cap.
- Monsters now use light separation movement so they do not stack into one blob.
- Added fast, normal, and tank-style lockdown monster behavior.

## Projectile System
- Projectile PNGs now have individual behavior instead of only visual differences.
- Examples:
  - Ash Bolt: fast shot
  - Rust Spike: piercing shot
  - Vector Pulse: wider hitbox
  - Ember Round: heavier damage
  - Static Needle: very fast crit shot
  - Ash Disc: multi-pierce saw shot
  - Grave Flame: slower burn projectile
  - Vector Core: elite heavy shot
- Added projectile-specific size, speed, damage, hit radius, pierce, crit, splash, and damage-over-time hooks.
- Projectiles now show clearer impact feedback.

## Combat Feedback
- Added enemy hit flash when projectiles land.
- Added floating hit numbers near enemies.
- Added kill text near defeated lockdown enemies.
- Added player contact-damage floats during lockdown.

## Character Lockdown Bonuses
- Active operators now influence lockdown events.
- Examples:
  - Vexa starts with an extra projectile and faster firing.
  - Tank operators gain more event HP and take less contact damage.
  - Assassin operators gain more projectile damage.
  - Tech operators gain projectile speed and safer rolls.
  - Support operators gain safer rolls and better rewards.

## Rewards
- Added a proper Vector Lockdown reward screen after surviving.
- Reward screen now shows:
  - event tier
  - kills
  - damage taken
  - rolls
  - reward count
  - operator XP earned
  - item rewards
- Added a Continue button to close the reward screen cleanly.

## Mobile / Phone Scaling
- Added another phone readability pass for the game overlays.
- Database/inventory/fracture panels fit better on phone screens.
- Mobile controls shrink during lockdown so they cover less of the arena.
- Lockdown reward screen is now mobile-sized.
- Game canvas height is reduced during lockdown/warning on phones to keep controls and HUD usable.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V193.md`
