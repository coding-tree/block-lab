# SortLab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship v1 of the SortLab suite at `sort-lab/`. Three apps (Race, Cards, Driver) on a shared core. Design: `docs/plans/2026-05-06-sort-lab-design.md`.

**Approach:** build the shared engine first with strong inline tests, then bolt on the three thin UIs one at a time. Each milestone independently committable.

**Tech stack:** Vanilla HTML/CSS/JS. Single `core.js` shared via `<script src="../core.js">` from each app. Canvas-based bar rendering. Inline `t(name, cond)` tests run when loaded with `?dev=1`.

---

## Milestones

### M1 — Shared core (`sort-lab/core.js`)

- `PALETTE` — 12 pleasant colours
- `mulberry32(seed)` — seedable PRNG (lifted from radio-room)
- `dealRandomHand(n, seed?)` — returns `[{id, value, color}]`
- Five algorithm generators yielding `{kind, ...}` ops:
  - `bubbleSort`, `selectionSort`, `insertionSort` (swap-based)
  - `mergeSort` (uses `set` ops with full item replacement)
  - `quickSort` (Lomuto partition, swap-based)
- `applyOp(items, op)` — mutates `items` to apply an op
- `runAlgorithm(initial, algo)` — drains the generator, returns `{ items, ops }`
- `renderBars(canvas, items, highlights)` — draws cards + bars
- Inline tests: each algorithm sorts a 20-item shuffled array; edge cases (empty, single, sorted, reverse, duplicates); op stream is consistent (`applyOp` applied to initial yields the same final array as the generator's internal copy).

Acceptance: open `sort-lab/index.html?dev=1`, console shows `15+ pass, 0 fail`.

### M2 — Sort Race (`sort-lab/race/index.html`)

- 2–4 algorithm tracks running side-by-side on the same shuffled input
- Speed slider (0.25× → 4×), shuffle, pause, step
- Per-track counter strip (compares / swaps / ticks) + ✓ when done
- Algorithm picker (checkbox grid)
- 20-item default; size slider 8–40

Acceptance: pick Bubble + Quick on 30 items, hit ▶, watch Quick finish first; counters match expected order of magnitude.

### M3 — Sort Cards (`sort-lab/cards/index.html`)

- Hand of 8–12 cards rendered as draggable elements
- Drag and drop to reorder; smooth slot snap
- Move log; on hand sorted, classify pattern (bubble / selection / insertion / własny styl)
- "Robot pokaże" button replays same hand under chosen algo at slow speed alongside

Acceptance: hand-sort by always swapping adjacent → "bubble" detected. Hand-sort by min-find → "selection" detected. Hand-sort weirdly → "własny styl".

### M4 — Sort Driver (`sort-lab/driver/index.html`)

- Algorithm picker: Bubble / Selection / Insertion (v1)
- Per-algorithm primitive button set (Compare / Swap / Mark / Next / etc.)
- Pointer rendering on bars
- State machine constrains illegal moves; nudges if mistaken
- ⚡ Robot mode hands control back to the algorithm

Acceptance: walk bubble sort manually on 8 items to completion; same for selection; robot mode finishes any partial state.

### M5 — Suite landing + block-lab landing card

- `sort-lab/index.html` lists the three apps
- `block-lab/index.html` adds a SortLab card next to RadioRoom

## Out of scope (v2)

- Sort Maker (block-program your own sort)
- Custom inputs (sorted, reverse, nearly-sorted)
- Big-O annotations
- History/replay graph
- Recursion-based algorithms in Driver

## Commit cadence

One commit per milestone. No `--no-verify`. No Co-Authored-By trailer. Push only when user asks.
