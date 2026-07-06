# ASH VECTOR Update V163

## Vyra Walking Animation Framework Pass

### What was in the uploaded Vyra pack
- 8 direction idle rotations.
- New `Walking` animation folders.
- 4 walking frames per direction.
- 32 walking frames total.

### What this patch makes usable
- Added the walking frames into `assets/operators/av001/sprites/animations/walking/...`.
- Mirrored the same frames into `assets/operators/vyra/sprites/animations/walking/...` for legacy path safety.
- Updated the character framework to preload animation frames.
- Updated player drawing to use walking frames while moving.
- Added a short step animation loop so movement visibly animates after each tile step.
- Keeps idle facing sprites when the player is standing still.
- Bumped build to `v0.9.73` and cache to `?v=163`.

### Replace these files/folders only
- `index.html`
- `js/game.js`
- `assets/operators/av001/sprites/rotations/`
- `assets/operators/av001/sprites/animations/walking/`
- `assets/operators/av001/sprites/map_sprite.png`
- `assets/operators/av001/sprites/map_sprite_large.png`
- `assets/operators/vyra/sprites/rotations/`
- `assets/operators/vyra/sprites/animations/walking/`
- `assets/operators/vyra/sprites/map_sprite.png`
- `assets/operators/vyra/sprites/map_sprite_large.png`
- `UPDATE_V163.md`
