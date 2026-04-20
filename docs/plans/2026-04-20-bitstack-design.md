# BitStack — Design Document

> Visual logic & binary learning tool for kids aged 9-15.
> Part of block-lab (coding-tree). Single HTML file at `bit-stack/`.

## Overview

BitStack teaches binary representation, logic gates, and De Morgan's laws through interactive circuit building. Three modes: Skill Tree (progression), Challenges (guided puzzles), Sandbox (free building).

Visual metaphor: light bulbs & switches (ON/OFF = 1/0). Architecture supports future themes (water pipes, doors & keys).

## Modes

### Skill Tree
Vertical scrollable map with connected nodes. Node states: locked (grey), available (glowing), in-progress, complete (with stars). Colors by age band: green = Binary Basics (9+), blue = Logic Gates (11+), purple = Logic Laws (13+). Progress saved to localStorage.

### Challenge
Each challenge has: goal (target truth table or description), given inputs/gates, constraints (max gates, available types), and 3-star rating (solved / under limit / optimal). Verification checks all input combinations against target. Animated celebration on success.

### Sandbox
Free circuit building. Always accessible regardless of progress.

## Topic Tree (Prerequisites)

```
Binary Basics (age 9+)
  ├── What is ON/OFF (1/0)
  ├── Counting in binary (0-15)
  └── Binary ↔ decimal conversion
        │
Logic Gates (age 11+)
  ├── NOT gate
  ├── AND gate
  ├── OR gate
  ├── XOR gate
  └── Combining gates
        │
Logic Laws (age 13+)
  ├── Truth tables
  ├── De Morgan's Law 1: NOT(A AND B) = NOT A OR NOT B
  ├── De Morgan's Law 2: NOT(A OR B) = NOT A AND NOT B
  └── Build & prove equivalence
```

Each node: 3-5 challenges.

## Circuit Builder (Sandbox + Challenges)

### Layout: 4 snap columns

```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ INPUTS  │→ │ LAYER 1 │→ │ LAYER 2 │→ │ OUTPUTS │
│ ○ A [1] │  │ ┌─AND─┐ │  │ ┌─NOT─┐ │  │ 💡 = 0  │
│ ○ B [0] │  │ └─────┘ │  │ └─────┘ │  │         │
│ ○ C [1] │  │ ┌─OR──┐ │  │         │  │         │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
```

- **Inputs**: toggle switches, click to flip 0/1
- **Gate layers**: drag from palette. Wiring via checkbox picker (select inputs from previous column)
- **Outputs**: light bulbs, animate on/off
- **Real-time**: every toggle propagates instantly through all layers

### Gate Palette

| Gate | Inputs | Color | Kid label        |
|------|--------|-------|------------------|
| NOT  | 1      | Red   | "Odwróć"         |
| AND  | 2      | Blue  | "OBA potrzebne"  |
| OR   | 2      | Green | "KTÓRYKOLWIEK"    |
| XOR  | 2      | Orange| "RÓŻNE"          |

### Visual Style
Dark theme matching block-lab. Gates are rounded boxes with icons. Friendly labels for younger kids, proper gate symbols available for older kids.

## Example Challenges

### Binary Basics
- Toggle switches to show number 5 in binary (101)
- What decimal number is 1101? (multiple choice)
- Count from 0 to 7 using 3 switches

### Logic Gates
- Place one gate so the light turns ON (discover NOT)
- Light on only when BOTH switches ON (discover AND)
- Alarm when ANY door open (OR with 3 inputs)
- Light on when inputs are DIFFERENT (discover XOR or build from AND/OR/NOT)

### De Morgan's Laws
- Build NOT(A AND B). Then build equivalent using only OR and NOT. Verify match.
- Given truth table — build two different circuits that produce it
- Simplify 5-gate circuit to 3 gates (apply De Morgan's)

## Skill Tree UI

```
    🟢 ON/OFF (1/0)
     │
    🟢 Counting in binary
     │
    🟢 Binary ↔ decimal
     │
    ┌┴┐
   🔵 NOT    🔵 AND
    │         │
    └┬────────┘
     │
    🔵 OR
     │
    🔵 XOR
     │
    🔵 Combining gates
     │
    🟣 Truth tables
     │
    ┌┴┐
  🟣 DM1    🟣 DM2
    │         │
    └┬────────┘
     │
    🟣 Build & prove
```

## Technical Notes

- Single HTML file with inline CSS and JS (matches block-lab pattern)
- localStorage for progress persistence
- No dependencies, no build step
- Visual theme abstracted to support future metaphors (pipes, doors)
