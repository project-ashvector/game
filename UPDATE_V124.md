# ASH VECTOR Update V124

## Intro Video Fadeout Pass

This patch makes the intro video fade out automatically before opening the main menu.

### Changes
- When the intro video finishes, it now fades to black before the main menu opens.
- The fade happens automatically from the video ended event.
- The fade also works when iPhone/Safari exits video fullscreen at the end.
- Start/skip behavior still works normally.
- The intro gate still disappears when playback starts.
- Main menu still uses pause.mp3.
- Bumped visible build to v0.9.34 and cache links to ?v=124.

### Replace these files
- index.html
- js/game.js
- UPDATE_V124.md
