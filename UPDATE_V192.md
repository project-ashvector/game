# Project ASH VECTOR — V192 Projectile Asset Swap Update

## Added
- Added the uploaded transparent projectile PNG set to `assets/projectiles/`.
- Added 15 projectile assets for the Vector Lockdown auto-fire system:
  - Ash Bolt
  - Vector Pulse
  - Rust Spike
  - Bone Dart
  - Toxic Splinter
  - Scrap Shot
  - Ember Round
  - Static Needle
  - Corrupted Shard
  - Plasma Cube
  - Blood Spark
  - Ash Disc
  - Echo Pellet
  - Grave Flame
  - Vector Core

## Changed
- Replaced the old generated canvas projectile shapes with real PNG projectile assets.
- Lockdown volleys now cycle through the projectile asset set so shots look more visually different.
- Projectile trails still render behind the PNGs so the shots stay easy to see during movement.
- Projectile assets are loaded through the same cache/version system as other game images.

## Safety
- Added a fallback renderer so projectiles still show if an asset path is missing.
- Kept the existing hit detection, damage, pierce, buffs, debuffs, and enemy cap logic unchanged.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/assets/projectiles/*.png`
- `game-main/UPDATE_V192.md`
