# Project: ASH VECTOR — QA Playtest Notes

## Build
Milestone Bravo Sprint — v16 Local QA Console

## Goal
Test the first playable Chapter 1 path locally before anything is uploaded to GitHub.

## Main path
1. Launch `index.html`.
2. Wait for AVOS boot.
3. Press Enter / tap access.
4. Select **Initialize Operator**.
5. Read the opening transmission.
6. Move with arrow keys.
7. Find the recovery terminal.
8. Fight three anomalies.
9. Defeat the Ashborn Revenant Lord boss.
10. Reach the exit tile.
11. Confirm the Chapter Complete screen appears.

## New QA tools
Open the console from the top bar with **Playtest Console** or press **F9**.

Tools included:
- Full Heal
- Add 100 Credits
- Mark 3 Anomalies Cleared
- Unlock Boss Route
- Force Chapter Complete
- Reset Current Run

These are for local testing only and can be removed or hidden before a public release.

## Things to check
- Boot does not freeze.
- Menu buttons open and close correctly.
- New Game resets state correctly.
- Movement does not enter walls.
- Chests only open once.
- Save terminal creates local save.
- Load restores position, inventory, XP, credits, and map changes.
- Battle starts when touching an anomaly.
- Battle ends and returns to map.
- XP/leveling works.
- Boss defeat unlocks the exit.
- Chapter complete screen appears.
- Mobile buttons move the player.
- QA console works without breaking normal play.
