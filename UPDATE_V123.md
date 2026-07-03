# ASH VECTOR Update V123

## Intro Video Clean Start Pass

This patch makes the intro gate/menu disappear immediately when the player starts the video.

### Changes
- Pressing Enter / Space / tapping Start now instantly hides the intro gate.
- The dark overlay shade is hidden while the intro video plays.
- The video is forced above the boot UI while playing.
- Gate styles are reset only if playback is blocked or after the video finishes.
- Main menu still opens after the video ends.
- Main menu music still uses pause.mp3 through the intro route change.
- Bumped visible build to v0.9.33 and cache links to ?v=123.

### Replace these files
- index.html
- js/game.js
- UPDATE_V123.md
