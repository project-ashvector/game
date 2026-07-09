# Project ASH VECTOR - Update V247

## Level + Lockdown Asset Restore Pass

This update fixes the asset loading regression from the performance streaming passes.

### Fixed
- Canvas images no longer use browser `loading="lazy"` behavior.
- Once the game requests an image for the current level, it now loads immediately instead of waiting forever off-screen.
- Map objects now load when drawn:
  - terminals
  - doors
  - portals
  - chests
  - med pickups
  - lore props
  - wall/floor props
- NPC images now load when drawn.
- Training node/object images now load when drawn.
- Anomaly and boss images now load when drawn.
- Vector Lockdown / minigame assets now preload at warning/start:
  - enemy images
  - projectile images
  - buff icons
- Current level assets still load without forcing the whole game to preload every stage.

### Build
- Updated build label to `v247 // LEVEL ASSET RESTORE PASS`.

### Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V247.md`
