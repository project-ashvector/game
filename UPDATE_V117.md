# ASH VECTOR Update V117

## Stage Color Identity Pass

Yes — this update changes tile color in-game without editing the source tile image files.

### How it works
- Floor colors are generated through canvas rendering and stage-specific palette data.
- Wall colors, path overlays, and atmosphere tints are applied at runtime.
- The original PNG/tile assets are untouched.

### Changes
- Added unique procedural floor palettes for F-001 through F-012.
- Added missing unique palettes for F-007 through F-012 so late-game maps no longer inherit the early graveyard look.
- Added per-stage wall tint and wall-edge color for F-007 through F-012.
- Added per-stage path tint for F-007 through F-012.
- Added per-stage atmosphere/fog/glow colors for all 12 stages.
- Added subtle accent shapes to floor tiles so each stage has a stronger identity while staying readable.
- Added small prop tint packs for F-007 through F-012 using existing assets.
- Bumped visible build to v0.9.27 and cache links to ?v=117.

### Replace these files
- index.html
- js/game.js
- UPDATE_V117.md
