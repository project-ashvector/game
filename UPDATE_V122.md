# ASH VECTOR Update V122

## Intro Music Route Pass

This patch changes the old intro music route so anything that still calls the intro music key now plays pause.mp3 instead.

### Changes
- MUSIC.intro now points to assets/music/pause.mp3.
- Main menu still plays pause.mp3.
- Intro video keeps using its own embedded video audio.
- Bumped visible build to v0.9.32 and cache links to ?v=122.

### Replace these files
- index.html
- js/game.js
- UPDATE_V122.md
