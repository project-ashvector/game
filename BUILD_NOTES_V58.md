# Build Notes v58 — Music Recovery

Fixed a regression where `intro.mp3` and `level1.mp3` could stay silent after the death/audio-state update.

Changes:
- Rebuilt AudioManager recovery path.
- Music queues until the first user gesture.
- Any click/key/tap now attempts to resume the requested track.
- Closing menus before gameplay returns to `intro.mp3`.
- Starting/resuming gameplay forces `level1.mp3`.
- Death stops music cleanly and plays `death.mp3`.
- Added `window.AV_AUDIO.status()` and `window.AV_AUDIO.force('intro')` debug helpers.
- Added temporary hotkey `K` to force the correct current music track during playtesting.
