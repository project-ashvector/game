# ASH VECTOR Update V157

## Level 1 Story Hard Fix Pass

### Changes
- Fixed Level 1 intro story not appearing after New Game.
- New Game now clears any stale story overlay before starting.
- Level 1 intro ignores old storySeen flags and forces the opening dialog.
- Story dialog opens before native fullscreen is requested.
- Native fullscreen now starts after the intro dialog closes.
- Added hard inline story overlay styles so the dialog is visible even if CSS fails to load.
- Added story overlay safety retries in case the browser hides the first render.
- Version bumped to v0.9.67 and cache links to ?v=157.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V157.md
