# SortLab — design

A new block-lab suite of three small kid-targeted apps that teach sorting from
three complementary perspectives. Lives at `sort-lab/` with subfolders for each
app, all built on a single shared core.

The three apps:

| App         | Perspective    | What the kid does                                                      | "Aha"                                                       |
|-------------|----------------|------------------------------------------------------------------------|-------------------------------------------------------------|
| Sort Race   | 👁️ watch        | Picks 2–4 algorithms, hits ▶, watches bars sort side by side.          | Quicksort *flies* past bubble sort. Complexity intuited.    |
| Sort Cards  | ✋ play         | Drags cards in a hand to reorder; tool detects which algorithm pattern | "I already sort. Algorithms are *names* for what humans do." |
| Sort Driver | 🎯 drive       | Manual primitive buttons (compare/swap/next) walk one algorithm step   | "Bubble sort is just compare-and-maybe-swap, repeated."     |

## Suite structure

```
block-lab/
├── index.html         ← landing card "🔢 SortLab" links to sort-lab/
└── sort-lab/
    ├── index.html     ← suite landing: 3 cards (Race / Cards / Driver) + back link
    ├── core.js        ← shared engine + visual primitives
    ├── race/index.html
    ├── cards/index.html
    └── driver/index.html
```

Mirrors the existing block-lab pattern (one HTML per tool) but groups the trio under one umbrella so they feel like a family. Each subfolder loads `../core.js` for the shared engine.

## Shared core (`core.js`)

The single source of truth for everything visual + algorithmic. Touching one file fixes all three apps.

### Item model

```js
{ id: number, value: number, color: string }
```

- `id` and `color` are assigned once at deal time from a fixed palette indexed by id, so a card keeps its colour through any number of moves — kids can track individual items through swaps.
- `id` is independent of `value` so the same colour stays bound to the same card after sorting (intentional; visualises the item's *journey*).

### Algorithms as operation streams

Each algorithm is a generator that yields *operations* over an indexed array:

```js
{ kind: 'compare', i, j }
{ kind: 'swap',    i, j }
{ kind: 'mark',    i, label }     // "min so far", "i", "j", etc.
{ kind: 'set',     i, value }     // for shifts in insertion sort
{ kind: 'done' }
```

All three apps consume the same stream and just render it differently. Adding a new algorithm lights up everywhere.

v1 algorithms: bubble, selection, insertion, merge, quick.

### Bar+card render

A single `renderBars(canvas, items, highlights)` routine. Each item draws as a small card with the number on top and a coloured bar whose height matches the value. `highlights` is `{ glow: [i,...], mark: { i: label } }` — apps pass which positions to emphasise.

### Counters

`{ compares, swaps, reads, writes, ticks }` updated as ops flow through. Each app uses some subset.

## Sort Race

Visual race of 2–4 algorithms on the same shuffled input.

- 20–40 items per track (slider).
- One row per chosen algorithm, each with its own counter strip and a `✓` badge when it finishes.
- Speed slider (0.25× → 4×), pause, step, shuffle.
- Default selection: Bubble + Selection + Quick (slow, medium, fast — most dramatic spread).
- Algorithm checkbox grid for the picker.

The disparity between Quick and Bubble on a 40-item array is visible *as motion* before any number is read. That's the lesson.

## Sort Cards

Drag-to-reorder game. Hand of 8–12 cards.

- Drag any card; drop snaps to the nearest slot, others shift over.
- Every move (swap of adjacent / pick-up-and-insert) is logged.
- After the hand is fully sorted, a **detector** classifies the move pattern:
  - Repeated adjacent swaps from a left-to-right pass → **bubble**.
  - Repeated min-find scans + move to the front → **selection**.
  - Pick-up-and-slot-into-already-ordered → **insertion**.
  - Otherwise → "własny styl 🎨".
- A "Robot pokaże ci [name] sort" button replays the same hand under the chosen algorithm side-by-side at slow speed.
- Stat strip: kid's moves vs algorithm's moves (compares, swaps).

Detector heuristic: state machine over the move log. Doesn't need to be perfect; ambiguous patterns get the "własny styl" label, which is fine — the kid still won, and they invented something.

## Sort Driver

Step-by-step manual driver for one algorithm at a time.

- Algorithm picker: Bubble / Selection / Insertion (v1; merge and quick need recursion scaffolding, deferred).
- The app shows only the primitives that algorithm needs:
  - **Bubble**: Compare, Swap, Next.
  - **Selection**: Compare, Mark min, Swap, Next pass.
  - **Insertion**: Pick up, Compare with left, Insert here.
- Pointers `i` / `j` / `marked` render as glowing rings on bars.
- State machine constrains illegal moves; nudges the kid if they press Swap when the last compare said "in order".
- **Robot mode** ⚡: hands control to the algorithm to finish the run automatically at a steady pace.
- Counters total compares/swaps the kid performed.

## Out of scope (v2)

- **Sort Maker** (block-program your own sort) — needs `for-loop` and array-index blocks that pixel-stack/radio-room don't yet have. Real design problem on its own.
- Custom inputs (sorted, reverse-sorted, nearly-sorted).
- Big-O annotations or formula display.
- History/replay graph.
- Branching "what if?" mode in Driver.
- Recursion-based algorithms (merge, quick) in Driver.
- Saved games / leaderboards.

## Implementation order

1. **Shared core** — item model, algorithm generators, render routine, counters. Inline test harness like pixel-stack/radio-room (`?dev=1` → console assertions).
2. **Sort Race** — biggest visual hook, simplest UI on top of the core.
3. **Sort Cards** — drag UI + pattern detector. The detector is the only really new logic outside the core.
4. **Sort Driver** — primitive buttons + state machine wrapping the operation stream.
5. **Suite landing** at `sort-lab/index.html` linking to the three apps.
6. **Block-lab landing** updated with a SortLab card.

Each step ships independently, commits, can be reviewed.
