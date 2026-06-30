# Build Notes v41 — Fullscreen Game Presentation

- Added a Full Screen button to the in-game top bar and main menu.
- Added keyboard shortcut `F` to toggle game fullscreen/CSS fullscreen mode.
- Added `ESC` to leave fullscreen mode.
- Converted fullscreen gameplay to a fixed, no-scroll, native-game-style viewport.
- Hides the side panel in fullscreen so the dungeon canvas fills the screen.
- Keeps mission/objective overlays subtle and hover-revealed.
- Battle overlay now also expands to the fullscreen viewport.

Recommended test:
1. Start game.
2. Click Full Screen or press F.
3. Move with arrow keys. Browser/page should not scroll.
4. Open battle. Battle should fill the screen cleanly.
5. Press ESC or F to leave fullscreen.
