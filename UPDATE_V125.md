# ASH VECTOR Update V125

## Intro Auto Close Pass

This patch fixes the issue where the video fades and music starts but the fullscreen video player stays open until the user presses the fullscreen/video button.

### Changes
- Intro video now plays in CSS/page fullscreen instead of native video-player fullscreen.
- This lets the game close the video automatically when it ends.
- When the fade finishes, the game now exits fullscreen if needed, hides the boot screen, and shows the main menu.
- Video controls are hidden so the browser's native video overlay does not trap the screen.
- The intro gate still disappears when playback starts.
- Main menu still uses pause.mp3.
- Bumped visible build to v0.9.35 and cache links to ?v=125.

### Replace these files
- index.html
- js/game.js
- UPDATE_V125.md
