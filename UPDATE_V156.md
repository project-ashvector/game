# ASH VECTOR Update V156

## New Game Button + Story Start Fix Pass

### Changes
- Replaced Initialize Operator with one clean New Game button.
- Removed the Replay Opening Story button from the main menu.
- New Game now force-starts the opening story dialog.
- Opening story no longer depends on a stale storySeen flag from older saves.
- Story dialog waits for fullscreen/game layout to settle before opening.
- Story overlay now remounts into fullscreen if the browser changes fullscreen state.
- Story overlay now forces visible display/grid/z-index so it cannot silently hide behind the game.
- Bumped visible build to v0.9.66 and cache links to ?v=156.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V156.md
