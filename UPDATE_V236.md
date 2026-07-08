# Project ASH VECTOR - Update V236

## Asset Streaming / Startup Performance Pass
- Reduced the amount of artwork loaded synchronously when the game starts.
- Kept intro video priority high so `intro.mp4` can start easier.
- Switched most stage, enemy, boss, projectile, and buff art to background/idle loading.
- Stopped every image load from forcing a full `renderAll()` refresh. Image loads now queue one light refresh instead.
- Current-stage art streams in small chunks instead of blocking the first playable frame.
- Lockdown projectile/buff assets now load in smaller chunks after gameplay begins.
- Background asset preload waits longer and uses smaller chunks to avoid freezing the intro/menu.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V236.md`
