# Project ASH VECTOR V283 – Phone Menu Hard Fix

- Added a stronger mobile-only menu override for phone landscape/portrait.
- Hides gameplay HUD, nearest-object compass, and touch controls while any menu overlay is open.
- Forces Inventory, Mission Briefing, Progression Matrix, Characters, and Config into readable single-column phone layouts.
- Restores full-screen touch scrolling inside phone menus.
- Compresses phone menu headers, buttons, cards, progress rows, save panels, config rows, and inventory filters.
- Adds a JS overlay guard so the phone menu class stays synced even if older buttons open a menu path.
- Does not change gameplay, saves, NPCs, portals, combat, controller input, rewards, or asset loading.
