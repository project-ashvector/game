# Project ASH VECTOR — Update V292
## Operator Sprite Recovery

This patch fixes the gray fallback block appearing instead of the player avatar after the smooth-movement update.

### Fixes
- Prioritizes the current operator's reliable map sprite before loading the full animation bank.
- Keeps the last successfully loaded player frame visible while a walking or facing frame loads.
- Retries failed sprite requests without the version query for local/static hosts that reject query-string image paths.
- Allows failed cached image requests to recover instead of remaining permanently broken.
- Adds real character-art fallbacks before the emergency silhouette can appear.
- Restores the complete Vyra map-sprite folder in the patch so the default operator files are guaranteed to be present.
- Keeps all V291 smooth held-movement and rendering-cache improvements.

### Updated/restored files
- `js/game.js`
- `assets/operators/av001/sprites/**`
- `UPDATE_V292.md`
