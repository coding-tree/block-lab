# RadioRoom — design

A new block-lab tool for kids. Builds intuition for **messaging, probability, and eventual consistency** by simulating several little radio-equipped devices that broadcast unreliable messages to each other.

Models micro:bit's `radio.set_group` + `radio.send_string` and Scratch's broadcast/receive, but makes the unreliability and addressing visible and controllable.

---

## Concept

Several "micro:bit-style" devices share one screen. Each has a 5×5 LED display, state, two buttons, a channel subscription, and a small block program. Between them, a visible **radio space** shows every broadcast as a coloured dot flying from sender to subscribers — some arrive, some are dropped, some are delayed.

The kid sees probability happen (dice rolls on messages, live delivery-rate stats), feels addressing (channels = colours), and watches eventual consistency emerge (devices' views diverge under unreliability and reconverge with the right protocol).

## Screen layout

```
┌──────────────────────────────────────────────────────────────┐
│  DEVICES                            STATS                    │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                ┌────────────────────┐  │
│  │A │ │B │ │C │ │D │                │ ch.1: sent 12      │  │
│  │▦▦│ │▦ │ │▦▦│ │▦▦│                │       got  9 (75%) │  │
│  │▦ │ │▦▦│ │▦ │ │▦ │                │ ch.2: sent  4      │  │
│  └──┘ └──┘ └──┘ └──┘                │       got  4 (100%)│  │
│   1     1     2     1   ← channel   └────────────────────┘  │
│                                                              │
│  RADIO SPACE                        KNOBS                    │
│  ··  ●→     ····    ✗               drop%:  ▮▮▮▮░░ 40%      │
│   ●→     ··                         delay:  ▮▮░░░░ 200ms    │
│                                     reorder: □               │
│                                     seed:   _______          │
└──────────────────────────────────────────────────────────────┘
```

- **Devices**: 2–6 units, click one to edit its block program.
- **Radio space**: each broadcast is a coloured dot (colour = channel) animating sender→subscribers. Drops vanish with `✗`. Slow flights = high delay.
- **Stats panel**: per-channel sent / delivered / drop-rate; per-message dice flash.
- **Knobs**: drop %, delay (ms), reorder toggle, optional fixed RNG seed.

## Channels & addressing

- Each broadcast carries a channel number (1–9), rendered as a colour.
- Each device has one channel subscription (v1 — multi-subscribe in v2). Sending channel and listening channel are independent.
- A message on ch.X is only a delivery candidate to devices subscribed to ch.X. Devices on other channels stay dim — distinct from a drop.
- Two failure modes are now distinguishable: *wrong frequency* vs *radio drop*.

## Probability, made visible

1. **Per-message dice flash** — small d10 face on the dot at send time ("rolled 7 vs threshold 4 → arrives" / "→ DROP").
2. **Live tally per channel** — sent / delivered / observed drop-rate vs configured. Lets the kid feel law of large numbers.
3. **Mini delay sparkline** — last 30 message delays as a tiny histogram (chapter 2 only).

Knobs: `drop%`, `delay` (mean ms, with implicit ±50% jitter), `reorder` toggle, `seed` text input.

Polish kid-facing labels: drop chance, opóźnienie, wymieszanie kolejności, ziarno losowości.

## Block primitives

Built on top of pixel-stack's existing block engine (categories, slots, fill-in-blank, click-to-place, ×-remove, slot editor).

**Triggers:**
- `🟢 na start`
- `🅰 gdy klik A` / `🅱 gdy klik B`
- `📡 gdy odebrano §msg na §ch` (blank channel = any)
- `🕐 co tick`

**Radio:**
- `📢 nadaj §msg na §ch`
- `📥 ostatnia wiadomość`  (expression)
- `🎯 ustaw kanał słuchania §ch`

**Display (5×5):**
- `💡 zapal (§x, §y)`
- `🌑 zgaś (§x, §y)`
- `🎨 cały ekran §c`
- `📃 pokaż liczbę §n`

**State:**
- `stan.§field = §val`, `stan.§field`
- `globalne.§field = §val`, `globalne.§field` (per-device, NOT shared — this is the whole point)

**Flow:** `if §cond then …`, `repeat §n times …`, the `op` block from pixel-stack.

Mental model the kid lands on: *every device runs the same code, but observes a different reality because messages drift.*

## Lesson arc — 12 micro-challenges in 3 chapters

**Chapter 1 — Messaging basics (channels & broadcast)**
1. *Cześć!* — broadcast "hi", all light up. Drop=0.
2. *Inny kanał* — one device on ch.2 stays dark. Why? Fix the subscription.
3. *Dwa kanały* — alternate broadcasts on ch.1 and ch.2; listeners split.
4. *Echo* — receiver replies; sender shows "got reply".

**Chapter 2 — Probability**
5. *Zgubione wiadomości* — drop=50%, send 1, run repeatedly.
6. *Średnia* — send 50, count arrivals, compare to 50%.
7. *Dwa razy częściej* — send each message twice. How often does at least one arrive?
8. *Opóźnienie i kolejność* — reorder=on, watch out-of-order arrivals.

**Chapter 3 — Eventual consistency**
9. *Licznik się rozjeżdża* — each device increments local counter on tick and broadcasts +1; drop=30% → drift.
10. *Wyślij sumę* — broadcast the total instead of the delta. Counters converge. (CRDT-ish.)
11. *Plotka* — periodic full-state broadcasts; "newer" wins (uses tick counter as logical time). Tolerates drops.
12. *Podziel sieć* — partition (drop=100% between halves), watch divergence; restore, watch reconciliation. **The eventual-consistency aha.**

Each challenge: goal text, initial multi-device script with blanks, tests run for a fixed tick count under fixed seed, 3-star scoring like pixel-stack.

## Architecture

Single `index.html` like pixel-stack. Reuses pixel-stack's blocks engine, fill-in-blank machinery, slot editor, click-to-place, target highlights, remove-×.

**Replace** pixel-stack's world (sprites + 2D canvas) with:
- A **multi-device simulator** — array of devices, each with its own state and script
- A **radio bus** — one shared FIFO of `{from, channel, msg, sentAt, deliverAt, dropped}` records, scheduled at send time using current knobs

**Per-tick loop (~30 Hz):**
1. Run each device's `co tick` body once
2. Process radio bus: messages whose `deliverAt` has passed deliver to subscribed devices and fire their `📡 gdy odebrano` handlers
3. Render device displays + radio-space dot positions + stats

**Determinism:** seedable `mulberry32` PRNG when `seed` is set; critical for lesson tests. Drops are decided at send time so dot animations match outcomes.

**Tests:** evaluate device state after a fixed tick count with a fixed seed.

## Out of v1 (notes for v2)

- More than 6 devices
- Multi-channel subscriptions per device
- Real network mode (cross-device sync)
- Custom message payloads (objects, lists)
- Vector clocks / Lamport timestamps (chapter 11 uses simple tick counter — sufficient for the lesson)
- Energy / battery model
- Geographic radio range (distance-based drop)

## Reuse summary

Lifted from pixel-stack, no changes needed:
- Blocks engine: BLOCKS table, slot rendering, label parsing
- Fill-in-blank: `_blanks`, `markBlanks`, lock-literals rule
- UI: click-to-place, target highlights, remove-×, slot editor (text/choice/color/expression), drag-and-drop
- Persistence: per-challenge script in localStorage
- Stage/challenge tree, stars, progression gating

New code:
- Device model + multi-device renderer
- Radio bus + scheduling
- 5×5 LED display block render
- Probability stats panel + dice-flash overlay
- Channel colour palette + subscription UI
- 12 challenge specs

Estimated v1 size: ~1500 LOC on top of pixel-stack patterns. Single HTML file.
