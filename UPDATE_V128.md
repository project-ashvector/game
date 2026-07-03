# ASH VECTOR Update V128

## Game Entry Video Fix Pass

This patch fixes the glitch where starting the game could reopen the intro video layer.

### Changes
- Added a safe intro-video shutdown helper before gameplay starts.
- Starting a new game now pauses/resets the intro video and hides the boot/video layer.
- Continue Operation also clears any stuck intro video state.
- Fullscreen requests no longer target the hidden boot/video screen.
- Gameplay fullscreen now targets the game app instead.
- V126 is still removed from the update path; this builds from V127.
- Bumped visible build to v0.9.38 and cache links to ?v=128.

### Replace these files
- index.html
- js/game.js
- UPDATE_V128.md
