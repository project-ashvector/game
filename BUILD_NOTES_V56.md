# Build Notes v56 — Music Playback Fix

- Rebuilt the music manager so browser autoplay restrictions are handled correctly.
- Music now queues until the first player gesture, then starts/resumes the requested track.
- Added cache-busting query strings to music and SFX files so GitHub Pages does not keep stale audio.
- Kept all music tracks looping:
  - intro.mp3: boot/menu
  - level1.mp3: exploration
  - battle.mp3: anomaly battles
  - boss.mp3: boss battles
  - pause.mp3: database/inventory/menu overlays
- Exposed `window.AV_AUDIO` and `window.AV_SFX` for quick browser-console testing.
