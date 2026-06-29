# Project: ASH VECTOR — Engine Architecture

The current project is still GitHub Pages friendly: static HTML, CSS, JavaScript, JSON, and image/audio assets.

## Engine Modules
Future code should be separated into these systems:

```text
engine/
  core/
    Game.js
    State.js
    AssetLoader.js
  input/
    KeyboardInput.js
    TouchInput.js
  render/
    Renderer.js
    Camera.js
    Effects.js
  world/
    FractureLoader.js
    Collision.js
    Events.js
  combat/
    CombatEngine.js
    StatusEffects.js
    LootResolver.js
  ui/
    MenuSystem.js
    DialogueBox.js
    DatabasePanels.js
  save/
    SaveManager.js
  audio/
    AudioManager.js
```

## Rule
Every update should keep `index.html` playable on GitHub Pages.

## Asset Rule
No code should depend on temporary filenames. Assets must use their final production path from day one.
