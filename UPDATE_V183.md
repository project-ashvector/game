# Project ASH VECTOR — Update V183

## Character Progression + UI + Lockdown Pass

Changed files:
- `index.html`
- `css/style.css`
- `js/game.js`
- `UPDATE_V183.md`

## Added

- Separate operator progression system.
- Each playable operator now starts with their own Operator Level 1 progression.
- Active operator XP is gained from battle victories and Vector Lockdown clears.
- Operator stat identity now feeds into combat:
  - HP bonus
  - EP bonus
  - attack bonus
  - defense bonus
  - crit bonus
  - block / XP bonus where appropriate
- Each operator now has its own combat move list.
- Character roster now shows:
  - operator level
  - operator XP bar
  - role/passive description
  - stat bonuses
  - unique battle moves
- Main HUD now shows both Player Level and active Operator Level.
- Operator Archive panel now displays active operator role and passive.

## Added: Vector Lockdown Event

- Random rogue-lite room event added after early progression.
- Rooms can enter a 60-second Vector Lockdown.
- Lockdown gives a new random upgrade every 5 seconds.
- Temporary upgrades include Ash Blades, Bone Armor, Vector Heart, Static Pulse, Scrap Magnet, Ember Edge, and more.
- Lockdown applies atmospheric danger pulses without deleting permanent progress.
- Surviving rewards the player with useful items and operator XP.
- Added `window.AV.startVectorLockdown()` for playtesting the event from browser console.

## UI / Visual Polish

- Cleaner panels with better spacing and softer card layout.
- Cleaner top action buttons.
- Better quick-bag grid.
- Improved character screen readability.
- Added fog/vignette visual layer over gameplay.
- Added stronger red/cyan visual treatment during Vector Lockdown.
- Battle buttons now have cleaner rounded styling.

## Notes

This update is a foundation pass. The Vector Lockdown is implemented as a safe timed survival event first, so it does not break pathing, boss access, or existing battle flow. A later pass can attach wandering monster AI and real-time enemies to the lockdown system.
