# ASH VECTOR UPDATE V119 - NPC + SALVAGE PROP PASS

Changed files included in this patch:
- index.html
- js/game.js
- UPDATE_V119.md
- assets/npcs/scavenger.png
- assets/npcs/medic.png
- assets/npcs/warden.png
- assets/postapoc/barrel_red.png
- assets/postapoc/barrel_blue.png
- assets/postapoc/cardboard_1.png
- assets/postapoc/cardboard_2.png
- assets/postapoc/bench_down.png
- assets/postapoc/bench_side.png
- assets/postapoc/door_rust.png
- assets/postapoc/hatch_closed.png
- assets/postapoc/hvac.png
- assets/postapoc/antenna.png
- assets/postapoc/container_gray.png
- assets/postapoc/container_red.png
- assets/postapoc/posters.png
- assets/postapoc/duct_down.png

What this patch does:
- Bumps build to v0.9.29
- Adds 3 new survivor NPCs across all 12 current stages:
  - Rook the Scavenger
  - Kessa Field Medic
  - Ashline Warden
- Extends Fermilat placement so he can appear in later stages too
- Adds new NPC dialogue scenes and one-time interaction rewards per stage
- Adds post-apocalypse salvage clutter / shelter-style prop dressing across every current stage
- Uses uploaded post-apocalypse asset pack files for barrels, cardboard, benches, containers, HVAC, doors, hatches, posters, antennas, and ducts
- Updates playtest stage picker so all 12 stages can be loaded directly from the HTML QA panel
- Fixes image preloading so all NPC sprites are loaded, not just Fermilat

Install notes:
- Upload and replace the included files/folders in the repo
- If GitHub Pages caches the old build, hard refresh after deploy
