# Project ASH VECTOR - Update V201

## Lockdown Buff Dock
- Moved active mini-game buff/projectile icons out of the top HUD and into a bottom dock above the mobile menu/action buttons.
- Made buff icons larger and easier to read.
- Added visible stack badges like `x1`, `x2`, `x3` on stackable abilities.
- The dock hides automatically when the event ends, fails, or is cancelled.

## Blood Circuit Fix
- Changed Blood Circuit from percent-based healing to fixed stack healing.
- Blood Circuit now heals 1 HP per kill per stack:
  - Stack 1 = +1 HP per kill
  - Stack 2 = +2 HP per kill
  - Stack 3 = +3 HP per kill
  - and so on

## Build Label
- Updated build label to `v1.0.11 // BOTTOM BUFF DOCK PASS`.
- Updated cache busting for `style.css` and `game.js`.

## Files Changed
- `game-main/index.html`
- `game-main/css/style.css`
- `game-main/js/game.js`
- `game-main/UPDATE_V201.md`
