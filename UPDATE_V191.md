# Project ASH VECTOR — V191 Mobile Lockdown Visibility Fix

## Focus
Fixes the phone version scaling problems around the new Vector Lockdown system and fixes the random-event monster visibility issue.

## Changed
- Updated build label to v1.0.01.
- Added mobile lockdown scaling overrides so the HUD, warning countdown, controls, and toast messages take less room on phones.
- Switched phone canvas behavior toward contain/readability during gameplay so event edges and monsters are not cropped off-screen.
- Fixed a lockdown render bug in the player HP bar that could break the event render loop.
- Added a safer lockdown monster image loader so event monsters can display real in-game anomaly assets even if they were not cached yet.
- Added a stronger fallback monster drawing style, so monsters never disappear into tiny dots if an asset path is missing.
- Made lockdown monsters larger and more readable on phones.
- Increased projectile hit radius slightly so shots connect more reliably on mobile.
- Made projectile visuals a little larger and easier to see on phone screens.

## Files Changed
- index.html
- css/style.css
- js/game.js
- UPDATE_V191.md
