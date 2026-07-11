# Project ASH VECTOR — Update V294
## Vector Lockdown Escalation

### Difficulty changes
- The first Vector Lockdown supports up to **30 simultaneous monsters**.
- Every successful survival permanently adds **25** to the simultaneous monster cap:
  - 0 survivals: 30
  - 1 survival: 55
  - 2 survivals: 80
  - 3 survivals: 105
  - Continues increasing by 25 after every clear.
- Failed runs do not increase the cap.
- Spawn batches increase during the 60-second event, producing denser late-run waves.
- Additional completed runs slightly increase opening pressure and spawn speed.

### Interface and save support
- The Lockdown HUD now displays the current survival count and hostile cap.
- The reward summary displays the next run's cap and the +25 increase.
- Existing saves derive their initial survival count from completed Lockdown history when needed.
- The survival count is stored permanently in save data.

### Performance protection
- Monster separation now uses nearby spatial groups instead of comparing every monster against the entire swarm.
- This reduces slowdown as the persistent monster cap grows.

### Included stability fix
- The Lockdown reward Continue button is bound only to the active center modal.
- Duplicate reward cards and repeated modal openings were removed.

### Updated files
- `js/game.js`
- `UPDATE_V294.md`
