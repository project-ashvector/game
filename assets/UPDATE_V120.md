# ASH VECTOR Update V120

## Intro Video Pass

This patch replaces the old boot/typewriter loading screen with a full intro video sequence.

### Changes
- Added `assets/video/intro.mp4` to the patch.
- Boot screen now shows a press Enter / tap video gate.
- Pressing Enter, Space, tapping, or controller confirm starts the intro video.
- The full video plays before the main menu opens.
- When the video ends, the game transitions automatically to the main menu.
- Main menu music now uses `assets/music/pause.mp3` instead of intro music.
- Build bumped to v0.9.30 and cache bumped to ?v=120.

### Replace / add these files
- index.html
- js/game.js
- UPDATE_V120.md
- assets/video/intro.mp4
