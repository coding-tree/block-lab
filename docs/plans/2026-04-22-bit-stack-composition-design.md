# BitStack — Composition Scaffolding

> Adds intermediate exercises between individual-gate topics and the XOR-from-primitives capstone, so kids build intuition for composing gates before they're asked to synthesize one.
> Scope: [bit-stack/index.html](../../bit-stack/index.html) only.

## Problem

The jump from `gate-xor`'s first challenge ("Odkryj XOR") to its second ("Zbuduj XOR uzywajac tylko AND, OR i NOT — 4 gates, 3 layers") is a cliff. Three distinct skills stall kids at once:

1. **Mechanical** — connecting one gate's output into another gate's input (the wire popup).
2. **Planning** — choosing which gates to try in what order from the palette.
3. **Synthesis** — going from a target truth table back to a circuit structure.

Nothing in the current curriculum isolates any of these skills; every challenge asks for all three at once.

## Shape of the fix

Three new challenge types that decouple the skills, plus three new skill-tree topics that give composition visible progression.

### New challenge types

**`predict`** — fully pre-built circuit, kid fills a truth table. Teaches *reading* before *writing*.

```js
{ type: 'predict', inputs: ['A','B'],
  preset: { layers: [
    [ {type:'NOT', wires:[{layer:-1,idx:0}]} ],
    [ {type:'AND', wires:[{layer:0,idx:0},{layer:-1,idx:1}]} ],
  ]},
  hint: '...' }
```

**`wire`** — gates pre-placed in the right layers, palette hidden, kid only uses the 🔌 Polacz popup. Target is a `targetFn` checked across all combos.

```js
{ type: 'wire', inputs: ['A','B'],
  preset: { layers: [[{type:'NOT'},{type:'NOT'}],[{type:'AND'}]] },
  targetFn: (v) => (!v.A && !v.B) ? 1 : 0 }
```

**`fill`** — pre-built circuit with one gate replaced by a `?` slot; kid picks from options.

```js
{ type: 'fill', inputs: ['A','B'],
  preset: { layers: [[{type:'?', wires:[{layer:-1,idx:0},{layer:-1,idx:1}]}]] },
  options: ['AND','OR','XOR'], answer: 'AND' }
```

All three reuse the existing `evaluateCircuit` / `getFinalOutput` simulation.

### Reshaped blue track

```
[NOT || AND] ── OR ── XOR ── Series ── Parallel ── Combine ── Build XOR
                                                      └──── (→ Logic Laws)
```

Three new topic nodes:

- **`compose-series`** (Szeregowo) — output of one gate feeds input of next: NAND, NOR, double-NOT.
- **`compose-parallel`** (Rownolegle) — two branches feed a combiner: `(NOT A) AND (NOT B)` patterns. Foreshadows De Morgan.
- **`build-xor`** (Zbuduj XOR) — capstone. Walks through XOR synthesis via predict → wire → fill → build, all using the same `(A OR B) AND NOT(A AND B)` construction.

`gate-xor` loses its XOR-from-primitives challenge (moves to `build-xor`). `truth-tables` requires stays `['gate-combine']` — `build-xor` is a bonus endpoint, so kids who stall on XOR can still progress into De Morgan, which itself reinforces composition.

## Challenge content

### Warm-ups prepended to existing gate topics

| Topic | New challenge #1 | Notes |
|---|---|---|
| `gate-not` | `predict` "Zobacz NOT" | Preset: A → NOT. Fill [A→out]. |
| `gate-and` | `predict` "Zobacz AND" | Preset: A,B → AND. Fill 4-row table. |
| `gate-or` | `predict` "Zobacz OR" | Preset: A,B → OR. |
| `gate-xor` | `predict` "Zobacz XOR" | Preset: A,B → XOR. **Also remove current challenge #2** (moves to `build-xor`). |
| `gate-combine` | `fill` "Jaka bramka?" (appended) | Circuit: A → NOT, then ?(A_not, B). Target: `!A && B`. Options: AND/OR/XOR. Answer: AND. |

### `compose-series` — 4 challenges

1. `predict` **Podwojny NOT** — A → NOT → NOT → out. Kid discovers double-NOT = identity.
2. `predict` **NAND** — A,B → AND → NOT → out.
3. `wire` **Polacz NOR** — OR + NOT pre-placed. Target: `!(A||B)`.
4. `circuit` **Zbuduj NAND** — from scratch, available: AND, NOT. Target: `!(A&&B)`. `maxGates: 2`.

### `compose-parallel` — 4 challenges

1. `predict` **Dwie galezie** — Layer 1 `[NOT A, NOT B]`, Layer 2 AND of both.
2. `wire` **Polacz galezie** — same three gates pre-placed, kid wires. Target: `!A && !B`.
3. `fill` **Co na koncu?** — parallel NOT branches + `?` combiner. Target: `!A && !B`. Options: AND/OR/XOR. Answer: AND.
4. `circuit` **Oba wylaczone** — from scratch, available: NOT, NOT, AND. Target: `!A && !B`. `maxGates: 3`.

### `build-xor` — 4 challenges (capstone)

All use the canonical `(A OR B) AND NOT(A AND B)` construction so scaffolding transfers.

Layer 1: `OR(A,B)`, `AND(A,B)`
Layer 2: `NOT(L1.AND)`
Layer 3: `AND(L1.OR, L2.NOT)` ← final output

1. `predict` **Zobacz calosc XOR** — full 4-gate circuit pre-built.
2. `wire` **Polacz XOR** — four gates pre-placed in 3 layers, kid wires.
3. `fill` **Ktora na koncu?** — full XOR circuit with last gate = `?`. Options: AND/OR/XOR. Answer: AND.
4. `circuit` **Zbuduj XOR sam** — the original hard challenge, moved here. Available: AND, AND, OR, NOT. `maxGates: 4`.

## Implementation

Single file: [bit-stack/index.html](../../bit-stack/index.html). Estimated ~400–500 lines added, ~20 modified.

### New code

- `renderPredictChallenge(ch)` (~80 lines) — renders preset circuit read-only (reuses gate-box markup but strips remove/wire buttons), plus a truth table below where kid clicks output cells to cycle `?→0→1→?`. Check: for each combo, set `circuitValues`, call `evaluateCircuit()`, compare `getFinalOutput()` to kid's answer. 3 stars on first-pass correct.
- `renderFillChallenge(ch)` (~70 lines) — renders preset circuit with `?` gate as a distinctive empty slot. Clicking it pops a small picker with `ch.options`. On pick, set slot's `type`, evaluate, compare to `ch.answer`.
- `loadPreset(preset)` (~15 lines) — deep-copies `preset.layers` into `circuitLayers` so challenge data isn't mutated across retries.

### Reuse for `wire`

Add options arg to `renderCircuitUI(ch, available, opts)`:

```js
{ hidePalette: true, hideRemove: true, lockGates: true }
```

When set, the palette is not rendered, the ✕ buttons are omitted, and the drop zones at the end of each layer are hidden. Wire popup continues to work as-is. `renderWireChallenge(ch)` becomes a ~10-line wrapper that calls `loadPreset(ch.preset)` then `renderCircuitUI(ch, [], opts)`. Check logic reuses existing `checkCircuitChallenge` via the `targetFn` path.

### Dispatcher update

At [index.html:576](../../bit-stack/index.html#L576), add three cases alongside existing types:

```js
if (ch.type === 'predict') { renderPredictChallenge(ch); return; }
if (ch.type === 'wire')    { renderWireChallenge(ch); return; }
if (ch.type === 'fill')    { renderFillChallenge(ch); return; }
```

### Data changes in `TOPICS`

- 4 `predict` warm-ups prepended to existing gate topics.
- 1 `fill` appended to `gate-combine`.
- 1 existing challenge removed from `gate-xor` (moved to `build-xor`).
- 3 new topic objects added: `compose-series`, `compose-parallel`, `build-xor`.

### Tree rendering update

At [index.html:497-500](../../bit-stack/index.html#L497-L500), blue track's `ids` becomes:

```js
['gate-not','gate-and','gate-or','gate-xor',
 'compose-series','compose-parallel','gate-combine','build-xor']
```

NOT/AND parallel pair logic at [index.html:521-523](../../bit-stack/index.html#L521-L523) stays untouched — no new pairs.

### `?` slot handling

Not added to `GATE_DEFS`. Treated specially in `renderFillChallenge` and skipped by `evaluateCircuit` until the kid picks a real type. During check, the picked type is assigned to the slot's `type` field before evaluation.

## Progress compatibility

Existing localStorage progress is keyed by topic id with a `stars: []` array indexed by challenge position. Inserting a new challenge at index 0 in `gate-not/and/or/xor` shifts existing stars right by one position — meaning kids lose their star on the old challenge #1 (now challenge #2).

**Decision: accept the shift.** The warm-up `predict` challenges are 10-second interactions; replaying costs nothing. Migration code would add complexity for a one-time event. New topics start with empty progress as expected.

## Out of scope

- Multi-language (Polish text added; English path handled by existing i18n plan).
- New gate types (NAND/NOR as primitive gates — deliberately built *from* AND/OR/NOT in this plan to teach composition).
- Animation or visual wire drawing — reuses current column-based layout.
- Drag-to-reorder, undo/redo — out of scope.
