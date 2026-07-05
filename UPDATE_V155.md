# ASH VECTOR Update V155

## Save Continue + Story Pass

### Save fixes
- Fixed Continue so it loads the saved archive instead of falling into a new game.
- Fixed the main-menu Enter/Space shortcut so it continues a save when one exists.
- Added verified save writes: the game now reads the save back after writing it.
- Added a primary save, backup save, and autoslot save for safer browser storage.
- Added save migration so old saves are rewritten to the newest schema.
- Added save on browser/tab close and when the page is hidden.
- Added save status text to the main menu.
- Save & Exit still saves and returns to the menu.

### Story fixes
- New game now starts with a deeper intro explaining ASH Vector, Vyra, AVOS, Fractures, and the first objective.
- Every level F-001 through F-012 now has richer story dialog.
- Each level now has arrival, terminal, archive/lore, boss intro, boss defeated, and clear-story beats.
- Story uses irreverent sci-fi humor with AVOS and Vyra banter.
- Story still only plays once if already read.
- Story archive now includes the generated story beats.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V155.md
