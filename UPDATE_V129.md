# ASH VECTOR Update V129

## Fullscreen Story Fix Pass

This patch fixes the unplayable state where the game starts, but the story dialog is hidden until fullscreen is exited.

### What was wrong
- The game was requesting fullscreen on the `#app` element.
- The story dialog is created as a body-level overlay.
- Browser fullscreen only displays the fullscreen element and its children.
- Because the story dialog was outside `#app`, it existed but was invisible and input still got trapped.

### Fixes
- Fullscreen now targets the whole document instead of the hidden intro/video layer or the game app only.
- Story overlays are mounted inside the current fullscreen element if needed.
- Story overlay z-index is raised so it stays above the game.
- Starting the game still safely hides/resets the intro video layer.
- This patch keeps V126 out of the update path.
- Bumped visible build to v0.9.39 and cache links to ?v=129.

### Replace these files
- index.html
- js/game.js
- UPDATE_V129.md
