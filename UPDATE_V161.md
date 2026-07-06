# UPDATE_V161.md

## V161 — Vyra Legacy Folder Mirror Pass

### Why this exists
GitHub still had an old `assets/operators/vyra/` folder. Some older pages/docs/cache paths can still point there even after the new `av001` operator framework was added.

### Fixed
- Mirrored the new V160 Vyra replacement art into `assets/operators/vyra/` too.
- Kept `assets/operators/av001/` as the new canonical character folder.
- Added legacy operator asset preloading so both paths stay safe during GitHub Pages cache transitions.
- Bumped cache links to `?v=161`.
- Bumped build to `v0.9.71 // VYRA LEGACY MIRROR PASS`.

### Replace these files/folders
- `index.html`
- `js/game.js`
- `assets/operators/vyra/`
- `UPDATE_V161.md`

### Note
You can leave the old `assets/operators/vyra/` folder on GitHub now because this patch overwrites it with the new Vyra art. The game framework still uses `av001` as the clean future-proof path.
