# Missiles over Xerion - App Plan

## Goal
Create a JavaScript browser game inspired by the Amiga-era style of arcade defense games: protect Xerion's cities from incoming missiles using limited interceptor shots, escalating waves, and retro presentation.

## Scope

### In Scope (v1)
- Single-player 2D game in browser using HTML5 Canvas.
- Core loop: enemy missiles descend, player launches interceptors from batteries, explosions destroy nearby threats.
- City and battery health/lives, score, wave progression, game over, restart.
- Retro visual style (pixel-inspired palette, scanline/shader-like overlay optional).
- Keyboard and mouse controls.
- Basic sound effects and music toggle.

### Out of Scope (v1)
- Online multiplayer.
- Complex campaign narrative.
- In-app purchases/account system.

## Tech Stack
- Runtime: modern browser.
- Language: JavaScript (ES modules).
- Rendering: HTML5 Canvas 2D.
- Audio: Web Audio API (or preloaded audio assets).
- Tooling: Vite (dev server + build), npm scripts.
- Tests: Vitest for game logic modules; Playwright smoke test for load/start flow (optional in phase 1, required by beta).

## Architecture Plan
- `src/main.js`: bootstrap, asset preloading, start screen, game loop ownership.
- `src/game/Game.js`: orchestrates state transitions (`menu`, `playing`, `paused`, `gameover`).
- `src/game/entities/`: `Missile`, `Interceptor`, `Explosion`, `City`, `Battery`.
- `src/game/systems/`:
  - `SpawnerSystem`: wave scheduling and spawn patterns.
  - `CollisionSystem`: explosion radius checks and destruction.
  - `ScoringSystem`: points, multipliers, wave bonus.
  - `RenderSystem`: draw background, entities, HUD, effects.
  - `InputSystem`: mouse targeting + keyboard actions.
- `src/game/config.js`: tuneable constants (speed, counts, wave scaling).
- `src/assets/`: sprites, audio, fonts.

## Gameplay Design (Core Rules)
- Player controls 3 missile batteries with limited ammo per wave.
- Enemy missiles target cities or batteries with increasing speed and count each wave.
- Player launches interceptor at cursor target; interceptor explodes on arrival.
- Explosion destroys enemy missiles in radius; chain reactions allowed.
- End of wave grants bonus for surviving cities + unused ammo.
- Game over when all cities are destroyed.

## Milestones

### M1 - Foundation
- Initialize Vite app and canvas rendering loop.
- Create deterministic update loop with fixed timestep.
- Add menu and start/restart flow.

### M2 - Playable Core
- Implement missile spawning, interceptor firing, explosion collisions.
- Implement city/battery damage and game over logic.
- Add score and HUD.

### M3 - Game Feel
- Add wave scaling and spawn pattern variety.
- Add hit/explosion audio and background track toggle.
- Apply retro visual polish (palette, scanline overlay, simple screen shake).

### M4 - Hardening
- Add logic tests for collision, scoring, and wave progression.
- Add smoke test (page loads, game starts, loop runs).
- Balance pass for difficulty and ammo economy.

## Validation Strategy
- Unit tests:
  - Collision radius calculations.
  - Wave progression and spawn counts.
  - Score computation for kills and bonuses.
- Manual QA checklist:
  - Start, pause, restart all work.
  - Missiles/Interceptors render and collide correctly.
  - Game-over triggers only when all cities are gone.
  - Works in latest Chrome and Firefox at minimum.
- Performance target:
  - 60 FPS on typical laptop in Chrome for v1 scenes.

## Risks and Mitigations
- Risk: gameplay feels unfair at higher waves.
  - Mitigation: expose tuning constants and test with replayable fixed seeds.
- Risk: audio latency/inconsistency across browsers.
  - Mitigation: lazy-init audio on first user interaction, keep effects short.
- Risk: scope creep from nostalgia features.
  - Mitigation: strict v1 freeze after M2 core loop completion.

## Definition of Done (v1)
- Core gameplay loop complete and stable.
- Difficulty scales across multiple waves without soft-locks.
- Score and game-over flow fully functional.
- Tests for core logic passing in CI.
- Build output deployable as static site.
