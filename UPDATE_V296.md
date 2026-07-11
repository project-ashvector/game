# Project ASH VECTOR — Update V296
## Vector Lockdown Single-Shot Range

### Changes
- Vector Lockdown still waits until the nearest monster enters the **8-tile firing radius**.
- Every Lockdown run now begins with **exactly one projectile per shot**.
- Operator bonuses can no longer grant extra starting projectiles.
- Saved projectile stacks no longer preload a multi-shot volley at the beginning of a run.
- Extra projectiles are gained only from upgrades earned after the current Lockdown starts.
- The Lockdown HUD now shows **SINGLE SHOT** or **UPGRADED VOLLEY**.

### Updated files
- `js/game.js`
- `UPDATE_V296.md`
