# ASH VECTOR Update V159

## New Game Story Root Fix Pass

### Root cause
The story was being called at the very end of startGame(), after map render, music/radio setup, save work, fullscreen setup, and older overlay code. If any one of those systems failed or hid the overlay, the opening story never appeared.

### Changes
- New Game now uses a dedicated newGameRootStart() path.
- The opening dialog is created before render/audio/save/fullscreen work can cancel it.
- The opening dialog no longer depends on the old story overlay, old story CSS, or STORY_SCENES.
- Enter/Space, the New Game button, and AV_MENU.start all route to the same new-game story path.
- Added a fully self-contained Level 1 opening dialog with its own DOM, CSS class, inline styles, z-index, and buttons.
- Render/audio errors after New Game are caught so the story can still stay open.
- Version bumped to v0.9.69 and cache links to ?v=159.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V159.md
