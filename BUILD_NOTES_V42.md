# Build Notes v42 — Fullscreen Launch Fix

- The game now starts in a fullscreen-style fixed viewport instead of behaving like a scrolling webpage.
- `fullscreen-mode` is applied automatically when entering the menu/game.
- The browser native fullscreen API is requested on the first allowed user interaction: Enter, tap, Continue, or New Game.
- Important browser rule: Chrome/Firefox/Safari do not allow true fullscreen on page load without a user gesture, so the project now uses CSS fullscreen immediately and native fullscreen as soon as the player interacts.
- Boot/menu/game screens are locked to viewport height with internal scrolling only where needed.
