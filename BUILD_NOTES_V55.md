# Build Notes V55 — Sound FX Integration

## Added
- One-shot SFX manager for short effects.
- `steps.mp3` plays on successful arrow-key movement.
- Random slash SFX plays when Vyra uses damage attacks:
  - `slash1.mp3`
  - `slash2.mp3`
  - `slash3.mp3`
  - `slash4.mp3`
- `battle-win.mp3` plays when a battle is won.
- `death.mp3` plays when Vyra reaches 0 HP before developer mercy recovery.
- `level-win.mp3` plays when Chapter 1 completion triggers.
- `item-pickup.mp3` plays when items are added to inventory.

## Audio paths
- Music: `assets/music/`
- Sound effects: `assets/sound fx/`

## Main file changed
- `js/game.js`
