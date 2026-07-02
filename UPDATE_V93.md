# Project: ASH VECTOR — Update V93

## Controller Battle Menu Pass

Changed files only:

- `index.html`
- `js/game.js`
- `css/style.css`
- `UPDATE_V93.md`

## What changed

- Added controller button labels directly to the pre-battle **Engage / Retreat** menu.
- Added controller button labels directly to the in-battle combat command menu.
- Added D-pad / left-stick command cursor movement for pre-battle and battle menus.
- Added highlighted/hovered controller selection state so the active option is obvious.
- `A / Cross / B on Switch` confirms the highlighted command.
- `B / Circle / A on Switch` retreats from pre-battle and guards in battle.
- Kept quick controller shortcuts for battle commands:
  - South button: choose highlighted command
  - West / LB: second attack shortcut
  - LT/L2/ZL: third attack shortcut
  - RT/R2/ZR: Vector Cell shortcut
  - North / RB: Overdrive shortcut
  - East button: Guard shortcut
- Fixed controller handling order so battle overlays no longer get accidentally closed by the generic overlay back behavior.
- Updated boot/menu/cache version to **v0.9.3**.

## Test notes

Connect an Xbox, PlayStation, Switch Pro, or generic mapped controller before or during gameplay. Enter an anomaly tile, then use the D-pad or left stick to move between **Engage** and **Retreat**. In battle, use the D-pad or left stick to move between attacks, Vector Cell, Guard, and Overdrive, then press the south confirm button.
