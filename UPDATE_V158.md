# ASH VECTOR Update V158

## Story Dialog Override Pass

### Changes
- Replaced the Level 1 opening story launch with a self-contained hard dialog.
- The opening dialog no longer depends on the older story overlay CSS path.
- The story dialog uses its own inline layout, z-index, buttons, and retry draws.
- New Game now forces the Level 1 intro dialog every time.
- Added an emergency alert fallback if the browser blocks the custom dialog.
- Kept story once-read behavior after the intro is completed.
- Version bumped to v0.9.68 and cache links to ?v=158.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V158.md
