# Project ASH VECTOR v54 — Music Loop + State/Battle Fix

## Added
- Looping music manager for `assets/music/intro.mp3`, `level1.mp3`, `battle.mp3`, `boss.mp3`, and `pause.mp3`.
- Automatic music routing:
  - Boot/Menu: intro.mp3
  - Exploration: level1.mp3
  - Normal fights: battle.mp3
  - Boss fights: boss.mp3
  - Menus/databases opened in-game: pause.mp3
- Fade transitions between tracks.

## Fixed
- Overlay close behavior now returns to gameplay when opened from gameplay instead of dropping back to the title/main menu.
- Battle sprites are positioned lower and closer to the command selection panel.
- Battle characters now have soft ground shadows.

## Notes
- True audio playback still requires a browser user action, so the first click/keypress unlocks music playback.
