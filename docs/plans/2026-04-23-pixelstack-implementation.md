# PixelStack Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build PixelStack MVP — a block-based 2D game building environment with skill tree, 16 challenges across 4 stages (Pixels, Tick, Autonomy, Motion), and sandbox. Single HTML file at `block-lab/pixel-stack/index.html`.

**Architecture:** Single HTML file, zero dependencies. Three views (tree / challenge / sandbox) toggled by CSS class. Block system: Scratch-style palette + drag & drop into per-sprite scripts. Runtime: canvas, `requestAnimationFrame` tick loop, interpreter walks block tree per sprite per tick. Validators run a headless sim to target tick and evaluate assertions.

**Tech Stack:** HTML / CSS / vanilla JS, Canvas 2D, Google Fonts (Outfit + DM Mono), `localStorage` for persistence. Conventions cloned from `bit-stack/index.html`.

**Design reference:** `docs/plans/2026-04-23-pixelstack-design.md`.

**Testing approach:** There is no test framework in block-lab. Each task ends with manual browser verification (open `block-lab/pixel-stack/index.html`, check specific behaviour). For the interpreter/validator, Task 14 adds an inline `__dev_tests()` harness runnable via `?dev=1` URL param that prints pass/fail to the console — used to regression-check runtime changes.

**Commit convention:** Follow repo history — short imperative subjects (`Add PixelStack skill tree renderer`, `Fix tick loop drift`). **Do NOT add Co-Authored-By trailer** (user preference). **Do NOT push** — always ask first (user preference).

---

## Phase 1: Foundation

### Task 1: Scaffold pixel-stack folder and empty index.html

**Files:**
- Create: `block-lab/pixel-stack/index.html`

**Step 1: Create the folder and starter file**

Create `block-lab/pixel-stack/index.html` with this skeleton (keep CSS vars identical to bit-stack for visual consistency):

```html
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PixelStack — Bloki do gier 2D</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #09090f; --bg2: #0f0f1a; --bg3: #16162a; --bg4: #1e1e36;
  --border: #2a2a4a; --border2: #3a3a6a;
  --text: #e8e8f0; --muted: #6060a0;
  --green: #00ff88; --blue: #4488ff; --purple: #bb66ff;
  --red: #ff4466; --orange: #ffaa00; --cyan: #00ddff; --yellow: #ffd93d;
  --pink: #ff55ff;
  --font: 'Outfit', sans-serif; --mono: 'DM Mono', monospace;
  --r: 12px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; background: var(--bg); color: var(--text); font-family: var(--font); }

.topbar { height: 48px; background: var(--bg2); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 16px; gap: 12px; }
.topbar .logo { font-weight: 900; font-size: 18px; letter-spacing: -.5px; }
.topbar .logo span { color: var(--pink); }
.topbar .logo em { font-style: normal; color: var(--cyan); }
.topbar .spacer { flex: 1; }
.topbar .badge { font-family: var(--mono); font-size: 10px; color: var(--muted); }

.main { height: calc(100% - 48px); display: flex; position: relative; }
.view { display: none; width: 100%; height: 100%; }
.view.active { display: flex; }
</style>
</head>
<body>
<div class="topbar">
  <div class="logo"><span>Pixel</span><em>Stack</em></div>
  <div class="spacer"></div>
  <div class="badge" id="stars-badge">⭐ 0 / 0</div>
</div>
<div class="main">
  <div id="tree-view" class="view active">TREE</div>
  <div id="challenge-view" class="view">CHALLENGE</div>
  <div id="sandbox-view" class="view">SANDBOX</div>
</div>
<script>
const STATE = { view: 'tree-view', stage: null, challenge: null };
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === id));
  STATE.view = id;
}
// expose for console debugging
window.ps = { STATE, showView };
</script>
</body>
</html>
```

**Step 2: Verify**

Open `block-lab/pixel-stack/index.html` in browser. Expected:
- Dark background, topbar with "PixelStack" logo (pink + cyan), `⭐ 0 / 0` badge on right
- Content area shows the word `TREE`
- In console, `ps.showView('challenge-view')` switches to `CHALLENGE`; `ps.showView('sandbox-view')` to `SANDBOX`

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Scaffold PixelStack: folder, skeleton, view router"
```

---

### Task 2: Add PixelStack card to block-lab index

**Files:**
- Modify: `block-lab/index.html` (after BitStack card, around line 241)

**Step 1: Insert new card**

After the closing `</a>` of the BitStack card, add:

```html
  <a class="card" href="pixel-stack/" data-accent="pink">
    <span class="version">v1 — new</span>
    <h2>PixelStack</h2>
    <p class="desc">Bloki do budowy gier 2D — piksele, game loop, fizyka, AI wrogów. Skill tree z wyzwaniami.</p>
    <div class="features">
      <span>x/y</span>
      <span>game loop</span>
      <span>fizyka</span>
      <span>shmup</span>
      <span>FSM AI</span>
    </div>
    <div class="status" style="color: var(--pink);">⬢ Nowy</div>
  </a>
```

Verify `data-accent="pink"` styles exist in `block-lab/index.html` — if not (check lines ~108–127 for `.card[data-accent="..."]` rules), add these alongside the existing ones:

```css
.card[data-accent="pink"]::before { background: var(--pink); }
.card[data-accent="pink"] .version { color: var(--pink); background: #ff55ff12; }
```

**Step 2: Verify**

Open `block-lab/index.html` in browser. PixelStack card appears in the grid after BitStack, with pink accent stripe on top and pink `v1 — new` badge. Clicking it navigates to `pixel-stack/` and shows the scaffold.

**Step 3: Commit**

```bash
git add block-lab/index.html
git commit -m "Link PixelStack card on block-lab index"
```

---

## Phase 2: Skill Tree & Challenge Browser

### Task 3: Stage data model and skill tree renderer

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Add stage data + tree renderer**

Inside `<script>`, before the existing `STATE`:

```js
const STAGES = [
  { id: 'pixels',   track: 'basics', title: 'Pixels',   icon: '🎨', desc: 'x/y, rozmiar, kolor',           requires: [] },
  { id: 'tick',     track: 'basics', title: 'Tick',     icon: '🕐', desc: 'game loop, co klatkę',          requires: ['pixels'] },
  { id: 'autonomy', track: 'actors', title: 'Autonomy', icon: '🧠', desc: 'każdy sprite własna pętla',     requires: ['tick'] },
  { id: 'motion',   track: 'actors', title: 'Motion',   icon: '➡️', desc: 'prędkość, grawitacja',          requires: ['autonomy'] },
];

const TRACKS = {
  basics: { label: 'Basics', color: 'green' },
  actors: { label: 'Actors', color: 'blue' },
};
```

Copy CSS for `.tree-track-label`, `.tree-connector`, `.tree-node`, node colors (`.t-green`, `.t-blue`), and `@keyframes pulse-border` from `bit-stack/index.html` (lines ~46–89). Keep them identical so visual language matches.

Replace the `TREE` placeholder inside `#tree-view` with `<div id="tree-root"></div>` and give `#tree-view` the scrolling layout:

```css
#tree-view { flex-direction: column; align-items: center; overflow-y: auto; padding: 40px 20px 80px; }
```

Add renderer:

```js
function progress() {
  try { return JSON.parse(localStorage.getItem('pixelstack-progress') || '{}'); }
  catch { return {}; }
}
function saveProgress(p) { localStorage.setItem('pixelstack-progress', JSON.stringify(p)); }
function stageProgress(id) { return progress()[id] || { stars: [] }; }
function isStageComplete(id) {
  const p = stageProgress(id);
  const earned = (p.stars || []).filter(s => s > 0).length;
  return earned >= 3;  // MVP: 4 challenges per stage, need ≥3 with a star
}
function isStageAvailable(id) {
  const stage = STAGES.find(s => s.id === id);
  return stage.requires.every(r => isStageComplete(r));
}

function renderTree() {
  const root = document.getElementById('tree-root');
  root.innerHTML = '';
  const byTrack = {};
  STAGES.forEach(s => { (byTrack[s.track] ||= []).push(s); });
  Object.entries(byTrack).forEach(([trackId, stages]) => {
    const meta = TRACKS[trackId];
    const label = document.createElement('div');
    label.className = `tree-track-label ${meta.color}`;
    label.textContent = meta.label;
    root.appendChild(label);
    stages.forEach((s, i) => {
      if (i > 0) {
        const c = document.createElement('div');
        c.className = 'tree-connector';
        root.appendChild(c);
      }
      const complete = isStageComplete(s.id);
      const available = isStageAvailable(s.id);
      const locked = !complete && !available;
      const node = document.createElement('div');
      node.className = `tree-node t-${meta.color} ${complete ? 'complete' : available ? 'available' : 'locked'}`;
      node.innerHTML = `
        <div class="node-icon">${s.icon}</div>
        <div class="node-title">${s.title}</div>
        <div class="node-desc">${s.desc}</div>
      `;
      if (!locked) node.addEventListener('click', () => openStage(s.id));
      root.appendChild(node);
    });
  });
}
function openStage(id) { console.log('open stage', id); /* Task 4 */ }

renderTree();
window.ps.renderTree = renderTree;
```

**Step 2: Verify**

Reload. Expected:
- Two track labels (`Basics` green, `Actors` blue)
- 4 nodes stacked vertically, connected by vertical lines
- First node `Pixels` is `available` (glowing), rest `locked` (dimmed)
- Clicking `Pixels` logs `open stage pixels` in console; clicking locked nodes does nothing
- In console: `localStorage.setItem('pixelstack-progress', JSON.stringify({pixels: {stars: [1,1,1,0]}})); ps.renderTree()` → `Pixels` becomes complete, `Tick` becomes available

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add stage data model and skill tree renderer"
```

---

### Task 4: Challenge data schema + challenge browser

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Add challenges data and browser view**

Add a 4th view `#browser-view` for the stage's challenge list (separate from `#challenge-view` which shows a single challenge):

```html
<div id="browser-view" class="view"></div>
```

Add data (placeholder titles only; real challenges land in Phase 6):

```js
const CHALLENGES = {
  pixels:   [/* filled in Task 18 */],
  tick:     [/* filled in Task 19 */],
  autonomy: [/* filled in Task 20 */],
  motion:   [/* filled in Task 21 */],
};
```

Add CSS for browser list (copy `.challenge-item` styles from bit-stack lines ~275–283):

```css
#browser-view { flex-direction: column; padding: 24px 32px; overflow-y: auto; }
.browser-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.browser-header .back { padding: 6px 12px; border: 1px solid var(--border); background: transparent; color: var(--muted); border-radius: 8px; cursor: pointer; font-family: var(--font); }
.browser-header .back:hover { color: var(--text); border-color: var(--border2); }
.browser-header h2 { font-weight: 800; font-size: 20px; }
.challenge-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--r); margin-bottom: 10px; cursor: pointer; transition: all .15s; }
.challenge-item:hover { border-color: var(--border2); transform: translateX(4px); }
.challenge-item .ci-num { font-family: var(--mono); font-size: 11px; color: var(--muted); width: 24px; }
.challenge-item .ci-title { flex: 1; font-weight: 600; font-size: 13px; }
.challenge-item .ci-stars { font-size: 14px; letter-spacing: 1px; }
```

Renderer:

```js
function openStage(id) {
  STATE.stage = id;
  const stage = STAGES.find(s => s.id === id);
  const list = CHALLENGES[id] || [];
  const p = stageProgress(id);
  const el = document.getElementById('browser-view');
  el.innerHTML = `
    <div class="browser-header">
      <button class="back" onclick="ps.backToTree()">← drzewo</button>
      <h2>${stage.icon} ${stage.title}</h2>
    </div>
    <div id="challenge-list"></div>
  `;
  const listEl = el.querySelector('#challenge-list');
  list.forEach((ch, i) => {
    const stars = (p.stars && p.stars[i]) || 0;
    const starsHtml = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const div = document.createElement('div');
    div.className = 'challenge-item';
    div.innerHTML = `
      <span class="ci-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="ci-title">${ch.title}</span>
      <span class="ci-stars">${starsHtml}</span>
    `;
    div.addEventListener('click', () => openChallenge(id, i));
    listEl.appendChild(div);
  });
  showView('browser-view');
}
function openChallenge(stageId, idx) { console.log('open', stageId, idx); /* Task 5 */ }
function backToTree() { showView('tree-view'); renderTree(); }
window.ps.backToTree = backToTree;
```

**Step 2: Verify**

Reload. Click `Pixels` node — browser view opens with header "🎨 Pixels" and empty list (since CHALLENGES.pixels is `[]`). In console: `CHALLENGES.pixels = [{title:'test1'},{title:'test2'}]; ps.openStage?.('pixels')` — two items show with 3 empty stars. Click `← drzewo` returns to tree.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add challenge browser view"
```

---

### Task 5: Challenge view shell (3-column layout)

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Build the 3-column challenge layout**

Replace `#challenge-view` content with:

```html
<div id="challenge-view" class="view">
  <div class="ch-topbar">
    <button class="back" onclick="ps.backToStage()">← wyzwania</button>
    <span class="ch-title" id="ch-title"></span>
    <span class="ch-stars" id="ch-stars">☆☆☆</span>
  </div>
  <div class="ch-body">
    <aside id="palette" class="ch-col palette"></aside>
    <section class="ch-col ch-main">
      <div id="script-area" class="script-area"></div>
      <canvas id="scene" width="512" height="320"></canvas>
      <div class="ch-controls">
        <button id="btn-run">▶ Uruchom</button>
        <button id="btn-reset">🔄 Reset</button>
        <button id="btn-check">✓ Sprawdź</button>
      </div>
    </section>
    <aside class="ch-col ch-side">
      <div id="ch-goal" class="ch-goal"></div>
      <div id="ch-tests" class="ch-tests"></div>
      <div id="ch-msg" class="ch-msg"></div>
    </aside>
  </div>
</div>
```

CSS:

```css
#challenge-view { flex-direction: column; }
.ch-topbar { display: flex; align-items: center; gap: 16px; padding: 12px 20px; background: var(--bg2); border-bottom: 1px solid var(--border); }
.ch-topbar .back { padding: 6px 12px; border: 1px solid var(--border); background: transparent; color: var(--muted); border-radius: 8px; cursor: pointer; font-family: var(--font); }
.ch-topbar .ch-title { font-weight: 700; flex: 1; }
.ch-topbar .ch-stars { font-size: 18px; letter-spacing: 2px; }
.ch-body { flex: 1; display: flex; overflow: hidden; }
.ch-col { padding: 16px; overflow-y: auto; }
.palette { width: 220px; border-right: 1px solid var(--border); background: var(--bg2); }
.ch-main { flex: 1; display: flex; flex-direction: column; gap: 12px; align-items: center; }
.script-area { width: 100%; max-width: 520px; min-height: 160px; background: var(--bg2); border: 1px dashed var(--border); border-radius: var(--r); padding: 12px; }
#scene { background: #000; image-rendering: pixelated; border: 1px solid var(--border); border-radius: 8px; }
.ch-controls { display: flex; gap: 10px; }
.ch-controls button { padding: 8px 16px; border: 1px solid var(--border2); background: var(--bg3); color: var(--text); border-radius: 8px; cursor: pointer; font-family: var(--font); font-weight: 600; }
.ch-controls button:hover { background: var(--bg4); }
.ch-side { width: 280px; border-left: 1px solid var(--border); background: var(--bg2); }
.ch-goal { font-size: 13px; color: var(--muted); line-height: 1.5; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.ch-tests div { display: flex; gap: 8px; align-items: center; padding: 6px 0; font-size: 12px; }
.ch-tests .t-pass { color: var(--green); }
.ch-tests .t-fail { color: var(--red); }
.ch-tests .t-pending { color: var(--muted); }
.ch-msg { margin-top: 12px; font-weight: 600; font-size: 13px; }
.ch-msg.success { color: var(--green); }
.ch-msg.fail { color: var(--red); }
```

Renderer:

```js
function openChallenge(stageId, idx) {
  STATE.stage = stageId;
  STATE.challenge = idx;
  const ch = (CHALLENGES[stageId] || [])[idx];
  if (!ch) { console.warn('no challenge'); return; }
  document.getElementById('ch-title').textContent = ch.title;
  const stars = (stageProgress(stageId).stars || [])[idx] || 0;
  document.getElementById('ch-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('ch-goal').innerHTML = ch.goal || '';
  document.getElementById('ch-tests').innerHTML = (ch.tests || []).map((t, i) =>
    `<div class="t-pending" data-i="${i}">○ ${t.label || `test ${i+1}`}</div>`
  ).join('');
  document.getElementById('ch-msg').textContent = '';
  document.getElementById('script-area').innerHTML = '<em style="color:var(--muted);font-size:12px">(paleta i bloki — Phase 3)</em>';
  document.getElementById('palette').innerHTML = '<em style="color:var(--muted);font-size:12px">paleta</em>';
  // clear canvas
  const cvs = document.getElementById('scene');
  cvs.getContext('2d').clearRect(0, 0, cvs.width, cvs.height);
  showView('challenge-view');
}
function backToStage() { openStage(STATE.stage); }
window.ps.backToStage = backToStage;
```

**Step 2: Verify**

Reload. In console: `CHALLENGES.pixels = [{title:'Postaw kulkę', goal:'Ustaw sprite w (100,80)', tests:[{label:'x=100, y=80'}]}]; ps.openStage ? ps.openStage('pixels') : null` — then click the item. Challenge view opens with title, pending test, empty script/palette placeholders, black canvas. `← wyzwania` returns to browser.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add challenge view shell with 3-column layout"
```

---

## Phase 3: Block System

### Task 6: Block definitions and palette rendering

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Define blocks**

Add after `STAGES`:

```js
// block types: 'statement' (does something) | 'expression' (returns value) | 'trigger' (script head) | 'c-block' (container with body)
const BLOCKS = {
  // DRAW
  'set-pos':    { cat: 'draw', type: 'statement', label: 'postaw w (x: §x, y: §y)',  slots: { x: { type: 'number', default: 100 }, y: { type: 'number', default: 80 } } },
  'set-size':   { cat: 'draw', type: 'statement', label: 'rozmiar (w: §w, h: §h)',   slots: { w: { type: 'number', default: 16 }, h: { type: 'number', default: 16 } } },
  'set-color':  { cat: 'draw', type: 'statement', label: 'kolor §c',                  slots: { c: { type: 'color',  default: '#00ff88' } } },
  // LOOP
  'on-start':   { cat: 'loop', type: 'trigger', label: '🟢 na start' },
  'on-tick':    { cat: 'loop', type: 'trigger', label: '🕐 co tick' },
  // STATE
  'set-state':  { cat: 'state', type: 'statement', label: 'stan.§field = §val',      slots: { field: { type: 'ident', default: 'x' }, val: { type: 'expression', default: 0 } } },
  'get-state':  { cat: 'state', type: 'expression', label: 'stan.§field',            slots: { field: { type: 'ident', default: 'x' } } },
  'set-global': { cat: 'state', type: 'statement',  label: 'globalne.§field = §val', slots: { field: { type: 'ident', default: 'score' }, val: { type: 'expression', default: 0 } } },
  // MATH
  'num':        { cat: 'math', type: 'expression', label: '§n',                      slots: { n: { type: 'number', default: 0 } } },
  'op':         { cat: 'math', type: 'expression', label: '(§a §op §b)',             slots: { a: { type: 'expression', default: 0 }, op: { type: 'choice', options: ['+','-','*','/','%'], default: '+' }, b: { type: 'expression', default: 0 } } },
  'my-x':       { cat: 'math', type: 'expression', label: 'moje.x' },
  'my-y':       { cat: 'math', type: 'expression', label: 'moje.y' },
  'random':     { cat: 'math', type: 'expression', label: 'losowe (§min..§max)',     slots: { min: { type: 'expression', default: 0 }, max: { type: 'expression', default: 100 } } },
  // MOTION
  'move-by':    { cat: 'motion', type: 'statement', label: 'przesuń o (§dx, §dy)',   slots: { dx: { type: 'expression', default: 1 }, dy: { type: 'expression', default: 0 } } },
  'set-vel':    { cat: 'motion', type: 'statement', label: 'ustaw prędkość (§vx, §vy)', slots: { vx: { type: 'expression', default: 0 }, vy: { type: 'expression', default: 0 } } },
  'set-gravity':{ cat: 'motion', type: 'statement', label: 'grawitacja (§gx, §gy)',  slots: { gx: { type: 'expression', default: 0 }, gy: { type: 'expression', default: 0.2 } } },
};

const CATEGORIES = {
  draw:   { label: 'Rysowanie', color: 'pink' },
  loop:   { label: 'Pętla',     color: 'green' },
  state:  { label: 'Stan',      color: 'blue' },
  math:   { label: 'Math',      color: 'orange' },
  motion: { label: 'Ruch',      color: 'cyan' },
};
```

Each stage unlocks categories. Add to `STAGES`:

```js
// extend each stage entry
{ ..., unlockedCats: ['draw'] },                           // pixels
{ ..., unlockedCats: ['draw','loop','state','math'] },     // tick
{ ..., unlockedCats: ['draw','loop','state','math'] },     // autonomy
{ ..., unlockedCats: ['draw','loop','state','math','motion'] }, // motion
```

**Step 2: Render palette in challenge view**

Palette CSS:

```css
.palette-cat { margin-bottom: 14px; }
.palette-cat-label { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
.palette-block { padding: 6px 10px; border-radius: 6px; font-size: 12px; font-family: var(--mono); color: var(--text); cursor: grab; margin-bottom: 4px; user-select: none; }
.palette-block.b-draw   { background: #ff55ff22; border: 1px solid #ff55ff55; }
.palette-block.b-loop   { background: #00ff8822; border: 1px solid #00ff8855; }
.palette-block.b-state  { background: #4488ff22; border: 1px solid #4488ff55; }
.palette-block.b-math   { background: #ffaa0022; border: 1px solid #ffaa0055; }
.palette-block.b-motion { background: #00ddff22; border: 1px solid #00ddff55; }
```

Update `openChallenge`:

```js
function renderPalette(cats) {
  const el = document.getElementById('palette');
  el.innerHTML = '';
  cats.forEach(catId => {
    const meta = CATEGORIES[catId];
    const group = document.createElement('div');
    group.className = 'palette-cat';
    group.innerHTML = `<div class="palette-cat-label">${meta.label}</div>`;
    Object.entries(BLOCKS).filter(([,b]) => b.cat === catId).forEach(([id, b]) => {
      const bl = document.createElement('div');
      bl.className = `palette-block b-${catId}`;
      bl.draggable = true;
      bl.dataset.blockId = id;
      bl.textContent = b.label.replace(/§\w+/g, '…');
      group.appendChild(bl);
    });
    el.appendChild(group);
  });
}
```

And call it in `openChallenge`:

```js
const stage = STAGES.find(s => s.id === stageId);
renderPalette(stage.unlockedCats);
```

**Step 3: Verify**

Reload, open a challenge in `Pixels` stage. Palette shows only `Rysowanie` category with 3 blocks (`postaw w (…)`, `rozmiar (…)`, `kolor …`). Set `STATE.stage='motion'` + reopen: all 5 categories appear.

**Step 4: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add block definitions and palette renderer"
```

---

### Task 7: Script data model + render script area

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Script JSON model**

A script is a tree of nodes. Each node: `{ id, slots: { ...literals or nested nodes } }`. Top-level script is an array (each entry a trigger node with a `body: [...statements]`). Example:

```js
// script for sprite: two scripts (on-start, on-tick)
const exampleScript = [
  { id: 'on-start', body: [
    { id: 'set-pos',   slots: { x: 100, y: 80 } },
    { id: 'set-color', slots: { c: '#00ff88' } },
  ] },
  { id: 'on-tick', body: [
    { id: 'move-by', slots: { dx: 1, dy: 0 } },
  ] },
];
```

Literal slot values are stored directly; expression slots may hold either literal values or nested block objects (`{ id: 'op', slots: { a: ..., op: '+', b: ... } }`).

Add helper:

```js
function emptyScript() { return []; }

function labelHtml(def, slots) {
  return def.label.replace(/§(\w+)/g, (_, key) => {
    const val = slots && key in slots ? slots[key] : def.slots?.[key]?.default ?? '';
    return `<span class="slot" data-slot="${key}">${slotDisplay(val)}</span>`;
  });
}
function slotDisplay(v) {
  if (v && typeof v === 'object' && v.id) return BLOCKS[v.id]?.label.replace(/§\w+/g, '…') || '?';
  return String(v);
}

function renderScript() {
  const el = document.getElementById('script-area');
  el.innerHTML = '';
  STATE.script = STATE.script || emptyScript();
  STATE.script.forEach((trig, ti) => {
    const def = BLOCKS[trig.id];
    const head = document.createElement('div');
    head.className = `palette-block b-${def.cat}`;
    head.innerHTML = labelHtml(def, trig.slots);
    el.appendChild(head);
    const body = document.createElement('div');
    body.className = 'script-body';
    body.style.cssText = 'margin-left:20px;border-left:2px solid var(--border);padding-left:10px;margin-bottom:8px;';
    (trig.body || []).forEach((n, i) => {
      const def2 = BLOCKS[n.id];
      const b = document.createElement('div');
      b.className = `palette-block b-${def2.cat}`;
      b.innerHTML = labelHtml(def2, n.slots);
      body.appendChild(b);
    });
    el.appendChild(body);
  });
}
```

Hook into `openChallenge`:

```js
STATE.script = JSON.parse(JSON.stringify(ch.initialScript || []));
renderScript();
```

**Step 2: Verify**

In console, while on a challenge view:
```js
ps.STATE.script = [{id:'on-start', body:[{id:'set-pos', slots:{x:100,y:80}},{id:'set-color', slots:{c:'#00ff88'}}]}];
ps.renderScript();
```

Script area shows trigger `🟢 na start` followed by indented `postaw w (100, 80)` and `kolor #00ff88`. Expose `renderScript` via `window.ps`.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add script data model and renderer"
```

---

### Task 8: Drag palette → script area (append blocks)

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Implement drag & drop from palette**

Use native HTML5 drag API. In `renderPalette`, `draggable=true` and `dataset.blockId` are already set. Add `dragstart`:

```js
document.getElementById('palette').addEventListener('dragstart', e => {
  const t = e.target.closest('.palette-block');
  if (!t) return;
  e.dataTransfer.setData('text/block-id', t.dataset.blockId);
  e.dataTransfer.effectAllowed = 'copy';
});
```

Script area becomes drop target. Drop behaviour:

- If dropped on a trigger body → append statement to that body
- If dropped on script area background → if block is a trigger, add a new trigger; if it's a statement, reject
- Expression blocks: **not** supported as drop target in this task (literals only for now; nested expressions land in Task 10)

In `renderScript`, mark each script body with `data-role="body"` and script area with `data-role="root"`:

```js
body.dataset.role = 'body';
body.dataset.triggerIdx = ti;
```

Drop handlers:

```js
const scriptArea = document.getElementById('script-area');
scriptArea.addEventListener('dragover', e => {
  if (e.dataTransfer.types.includes('text/block-id')) { e.preventDefault(); }
});
scriptArea.addEventListener('drop', e => {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/block-id');
  const def = BLOCKS[id]; if (!def) return;
  const targetBody = e.target.closest('[data-role="body"]');
  const defaults = makeDefaultSlots(def);
  if (def.type === 'trigger') {
    if (targetBody) { alert('Trigger nie może być w ciele innego triggera.'); return; }
    STATE.script.push({ id, slots: defaults, body: [] });
  } else if (def.type === 'statement') {
    if (!targetBody) { alert('Przeciągnij blok do ciała triggera (obszar z lewym paskiem).'); return; }
    const ti = Number(targetBody.dataset.triggerIdx);
    STATE.script[ti].body.push({ id, slots: defaults });
  } else {
    return; // expressions handled later
  }
  renderScript();
});

function makeDefaultSlots(def) {
  const out = {};
  Object.entries(def.slots || {}).forEach(([k, s]) => { out[k] = s.default; });
  return out;
}
```

**Step 2: Verify**

Reload, open a challenge from `Tick` stage (so `loop` and `draw` categories available). Actions:
1. Drag `🕐 co tick` from palette to script area background → trigger with empty body appears
2. Drag `postaw w (…)` to the trigger's body → appears indented under the trigger
3. Drag `postaw w (…)` to script area background → alert warns

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add drag & drop from palette to script"
```

---

### Task 9: Slot editing (click literal → edit)

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Click to edit literal slots**

Clicking a `.slot` element pops a small input next to it. For `type: 'number'` — `<input type="number">`; `'color'` — `<input type="color">`; `'ident'` — `<input type="text">`; `'choice'` — `<select>`.

```js
document.getElementById('script-area').addEventListener('click', e => {
  const slot = e.target.closest('.slot');
  if (!slot) return;
  const block = slot.closest('.palette-block');
  const node = locateNode(block);
  if (!node) return;
  const def = BLOCKS[node.id];
  const slotKey = slot.dataset.slot;
  const slotDef = def.slots?.[slotKey];
  if (!slotDef) return;
  // expressions with nested block — skip literal editor
  if (node.slots[slotKey] && typeof node.slots[slotKey] === 'object') return;
  openSlotEditor(slot, node, slotKey, slotDef);
});

function locateNode(blockEl) {
  // walk DOM to figure out which node in STATE.script is this
  // For MVP: store a ref on the block element when rendering.
  return blockEl.__node || null;
}
```

Store the `__node` reference during `renderScript` (set after creating the DOM element: `head.__node = trig; b.__node = n;`).

Editor implementation:

```js
function openSlotEditor(slotEl, node, key, def) {
  const cur = node.slots[key];
  let input;
  if (def.type === 'choice') {
    input = document.createElement('select');
    def.options.forEach(o => {
      const opt = document.createElement('option'); opt.value = o; opt.textContent = o;
      if (o === cur) opt.selected = true;
      input.appendChild(opt);
    });
  } else if (def.type === 'color') {
    input = document.createElement('input'); input.type = 'color'; input.value = cur;
  } else if (def.type === 'number' || def.type === 'expression') {
    input = document.createElement('input'); input.type = 'text'; input.value = cur;
  } else {
    input = document.createElement('input'); input.type = 'text'; input.value = cur;
  }
  input.style.cssText = 'font-family:var(--mono);font-size:12px;padding:2px 6px;width:80px;background:var(--bg);border:1px solid var(--border2);color:var(--text);border-radius:4px;';
  slotEl.innerHTML = '';
  slotEl.appendChild(input);
  input.focus();
  const commit = () => {
    let v = input.value;
    if (def.type === 'number') v = Number(v);
    if (def.type === 'expression') v = isNaN(Number(v)) ? v : Number(v);
    node.slots[key] = v;
    renderScript();
  };
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
}
```

**Step 2: Verify**

Open a challenge, drop `postaw w (100, 80)` into a trigger body. Click `100` → input appears, change to `200`, press Enter → script re-renders with `200`. Click color swatch on `kolor …`, change color, blur → value updates.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add click-to-edit slot literals"
```

---

### Task 10: Right-click to delete block

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Contextmenu handler**

```js
document.getElementById('script-area').addEventListener('contextmenu', e => {
  const block = e.target.closest('.palette-block');
  if (!block || !block.__node) return;
  e.preventDefault();
  if (!confirm('Usunąć ten blok?')) return;
  removeNode(block.__node);
  renderScript();
});

function removeNode(target) {
  for (let ti = 0; ti < STATE.script.length; ti++) {
    const trig = STATE.script[ti];
    if (trig === target) { STATE.script.splice(ti, 1); return; }
    const bi = (trig.body || []).indexOf(target);
    if (bi >= 0) { trig.body.splice(bi, 1); return; }
  }
}
```

**Step 2: Verify**

Right-click a block in the script area → confirm dialog → removed. Right-click a trigger → entire trigger + its body removed.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Right-click to remove blocks"
```

---

## Phase 4: Runtime

### Task 11: Sprite model + canvas renderer

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Sprite model and draw**

```js
function makeSprite(opts = {}) {
  return {
    name: opts.name || 'sprite',
    x: opts.x ?? 0, y: opts.y ?? 0,
    w: opts.w ?? 16, h: opts.h ?? 16,
    color: opts.color ?? '#ffffff',
    vx: 0, vy: 0, gx: 0, gy: 0,
    state: {},
    script: opts.script || [],
    alive: true,
    // triggers fired flags (so on-start runs once)
    _started: false,
  };
}

function drawScene(sprites) {
  const cvs = document.getElementById('scene');
  const ctx = cvs.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  sprites.forEach(s => {
    if (!s.alive) return;
    ctx.fillStyle = s.color;
    ctx.fillRect(Math.round(s.x), Math.round(s.y), s.w, s.h);
  });
}

window.ps.drawScene = drawScene;
window.ps.makeSprite = makeSprite;
```

**Step 2: Verify**

Open a challenge. In console:
```js
const s = ps.makeSprite({ x: 100, y: 80, color: '#00ff88' });
ps.drawScene([s]);
```
A green 16×16 square appears at (100, 80) on the black canvas, crisp pixel edges.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add sprite model and canvas renderer"
```

---

### Task 12: Expression evaluator + statement executor

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Interpreter core**

```js
function evalExpr(node, ctx) {
  if (node == null) return 0;
  if (typeof node === 'number' || typeof node === 'string') {
    // If it's a string that parses as a number, return number.
    if (typeof node === 'string' && !isNaN(Number(node))) return Number(node);
    return node;
  }
  const def = BLOCKS[node.id];
  if (!def) return 0;
  switch (node.id) {
    case 'num':    return Number(node.slots.n);
    case 'my-x':   return ctx.sprite.x;
    case 'my-y':   return ctx.sprite.y;
    case 'random': {
      const min = evalExpr(node.slots.min, ctx);
      const max = evalExpr(node.slots.max, ctx);
      return min + Math.random() * (max - min);
    }
    case 'op': {
      const a = Number(evalExpr(node.slots.a, ctx));
      const b = Number(evalExpr(node.slots.b, ctx));
      switch (node.slots.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b === 0 ? 0 : a / b;
        case '%': return b === 0 ? 0 : a % b;
      }
      return 0;
    }
    case 'get-state': return ctx.sprite.state[node.slots.field] ?? 0;
  }
  return 0;
}

function runStatement(node, ctx) {
  const s = ctx.sprite;
  switch (node.id) {
    case 'set-pos':   s.x = evalExpr(node.slots.x, ctx); s.y = evalExpr(node.slots.y, ctx); break;
    case 'set-size':  s.w = evalExpr(node.slots.w, ctx); s.h = evalExpr(node.slots.h, ctx); break;
    case 'set-color': s.color = node.slots.c; break;
    case 'set-state': s.state[node.slots.field] = evalExpr(node.slots.val, ctx); break;
    case 'set-global': ctx.globals[node.slots.field] = evalExpr(node.slots.val, ctx); break;
    case 'move-by':   s.x += evalExpr(node.slots.dx, ctx); s.y += evalExpr(node.slots.dy, ctx); break;
    case 'set-vel':   s.vx = evalExpr(node.slots.vx, ctx); s.vy = evalExpr(node.slots.vy, ctx); break;
    case 'set-gravity': s.gx = evalExpr(node.slots.gx, ctx); s.gy = evalExpr(node.slots.gy, ctx); break;
  }
}

function runBody(body, ctx) {
  for (const n of body || []) runStatement(n, ctx);
}

function runTrigger(trigId, sprite, globals) {
  const ctx = { sprite, globals };
  for (const trig of sprite.script) {
    if (trig.id === trigId) runBody(trig.body, ctx);
  }
}
```

**Step 2: Verify**

```js
const s = ps.makeSprite({ color: '#00ff88', script: [
  { id: 'on-start', body: [
    { id: 'set-pos', slots: { x: 100, y: 80 } },
    { id: 'set-state', slots: { field: 'n', val: 5 } },
  ]},
]});
// expose runTrigger
window.ps.runTrigger = runTrigger;
ps.runTrigger('on-start', s, {});
console.log(s.x, s.y, s.state.n); // 100 80 5
ps.drawScene([s]);
```

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add block interpreter (expressions + statements)"
```

---

### Task 13: Tick loop + motion integration

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Loop**

```js
const WORLD = { sprites: [], globals: {}, running: false, tick: 0, raf: 0 };

function worldReset(sprites) {
  WORLD.sprites = sprites.map(s => ({ ...s, _started: false, state: {}, vx: 0, vy: 0, gx: 0, gy: 0 }));
  WORLD.globals = {};
  WORLD.tick = 0;
}
function worldStart() {
  if (WORLD.running) return;
  WORLD.running = true;
  const loop = () => {
    if (!WORLD.running) return;
    stepOnce();
    drawScene(WORLD.sprites);
    WORLD.raf = requestAnimationFrame(loop);
  };
  WORLD.raf = requestAnimationFrame(loop);
}
function worldStop() { WORLD.running = false; cancelAnimationFrame(WORLD.raf); }

function stepOnce() {
  for (const s of WORLD.sprites) {
    if (!s.alive) continue;
    if (!s._started) { runTrigger('on-start', s, WORLD.globals); s._started = true; }
    runTrigger('on-tick', s, WORLD.globals);
    // integrate motion
    s.vx += s.gx; s.vy += s.gy;
    s.x += s.vx; s.y += s.vy;
  }
  WORLD.tick++;
}

window.ps.world = WORLD;
window.ps.worldReset = worldReset;
window.ps.worldStart = worldStart;
window.ps.worldStop = worldStop;
window.ps.stepOnce = stepOnce;
```

Wire the buttons in challenge view:

```js
function compileActiveSprite() {
  // MVP: single sprite per challenge, initialSprites from challenge; its script is STATE.script
  const ch = CHALLENGES[STATE.stage][STATE.challenge];
  const init = (ch.initialSprites && ch.initialSprites[0]) || { name: 's', color: '#00ff88', w: 16, h: 16 };
  return makeSprite({ ...init, script: STATE.script });
}
document.getElementById('btn-run').onclick = () => {
  worldStop();
  worldReset([compileActiveSprite()]);
  worldStart();
};
document.getElementById('btn-reset').onclick = () => {
  worldStop();
  worldReset([compileActiveSprite()]);
  drawScene(WORLD.sprites);
};
```

**Step 2: Verify**

Open a `Tick` stage challenge. Build this script in the editor:
- `🟢 na start` → `postaw w (50, 80)`, `kolor #00ff88`
- `🕐 co tick` → `przesuń o (1, 0)` (paste via `ps.STATE.script` if motion blocks are not yet unlocked for this stage)

Click `▶ Uruchom` — green square moves right across canvas. Click `🔄 Reset` — returns to (50, 80), stopped.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add tick loop and motion integration"
```

---

### Task 14: Dev test harness

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Self-test runner activated by `?dev=1`**

Add at the end of the script:

```js
function __dev_tests() {
  const fail = [], pass = [];
  const t = (name, cond) => (cond ? pass : fail).push(name);

  // evalExpr
  const s1 = makeSprite({ x: 7, y: 3 });
  t('num literal', evalExpr({ id: 'num', slots: { n: 5 } }, { sprite: s1 }) === 5);
  t('op add', evalExpr({ id: 'op', slots: { a: 2, op: '+', b: 3 } }, { sprite: s1 }) === 5);
  t('op div zero', evalExpr({ id: 'op', slots: { a: 10, op: '/', b: 0 } }, { sprite: s1 }) === 0);
  t('my-x', evalExpr({ id: 'my-x' }, { sprite: s1 }) === 7);

  // statements
  const s2 = makeSprite();
  runStatement({ id: 'set-pos', slots: { x: 100, y: 80 } }, { sprite: s2 });
  t('set-pos', s2.x === 100 && s2.y === 80);
  runStatement({ id: 'set-state', slots: { field: 'hp', val: 3 } }, { sprite: s2 });
  t('set-state', s2.state.hp === 3);

  // tick loop
  worldReset([ makeSprite({ x: 0, y: 0, script: [
    { id: 'on-start', body: [ { id: 'set-pos', slots: { x: 0, y: 0 } } ] },
    { id: 'on-tick',  body: [ { id: 'move-by', slots: { dx: 1, dy: 0 } } ] },
  ]}) ]);
  for (let i = 0; i < 10; i++) stepOnce();
  t('tick loop moves sprite', WORLD.sprites[0].x === 10);

  console.log('%cPixelStack dev tests', 'font-weight:bold', `${pass.length} pass, ${fail.length} fail`);
  pass.forEach(n => console.log('  ✅', n));
  fail.forEach(n => console.warn('  ❌', n));
  return { pass: pass.length, fail: fail.length };
}
if (new URLSearchParams(location.search).get('dev') === '1') {
  window.addEventListener('load', () => { setTimeout(__dev_tests, 100); });
}
window.ps.__dev_tests = __dev_tests;
```

**Step 2: Verify**

Open `block-lab/pixel-stack/index.html?dev=1`. Console shows `PixelStack dev tests 7 pass, 0 fail` with ✅ per test.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add dev test harness (?dev=1)"
```

---

## Phase 5: Validation

### Task 15: Fill-in-blank + tests validator

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Validator**

Each challenge has:
- `type: 'fill-in-blank'` — render `initialScript` as read-only blocks **except** specific slots marked with `hole: true`. Student fills holes. Validator runs until `maxTicks` and evaluates tests.
- `type: 'tests'` — student builds script freely (initialScript optional). Validator runs tests.

Tests shape:
```js
tests: [
  { label: 'po 60 tickach x=100', t: 60, assert: 's.x === 100' }
]
```

The assert is evaluated in a sandboxed function with `s` = first sprite, `sprites`, `globals`, `tick` in scope.

```js
function runHeadless(maxTicks, sprites) {
  worldReset(sprites);
  for (let i = 0; i < maxTicks; i++) stepOnce();
  return { s: WORLD.sprites[0], sprites: WORLD.sprites, globals: WORLD.globals, tick: WORLD.tick };
}

function evalAssert(exprStr, env) {
  try {
    const fn = new Function('s', 'sprites', 'globals', 'tick', `return (${exprStr});`);
    return !!fn(env.s, env.sprites, env.globals, env.tick);
  } catch (e) {
    console.warn('assert error', e);
    return false;
  }
}

function runTests(ch) {
  const results = [];
  for (const test of ch.tests || []) {
    const maxT = test.t || 0;
    const env = runHeadless(maxT, [compileActiveSprite()]);
    results.push({ label: test.label || ('t=' + maxT), pass: evalAssert(test.assert, env) });
  }
  return results;
}

function renderTestResults(results) {
  const el = document.getElementById('ch-tests');
  el.innerHTML = results.map(r =>
    `<div class="${r.pass ? 't-pass' : 't-fail'}">${r.pass ? '✅' : '❌'} ${r.label}</div>`
  ).join('');
  const allPass = results.every(r => r.pass);
  const msg = document.getElementById('ch-msg');
  msg.className = 'ch-msg ' + (allPass ? 'success' : 'fail');
  msg.textContent = allPass ? '🎉 Brawo! Wszystkie testy przechodzą.' : 'Niektóre testy nie przechodzą.';
  return allPass;
}

document.getElementById('btn-check').onclick = () => {
  const ch = CHALLENGES[STATE.stage][STATE.challenge];
  const results = runTests(ch);
  const pass = renderTestResults(results);
  if (pass) awardStar(ch, 1);
};
```

**Step 2: Placeholder `awardStar`**

```js
function awardStar(ch, n) {
  const all = progress();
  const entry = all[STATE.stage] = all[STATE.stage] || { stars: [] };
  entry.stars[STATE.challenge] = Math.max(entry.stars[STATE.challenge] || 0, n);
  saveProgress(all);
  const stars = entry.stars[STATE.challenge];
  document.getElementById('ch-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
}
```

**Step 3: Verify**

In console, add a quick challenge:
```js
CHALLENGES.tick = [{
  title: 'Move right 10', type: 'tests',
  initialSprites: [{ color:'#00ff88' }],
  tests: [{ t: 10, label: 'x=10', assert: 's.x === 10' }]
}];
ps.STATE.stage = 'tick'; ps.STATE.challenge = 0;
```
Open via browser flow. Build `🕐 co tick → przesuń o (1,0)`, click `✓ Sprawdź` → green ✅, `🎉 Brawo…`, star awarded.

**Step 4: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add test validator and star awarding"
```

---

### Task 16: Fill-in-blank slot holes

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Hole rendering**

In `initialScript`, a slot value may be `null` meaning a hole. Render holes as empty droppable spots:

```js
// in slotDisplay
function slotDisplay(v) {
  if (v === null || v === undefined) return '<span class="hole">?</span>';
  if (v && typeof v === 'object' && v.id) return BLOCKS[v.id]?.label.replace(/§\w+/g, '…') || '?';
  return String(v);
}
```

CSS:
```css
.hole { display: inline-block; min-width: 28px; padding: 0 6px; background: var(--bg4); border: 1px dashed var(--border2); border-radius: 4px; color: var(--muted); }
```

Click a hole to open a small editor (number input by default) that fills the literal. Reuse `openSlotEditor` but guard against `null` values already.

**Step 2: Locking non-hole slots**

For `fill-in-blank` challenges, make every non-hole slot **non-editable** (no click handler). Add a flag on the slot DOM: `slot.dataset.locked = '1'` unless it's a hole, and in the click handler skip locked slots.

Adjust `renderScript` to accept a mode:
```js
function renderScript() {
  const ch = STATE.stage && STATE.challenge != null ? CHALLENGES[STATE.stage][STATE.challenge] : null;
  const fillIn = ch && ch.type === 'fill-in-blank';
  // ...
  // when rendering slots: if fillIn && value !== null, add data-locked
}
```

And gate drag-drop in fill-in-blank mode: student cannot add/remove blocks, only fill holes. Easiest: in the drop handler, if `fillIn` mode, reject drops; in contextmenu remove, reject as well.

**Step 3: Verify**

```js
CHALLENGES.pixels = [{
  title: 'Postaw kulkę w (100,80)', type: 'fill-in-blank',
  initialSprites: [{ color: '#00ff88' }],
  initialScript: [{ id: 'on-start', body: [
    { id: 'set-pos', slots: { x: null, y: null } }
  ]}],
  tests: [{ t: 0, label: 'x=100, y=80', assert: 's.x === 100 && s.y === 80' }]
}];
```
Open it. Trigger + `postaw w (?, ?)` visible but blocks can't be dragged or removed. Click `?` on x → input, type 100 → replaced. Do same for y. Click `✓ Sprawdź` → pass.

**Step 4: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add fill-in-blank challenge mode with slot holes"
```

---

### Task 17: Tree updates on progress + stars badge

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Render stars in tree + topbar total**

Update `renderTree` to show earned stars per node (sum of challenge stars):

```js
const p = stageProgress(s.id);
const chList = CHALLENGES[s.id] || [];
const earned = (p.stars || []).reduce((a, b) => a + (b || 0), 0);
const total = chList.length * 3;
node.innerHTML += `<div class="node-stars" style="color:var(--muted);font-size:11px">⭐ ${earned}/${total}</div>`;
```

Update topbar badge after each star:

```js
function updateStarsBadge() {
  let earned = 0, total = 0;
  for (const s of STAGES) {
    const chs = CHALLENGES[s.id] || [];
    total += chs.length * 3;
    const p = stageProgress(s.id);
    earned += (p.stars || []).reduce((a, b) => a + (b || 0), 0);
  }
  document.getElementById('stars-badge').textContent = `⭐ ${earned} / ${total}`;
}
// call on init and after awardStar
```

Also, when validation passes, re-render challenge browser on back so unlocked stages update.

**Step 2: Verify**

Complete fill-in-blank challenge from Task 16. Click `← wyzwania`, then `← drzewo`. `Pixels` node shows `⭐ 1/12` (or similar). Topbar shows total. Complete 3 of 4 challenges in Pixels → `Tick` node becomes available.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Update tree and badge with earned stars"
```

---

## Phase 6: Content (16 Challenges)

### Task 18: Pixels stage challenges (4× fill-in-blank)

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Fill in `CHALLENGES.pixels`**

```js
CHALLENGES.pixels = [
  {
    title: 'Postaw kulkę w (100, 80)',
    type: 'fill-in-blank',
    goal: 'Ustaw sprite w konkretnym punkcie.',
    initialSprites: [{ color: '#00ff88' }],
    initialScript: [{ id: 'on-start', body: [
      { id: 'set-pos', slots: { x: null, y: null } }
    ]}],
    tests: [{ t: 0, label: 'x=100, y=80', assert: 's.x === 100 && s.y === 80' }]
  },
  {
    title: 'Zmień kolor i rozmiar',
    type: 'fill-in-blank',
    goal: 'Niech kulka będzie różowa i mieć 32×32.',
    initialSprites: [{ color: '#00ff88' }],
    initialScript: [{ id: 'on-start', body: [
      { id: 'set-pos',   slots: { x: 100, y: 80 } },
      { id: 'set-size',  slots: { w: null, h: null } },
      { id: 'set-color', slots: { c: null } }
    ]}],
    tests: [
      { t: 0, label: 'rozmiar 32×32', assert: 's.w === 32 && s.h === 32' },
      { t: 0, label: 'kolor różowy',  assert: "s.color.toLowerCase() === '#ff55ff'" }
    ]
  },
  {
    title: 'Środek sceny',
    type: 'fill-in-blank',
    goal: 'Ustaw sprite w środku canvasu (scena 512×320). Podpowiedź: użyj liczb.',
    initialSprites: [{ color: '#00ddff', w: 20, h: 20 }],
    initialScript: [{ id: 'on-start', body: [
      { id: 'set-pos', slots: { x: null, y: null } }
    ]}],
    tests: [
      { t: 0, label: 'x≈256', assert: 'Math.abs(s.x - 246) < 2' }, // 256 - w/2
      { t: 0, label: 'y≈160', assert: 'Math.abs(s.y - 150) < 2' }
    ]
  },
  {
    title: 'Prawy dolny róg',
    type: 'fill-in-blank',
    goal: 'Postaw 16×16 kwadrat tak, żeby dotykał prawego dolnego rogu sceny.',
    initialSprites: [{ color: '#ffaa00', w: 16, h: 16 }],
    initialScript: [{ id: 'on-start', body: [
      { id: 'set-pos', slots: { x: null, y: null } }
    ]}],
    tests: [
      { t: 0, label: 'prawa krawędź = 512', assert: 's.x + s.w === 512' },
      { t: 0, label: 'dolna krawędź = 320', assert: 's.y + s.h === 320' }
    ]
  }
];
```

**Step 2: Verify**

Reload tree (`?dev=1` optional). Open each Pixels challenge; solve it; see ⭐ award. After 3 solved, `Tick` unlocks.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add Pixels stage challenges (4)"
```

---

### Task 19: Tick stage challenges (4× fill-in-blank)

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Fill in `CHALLENGES.tick`**

Teach the game loop: students must place `on-tick` vs `on-start`, and vary a loop counter.

```js
CHALLENGES.tick = [
  {
    title: 'Porusz się w prawo',
    type: 'fill-in-blank',
    goal: 'Kulka ma sunąć w prawo o 1 piksel co klatkę.',
    initialSprites: [{ color: '#00ff88' }],
    initialScript: [
      { id: 'on-start', body: [{ id: 'set-pos', slots: { x: 0, y: 80 } }] },
      { id: 'on-tick',  body: [{ id: 'move-by', slots: { dx: null, dy: null } }] }
    ],
    tests: [
      { t: 30, label: 'po 30 tickach x=30', assert: 'Math.abs(s.x - 30) < 1' },
      { t: 30, label: 'y bez zmian', assert: 's.y === 80' }
    ]
  },
  {
    title: 'Licznik w stanie',
    type: 'fill-in-blank',
    goal: 'Co klatkę zwiększ `stan.n` o 1. Po 100 klatkach ma być 100.',
    initialSprites: [{ color: '#bb66ff' }],
    initialScript: [
      { id: 'on-start', body: [{ id: 'set-state', slots: { field: 'n', val: 0 } }] },
      { id: 'on-tick',  body: [{ id: 'set-state', slots: { field: 'n', val: null } }] }
    ],
    // student fills the val slot with an expression like stan.n + 1
    tests: [
      { t: 100, label: 'stan.n === 100', assert: 's.state.n === 100' }
    ]
  },
  {
    title: 'Start raz, tick stale',
    type: 'fill-in-blank',
    goal: 'Ustaw pozycję raz na starcie, a kolor losowo co klatkę.',
    initialSprites: [{ color: '#ffffff' }],
    initialScript: [
      { id: 'on-start', body: [{ id: 'set-pos', slots: { x: null, y: null } }] },
      { id: 'on-tick',  body: [{ id: 'set-color', slots: { c: null } }] }
    ],
    tests: [
      { t: 1, label: 'pozycja po tick 1', assert: 's.x === 200 && s.y === 160' },
      { t: 5, label: 'pozycja nadal taka sama', assert: 's.x === 200 && s.y === 160' }
    ]
  },
  {
    title: 'Pozycja rośnie od czasu',
    type: 'fill-in-blank',
    goal: 'Co klatkę zwiększ zmienną `stan.t` i ustaw x = stan.t × 2.',
    initialSprites: [{ color: '#00ddff' }],
    initialScript: [
      { id: 'on-start', body: [{ id: 'set-state', slots: { field: 't', val: 0 } }] },
      { id: 'on-tick',  body: [
        { id: 'set-state', slots: { field: 't', val: null } },
        { id: 'set-pos',   slots: { x: null, y: 100 } }
      ]}
    ],
    tests: [
      { t: 50, label: 'stan.t=50', assert: 's.state.t === 50' },
      { t: 50, label: 'x=100',     assert: 's.x === 100' }
    ]
  }
];
```

**Note on nested expressions:** For slots like `stan.n + 1` the student needs to build `{id:'op', slots:{a:{id:'get-state',slots:{field:'n'}}, op:'+', b:1}}`. Task 20 covers expression nesting; for Tick challenges `#2` and `#4`, **expression nesting is required**. If nesting isn't done yet, these challenges may have to wait until Task 20. Recommendation: **do Task 20 before Task 19**, or accept that students can type the expression as a raw string (the evaluator treats numeric strings numerically; for arithmetic expressions, a string like `"s.state.n + 1"` would not parse — we'd need actual nesting).

Reorder: do **Task 20 (nested expressions)** first, then Task 19.

**Step 2: Verify**

Walk through each Tick challenge manually. `Autonomy` stage should unlock after 3/4.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add Tick stage challenges (4)"
```

---

### Task 20: Nested expressions in slots

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Let expression blocks drop into expression slots**

Extend the drop handler: a slot element may be `draggable-target` if its slot definition `type === 'expression'` and the dragged block is an `expression`-type block. On drop, replace the slot value with the block node object.

```js
document.getElementById('script-area').addEventListener('dragover', e => {
  if (!e.dataTransfer.types.includes('text/block-id')) return;
  e.preventDefault();
});
document.getElementById('script-area').addEventListener('drop', e => {
  // existing body/root logic stays; add expression slot branch:
  const slot = e.target.closest('.slot');
  if (slot && !slot.dataset.locked) {
    const id = e.dataTransfer.getData('text/block-id');
    const def = BLOCKS[id];
    if (!def || def.type !== 'expression') return; // fall through to existing handler
    const block = slot.closest('.palette-block');
    const node = block?.__node;
    if (!node) return;
    const slotKey = slot.dataset.slot;
    const slotDef = BLOCKS[node.id].slots?.[slotKey];
    if (slotDef?.type !== 'expression') return;
    node.slots[slotKey] = { id, slots: makeDefaultSlots(def) };
    e.preventDefault(); e.stopPropagation();
    renderScript();
    return;
  }
  // existing trigger/statement code unchanged...
});
```

Nested blocks render inside the slot (replacing the literal). Recursively `labelHtml` needs to walk expression blocks:

```js
function slotDisplay(v) {
  if (v === null || v === undefined) return '<span class="hole">?</span>';
  if (v && typeof v === 'object' && v.id) {
    const def = BLOCKS[v.id]; if (!def) return '?';
    return `<span class="nested b-${def.cat}">${labelHtml(def, v.slots)}</span>`;
  }
  return String(v);
}
```

CSS for nested:
```css
.nested { display: inline-block; padding: 2px 6px; border-radius: 4px; font-family: var(--mono); font-size: 11px; }
.nested.b-state  { background: #4488ff33; }
.nested.b-math   { background: #ffaa0033; }
```

Right-click on a nested expression to remove (revert slot to default literal). Extend the existing contextmenu handler to check for `.slot` and reset its value.

**Step 2: Verify**

In a Tick challenge, drag `moje.x` into a slot — renders inline. Drag `(… + …)` — nested, its internal slots are holes. Drag `losowe (…)`-style expression into them. Run — behaves as composed expression.

Run `?dev=1` — all tests still pass.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Allow expression blocks nested in expression slots"
```

---

### Task 21: Autonomy stage challenges (4× tests)

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Extend runtime to support multiple sprites**

Up to now `compileActiveSprite` returns one sprite. Change it:

```js
function compileSpritesForChallenge() {
  const ch = CHALLENGES[STATE.stage][STATE.challenge];
  const inits = ch.initialSprites || [{ name: 's0', color: '#00ff88' }];
  // if there's only one and it's the "author" sprite, its script is STATE.script
  // multi-sprite challenges: each init can carry its own script, except one marked `playerEdited:true` which uses STATE.script
  return inits.map((init, i) => {
    const script = init.playerEdited ? STATE.script : (init.script || []);
    return makeSprite({ ...init, script });
  });
}
// swap all references from compileActiveSprite → compileSpritesForChallenge
```

For the asserts, expose `sprites` array (already done in `runHeadless`). Let asserts refer to `sprites[0]`, `sprites[1]`, etc.

**Step 2: Autonomy challenges**

These test that students understand each sprite has its own independent on-tick. Open-mode (student builds script from scratch with `type: 'tests'`).

```js
CHALLENGES.autonomy = [
  {
    title: 'Dwa kwadraty, każdy w swoją stronę',
    type: 'tests',
    goal: 'Na scenie są 2 sprite\'y: "L" i "R". Ustaw ich ruch tak, żeby L szło w lewo, R w prawo. Edytujesz skrypt sprite\'a "R".',
    initialSprites: [
      { name: 'L', color: '#4488ff', x: 256, y: 100, script: [
        { id: 'on-start', body: [] },
        { id: 'on-tick',  body: [{ id: 'move-by', slots: { dx: -1, dy: 0 } }] }
      ]},
      { name: 'R', color: '#ff55ff', x: 256, y: 200, playerEdited: true }
    ],
    tests: [
      { t: 30, label: 'R w prawo (x > 280)', assert: 'sprites[1].x > 280' },
      { t: 30, label: 'L nadal w lewo',     assert: 'sprites[0].x < 230' }
    ]
  },
  {
    title: 'Skocz do lewego górnego rogu',
    type: 'tests',
    goal: 'Edytowany sprite ma mieć `stan.done` = 1 po wejściu w róg (x<5 i y<5). Używaj on-tick.',
    initialSprites: [{ name: 'me', color: '#00ff88', x: 400, y: 250, playerEdited: true }],
    tests: [
      { t: 600, label: 'stan.done=1', assert: 'sprites[0].state.done === 1' }
    ]
  },
  {
    title: 'Dwa sprite\'y, różny czas startu',
    type: 'tests',
    goal: 'Sprite "A" ma zmieniać kolor od razu; edytuj "B" tak, by zmienił kolor dopiero po 60 klatkach. Podpowiedź: stan.t.',
    initialSprites: [
      { name: 'A', color: '#ff55ff', script: [
        { id: 'on-tick', body: [{ id: 'set-color', slots: { c: '#00ff88' } }] }
      ]},
      { name: 'B', color: '#4488ff', playerEdited: true }
    ],
    tests: [
      { t: 30, label: 'B nadal niebieski w t=30', assert: "sprites[1].color.toLowerCase() === '#4488ff'" },
      { t: 90, label: 'B zmienił się w t=90',     assert: "sprites[1].color.toLowerCase() !== '#4488ff'" }
    ]
  },
  {
    title: 'Niezależny licznik',
    type: 'tests',
    goal: 'Na scenie są 3 sprite\'y, każdy z własnym stan.n. Edytowany sprite (trzeci) ma osiągnąć 50 po 50 klatkach. Pozostałe go nie zakłócają.',
    initialSprites: [
      { name: 'a', color: '#ff5555', x: 50,  y: 50, script: [{ id: 'on-tick', body: [{ id: 'set-state', slots: { field: 'n', val: { id:'op', slots:{ a:{id:'get-state',slots:{field:'n'}}, op:'+', b: 2 }}}}]}]},
      { name: 'b', color: '#5555ff', x: 150, y: 50, script: [{ id: 'on-tick', body: [{ id: 'set-state', slots: { field: 'n', val: { id:'op', slots:{ a:{id:'get-state',slots:{field:'n'}}, op:'+', b: 3 }}}}]}]},
      { name: 'c', color: '#00ff88', x: 250, y: 50, playerEdited: true }
    ],
    tests: [
      { t: 50, label: 'sprites[2].state.n === 50', assert: 'sprites[2].state.n === 50' },
      { t: 50, label: 'sprites[0] niezakłócony',   assert: 'sprites[0].state.n === 100' }
    ]
  }
];
```

**Step 3: Verify**

Open each Autonomy challenge. Verify multi-sprite rendering works — 2 or 3 squares visible on canvas. Solve them. `Motion` stage unlocks after 3/4.

**Step 4: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add Autonomy stage with multi-sprite runtime"
```

---

### Task 22: Motion stage challenges (4× tests)

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Fill in `CHALLENGES.motion`**

```js
CHALLENGES.motion = [
  {
    title: 'Stała prędkość',
    type: 'tests',
    goal: 'Ustaw prędkość (2, 0) raz na starcie. Silnik ma ruszać sprite\'em automatycznie.',
    initialSprites: [{ name: 's', color: '#00ff88', x: 0, y: 100, playerEdited: true }],
    tests: [
      { t: 60, label: 'x≈120', assert: 'Math.abs(s.x - 120) < 2' },
      { t: 60, label: 'y=100', assert: 's.y === 100' }
    ]
  },
  {
    title: 'Grawitacja w dół',
    type: 'tests',
    goal: 'Ustaw grawitację (0, 0.2). Sprite ma spadać coraz szybciej.',
    initialSprites: [{ name: 's', color: '#ffaa00', x: 256, y: 0, playerEdited: true }],
    tests: [
      { t: 30,  label: 'spada',             assert: 's.y > 30' },
      { t: 60,  label: 'dalej spada',       assert: 's.y > 150' },
      { t: 60,  label: 'przyspiesza (vy>0)', assert: 's.vy > 5' }
    ]
  },
  {
    title: 'Pocisk w łuku',
    type: 'tests',
    goal: 'Wystrzel sprite\'a z prędkością (3, -4) i grawitacją (0, 0.2). Ma lądować w x > 180.',
    initialSprites: [{ name: 's', color: '#ff55ff', x: 50, y: 280, playerEdited: true }],
    tests: [
      { t: 100, label: 'x > 180',  assert: 's.x > 180' },
      { t: 40,  label: 'w górze',  assert: 's.y < 260' }
    ]
  },
  {
    title: 'Odbij się od góry',
    type: 'tests',
    goal: 'Gdy y < 0, odwróć vy (ustaw na -vy). Użyj on-tick + set-vel + get-state/expressions.',
    initialSprites: [{ name: 's', color: '#00ddff', x: 256, y: 200, playerEdited: true, script: [] }],
    tests: [
      { t: 300, label: 'nie spada za górę', assert: 's.y > -5' },
      { t: 300, label: 'jeszcze się rusza', assert: 'Math.abs(s.vy) > 0.5' }
    ]
  }
];
```

**Note:** The 4th challenge needs a conditional block (`jeżeli y < 0 → set-vel(…, -vy)`). If `if`/conditional isn't in BLOCKS yet, either:

1. Replace challenge #4 with a simpler one that doesn't need conditionals, **or**
2. Add a minimal `if-statement` block here:

```js
'if': { cat: 'math', type: 'c-block', label: 'jeżeli §cond', slots: { cond: { type: 'expression', default: 0 } } },
'cmp': { cat: 'math', type: 'expression', label: '(§a §op §b)', slots: { a: { type: 'expression', default: 0 }, op: { type: 'choice', options: ['<','<=','==','>=','>'], default: '<' }, b: { type: 'expression', default: 0 } } },
```

Extend `runStatement` with `c-block` handling (`if`) — evaluate cond, run body if truthy. Extend `evalExpr` with `cmp` (returns 0/1).

For MVP simplicity: **replace challenge #4 with one that doesn't require conditionals** (e.g., "Spraw by statek poruszał się po okręgu używając set-vel z wyrażeniami"). Pick whichever is easier; keep the challenge count at 4.

**Step 2: Verify**

Walk through motion challenges. Star total across all stages: ≥ 12 (4 stages × 3 stars). Topbar shows `⭐ N / 48` (4 stages × 4 challenges × 3 stars).

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add Motion stage challenges (4)"
```

---

## Phase 7: Sandbox & Polish

### Task 23: Sandbox view

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: Sandbox renderer**

Reuse challenge-view layout. Add a sprite list panel (left, above palette or collapsed):

```html
<div id="sandbox-view" class="view">
  <div class="ch-topbar">
    <button class="back" onclick="ps.backToTree()">← drzewo</button>
    <span class="ch-title">Sandbox</span>
    <button id="sb-add">+ sprite</button>
  </div>
  <div class="ch-body">
    <aside class="ch-col palette">
      <div id="sb-sprite-list" style="margin-bottom:16px;"></div>
      <div id="sb-palette"></div>
    </aside>
    <section class="ch-col ch-main">
      <div id="sb-script-area" class="script-area"></div>
      <canvas id="sb-scene" width="512" height="320"></canvas>
      <div class="ch-controls">
        <button id="sb-run">▶</button>
        <button id="sb-pause">⏸</button>
        <button id="sb-step">⏭</button>
        <button id="sb-reset">🔄</button>
      </div>
    </section>
  </div>
</div>
```

Sandbox state: list of sprites (each with its own script); click in the sprite list selects the active sprite for editing. Palette is full (all categories unlocked in MVP — matches the top unlocked stage).

```js
const SB = { sprites: [], activeIdx: 0, running: false };

function openSandbox() {
  if (!SB.sprites.length) {
    SB.sprites.push({ name: 'sprite1', color: '#00ff88', x: 100, y: 100, w: 16, h: 16, script: [] });
  }
  renderSandbox();
  showView('sandbox-view');
}
```

Add a Sandbox CTA on the tree view:

```js
// in renderTree, append a link to openSandbox at the bottom
const sb = document.createElement('button');
sb.textContent = '🧪 Sandbox';
sb.style.cssText = 'margin-top:40px;padding:10px 24px;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:8px;cursor:pointer;font-family:var(--font);font-weight:600;';
sb.onclick = openSandbox;
document.getElementById('tree-root').appendChild(sb);
```

**Step 2: Sandbox runtime**

Duplicate the canvas/script-area wiring but onto sandbox DOM ids. Add per-sprite script switching: changing `SB.activeIdx` re-renders `sb-script-area` based on that sprite's script. All sprites run together via `worldReset(SB.sprites.map(clone))`.

The implementation should reuse `makeSprite`, `worldReset`, `worldStart`, `drawScene` but render to `#sb-scene`. Either parametrize `drawScene(canvasId, sprites)` or introduce a `CURRENT_CANVAS` var.

Cleanest: make `drawScene(sprites, canvasId = 'scene')`.

**Step 3: Verify**

On the tree, click `🧪 Sandbox`. Sandbox opens with 1 sprite. Palette has all categories. Build a script in `sprite1`. Click `▶` → animation runs. Click `+ sprite` → second sprite added, switch active, build separate script. `⏸` pauses, `⏭` steps one tick.

**Step 4: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Add sandbox view"
```

---

### Task 24: Persist last code per challenge

**Files:**
- Modify: `block-lab/pixel-stack/index.html`

**Step 1: On every script change → save**

After each `renderScript` triggered by a user action (drop/remove/slot edit), save `STATE.script` into `localStorage` under `pixelstack-scripts.{stage}.{idx}`.

On `openChallenge`, try to restore that saved script; if absent, use `initialScript` clone.

```js
function saveCurrentScript() {
  if (STATE.stage == null || STATE.challenge == null) return;
  const all = JSON.parse(localStorage.getItem('pixelstack-scripts') || '{}');
  all[STATE.stage] = all[STATE.stage] || {};
  all[STATE.stage][STATE.challenge] = STATE.script;
  localStorage.setItem('pixelstack-scripts', JSON.stringify(all));
}

function loadSavedScript(stageId, idx) {
  try {
    const all = JSON.parse(localStorage.getItem('pixelstack-scripts') || '{}');
    return all?.[stageId]?.[idx] || null;
  } catch { return null; }
}

// in openChallenge:
const saved = loadSavedScript(stageId, idx);
STATE.script = saved ? JSON.parse(JSON.stringify(saved)) : JSON.parse(JSON.stringify(ch.initialScript || []));
```

Call `saveCurrentScript()` at the end of the drop handler, remove handler, and slot editor commit.

**Step 2: Verify**

Solve a challenge. Close browser, reopen, navigate to the same challenge. Script is restored.

**Step 3: Commit**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "Persist per-challenge scripts in localStorage"
```

---

### Task 25: Final sweep + CNAME + deploy check

**Files:**
- Modify: `block-lab/pixel-stack/index.html` (polish)

**Step 1: Polish pass**

- Check console: no errors during any flow (open tree → stage → challenge → run → reset → check → back)
- `?dev=1` still passes all harness tests
- All 16 challenges awardable (solve each, earn at least 1⭐)
- Topbar star total correct
- Reset button doesn't crash when script is empty
- Run button handles malformed scripts (wrap `runTrigger` in try/catch and show error in `#ch-msg`)

```js
function safeStep() {
  try { stepOnce(); }
  catch (e) {
    worldStop();
    document.getElementById('ch-msg').className = 'ch-msg fail';
    document.getElementById('ch-msg').textContent = 'Błąd w skrypcie: ' + e.message;
  }
}
// use safeStep in worldStart's loop
```

**Step 2: GitHub Pages check**

Block-lab is served from GitHub Pages (CNAME `block-lab.codingtree.pl`). Since `pixel-stack/` is a relative folder with `index.html`, no extra config needed. Confirm by opening `block-lab/index.html` in browser and clicking the PixelStack card → loads.

**Step 3: Commit and ask about push**

```bash
git add block-lab/pixel-stack/index.html
git commit -m "PixelStack: polish, error handling, MVP complete"
```

Ask user before pushing — follow the "Don't push without asking" preference.

---

## Post-MVP (not in this plan)

- Stage 5 (Control) — input, collisions, shmup challenges
- Stage 6 (Minds) — state machine block + AI challenges
- Stage 7 (Worlds) — procedural generation challenges
- Custom pixel sprite editor (draw 16×16 grid)
- Multiple scripts per sprite (Scratch-style "hat blocks")
- Import/export sandbox projects as JSON
- Session recorder / replayer (port from ai-block-studio)
