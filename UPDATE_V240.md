# Project ASH VECTOR - Update V240

## Save Write Throttle Pass
- Reduced save/localStorage write pressure during startup and gameplay.
- Queued autosaves now wait for an idle moment when the browser supports it.
- Autosaves are throttled so rapid XP/items/menu updates do not spam storage writes.
- Silent autosaves no longer force full Save Hub/UI rebuilds.
- Backup save copies now update less often during silent autosaves, reducing storage lag spikes.
- Periodic autosave interval increased from 30 seconds to 60 seconds.
- Respawn/clamp maintenance loops were slightly slowed to reduce background work.
- Kept manual saves immediate and verified.

## Files Changed
- `game-main/index.html`
- `game-main/js/game.js`
- `game-main/UPDATE_V240.md`
