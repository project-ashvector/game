# Build Notes v44 — Menu Launch Recovery

Fixes the main menu soft-lock where the player could see the prompt but Enter/click did not reliably start gameplay.

Changes:
- Added a fixed visible `Initialize Operator` launch button at the bottom of the menu.
- Enter or Space now starts gameplay whenever the main menu is visible.
- New Game button handler now prevents default and hard-starts a fresh run.
- Double-clicking the menu acts as an emergency start fallback.
- Keeps full-window layout and previous v43 fixes.
