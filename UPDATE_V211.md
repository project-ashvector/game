# Project ASH VECTOR — Item Art Fix V211

This rebuild fixes the item art update not showing.

Main fix:
- Every replaced image now uses a brand-new path under `assets/items/custom/v211/`, so the browser cannot keep showing cached placeholder PNGs from the old filenames.

Also updated:
- `js/game.js`
- duplicate `assets/js/game.js`
- `index.html` and duplicate `assets/index.html` cache bust to `v=211`
- `data/items/items.json`
- 42 armor placeholder items
- Sewer Guard Vest and Wasteland Guard Helm
- 18 material items from the screenshots
