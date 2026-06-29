# Project: ASH VECTOR v25 — v10 Asset Usage Fix

This build uses v23 as the gameplay/code base and restores the proper v10 production assets into the paths that the latest code actually loads.

## Restored and actively used from v10

- `assets/ui/game_logo.png` — used by boot screen, main menu, and topbar.
- `assets/ui/splash_logo.png` — available for splash/title screens.
- `assets/ui/emblem.png` — available for database UI and favicon-style use.
- `assets/ui/menu_background.png` — now used by the main menu CSS background.
- `assets/logos/*` — full v10 logo pack restored.
- `favicon.png` and `assets/logos/favicon.png` — restored from v10 and linked in `index.html`.
- `assets/operators/av001/*` — v10 Vyra art copied into the active AV-001 paths used by the latest code.
- `assets/anomalies/an001_rust_hound/*` — v10 Rust Hound art copied into the active AN-001 paths.
- `assets/battle_backgrounds/toxic_sewers_battle.png` — v10 battle background restored.
- `assets/fractures/fracture001/*` — v10 Fracture 001 art restored.
- `assets/items/*` — v10 item icons restored.

## Preserved for reference

The original v10 naming folders are also preserved where useful, such as:

- `assets/operators/vyra/`
- `assets/anomalies/rust_hound/`
- `assets/anomalies/toxic_slime/`
- `assets/anomalies/scrap_crawler/`

The latest code still uses the cleaner production IDs like `av001` and `an001_rust_hound`, but the legacy folders are kept so no approved art is lost.
