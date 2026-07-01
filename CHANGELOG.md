
## v64 / v0.6.4 - Skill Emblem Asset Pass
- Imported uploaded `assets/skills` emblems.
- Updated skill matrix, combat style picker, and inventory skill strip to show real emblem art.
- Added safe fallback support for missing/future skill icons.


## v60 — Chapter 1 Flow
- Added story popups and dialogue beats for Chapter 1.
- Added current objective tracker text.
- Added boss-defeated and chapter-reward flags.
- Added Chapter Complete reward panel.
- No new assets required.


## v59 — Music Watchdog + Title Resize Stabilization
- Removed old recovery script from HTML to stop conflicting menu/version behavior.
- Added resilient music watchdog and pause/stall recovery.
- Stabilized boot/title/menu layout to avoid resize glitches and logo cropping.
- Updated build text to v0.5.9.

# Project: ASH VECTOR v58 Music Recovery

This build fixes music playback regression after v57. Intro and level music now resume from the active game state after the first click/key press. SFX remains unchanged.


## v57 — Audio State + Death Fix
- Fixed menu-before-game music: closing menu/database panels now returns to intro music until gameplay starts.
- Fixed gameplay menu music: in-game overlays use pause music and return to exploration music when closed.
- Removed developer mercy death prevention. Vyra can now die when HP reaches 0.
- Added defeat screen with retry and main menu options.
- Tuned encounters so death is actually possible during normal play.

# v56 — Music Playback Fix

- Fixed looping music not starting while SFX worked.
- Added browser gesture unlock + queued track replay.
- Added audio cache busting for GitHub Pages.
- Updated boot/UI version to v0.5.6.


## v44 — Menu Launch Recovery
- Fixed menu soft-lock where Enter/click could fail to start the game.
- Added always-visible fixed Initialize Operator button.
- Added Enter/Space hard-start fallback on the main menu.


## v43 - Main Menu Recovery Fix
- Fixed a launch blocker where the main menu buttons could be clipped off-screen.
- Added Enter-to-start from the main menu.
- Added responsive menu sizing for shorter screens.
- Added BUILD_NOTES_V43.md.


## v42 — Fullscreen Launch Fix
- Starts the app in a fixed fullscreen-style viewport.
- Automatically applies fullscreen layout when entering menu/game.
- Requests browser native fullscreen on first click/Enter where browser security allows it.
- Prevents boot/menu/game screens from scrolling like a webpage.


## v39 — Inventory UI Polish
- Polished inventory/database item slots with icon frames, rarity borders, and stack counts.
- Added item detail panel and filters for category/rarity.
- Improved side inventory display so item artwork is visible during gameplay.


## v31 — Creature Encounter Art Link
- Linked Fracture enemy and boss encounters to the imported monster/boss art library.
- Replaced generic map enemy markers with imported creature icons.
- Improved Anomaly Index image fallback behavior.
- Kept Rust Hound / Rust Mother removed from playable code.

# Changelog

## v26 - Viewport and Controls Fix
- Prevented arrow keys from scrolling the browser page during gameplay.
- Locked the desktop game viewport so the canvas no longer gets cropped by page scroll.
- Improved responsive text/button wrapping for smaller screens.
- Added safer canvas focus behavior when starting the game.

# Changelog

## v21 — Real Engine Sprint 1
- Added actual `css/style.css` and `js/game.js` files instead of relying on missing references.
- Implemented playable tile-map renderer on canvas.
- Added camera follow, collision, interactable tiles, chests, terminals, healing station, lore terminal, locked boss gate, and exit.
- Added real turn-based battle loop with four protocols, enemy turns, XP, level-ups, loot, and credits.
- Added minimap rendering, save/load via localStorage, inventory use, QA console, settings toggles, and mission objectives.
- Created replaceable production placeholder PNG assets in their final folders/filenames.

## v20 and earlier
Planning, documentation, production direction, and prototype scaffolding for Project: ASH VECTOR.

## v22 — Master Asset Consolidation
- Added approved concept/reference sheets into `assets/source/concepts/`.
- Added `ASSET_MANIFEST.md` for stable asset tracking.
- Added `assets/logos/` aliases for logo files.
- Kept playable build files intact while preserving production art references.

## v23 — Data Registry Sprint
- Added stable JSON-style content records for Operator AV-001, AN-001 Ashborn Revenant, BOSS-001 Ashborn Revenant Lord, items, skills, Fracture 001 layout/events, and intro dialogue.
- Added DATA_REGISTRY.md and BUILD_NOTES_V23.md.
- Preserved all consolidated master assets from v22.


## v25 — Asset Usage Fix
- Restored the proper v10 logo pack into active latest build paths.
- Updated latest CSS so the v10 `menu_background.png` is actually used on the main menu.
- Restored v10 Operator, Anomaly, Fracture, item, and battle background assets into active v23/v24 paths.
- Added favicon link to `index.html`.
- Preserved legacy v10 folders for reference while keeping latest production IDs active.


## v27 — Imported Creature Library

- Imported 100 monsters as ASH VECTOR anomaly assets.
- Imported 53 bosses as ASH VECTOR boss assets.
- Added registry JSON files for future database/encounter integration.
- Kept existing Chapter 1 Ashborn Revenant/Ashborn Revenant Lord assets intact.


## v28 — Battle UI + Creature Database Polish
- Rebuilt battle overlay CSS for a cleaner 16:9 combat frame.
- Reduced text overlap in combat.
- Added searchable/filterable creature database for imported monsters and bosses.
- Added `PLAYTEST_SPRINT_V28.md`.


## v29 - Imported Item Library

- Imported uploaded item ZIP into `assets/items/imported/`.
- Added 143 permanent item IDs starting at `IT-1001`.
- Added `data/items/imported_item_registry.json`.
- Expanded `data/items/items.json` with imported records.
- Upgraded Inventory Database screen with search/filter item library view.
- Added `IMPORTED_ITEM_LIBRARY_V29.md` with counts and replacement rules.


## v30 — Placeholder Removal + Fixed Viewport
- Removed legacy AN-001 Rust Hound and BOSS-001 Rust Mother from active gameplay/code.
- Promoted imported creature library records to start at AN-001/BOSS-001.
- Chapter 1 now uses Ashborn Revenant and Ashborn Revenant Lord.
- Locked gameplay/overlays into a fixed viewport to stop page scrolling and cropping.
- Added contained dark scrollbars inside database panels.


## v32 — Cryptic Idle Worlds Reuse
- Added Progression Matrix using adapted CIW skill/XP systems.
- Imported legacy skill icons and region backgrounds.
- Preserved reusable legacy code under `legacy/crypticidleworlds/`.
- Battles now grant style XP based on selected combat focus.


## v33 — Code-Only CIW Reuse

- Ignored legacy art/assets and focused on reusable old-game code.
- Removed legacy asset folders from this build.
- Replaced legacy skill image dependencies with CSS glyph badges.
- Expanded the CIW-inspired XP/skill matrix so combat focus now affects damage, crits, EP cost, dodge, and damage reduction.
- Added silent local autosave every 30 seconds while active.
- Preserved old JS code samples under `legacy/crypticidleworlds/code/` for reference.


## v34 — AV-001 Vyra Canon Asset Integration
- Replaced AV-001 visual assets with the approved hooded cyan dual-blade Vyra artwork.
- Added profile, battle, portrait, icon, avatar, operator card, weapon, expression, skill icon, and sprite sheet paths.
- Updated operator data to match the new official design.

## v35 — Vyra Exploration Sprite
- Added official AV-001 map sprite asset derived from the canonical Vyra art.
- Updated overworld renderer to draw Vyra on the dungeon map instead of the white placeholder tile.
- Added facing-state storage for future walking animations.

## v36 - Battle Background Production Pass
- Replaced the green debug Toxic Sewers battle background with a cinematic sewer battle backdrop.
- Kept the battle scene using the imported anomaly artwork and official Vyra battle asset.
- Added a clearer production note for the battle UI polish pass.


## v38 — Production Item Icon Pipeline
- Stored uploaded 1024×1024 item icons in `assets/source/items/`.
- Generated optimized 128×128 game icons and 64×64 compact icons.
- Added core item records to the Inventory Database.
- Upgraded inventory cards with icons, rarity borders, and hover polish.

## v40 — Combat UI Polish
- Rebuilt battle overlay with a fixed, polished JRPG-style layout.
- Added cleaner battle header, improved HP/EP meters, and command buttons.
- Added damage numbers, hit flashes, battle shake, and dodge/heal popups.
- Added victory loot screen using the new item icon pipeline.


## v45 — Fullscreen HUD + Hotkeys
- Added fullscreen quickbar and hotkeys for map/inventory/database/operator/progression/mission/help.
- Added fullscreen field HUD so sidebar data is accessible while the normal sidebar is hidden.
- Esc now closes open panels before exiting fullscreen layout.
- Main menu protocol buttons now provide feedback and remain accessible.

## v46
- Fixed main menu protocol buttons not visibly opening their overlays.
- Raised overlay z-index above menu/start layers.
- Added Escape/Close overlay recovery behavior.
- Improved Continue Operation fallback.


## v48 - Menu Protocol Recovery
- Fixed main-menu protocol buttons by hiding the menu layer while modals are open.
- Added inline fallback handlers and window.AV_MENU helpers.
- Escape/Close now returns to the main menu when opening from menu.


## v49 - Menu Recovery and Cache Bust
- Fixed stale version labels.
- Added cache-busting query strings to CSS/JS.
- Added independent recovery router for menu/database buttons.
- Added boot failsafe and direct Enter/Space handling.

## v50 - Menu Fit & Image Containment
- Fixed cropped main menu logo.
- Removed main menu scroll behavior.
- Fit menu buttons and text into a single fixed screen.
- Fixed cropped Operator file artwork display.
- Updated cache-busting and AVOS visible version labels to v0.5.0.


## v53 - Maze / Fog / Battle Layout Update
- Replaced the open level with a maze-first Fracture 001 layout.
- Added fog/tint/vignette canvas atmosphere.
- Removed non-colliding decorative props to make collision clearer.
- Moved battle sprites closer to the command panel.
- Added main menu fit rules to prevent logo cropping and menu scroll.

## v54 — Music Loop + State/Battle Fix
- Added looping AudioManager and wired intro, level1, battle, boss, and pause tracks.
- Fixed in-game database/menu close behavior so it returns to gameplay.
- Lowered battle sprites closer to the command UI and added ground shadow styling.


## v55 — Sound FX Integration
- Added one-shot SFX manager.
- Added walking step sound on movement.
- Added randomized slash sounds in combat.
- Added battle win, death, level win, and item pickup sounds.
- Updated AVOS version text to v0.5.5.


## v62 / v0.6.2 - Upgrade Matrix + Checkpoints
- Added credit-based Operator Upgrade Matrix in Progression Matrix.
- Added permanent upgrade ranks for ATK, HP/DEF, EP, and Med Patch healing.
- Added checkpoint recovery so death can retry from the latest synced location.
- Updated cache strings and labels to v62 / v0.6.2.


## v0.6.3 / v63 - Skill & Stage Matrix
- Trainable combat skills now max at 99 and use the RuneScape-style XP table.
- Added stat scaling, Health skill, full-screen HP/Lv HUD, improved Inventory menu, skill emblems, pre-battle scan dialog, autosave improvements, and the first next-stage selector/map shell.
