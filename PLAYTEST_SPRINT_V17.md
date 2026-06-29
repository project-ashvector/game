# Project: ASH VECTOR — v17 Playtest Loop Update

## Added
- Boss gate requirements: the Rust Mother chamber now blocks entry until the Recovery Terminal is linked and 3 anomalies are cleared.
- Exit seal feedback: trying to leave before the boss is defeated now triggers a transmission instead of only adding a log line.
- Defeat loop: if Vyra reaches 0 HP, the battle closes, credits are penalized, and she respawns at the entry tunnel with full HP.
- QA route helper in the Playtest Console.
- Small objective tracker polish.

## Test Route
1. Start New Game.
2. Open the first cache.
3. Link the Recovery Terminal.
4. Defeat three Rust Hounds.
5. Enter the boss room.
6. Defeat Rust Mother.
7. Exit through `X`.

## Known Next Targets
- Add actual item use during combat.
- Add status effects to battle actions.
- Add mini-map and camera smoothing.
- Replace remaining generated sheet crops with cleaner hand-cut production images.
