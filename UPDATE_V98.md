# Project: ASH VECTOR — Update V98

## Stage 3 Route Fix Pass

This patch keeps the opening story/replay work from V96/V97 and fixes the Stage 2 clear route.

### Fixed
- Fixed the chapter clear overlay so **Start Next Fracture** refreshes its target every time the panel opens.
- Clearing **F-002** now routes forward to **F-003** instead of using the old F-001 → F-002 button target.
- Added a fresh version/cache bump to **v0.9.8** with `?v=98` for GitHub Pages/browser cache.

### Files changed
- `index.html`
- `js/game.js`
- `css/style.css`
- `UPDATE_V98.md`
