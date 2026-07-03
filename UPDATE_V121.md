# ASH VECTOR Update V121

## Fullscreen Intro Video Fix

This patch fixes the intro video flow and adds a main-menu replay option.

### Changes
- Video now starts in real fullscreen when the player presses Enter / Space / taps the start button.
- Uses the video element itself for fullscreen when supported.
- Adds Safari/iPhone fallback using webkit fullscreen.
- Adds video controls while the intro is playing.
- Adds playback fallback if the browser blocks unmuted video.
- Adds a Skip to Main Menu button on the intro gate.
- Adds a main-menu button: Rewatch Intro Video.
- Main menu still uses assets/music/pause.mp3.
- Re-encoded intro.mp4 to a smaller GitHub-friendly version under the normal 100 MB file limit.
- Bumped visible build to v0.9.31 and cache links to ?v=121.

### Replace/add these files
- index.html
- js/game.js
- UPDATE_V121.md
- assets/video/intro.mp4
