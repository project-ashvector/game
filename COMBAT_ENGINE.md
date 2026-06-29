# Project: ASH VECTOR — Combat Engine v2

This build upgrades the battle system from simple attacks into a reusable RPG combat framework.

## Included Systems

- Operator vs Anomaly battle layout
- 4 Operator Protocol buttons
- Guard command
- Med Patch item use in battle
- Enemy skill lists
- Enemy turn logic
- Accuracy and miss chance
- Dodge chance
- Critical hits
- Status effects
- Victory screen
- Loot rewards
- XP / Synchronization increase
- Emergency defeat recovery
- Battle log with ASH VECTOR tone

## Status Effects

Current supported status effects:

- `Burn` — damage over time
- `Corruption` — damage over time, ASH VECTOR lore flavor
- `Shock` — chance to lose turn
- `Freeze` — higher chance to lose turn

## Skill Data Pattern

Operator and enemy skills are defined as objects:

```js
{
  id: 'neon_slash',
  name: 'Neon Slash',
  power: 9,
  type: 'attack',
  element: 'Void',
  accuracy: .95,
  critBonus: .05,
  status: null,
  line: 'Vyra cuts the air so hard the sewer asks for therapy.'
}
```

Enemy skills use a similar pattern:

```js
{
  name: 'Acid Burp',
  power: 6,
  accuracy: .9,
  status: { name: 'Burn', chance: .25, turns: 2, power: 2 }
}
```

## Replaceable Battle Assets

Battle art is still placeholder-ready:

```text
assets/operators/vyra/battle.png
assets/operators/vyra/icon.png
assets/anomalies/toxic_slime/battle.png
assets/anomalies/rust_rat/battle.png
assets/anomalies/cable_wraith/battle.png
assets/anomalies/sewer_king/battle.png
assets/battle_backgrounds/toxic_sewers_battle.png
```

Replace those files later with final generated art using the same filenames.
