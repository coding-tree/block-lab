# RadioRoom Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship v1 of `radio-room/index.html` — the new block-lab tool for messaging, probability, and eventual consistency. Design: `docs/plans/2026-05-04-radio-room-design.md`.

**Architecture:** Single HTML file mirroring pixel-stack's structure. Reuse pixel-stack's blocks engine, fill-in-blank machinery, slot editor, click-to-place, ×-remove. Replace pixel-stack's "world" (sprite array + 2D canvas) with a multi-device simulator + radio bus + per-device 5×5 LED display.

**Tech stack:** Vanilla HTML/CSS/JS. No build step. Inline `t(name, bool)` assertions for engine tests, mirroring pixel-stack's pattern.

**Approach:** start by copying pixel-stack/index.html as a scaffold and tearing out what doesn't apply, instead of writing from scratch. Faster, ensures consistency with the patterns kids already know.

---

## Milestones

Each milestone is a committable unit. Pause for review between.

### M1 — Skeleton & device model
- New file `radio-room/index.html` based on a copy of `pixel-stack/index.html`
- Strip pixel-stack: sprites, world canvas, motion physics, pixel-stack-specific blocks
- Define `BLOCKS` for radio-room (events, radio, display, state, flow categories)
- DEVICES array: data shape `{ id, name, channel, state, script, display: 5×5 }`
- Multi-device renderer: row of devices, click to focus → script editor opens for that device
- Per-device script saved separately
- Acceptance: open `radio-room/`, see 4 devices with empty scripts, click each, palette shows new categories

### M2 — Radio bus + simulation loop
- Radio bus FIFO: `{ from, channel, msg, sentAt, deliverAt, dropped }`
- `tryBroadcast(deviceIdx, msg, channel)` — schedules with current drop%/delay knobs
- Per-tick loop (~30 Hz): run each device's `co tick`, then deliver due messages → fire `📡 gdy odebrano` handlers
- Deterministic mode: `mulberry32` PRNG when seed is set
- Inline `t(...)` tests: drop probability over 1000 messages stays within 5% of configured rate
- Acceptance: manually wire two devices to ping/receive, run, see broadcast→receive in console; turn drop% up, see rate match stats

### M3 — Visual radio space + knobs + stats
- Radio space DOM: a column between device rows, animates dots flying from sender to subscribers
- Drops shown as `✗`; channel = colour
- Knobs UI: drop%, delay, reorder, seed
- Stats panel: per-channel sent / delivered / drop-rate
- Per-message dice flash on the dot
- Acceptance: send messages with knobs at various values, visually verify dots, drops, delays match stats

### M4 — Chapter 1 challenges (messaging basics)
- 4 challenges from design doc: Cześć, Inny kanał, Dwa kanały, Echo
- Stage tree mirrors pixel-stack: track + stages + per-stage challenge lists
- Test runner: simulate N ticks with fixed seed, assert device states
- Acceptance: all 4 challenges 3-star with correct solutions

### M5 — Chapter 2 challenges (probability)
- 4 challenges: Zgubione, Średnia, Dwa razy częściej, Opóźnienie i kolejność
- Add delay sparkline component for chapter 2 lessons
- Acceptance: all 4 challenges 3-star with correct solutions

### M6 — Chapter 3 challenges (eventual consistency) + polish
- 4 challenges: Licznik się rozjeżdża, Wyślij sumę, Plotka, Podziel sieć
- Partition control: per-pair drop override (used by Podziel sieć)
- Link from `block-lab/index.html` landing page to radio-room
- Acceptance: all 4 challenges 3-star, navigation works, README updated

## Out of scope (v2)

- Multi-channel subscriptions per device
- Real network mode
- More than 6 devices
- Vector clocks (chapter 11 uses tick counter)
- Custom message payloads beyond strings/numbers

## Commit cadence

One commit per milestone, more if a milestone has natural sub-units. No `--no-verify`, no Co-Authored-By trailer. Push only when user asks.
