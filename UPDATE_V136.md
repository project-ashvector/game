# ASH VECTOR Update V136

## Full Skill Node Grid Pass

This fixes the V134 skilling setup.

### Changes
- Every map now gets 4 different training objects for every skilling skill.
- That means each map gets 20 training nodes total:
  - 4 Cryptomining objects
  - 4 Datafishing objects
  - 4 Codecraft objects
  - 4 Forgenetics objects
  - 4 System Hacking objects
- Each skill has the same RuneScape-style requirement ladder:
  - Object 1 requires Lv. 1
  - Object 2 requires Lv. 3
  - Object 3 requires Lv. 5
  - Object 4 requires Lv. 8
- Level 1 now has at least one Lv. 1 object for every skill.
- Removed the issue where only one Datafishing node appeared.
- Removed duplicate-feeling Forgenetics placement by forcing unique node IDs/tiers per skill.
- Nodes are spread across the map instead of clumping.
- XP gains stay modest so level 99 remains a long grind.
- Bumped visible build to v0.9.46 and cache links to ?v=136.

### Replace these files only
- index.html
- js/game.js
- css/style.css
- UPDATE_V136.md
