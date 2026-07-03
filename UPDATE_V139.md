# ASH VECTOR Update V139

## Controller Speed Boundary Pass

This patch fixes controller movement being too fast and causing map-breaking boundary glitches.

### Changes
- Slowed controller movement repeat rate.
- Increased controller analog stick deadzone so tiny stick drift does not move Vyra.
- Controller movement is now strictly one tile at a time.
- Diagonal controller movement is blocked to prevent corner clipping.
- Movement now whitelists valid map tiles only.
- Blank/unknown map characters now count as blocked instead of walkable.
- Safety tether now only accepts real walkable tiles as valid recovery spots.
- Route pathing now uses stricter tile validation.
- Bumped visible build to v0.9.49 and cache links to ?v=139.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V139.md
