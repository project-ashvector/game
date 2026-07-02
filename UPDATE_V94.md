# Project: ASH VECTOR — Update V94

## Controller QA + Lighting Pass

Changed files:

- `index.html`
- `js/game.js`
- `css/style.css`

## Fixes

- Moved Fermilat on F-001, F-002, and F-003 so he is reachable but does not block the boss route.
- Bumped the map version so existing local saves rebuild onto the corrected routes.
- Made the Playtest Console stage loader more forceful for QA testing.
- Added direct QA buttons for loading F-001, F-002, and F-003.
- QA stage loading now enables the level bypass and unlocks all stage records.
- Unlock All Levels now also raises the player to the highest current stage requirement for faster testing.

## Controller updates

- Main menu now supports controller hover selection with D-pad / left stick.
- Non-battle menus now support controller hover selection with D-pad / left stick and confirm.
- Pre-battle keeps simple hover selection: confirm / retreat.
- Battle face buttons now map directly to the four main attack commands:
  - Xbox: A / B / X / Y
  - PlayStation: Cross / Circle / Square / Triangle
  - Switch: B / A / Y / X
- Battle utility commands now use shoulder/trigger shortcuts:
  - LT/L2/ZL: Vector Cell
  - RB/R1/R: Guard
  - RT/R2/ZR: Overdrive
- Start/Menu/Options can still confirm the highlighted battle command.

## Visuals

- Brightened the game canvas.
- Added a stronger player-centered light radius.
- Reduced the heavy black fog/vignette so the floor and paths are easier to read.
- Kept different lighting moods for F-001, F-002, and F-003.
