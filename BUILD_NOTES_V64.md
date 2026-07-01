# Project: ASH VECTOR v64 / v0.6.4

## Skill Emblem Integration
- Imported uploaded skill emblem PNGs into `assets/skills/`.
- Progression Matrix now uses real skill emblem art instead of text-only badges.
- Inventory skill strip and combat style picker use the same emblem renderer.
- Added icon fallback handling so missing future icons do not break the UI.

## Files expected
- `assets/skills/attack.png`
- `assets/skills/strength.png`
- `assets/skills/defense.png`
- `assets/skills/magic.png`
- `assets/skills/ranged.png`
- `assets/skills/slayer.png`
- `assets/skills/cryptomining.png`
- `assets/skills/datafishing.png`
- `assets/skills/codecraft.png`
- `assets/skills/forgenetics.png`
- `assets/skills/system_hacking.png`

A temporary `health.png` emblem was generated because the upload did not include a Health/Hitpoints icon; it can be replaced anytime with the same filename.
