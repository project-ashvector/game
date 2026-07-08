# Project ASH VECTOR - Update V241

## Critical Asset Path Performance Pass
- Split current-stage loading into critical assets and decorative assets.
- Critical route assets now load first: player/operator, portals, doors, chests, med pickups, lore/terminal props, NPCs on the current stage, and memory core art.
- Decorative floor/wall/prop art now streams after the game is already responsive.
- Current-stage boss/anomaly art now streams slightly later and in smaller chunks.
- Background all-game asset preload is less aggressive so it does not fight the intro/menu.
- NPC preload now only grabs NPCs used on the current stage during the critical path.

## Build
- Updated build label to `v241 // CRITICAL ASSET PATH PASS`.
- Updated cache busting to `?v=241`.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V241.md`
