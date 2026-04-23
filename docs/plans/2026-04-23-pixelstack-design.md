# PixelStack — Design Document

> Visual block-based environment for building 2D games.
> Part of block-lab (coding-tree). Single HTML file at `pixel-stack/`.

## Overview

PixelStack teaches 2D game development thinking — from placing pixels at x/y coordinates, through the game loop, physics, input, up to simple enemy AI and procedural worlds. Progression follows a skill tree with per-stage challenges (BitStack-style).

Target: students aged 10–14, after or alongside Scratch. Language: Polish UI (consistent with the rest of block-lab).

Block model: classic Scratch — sprites with their own scripts, drag & drop palette. Rationale: lowest cognitive cost for students coming from Scratch; the novelty is in the content (coordinates, ticks, physics), not in the paradigm.

## Progression (Skill Tree)

Four tracks, seven stages:

| # | Track | Stage | Teaches |
|---|---|---|---|
| 1 | Basics (green) | **Pixels** | x/y, size, color — static placement |
| 2 | Basics (green) | **Tick** | game loop, `every frame`, update vs render |
| 3 | Actors (blue) | **Autonomy** | each sprite has its own on-tick script |
| 4 | Actors (blue) | **Motion** | velocity, acceleration, gravity (vectors) |
| 5 | Play (orange) | **Control** | keyboard, collisions, shmup |
| 6 | Minds (purple) | **AI** | enemy state machine (patrol → attack → flee) |
| 7 | Minds (purple) | **Worlds** | randomness, seed, procedural levels |

Unlock rule: a stage unlocks the next when student earns ≥ 1 star on 3 of 4 challenges in it. Sandbox is always accessible but its palette only contains currently unlocked block categories — students see the palette grow, which reinforces progression.

Coordinate system: canvas-style, (0,0) top-left, X→right, Y→down. Explicitly taught in stage 1 — the difference from Scratch is part of the lesson.

## UI — Three Views

One `index.html`, three views switched by state (same pattern as BitStack).

### Tree view (default)
Header with title and star counter (`⭐ N / M`). Four track columns, each containing 1–2 stage nodes linked by dependency lines. Locked nodes greyed out; available nodes glow; complete nodes show earned stars. Side CTA opens Sandbox.

### Challenge browser + challenge view
Two-step. First a list of challenges in the stage (4 per stage). Second the challenge itself, three-column layout:

- **Left:** block palette — only categories unlocked up to this stage
- **Middle:** scripts area (blocks attached to the active sprite) above the 2D scene canvas
- **Right:** task description, goal preview (image/animation), test list with pass/fail, buttons `▶ Run`, `🔄 Reset`, `✓ Check`

### Sandbox view
Same layout as challenge view, minus the tasks panel. Adds a small sprite list (add/remove/rename) and tick controls (play/pause/step).

## Scene & Runtime

Canvas 512×320 logical pixels, rendered with `image-rendering: pixelated` for a crisp look.

Tick loop driven by `requestAnimationFrame`, fixed dt ≈ 16.67 ms (60 fps). Each frame:

1. Dispatch buffered input events to `when key pressed` handlers
2. Resolve collisions (AABB, per-pair), emit `when I touch` events
3. For every sprite: run `every tick` handlers (update phase)
4. Render pass: clear canvas, draw all sprites in list order

Reset zeroes sprite state and restarts scripts.

## Block Model

A sprite has: `name`, `x`, `y`, `w`, `h`, `color` (or custom pixel grid), `state` (dict), a block script. Global dict `globalne.*` is shared across sprites.

### Block categories (unlocked progressively)

**🎨 Drawing** (stage 1)
- `postaw w (x, y)`
- `rozmiar (w, h)`
- `kolor [#hex / paleta]`
- `narysuj piksel w (x, y) kolor [c]`

**🕐 Loop** (stage 2)
- `na start`
- `co tick`
- `co N ticków`
- `spawnuj sprite [nazwa]` (from stage 3)

**🧠 State** (stage 2)
- `stan.[pole] = [expr]` / `stan.[pole]`
- `globalne.[pole] = [expr]` / `globalne.[pole]`

**🧮 Math** (stage 2)
- arithmetic, comparisons, `losowe [min..max]`, `moje.x`, `moje.y`

**➡️ Motion** (stage 4)
- `przesuń o (dx, dy)`
- `ustaw prędkość (vx, vy)` — auto-integrated per tick
- `grawitacja (gx, gy)`

**🎮 Input** (stage 5)
- `gdy wciśnięto [klawisz]`
- `czy wciśnięte [klawisz]` (expression)

**💥 Collisions** (stage 5)
- `gdy dotknę [nazwa/tag]`
- `czy dotykam [nazwa]`
- `zniszcz siebie`

**🧭 Control** (stage 6)
- `jeżeli / inaczej`, `powtórz N razy`, `dopóki`, `stan_maszyny: [patrol / atak / ...]`

**🎲 World** (stage 7)
- `seed [n]`, `dla każdego w [0..N]`

## Challenge Model

Each challenge is a data object:

```js
{
  id: "pixels-01",
  track: "basics",
  stage: "pixels",
  order: 1,
  title: "Postaw kulkę",
  goal: "Ustaw sprite w punkcie (100, 80)",
  type: "fill-in-blank",              // | "tests" | "sandbox-checklist"
  unlockedBlocks: ["draw", "math"],
  initialSprites: [{ name: "ball", color: "#00ff88", w: 16, h: 16 }],
  initialScript: [ /* partial with [?] slots */ ],
  goalPreview: "image/anim" || renderFn,
  tests: [ { t: 0, assert: "ball.x === 100 && ball.y === 80" } ],
  stars: {
    1: "passes tests",
    2: "uses ≤ 3 blocks",
    3: "uses math expression instead of literal"
  }
}
```

### Three validation types

**fill-in-blank** (stages 1–2): script given with empty slots; student drops blocks in; validator runs and asserts.

**tests** (stages 3–5): list of `{ t, assert }` where `t` is tick count or ms. Validator runs the sim up to `t`, evaluates the assert. Input-driven challenges record a key script: `[{ t: 30, key: "ArrowRight", down: true }, ...]`. UI shows pass/fail per row.

**sandbox-checklist** (stages 6–7): student ticks off self-reported goals (`at least 2 enemies`, `enemy has 2 states`) plus a single automated assert (`runs ≥ 10s without errors`). Mentor can verify manually.

### Stars

- ⭐ tests pass
- ⭐⭐ constraint (block count limit, no hardcoded literal, uses a specific category)
- ⭐⭐⭐ bonus challenge (add one extra element, refactor)

## Persistence

`localStorage.pixelstack` holds: stars per challenge, last code per challenge (resumable), sandbox state.

## Tech Stack

- Zero dependencies — pure HTML / CSS / JS (block-lab convention)
- Single `index.html` (expected ~2500–3500 lines, similar to bit-stack)
- Google Fonts: Outfit (UI), DM Mono (code)
- Canvas 2D for scene, `requestAnimationFrame` runtime
- Drag & drop: custom mouse tracking (matches bit-stack)
- State persisted to `localStorage`

### File structure

```
<style>
  :root { ... }                    // CSS vars consistent with block-lab
  /* LAYOUT */                     // 3 views
  /* SKILL TREE */                 // like bit-stack
  /* BLOCK PALETTE + EDITOR */     // drag & drop
  /* SCENE CANVAS */               // pixel-rendered
  /* TESTS PANEL */                // tests / checklist UI
</style>

<body>
  <div id="tree-view"> ... </div>
  <div id="challenge-view"> ... </div>
  <div id="sandbox-view"> ... </div>
</body>

<script>
  // 1. DATA: CHALLENGES = [...]
  // 2. BLOCKS: BLOCK_DEFS = {...}
  // 3. STATE: user progress, current view, active sprite
  // 4. RENDERERS: tree / challenge / sandbox
  // 5. PALETTE: drag & drop into scripts
  // 6. INTERPRETER: eval blocks per sprite per tick
  // 7. RUNTIME: tick loop, collisions, input
  // 8. VALIDATOR: run tests, award stars
  // 9. PERSISTENCE: load / save localStorage
</script>
```

## Adding to block-lab index

New card in `block-lab/index.html`, accent `pink`:

```html
<a class="card" href="pixel-stack/" data-accent="pink">
  <span class="version">v1 — new</span>
  <h2>PixelStack</h2>
  <p class="desc">Bloki do budowy gier 2D — piksele, game loop, fizyka, AI wrogów. Skill tree z wyzwaniami.</p>
  <div class="features">
    <span>x/y</span><span>game loop</span><span>fizyka</span><span>shmup</span><span>FSM AI</span>
  </div>
  <div class="status" style="color: var(--pink);">⬢ Nowy</div>
</a>
```

## MVP Scope

First release: tracks **Basics + Actors** only (stages 1–4). That is 16 challenges, covering the full flow tree → challenge → validation → stars → unlock. Tracks Play and Minds (stages 5–7) land in v2.

## Build Order

1. Scaffold `index.html` — three views, view routing, localStorage shell
2. Skill tree (4 MVP nodes) + challenge list per node
3. Palette + drag & drop editor (3 categories: Drawing, Loop, State/Math)
4. Runtime: canvas, tick loop, interpreter
5. Tests, stars, unlocks
6. 16 challenges (data-driven, easy to extend)
7. Sandbox view
8. Card in `block-lab/index.html`

## Open Questions (deferred to implementation)

- Sprite appearance: flat color vs small pixel grid the student can draw? MVP: flat color only; pixel grid in v2.
- Multiple scripts per sprite (Scratch-style) vs one script per sprite? MVP: one script per sprite — simpler palette, fewer edge cases.
- Sound: out of scope for v1.
