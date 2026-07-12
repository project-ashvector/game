# Project ASH VECTOR — Update V302
## Combat and Boss Milestone

V302 combines the next major combat, boss, and input-stability work into one update.

### Combat presentation
- Added visible operator and enemy attack movement.
- Added animated melee arcs, projectiles, impacts, healing pulses, guard fields, Overdrive effects, and defeat effects.
- Existing projectile art is reused from `assets/projectiles`, so no new asset folder is required.
- Critical hits and Overdrive now produce stronger visual feedback.
- Reduced Motion still suppresses the longer animations.

### Unique boss phases
Every boss now has three phases with a fracture-specific protocol:

- F-001: Grave wards, core healing, and Death Choir pressure.
- F-002: Brood venom and late-phase double strikes.
- F-003: Echo-copy evasion and dead-frequency shock.
- F-004: Timed rail surges and terminal-velocity attacks.
- F-005: Prism resistance phases with Shock and Burn weaknesses.
- F-006: EP and Overdrive siphoning.
- F-007: Escalating cinder damage and burn pressure.
- F-008: Armor weakening, shock, and energy drain.
- F-009: Rust corrosion, defense loss, and boss healing.
- F-010: A rotating Null Lock that disables one combat protocol per turn.
- F-011: Frostbite, EP drain, and Overdrive suppression.
- F-012: Armor, healing, fire pressure, and late double strikes.

### Boss information and readability
- Added boss protocol information to the pre-battle scan.
- Added a compact phase display during boss combat.
- Added phase-change banners and phase indicators.
- Enemy Intent now describes the current boss phase.
- Added Frostbite as a supported combat status.

### Control stabilization
- Added a combat input lock during attack and enemy animations.
- Prevents rapid mouse, keyboard, touch, or controller input from activating multiple actions.
- Null-locked boss commands are clearly disabled.
- Guard, Vector Cell, and Overdrive actions consume only one turn.
- Desktop and mobile battle layouts remain supported.

### QA
- Added internal boss-start and phase-test helpers for the Playtest Console/runtime QA.
- Tested F-001, F-005, F-010, and F-012 boss phases and attack effects.
- Tested landscape mobile layout with no document overflow.
- JavaScript syntax validation passed.

### Updated files
- `index.html`
- `css/style.css`
- `js/game.js`
- `UPDATE_V302.md`
