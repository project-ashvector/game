# Project: ASH VECTOR — Playtest Sprint v20

## Focus
This sprint adds a larger Fracture 001 map and a real camera-follow renderer so the level no longer fits entirely on one static screen.

## Added
- Expanded Toxic Sewers tilemap from a single-room prototype into a larger multi-route area.
- Camera follow system that keeps AV-001 centered while clamping to map bounds.
- Viewport-based tile drawing for better performance and cleaner future map growth.
- On-canvas camera/tile debug readout for local QA.
- More caches, recovery stations, anomaly positions, and traversal space.

## Test Route
1. Start a new operation.
2. Move away from the starting area and confirm the camera follows.
3. Confirm collision still blocks wall tiles.
4. Open caches and verify they disappear.
5. Fight anomalies and verify return to the correct map tile.
6. Use the minimap to navigate toward the boss and exit.

## Known Work Remaining
- Replace symbolic tiles with production tile art.
- Add smooth tweened movement instead of one-tile jumps.
- Add enemy patrol AI.
- Add room labels and camera transition effects.
