# Build Notes v50 — Menu Fit & Image Containment

- Removed main menu internal scrolling.
- Swapped main menu logo to the wide splash logo so it does not crop.
- Scaled menu title/buttons to fit inside one fixed viewport.
- Hid the old floating initialize button because it overlapped the menu.
- Updated visible AVOS labels to v0.5.0.
- Changed Operator file artwork rendering to `object-fit: contain` so Vyra is not cropped.
