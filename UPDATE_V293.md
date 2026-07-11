# Project ASH VECTOR — Update V293
## Vector Lockdown Reward Exit Fix

This update fixes the reward screen that could trap the player after completing a Vector Lockdown.

### Fixed
- Removed the duplicate reward summary that was being rendered in both the side HUD and center modal.
- The visible Continue button now receives its click handler directly from the active modal.
- Old saved reward popups are cleaned before rendering so duplicate button IDs cannot return.
- Continue now works with mouse, touch, keyboard Enter/Space/Escape, and controller confirm.
- Closing the reward screen clears Lockdown UI state, restores field input, resumes field music, and autosaves.
- Added a recovery path for saves that were already stuck on the old reward popup.

### Updated files
- `js/game.js`
- `UPDATE_V293.md`
