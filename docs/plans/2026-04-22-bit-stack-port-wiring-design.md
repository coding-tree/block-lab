# BitStack — Port-to-Port Wiring UX

> Replaces the checkbox popup and the implicit "last-gate-in-last-layer" output rule with explicit, visible ports on every node. Kids wire by clicking a source output port, then a target input port. The output bulb becomes a real wiring target.
> Scope: [bit-stack/index.html](../../bit-stack/index.html) only.

## Problem

The current wiring flow has three frictions:

1. **Opaque output** — the final bulb auto-connects to "the last gate in the last non-empty layer." When a kid's layout doesn't match that rule, the check fails for reasons they can't see.
2. **Modal popup** — clicking "🔌 Polacz" opens a floating checkbox list, decontextualized from the circuit. Kid checks sources, closes the popup, reads the "← A, B" text summary to verify.
3. **No spatial intuition** — wiring is a list-selection task, not a spatial one. Kids can't *see* the topology of what they're building.

## Shape of the fix

Every connectable thing grows **ports** — little clickable dots on its edge. Wiring is a two-click interaction: click a source output port, click a target input port.

### Ports model

| Node | Input ports (left edge) | Output port (right edge) |
|---|---|---|
| Input switch (A, B, …) | — | 1 |
| NOT gate | 1 | 1 |
| AND / OR / XOR gate | 2 (top = port 0, bottom = port 1) | 1 |
| Output bulb | 1 | — |

**Port states** (via CSS classes):

- **Idle** — empty input port (outlined) or free output port (filled, neutral).
- **Occupied** — input port with a wire; filled in gate color.
- **Armed** — source port the kid just clicked; pulses.
- **Valid** — during wiring mode, input ports that could receive the armed source pulse with a matching outline.
- **Invalid** — dimmed, `pointer-events: none`.

**Rules:**
- Each input port holds 0 or 1 wires.
- Each output port can feed any number of targets.
- Output bulb has one input port; wiring something new replaces the previous wire.

### Interaction flow

**Create a wire (2 clicks):**

1. Click a source output port. Port arms, pulses. A thin banner slides in at the top: "Wybierz wejscie bramki lub lampki zeby polaczyc" with a ✕ to cancel. Valid input ports pulse; invalid stay dim.
2. Click a valid input port. Wire created, armed state clears, banner disappears. If the target was already occupied, the old wire is silently replaced.

**Cancel arming:**
- Click the armed port again.
- Click the banner's ✕ or press `Esc`.
- Click anywhere that's not a port.

**Remove a wire (no arming):**
- Click an occupied input port while no source is armed. Wire disconnects with a brief red flash.
- Clicking an occupied input port *while* armed replaces the wire (not remove).

**Re-arming / multi-target:**
- Clicking any output port when something else is armed switches the armed source. No chaining — one source at a time.
- After a wire is made, armed clears. To feed the same source into another target, re-click the source port.

**Disambiguating 2-input gates:**
- Two distinct input ports stacked vertically.
- When arming a source, both empty ports on valid targets highlight; kid picks which one.
- Filling only one port preserves current fallback (missing input → 0).

## Data model

### `gate.wires` becomes positional

Already an array — what changes is the interpretation:

- **Before**: append-order, padded with 0.
- **After**: `wires[i]` is the wire into port `i` specifically. Unwired ports hold `null`. Evaluation treats null as 0.

Existing presets (`wires: [{layer:-1,idx:0},{layer:-1,idx:1}]`) match port positions incidentally — we authored them in port order. **No preset migration needed.**

### New state: `circuitOutputWire`

```js
let circuitOutputWire = null; // {layer, idx} | null
```

Replaces the "last gate in last non-empty layer" heuristic.

### `getFinalOutput` rewrite

```js
function getFinalOutput() {
  if (!circuitOutputWire) return 0;
  const src = circuitLayers[circuitOutputWire.layer]?.[circuitOutputWire.idx];
  return src ? (src._output || 0) : 0;
}
```

### Preset backward compat

`loadPreset()` runs the old heuristic once after loading layers — finds the last non-empty layer's last gate and sets `circuitOutputWire` to that. All existing predict/wire/fill presets behave identically without edits. For kid-built challenges (`circuit` type, sandbox), `circuitOutputWire` starts `null` — kid must explicitly wire the output bulb.

Opt-out: preset can specify `outputWire: {layer, idx}` explicitly. Not needed now, cheap to support.

### Check behavior tweak

`checkCircuitChallenge` gains a kid-kind early branch: if `!circuitOutputWire` and `ch.type !== 'multi-input'`, show "Polacz bramke z lampka!" instead of the generic "Nie dla wszystkich kombinacji — sprawdz polaczenia!".

## Implementation

Single file: [bit-stack/index.html](../../bit-stack/index.html). Estimated **~300–400 lines added, ~80 modified, ~40 deleted**.

### CSS (~60 lines added)

New classes:

- `.port` — 12px circle, absolutely positioned.
- `.port.port-in`, `.port.port-out` — left vs right edge. Two `.port-in` at `top: 30%` / `top: 70%` for 2-input gates; single at `top: 50%` for NOT.
- `.port.occupied`, `.port.armed` (with pulse keyframe), `.port.valid` (with pulse keyframe), `.port.invalid`.
- `.wire-banner` — fixed top strip, 36px tall, cyan accent, shown while armed.

Requires `position: relative` on `.gate-box` (already), `.input-switch` (already), `.output-bulb` (add).

Delete `.wire-popup` styles.

### New state + helpers (~80 lines)

```js
let armedPort = null;
let circuitOutputWire = null;
```

Functions:

- `armPort(kind, layer, idx)` — toggles or switches armed source.
- `connectTarget(target)` — creates wire (gate input port or output bulb); clears arm.
- `disconnectTarget(target)` — removes wire.
- `cancelArm()` — clears armed state.
- `isValidTarget(target)` — output bulb always valid; gates require strictly-earlier source layer; input switches never valid targets.
- `pruneWires()` — sweeps circuit to null out wires pointing at removed gates or missing indexes; invoked by gate ✕ handler.

One-time document-level `keydown` listener: `Escape` → `cancelArm()`.

### `renderCircuitUI` changes

Replace per-gate markup:

```html
<!-- DELETE -->
<div class="gate-inputs">← A, B</div>
<button class="gate-wire-btn">🔌 Polacz</button>

<!-- ADD (absolutely positioned on gate-box edges) -->
<div class="port port-in occupied" onclick="..."></div>  <!-- 1 or 2 of these -->
<div class="port port-out armed" onclick="..."></div>
```

Input switch gets an output port on its right edge; click handler arms the input (layer `-1`). The switch body still toggles value — port click uses `event.stopPropagation()`.

Output bulb gets an input port on its left edge; click connects if armed, disconnects if occupied and nothing armed.

Banner rendered at top of `.challenge-body` only when `armedPort !== null`.

### Predict / fill renderers

No port markup — those modes are read-only. Current rendering unchanged.

### Eval changes

- `evaluateCircuit`: treat null wire entries the same as missing (early skip).
- `getFinalOutput`: rewritten to use `circuitOutputWire`.
- `loadPreset`: runs heuristic at end to populate `circuitOutputWire`.

### Dead code removal

- `openWirePopup` (~30 lines)
- `toggleWire` (~12 lines)
- `.wire-popup` CSS (~10 lines)
- `.gate-inputs` emission (class can stay, no styles lost)

### Reset points

Reset `armedPort = null` and `circuitOutputWire = null` in:
- `renderCircuitChallenge` (kid starts from scratch)
- `openSandbox` (always empty)
- `loadPreset` sets `circuitOutputWire` via heuristic after loading layers

## Progress compatibility

No `localStorage` schema change. Existing stars carry over.

## Out of scope

- **SVG wires between ports** — tinted ports communicate state; actual drawn lines are a natural next pass but not this one.
- **Port support in predict/fill modes** — those are read-only; ports would be decorative only.
- **Touch / mobile polish** — 12px ports are large enough for laptops; optimization for touch is later work.
- **Snap / path routing** — no routing logic since no lines are drawn.
