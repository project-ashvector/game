# ASH VECTOR Update V153

## Save + Story + Skill Scale Pass

### Changes
- Rebuilt save/load migration so old saves repair instead of breaking.
- Saves now store a save schema version and build version.
- Loading now catches corrupt JSON and backs it up instead of crashing.
- Loading now fills missing new systems like radio unlocks, contracts, NPC state, skills, and settings.
- Continue now only starts if a save actually loaded.
- Added a Save & Exit button to the top bar.
- Save & Exit saves the archive and returns to the main menu.
- Added story archive coverage for Level 1 through Level 12.
- Added fallback story dialog for any missing level intro, terminal, lore, boss, and clear scenes.
- Story dialog still only plays once unless already read.
- Skill training now scales by level:
  - Level 1 objects require skill Lv. 1-5.
  - Level 2 objects require skill Lv. 6-10.
  - Level 12 objects require skill Lv. 56-60.
- Every current skilling skill now gets 5 different trainable objects on each map.
- Bumped visible build to v0.9.63 and cache links to ?v=153.

### Replace these files only
- index.html
- js/game.js
- UPDATE_V153.md
