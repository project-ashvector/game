# ASH VECTOR Update V127

## Clean Map Lighting Pass

This patch is based on V125 and intentionally does not include the V126 locked-playback changes.

### Changes
- Toned down Vyra/player glow and cyan outline.
- Reduced the player shadow and removed the heavy marker-like lighting.
- Removed visible floor tile grid strokes.
- Removed inset square path overlays that made the floor look like separate boxes.
- Smoothed floor rendering so stages read as cleaner continuous surfaces.
- Kept walls readable by drawing only floor-facing wall edges, not boxed wall tiles.
- Kept interactable objects, NPCs, enemies, doors, and exits readable.
- Bumped visible build to v0.9.37 and cache links to ?v=127.

### Replace these files
- index.html
- js/game.js
- UPDATE_V127.md
