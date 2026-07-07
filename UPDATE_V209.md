# Project ASH VECTOR Update V209 — Item Art Replacement Pass

## What changed
- Replaced all 42 imported armor placeholder images with the new uploaded item PNGs.
- Updated imported armor registry statuses from `placeholder-art` to `dedicated-item-art`.
- Added dedicated item art for Sewer Guard Vest and Wasteland Guard Helm.
- Replaced shared/fallback item card art for 18 skill materials: Ash Ore, Circuit Scrap, Mutagen Sample, Ash Pebble, Dense Ash Ore, Vector Crystal, Static Packet, Ghost Log, Blackbox File, Wire Scrap, Logic Board, Quantum Relay, Spore Sample, Mutated Tissue, Vector DNA, Broken Token, Security Keybit, and Root Cipher.
- Pointed those item registry entries to the dedicated training item PNGs so inventory/item cards no longer use generic scrap/keycard/archive/catalyst art.
- Updated `data/items/items.json` so the external item registry matches these dedicated assets.
- Bumped `index.html` game script cache bust to `v=209`.

## Files included
Only changed/new files are included in this update package.
