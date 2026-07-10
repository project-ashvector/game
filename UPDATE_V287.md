# Project ASH VECTOR V287 – Immersive World Foundation

- Added a continuously animated, performance-capped field renderer so fog, particles, lighting, camera easing, and environmental motion remain alive while the player stands still.
- Added viewport tile culling so the animated renderer only draws the visible world area plus a safety margin instead of redrawing the full expanded map every frame.
- Added Auto, Cinematic, Balanced, and Performance graphics profiles in Configuration.
- Added optional dynamic lighting and fog with player-centered visibility plus colored light spill from terminals, healing stations, archives, portals, exits, caches, anomalies, and bosses.
- Added stage-specific ash, ember, rain, snow, spore, pollen, and fracture-shard particle themes across F-001 through F-012.
- Added cinematic camera look-ahead based on facing direction, smoother follow movement, and restrained impact shake.
- Added front/back depth ordering for decorative props so the operator can pass behind nearby scenery instead of always rendering above it.
- Added quality-scaled terrain cracks and grit to reduce the flat tile-map appearance.
- Added stronger canvas depth, contrast, and game-card presentation while preserving phone layouts.
- Reduced Motion now automatically lowers environmental motion and particle density.
- Fixed the training-node minimap color lookup so ready skill objects cannot interrupt minimap rendering.
- Hardened audio fades by clamping every animation frame to the browser-safe 0–1 volume range.
- No changes to saves, map collision, NPC logic, story flags, combat balance, rewards, portals, level requirements, or asset paths.

## Changed files

- `index.html`
- `css/style.css`
- `js/game.js`
- `UPDATE_V287.md`
