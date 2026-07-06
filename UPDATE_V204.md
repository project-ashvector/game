# Project ASH VECTOR - Update V204

## Stability / Bug Fix Pass
- Reworked controller support so any connected browser-detected controller can be selected and polled, including Xbox, PlayStation, Switch Pro/Joy-Con style controllers, and generic USB/Bluetooth controllers.
- Lowered controller deadzone and restored the requestAnimationFrame controller loop.
- Fixed controller button handling for gameplay, battle, boot/menu, overlays, and Playtest access.
- Made Vector Lockdown reward mode harder to accidentally hide so the reward screen stays visible after survival.

## Persistent Lockdown Buffs
- Positive Lockdown buffs and abilities now persist between future random events.
- Debuffs do not persist.
- Persistent stacks are saved in localStorage and re-applied at the start of each Lockdown.
- Lockdown difficulty now scales gradually from current stage, player level, and operator level while staying capped at 30 hostiles.

## Mobile / Phone Pass
- Added a phone Pause button that opens a touch-friendly menu with Inventory, Mission, Progress, Operators, Characters, Playtest, Settings, and Save.
- Added a pre-start portrait warning telling phone players to rotate landscape.
- Improved mobile menu scaling for Playtest, mission, overlays, and Lockdown panels.

## Files Changed
- `game-main/index.html`
- `game-main/css/style.css`
- `game-main/js/game.js`
- `game-main/UPDATE_V204.md`
