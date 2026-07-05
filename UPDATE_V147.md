# ASH VECTOR Update V147

## Intro Mobile Audio Pass

This patch fixes intro video audio not playing on phones.

### Changes
- Removed the old muted fallback for the intro video.
- Intro video now explicitly clears muted/defaultMuted before playback.
- Intro video volume is forced to 100% before play.
- If a phone blocks unmuted playback, the game shows a direct “Tap to start intro with sound” button.
- The audio prompt retries video playback from a real user tap.
- Updated the intro video cache query to ?v=147.
- Bumped visible build to v0.9.57 and cache links to ?v=147.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V147.md
