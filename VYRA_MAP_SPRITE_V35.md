# v35 — Vyra Exploration Sprite

This build connects AV-001 Vyra to the exploration map renderer.

## Added
- `assets/operators/av001/sprites/map_sprite.png`
- `assets/operators/av001/sprites/map_sprite_large.png`

## Changed
- The overworld no longer renders Vyra as a white placeholder block.
- The map renderer now draws the canonical AV-001 image as a feet-anchored exploration sprite.
- Movement stores facing direction for future animation support.

## Next
- Replace static `map_sprite.png` with a full direction-based walking sprite sheet.
- Add idle/walk frame animation.
- Add enemy patrol sprites using the imported anomaly assets.
