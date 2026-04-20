let apiKey = '';
let blocks = [];
let variables = Object.create(null);
let dragSrc = null;
let blockCounter = 0;
let currentExample = null; // { name, vIdx }

const BLOCK_DEFS = {
  'start':      { label: '▶ Start programu', cls: 'b-start', inputs: [] },
  'end':        { label: '🛑 Zakończ program', cls: 'b-end', inputs: [] },
  'ai-ask':     { label: '🤖 Zapytaj AI:', cls: 'b-ai', inputs: [{ key: 'text', placeholder: 'Skąd bierze się tęcza?' }] },
  'ai-story':   { label: '📖 Napisz historię o:', cls: 'b-ai', inputs: [{ key: 'topic', placeholder: 'dinozaurach' }] },
  'ai-explain': { label: '💡 Wyjaśnij:', cls: 'b-ai', inputs: [{ key: 'concept', placeholder: 'grawitację' }] },
  'ai-translate':{ label: '🌍 Przetłumacz na angielski:', cls: 'b-ai', inputs: [{ key: 'text', placeholder: 'Cześć świecie' }] },
  'ai-poem':    { label: '🎵 Ułóż wiersz o:', cls: 'b-ai', inputs: [{ key: 'topic', placeholder: 'kosmosie' }] },
  'say':        { label: '💬 Powiedz:', cls: 'b-say', inputs: [{ key: 'text', placeholder: 'Witaj!' }] },
  'ask':        { label: '🙋 Zapytaj:', cls: 'b-say', inputs: [{ key: 'text', placeholder: 'Jak masz na imię?' }, { key: 'name', placeholder: 'odpowiedź' }] },
  'wait':       { label: '⏱ Czekaj:', cls: 'b-repeat', inputs: [{ key: 'secs', placeholder: '1' }], suffix: 'sek' },
  'repeat':     { label: '🔁 Powtórz:', cls: 'b-repeat', inputs: [{ key: 'times', placeholder: '3' }], suffix: 'razy' },
  'if-random':  { label: '🎲 Losowo jeden z:', cls: 'b-var', inputs: [{ key: 'options', placeholder: 'pies, kot, ryba' }] },
  'set-var':    { label: '📦 Ustaw zmienną:', cls: 'b-var', inputs: [{ key: 'name', placeholder: 'imię' }, { key: 'value', placeholder: 'Zosia' }] },
  'show-var':   { label: '👁 Pokaż zmienną:', cls: 'b-var', inputs: [{ key: 'name', placeholder: 'imię' }] },
  'change-var': { label: '➕ Zmień zmienną o:', cls: 'b-var', inputs: [{ key: 'name', placeholder: 'punkty' }, { key: 'delta', placeholder: '1' }] },
  'math-set':   { label: '📐 Oblicz:', cls: 'b-math', inputs: [{ key: 'name', placeholder: 'wynik' }, { key: 'expr', placeholder: '{x} + {y} * 2' }] },
  'random-num': { label: '🎯 Losowa liczba:', cls: 'b-math', inputs: [{ key: 'name', placeholder: 'kostka' }, { key: 'min', placeholder: '1' }, { key: 'max', placeholder: '6' }] },
  'group':      { label: '📎 Grupa', cls: 'b-repeat', inputs: [{ key: 'name', placeholder: 'moja grupa' }], isGroup: true },
  'if-else':    { label: '❓ Jeżeli', cls: 'b-repeat', inputs: [], isIfElse: true },
  'debug-stop': { label: '⏸ Pauza:', cls: 'b-debug', inputs: [{ key: 'msg', placeholder: 'checkpoint' }] },
  'goto':       { label: '↩ Idź do:', cls: 'b-repeat', inputs: [], isGoto: true },
  'obj-new':    { label: '🏗 Nowy obiekt:', cls: 'b-var', inputs: [{ key: 'name', placeholder: 'gracz' }, { key: 'props', placeholder: 'imię=Zosia, hp=100, atak=15' }] },
  'list-new':   { label: '📋 Nowa lista:', cls: 'b-var', inputs: [{ key: 'name', placeholder: 'kolory' }, { key: 'values', placeholder: 'czerwony, niebieski, zielony' }] },
  'list-add':   { label: '➕ Dodaj do:', cls: 'b-var', inputs: [{ key: 'name', placeholder: 'kolory' }, { key: 'value', placeholder: 'czerwony' }] },
};

// ── API KEY ──
function showModal() {
  document.getElementById('apiModal').style.display = '';
  document.getElementById('apiKeyInput').focus();
}
function closeModal() {
  document.getElementById('apiModal').style.display = 'none';
}
function saveKey() {
  const val = document.getElementById('apiKeyInput').value.trim();
  if (val) {
    apiKey = val;
    document.getElementById('keyDot').classList.remove('no-key');
    document.getElementById('keyStatus').textContent = 'klucz aktywny';
    toggleAiBlocks(true);
  }
  document.getElementById('apiModal').style.display = 'none';
}
function toggleAiBlocks(show) {
  document.querySelectorAll('.palette .block-template.b-ai').forEach(el => {
    el.style.display = show ? '' : 'none';
  });
  document.querySelectorAll('.palette h3').forEach(h => {
    if (h.textContent.includes('AI')) h.style.display = show ? '' : 'none';
  });
}

// ── SAFE VARIABLE SYSTEM ──
function getVar(path) {
  const parts = String(path).split('.');
  let cur = variables;
  for (const key of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    if (!Object.prototype.hasOwnProperty.call(cur, key)) return undefined;
    cur = cur[key];
  }
  return cur;
}

function setVar(path, value) {
  const parts = String(path).split('.');
  let cur = variables;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!Object.prototype.hasOwnProperty.call(cur, key) || cur[key] == null || typeof cur[key] !== 'object') {
      cur[key] = Object.create(null);
    }
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
}

function formatVar(val) {
  if (val == null) return 'undefined';
  if (Array.isArray(val)) return '[' + val.map(v => formatVar(v)).join(', ') + ']';
  if (typeof val === 'object') {
    const entries = Object.keys(val).map(k => `${k}: ${formatVar(val[k])}`);
    return '{' + entries.join(', ') + '}';
  }
  return String(val);
}

// built-in functions for interpolation: {nazwa(arg)}
const BUILTIN_FNS = {
  'długość':  v => Array.isArray(v) ? v.length : (typeof v === 'object' && v ? Object.keys(v).length : String(v).length),
  'length':   v => Array.isArray(v) ? v.length : (typeof v === 'object' && v ? Object.keys(v).length : String(v).length),
  'losowy':   v => Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v,
  'random':   v => Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v,
  'ostatni':  v => Array.isArray(v) ? v[v.length - 1] : v,
  'last':     v => Array.isArray(v) ? v[v.length - 1] : v,
  'pierwszy': v => Array.isArray(v) ? v[0] : v,
  'first':    v => Array.isArray(v) ? v[0] : v,
  'klucze':   v => (typeof v === 'object' && v) ? Object.keys(v).join(', ') : '',
  'keys':     v => (typeof v === 'object' && v) ? Object.keys(v).join(', ') : '',
  'odwróć':   v => Array.isArray(v) ? [...v].reverse().join(', ') : v,
  'reverse':  v => Array.isArray(v) ? [...v].reverse().join(', ') : v,
  'suma':     v => Array.isArray(v) ? v.reduce((a, b) => a + (Number(b) || 0), 0) : v,
  'sum':      v => Array.isArray(v) ? v.reduce((a, b) => a + (Number(b) || 0), 0) : v,
  'min':      v => Array.isArray(v) ? Math.min(...v.map(Number)) : v,
  'max':      v => Array.isArray(v) ? Math.max(...v.map(Number)) : v,
  'połącz':   v => Array.isArray(v) ? v.join(', ') : v,
  'join':     v => Array.isArray(v) ? v.join(', ') : v,
};

// ── TABS ──
function switchTab(tab) {
  document.querySelectorAll('.output-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.output-pane').forEach(p => p.classList.remove('active'));
  document.querySelector(`.output-pane[data-tab="${tab}"]`).classList.add('active');
  document.querySelector(`.output-tab[onclick*="${tab}"]`).classList.add('active');
}

// ── OUTPUT MODE ──
let outputMode = 'say';

function setOutputMode(mode) {
  outputMode = mode;
  document.querySelectorAll('.output-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  const body = document.getElementById('outputBody');
  body.classList.toggle('show-all', mode === 'all');
}

// ── CONSOLE LOG ──
function clog(text) {
  const body = document.getElementById('consoleBody');
  const el = document.createElement('div');
  el.className = 'output-line console';
  const time = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  el.innerHTML = `<span style="color:var(--muted);margin-right:8px;">${time}</span>${escHtml(text)}`;
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
}

// ── VARIABLES PANEL ──
function updateVarsPanel() {
  const body = document.getElementById('varsBody');
  const keys = Object.keys(variables);
  if (keys.length === 0) {
    body.innerHTML = '<div class="var-empty">Brak zmiennych — uruchom program.</div>';
    return;
  }
  let html = '<table class="var-table"><tr><th>Nazwa</th><th>Typ</th><th>Wartość</th></tr>';
  function addRows(obj, prefix) {
    Object.keys(obj).forEach(k => {
      const val = obj[k];
      const fullName = prefix ? `${prefix}.${k}` : k;
      if (Array.isArray(val)) {
        html += `<tr><td>${escHtml(fullName)}</td><td>lista</td><td>${escHtml(formatVar(val))}</td></tr>`;
      } else if (val != null && typeof val === 'object') {
        html += `<tr><td>${escHtml(fullName)}</td><td>obiekt</td><td>${escHtml(formatVar(val))}</td></tr>`;
        addRows(val, fullName);
      } else {
        const type = typeof val === 'number' ? 'liczba' : 'tekst';
        const display = String(val).length > 60 ? String(val).slice(0, 60) + '...' : String(val);
        html += `<tr><td>${escHtml(fullName)}</td><td>${type}</td><td>${escHtml(display)}</td></tr>`;
      }
    });
  }
  addRows(variables, '');
  html += '</table>';
  body.innerHTML = html;
}

// ── DEBUG STOP ──
let debugResolve = null;
let debugStopped = false;

function resumeDebug() {
  if (debugResolve) {
    debugResolve();
    debugResolve = null;
  }
}

// ── SAVE/LOAD ──
const STORAGE_KEY = 'blocklab-projects';

function getProjects() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function setProjects(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function openSaveModal() {
  document.getElementById('saveModal').style.display = '';
  document.getElementById('projectNameInput').value = '';
  renderProjectList();
  document.getElementById('projectNameInput').focus();
}

function closeSaveModal() {
  document.getElementById('saveModal').style.display = 'none';
}

function saveProject() {
  const name = document.getElementById('projectNameInput').value.trim();
  if (!name) return;
  const projects = getProjects();
  if (!projects[name]) projects[name] = { versions: [] };
  const vNum = projects[name].versions.length + 1;
  projects[name].versions.push({
    v: vNum,
    date: new Date().toLocaleString('pl-PL'),
    blocks: JSON.parse(JSON.stringify(blocks)),
  });
  setProjects(projects);
  renderProjectList();
  document.getElementById('projectNameInput').value = '';
}

function saveToProject(name) {
  if (blocks.length === 0) return;
  const projects = getProjects();
  if (!projects[name]) projects[name] = { versions: [] };
  const vNum = projects[name].versions.length + 1;
  projects[name].versions.push({
    v: vNum,
    date: new Date().toLocaleString('pl-PL'),
    blocks: JSON.parse(JSON.stringify(blocks)),
  });
  setProjects(projects);
  renderProjectList();
}

function overwriteVersion(name, vIdx) {
  if (blocks.length === 0) return;
  const projects = getProjects();
  if (!projects[name]?.versions[vIdx]) return;
  projects[name].versions[vIdx].date = new Date().toLocaleString('pl-PL');
  projects[name].versions[vIdx].blocks = JSON.parse(JSON.stringify(blocks));
  setProjects(projects);
  renderProjectList();
}

function loadVersion(name, vIdx) {
  const projects = getProjects();
  const ver = projects[name]?.versions[vIdx];
  if (!ver) return;
  blocks = cloneBlocks(ver.blocks);
  blockCounter = countBlocks(blocks);
  renderBlocks();
  closeSaveModal();
}

function countBlocks(arr) {
  let c = 0;
  arr.forEach(b => {
    c++;
    if (b.children) c += countBlocks(b.children);
    if (b.elseChildren) c += countBlocks(b.elseChildren);
  });
  return c;
}

function deleteProject(name) {
  const projects = getProjects();
  delete projects[name];
  setProjects(projects);
  renderProjectList();
}

function deleteVersion(name, vIdx) {
  const projects = getProjects();
  if (!projects[name]) return;
  projects[name].versions.splice(vIdx, 1);
  // renumber
  projects[name].versions.forEach((v, i) => v.v = i + 1);
  if (projects[name].versions.length === 0) delete projects[name];
  setProjects(projects);
  renderProjectList();
}

function renderProjectList() {
  const list = document.getElementById('projectList');
  const projects = getProjects();
  const names = Object.keys(projects);
  if (names.length === 0) {
    list.innerHTML = '<div class="no-projects">Brak zapisanych projektów</div>';
    return;
  }
  list.innerHTML = '';
  names.forEach(name => {
    const p = projects[name];
    const eName = escHtml(name);
    const div = document.createElement('div');
    div.className = 'project-item';

    let html = `<div style="display:flex;align-items:center;">`;
    html += `<div class="project-item-name">${eName}</div>`;
    html += `<div class="project-actions">`;
    html += `<button onclick="event.stopPropagation();saveToProject('${eName}')" title="Dodaj nową wersję" style="color:var(--accent3);font-size:12px;">+ nowa</button>`;
    html += `<button onclick="event.stopPropagation();deleteProject('${eName}')" title="Usuń projekt">🗑</button>`;
    html += `</div></div>`;
    html += `<div class="project-versions" style="margin-top:6px;">`;
    p.versions.forEach((v, i) => {
      html += `<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">`;
      html += `<span class="version-chip" onclick="event.stopPropagation();loadVersion('${eName}',${i})" style="flex:1;">v${v.v} · ${v.date}</span>`;
      html += `<button style="background:none;border:none;color:var(--accent6);cursor:pointer;font-size:10px;padding:2px 4px;" onclick="event.stopPropagation();overwriteVersion('${eName}',${i})" title="Nadpisz tę wersję">💾</button>`;
      html += `<button style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:10px;padding:2px 4px;" onclick="event.stopPropagation();deleteVersion('${eName}',${i})" title="Usuń wersję">✕</button>`;
      html += `</div>`;
    });
    html += `</div>`;
    div.innerHTML = html;
    list.appendChild(div);
  });
}

function renderSavedProjectsHint() {
  const el = document.getElementById('savedProjectsHint');
  if (!el) return;
  const projects = getProjects();
  const names = Object.keys(projects);
  if (names.length === 0) { el.innerHTML = ''; return; }
  let html = '<div class="subtitle" style="margin-top:20px;">...lub otwórz zapisany projekt:</div>';
  html += '<div class="examples-grid">';
  names.forEach(name => {
    const p = projects[name];
    const lastIdx = p.versions.length - 1;
    html += `<div class="example-card" onclick="loadVersion('${escHtml(name)}',${lastIdx})">`;
    html += `<div class="ex-icon">💾</div>`;
    html += `<div class="ex-title">${escHtml(name)}</div>`;
    if (p.versions.length > 1) {
      html += `<select onclick="event.stopPropagation()" onchange="event.stopPropagation();loadVersion('${escHtml(name)}',Number(this.value))" style="margin-top:6px;width:100%;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:5px 8px;color:var(--text);font-family:'Nunito',sans-serif;font-weight:700;font-size:11px;cursor:pointer;">`;
      p.versions.forEach((v, i) => {
        html += `<option value="${i}" ${i === lastIdx ? 'selected' : ''}>v${v.v} · ${v.date}</option>`;
      });
      html += `</select>`;
    } else {
      html += `<div class="ex-desc">${p.versions[0].date}</div>`;
    }
    html += `</div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

function onResume() {
  debugStopped = false;
  resumeDebug();
}

// ── TEXT POPUP ──
let textPopupTarget = null;
function openTextPopup(idx, key, label) {
  textPopupTarget = { idx, key };
  document.getElementById('textPopupTitle').textContent = label;
  document.getElementById('textPopupArea').value = blocks[idx].vals[key] || '';
  document.getElementById('textPopup').style.display = '';
  document.getElementById('textPopupArea').focus();
}
function closeTextPopup() {
  document.getElementById('textPopup').style.display = 'none';
  textPopupTarget = null;
}
function saveTextPopup() {
  if (textPopupTarget) {
    const b = textPopupTarget.path ? getBlockByPath(textPopupTarget.path) : blocks[textPopupTarget.idx];
    if (b) b.vals[textPopupTarget.key] = document.getElementById('textPopupArea').value;
    renderBlocks();
  }
  closeTextPopup();
}

// ── DRAG FROM PALETTE ──
document.querySelectorAll('.block-template').forEach(el => {
  el.addEventListener('dragstart', e => {
    e.dataTransfer.setData('block-type', el.dataset.type);
    e.dataTransfer.effectAllowed = 'copy';
  });
  el.addEventListener('click', () => addBlock(el.dataset.type));
});

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = dragSrc !== null ? 'move' : 'copy';
}

function onDrop(e) {
  e.preventDefault();
  const type = e.dataTransfer.getData('block-type');
  if (!type) return;
  addBlock(type);
}

// ── BUILD BLOCK ──
function addBlock(type, vals = {}, targetArray = null) {
  const def = BLOCK_DEFS[type];
  if (!def) return;
  const id = ++blockCounter;
  const block = { id, type, vals: { ...vals } };
  if (def.isGroup) block.children = [];
  if (def.isIfElse) { block.children = []; block.elseChildren = []; block.vals = { left: vals.left || '', op: vals.op || '=', right: vals.right || '', ...vals }; }
  if (targetArray) targetArray.push(block);
  else if (drillDown && drillDown.arr && !drillDown.isBlock) drillDown.arr.push(block);
  else if (!drillDown) blocks.push(block);
  else return; // don't add to if-else block wrapper
  if (drillDown && !targetArray) renderDrillView();
  else renderBlocks();
}

function renderBlocks() {
  if (drillDown) { renderDrillView(); return; }
  const stack = document.getElementById('scriptStack');
  const hint = document.getElementById('dropHint');
  hint.style.display = blocks.length ? 'none' : '';
  if (!blocks.length) renderSavedProjectsHint();

  stack.innerHTML = '';
  renderBlockList(blocks, stack, null);

  // update global toggle button label
  const btn = document.getElementById('toggleAllDebugBtn');
  if (btn) {
    const debugBlocks = [];
    (function collect(arr) { arr.forEach(b => { if (b.type === 'debug-stop') debugBlocks.push(b); if (b.children) collect(b.children); }); })(blocks);
    const anyEnabled = debugBlocks.some(b => !b.disabled);
    btn.textContent = anyEnabled ? '⏸ Wyłącz wszystkie pauzy' : '▶ Włącz wszystkie pauzy';
  }
}

function initNewBlock(type) {
  const def = BLOCK_DEFS[type];
  if (!def) return null;
  const block = { id: ++blockCounter, type, vals: {} };
  if (def.isGroup) block.children = [];
  if (def.isIfElse) { block.children = []; block.elseChildren = []; block.vals = { left: '', op: '=', right: '' }; }
  return block;
}

function setupDropZone(el, targetArr, path, singleSlot) {
  el.addEventListener('dragover', ev => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.dataTransfer.dropEffect = dragSrc !== null ? 'move' : 'copy';
    el.classList.add('drag-over');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', ev => {
    ev.preventDefault();
    ev.stopPropagation();
    el.classList.remove('drag-over');
    const type = ev.dataTransfer.getData('block-type');
    if (type) {
      const newBlock = initNewBlock(type);
      if (newBlock) {
        if (singleSlot) { targetArr.length = 0; }
        targetArr.push(newBlock);
      }
      renderBlocks();
      return;
    }
    if (dragSrc !== null) {
      const moved = removeByPath(String(dragSrc));
      if (moved) {
        if (singleSlot) { targetArr.length = 0; }
        targetArr.push(moved);
      }
      renderBlocks();
      dragSrc = null;
    }
  });
}

function createDropGap(blkArray, insertIdx) {
  const gap = document.createElement('div');
  gap.className = 'drop-gap';
  gap.addEventListener('dragover', ev => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.dataTransfer.dropEffect = dragSrc !== null ? 'move' : 'copy';
    gap.classList.add('drag-over');
  });
  gap.addEventListener('dragleave', () => gap.classList.remove('drag-over'));
  gap.addEventListener('drop', ev => {
    ev.preventDefault();
    ev.stopPropagation();
    gap.classList.remove('drag-over');
    const type = ev.dataTransfer.getData('block-type');
    if (type) {
      const newBlock = initNewBlock(type);
      if (newBlock) blkArray.splice(insertIdx, 0, newBlock);
      renderBlocks();
      return;
    }
    if (dragSrc !== null) {
      const moved = removeByPath(String(dragSrc));
      if (moved) {
        // re-resolve insert index after removal
        blkArray.splice(Math.min(insertIdx, blkArray.length), 0, moved);
      }
      renderBlocks();
      dragSrc = null;
    }
  });
  return gap;
}

function collectGroupNames(blkArray) {
  const names = [];
  for (const b of blkArray) {
    if (b.type === 'group' && (b.vals.name || '').trim()) names.push((b.vals.name || '').trim());
    if (b.children) names.push(...collectGroupNames(b.children));
    if (b.elseChildren) names.push(...collectGroupNames(b.elseChildren));
  }
  return names;
}

function addBlockDropHandlers(el, idx, blkArray) {
  el.addEventListener('dragover', ev => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.dataTransfer.dropEffect = dragSrc !== null ? 'move' : 'copy';
    const row = el.closest('.block-row') || el;
    const rect = row.getBoundingClientRect();
    const top = (ev.clientY - rect.top) < rect.height / 2;
    row.classList.toggle('drag-over-top', top);
    row.classList.toggle('drag-over-bottom', !top);
  });
  el.addEventListener('dragleave', () => {
    const row = el.closest('.block-row') || el;
    row.classList.remove('drag-over-top', 'drag-over-bottom');
  });
  el.addEventListener('drop', ev => {
    ev.preventDefault();
    ev.stopPropagation();
    const row = el.closest('.block-row') || el;
    row.classList.remove('drag-over-top', 'drag-over-bottom');
    const rect = row.getBoundingClientRect();
    const top = (ev.clientY - rect.top) < rect.height / 2;
    const insertIdx = top ? idx : idx + 1;
    const type = ev.dataTransfer.getData('block-type');
    if (type) {
      const newBlock = initNewBlock(type);
      if (newBlock) blkArray.splice(insertIdx, 0, newBlock);
      renderBlocks();
      return;
    }
    if (dragSrc !== null) {
      const srcIdx = parseInt(String(dragSrc), 10);
      const moved = removeByPath(String(dragSrc));
      if (moved) {
        // if source was in same array before target, adjust for removal shift
        const adj = (!String(dragSrc).includes('.') && srcIdx < insertIdx) ? insertIdx - 1 : insertIdx;
        blkArray.splice(Math.min(adj, blkArray.length), 0, moved);
      }
      renderBlocks();
      dragSrc = null;
    }
  });
}

function renderBlockList(blkArray, container, parentPath) {
  blkArray.forEach((b, idx) => {
    const def = BLOCK_DEFS[b.type];
    const path = parentPath ? `${parentPath}.${idx}` : `${idx}`;

    // drop gap before each block
    container.appendChild(createDropGap(blkArray, idx));

    if (def.isGroup) {
      const wrapper = document.createElement('div');
      wrapper.className = 'block-group';

      // header
      const header = document.createElement('div');
      header.className = 'block-group-header';
      let hhtml = `<span>📎 Grupa:</span>`;
      hhtml += ` <input class="block-input" value="${escHtml(b.vals.name || '')}" placeholder="moja grupa"
                   onclick="event.stopPropagation()"
                   oninput="updateValByPath('${path}','name',this.value)">`;
      header.innerHTML = hhtml;
      header.draggable = true;
      header.addEventListener('dragstart', ev => {
        dragSrc = path;
        ev.dataTransfer.setData('block-path', path);
        ev.dataTransfer.effectAllowed = 'move';
      });
      addBlockDropHandlers(header, idx, blkArray);
      if (!drillDown) header.addEventListener('dblclick', ev => { ev.stopPropagation(); openBlockDrill(path); });
      wrapper.appendChild(header);

      // body
      const body = document.createElement('div');
      body.className = 'block-group-body';
      body.dataset.path = path;

      if (b.children.length === 0) {
        body.innerHTML = '<div class="block-group-hint">Przeciągnij bloki tutaj</div>';
      } else {
        renderBlockList(b.children, body, path);
      }

      // drop into group
      setupDropZone(body, b.children, path);

      wrapper.appendChild(body);
      container.appendChild(wrapWithMoveCol(wrapper, path, idx, blkArray.length));
    } else if (def.isIfElse) {
      const wrapper = document.createElement('div');
      wrapper.className = 'block-if-else';

      // header with condition inputs
      const header = document.createElement('div');
      header.className = 'block-if-else-header';
      let hhtml = `<span>❓ Jeżeli</span>`;
      hhtml += ` <input class="block-input" value="${escHtml(b.vals.left || '')}" placeholder="zmienna"
                   style="min-width:60px;max-width:120px"
                   onclick="event.stopPropagation()"
                   oninput="updateValByPath('${path}','left',this.value)">`;
      hhtml += ` <select onchange="updateValByPath('${path}','op',this.value)">
                   <option value="=" ${b.vals.op === '=' ? 'selected' : ''}>=</option>
                   <option value="!=" ${b.vals.op === '!=' ? 'selected' : ''}>≠</option>
                   <option value="zawiera" ${b.vals.op === 'zawiera' ? 'selected' : ''}>zawiera</option>
                   <option value=">" ${b.vals.op === '>' ? 'selected' : ''}>></option>
                   <option value="<" ${b.vals.op === '<' ? 'selected' : ''}><</option>
                 </select>`;
      hhtml += ` <input class="block-input" value="${escHtml(b.vals.right || '')}" placeholder="wartość"
                   style="min-width:60px;max-width:120px"
                   onclick="event.stopPropagation()"
                   oninput="updateValByPath('${path}','right',this.value)">`;
      header.innerHTML = hhtml;
      header.draggable = true;
      header.addEventListener('dragstart', ev => {
        dragSrc = path;
        ev.dataTransfer.setData('block-path', path);
        ev.dataTransfer.effectAllowed = 'move';
      });
      addBlockDropHandlers(header, idx, blkArray);
      if (!drillDown) header.addEventListener('dblclick', ev => { ev.stopPropagation(); openBlockDrill(path); });
      wrapper.appendChild(header);

      // branches container (horizontal layout)
      const branches = document.createElement('div');
      branches.className = 'block-if-branches';

      // THEN branch
      const thenBranch = document.createElement('div');
      thenBranch.className = 'block-if-branch';
      const thenLabel = document.createElement('div');
      thenLabel.className = 'block-if-label';
      thenLabel.textContent = '✓ to:';
      if (!drillDown) thenLabel.addEventListener('dblclick', ev => { ev.stopPropagation(); openBranchDrill(path, 'then', '✓ to:'); });
      thenBranch.appendChild(thenLabel);

      const thenBody = document.createElement('div');
      thenBody.className = 'block-if-body';
      thenBody.dataset.path = path;
      thenBody.dataset.branch = 'then';
      if (b.children.length === 0) {
        thenBody.innerHTML = '<div class="block-group-hint">Upuść blok lub grupę</div>';
      } else {
        renderBlockList(b.children, thenBody, path + '.then');
      }
      setupDropZone(thenBody, b.children, path, true);
      thenBranch.appendChild(thenBody);
      branches.appendChild(thenBranch);

      // ELSE branch
      const elseBranch = document.createElement('div');
      elseBranch.className = 'block-if-branch';
      const elseLabel = document.createElement('div');
      elseLabel.className = 'block-if-label';
      elseLabel.textContent = '✗ inaczej:';
      if (!drillDown) elseLabel.addEventListener('dblclick', ev => { ev.stopPropagation(); openBranchDrill(path, 'else', '✗ inaczej:'); });
      elseBranch.appendChild(elseLabel);

      const elseBody = document.createElement('div');
      elseBody.className = 'block-if-body block-if-body-else';
      elseBody.dataset.path = path;
      elseBody.dataset.branch = 'else';
      if (b.elseChildren.length === 0) {
        elseBody.innerHTML = '<div class="block-group-hint">Upuść blok lub grupę (opcjonalne)</div>';
      } else {
        renderBlockList(b.elseChildren, elseBody, path + '.else');
      }
      setupDropZone(elseBody, b.elseChildren, path, true);
      elseBranch.appendChild(elseBody);
      branches.appendChild(elseBranch);

      wrapper.appendChild(branches);

      container.appendChild(wrapWithMoveCol(wrapper, path, idx, blkArray.length));
    } else {
      const el = document.createElement('div');
      el.className = `block ${def.cls}${b.disabled ? ' disabled' : ''}`;
      el.dataset.path = path;

      let html = `<span style="pointer-events:none">${def.label}</span>`;
      def.inputs.forEach(inp => {
        const val = b.vals[inp.key] || '';
        html += ` <input class="block-input"
                    value="${escHtml(val)}" placeholder="${inp.placeholder}"
                    onclick="event.stopPropagation()"
                    oninput="updateValByPath('${path}','${inp.key}',this.value)">`;
        html += `<button class="block-expand" onclick="event.stopPropagation();openTextPopupByPath('${path}','${inp.key}','${escHtml(def.label)} ${escHtml(inp.placeholder)}')" title="Rozwiń">⤢</button>`;
      });
      if (def.suffix) html += ` <span style="pointer-events:none">${def.suffix}</span>`;
      if (b.type === 'debug-stop') {
        html += `<button class="block-expand" onclick="event.stopPropagation();toggleBlockByPath('${path}')" title="${b.disabled ? 'Włącz' : 'Wyłącz'}">${b.disabled ? '○' : '●'}</button>`;
      }
      if (def.isGoto) {
        const allGroups = collectGroupNames(blocks);
        const seen = new Set();
        const uniqueGroups = allGroups.filter(n => { if (seen.has(n)) return false; seen.add(n); return true; });
        const curTarget = b.vals.target || '';
        html += ` <select class="block-input" style="min-width:100px"
                    onclick="event.stopPropagation()"
                    onchange="updateValByPath('${path}','target',this.value)">`;
        html += `<option value="start"${curTarget === 'start' || curTarget === '' ? ' selected' : ''}>▶ start</option>`;
        uniqueGroups.forEach(name => {
          html += `<option value="${escHtml(name)}"${curTarget === name ? ' selected' : ''}>📎 ${escHtml(name)}</option>`;
        });
        html += `</select>`;
      }
      el.innerHTML = html;

      el.draggable = true;
      el.addEventListener('dragstart', ev => {
        dragSrc = path;
        ev.dataTransfer.setData('block-path', path);
        ev.dataTransfer.effectAllowed = 'move';
      });
      addBlockDropHandlers(el, idx, blkArray);

      const row = wrapWithMoveCol(el, path, idx, blkArray.length);
      container.appendChild(row);
    }
  });
  // trailing drop gap after last block
  if (blkArray.length > 0) {
    container.appendChild(createDropGap(blkArray, blkArray.length));
  }
}

function wrapWithMoveCol(el, path, idx, len) {
  const row = document.createElement('div');
  row.className = 'block-row';
  const col = document.createElement('div');
  col.className = 'block-move-col';
  col.innerHTML = `<button class="block-move" onclick="event.stopPropagation();moveBlockByPath('${path}',-1)" title="W górę" ${idx === 0 ? 'disabled' : ''}>▲</button>`
    + `<button class="block-move" onclick="event.stopPropagation();moveBlockByPath('${path}',1)" title="W dół" ${idx === len - 1 ? 'disabled' : ''}>▼</button>`;
  const delCol = document.createElement('div');
  delCol.className = 'block-delete-col';
  delCol.innerHTML = `<button onclick="event.stopPropagation();deleteByPath('${path}')" title="Usuń">✕</button>`;
  row.appendChild(col);
  row.appendChild(el);
  row.appendChild(delCol);
  return row;
}

// ── PATH HELPERS ──
function getRootArray() {
  return (drillDown && drillDown.arr) ? drillDown.arr : blocks;
}

function getArrayAndIndex(path) {
  const parts = path.split('.');
  let arr = getRootArray();
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part === 'then') { /* already navigated via parent */ continue; }
    if (part === 'else') { /* already navigated via parent */ continue; }
    const idx = Number(part);
    const b = arr[idx];
    if (!b) return null;
    const next = parts[i + 1];
    if (next === 'then') { arr = b.children; i++; }
    else if (next === 'else') { arr = b.elseChildren; i++; }
    else if (b.children) { arr = b.children; }
    else return null;
  }
  const last = parts[parts.length - 1];
  return { arr, idx: Number(last) };
}

function getBlockByPath(path) {
  const r = getArrayAndIndex(path);
  return r ? r.arr[r.idx] : null;
}

function removeByPath(path) {
  const r = getArrayAndIndex(path);
  if (!r) return null;
  return r.arr.splice(r.idx, 1)[0];
}

function deleteByPath(path) {
  removeByPath(path);
  renderBlocks();
}

function updateValByPath(path, key, val) {
  const b = getBlockByPath(path);
  if (b) b.vals[key] = val;
}

function toggleBlockByPath(path) {
  const b = getBlockByPath(path);
  if (b) b.disabled = !b.disabled;
  renderBlocks();
}

function moveBlockByPath(path, dir) {
  const r = getArrayAndIndex(path);
  if (!r) return;
  const newIdx = r.idx + dir;
  if (newIdx < 0 || newIdx >= r.arr.length) return;
  const tmp = r.arr[r.idx];
  r.arr[r.idx] = r.arr[newIdx];
  r.arr[newIdx] = tmp;
  renderBlocks();
}

function toggleAllDebug() {
  const debugBlocks = [];
  function collect(arr) {
    arr.forEach(b => {
      if (b.type === 'debug-stop') debugBlocks.push(b);
      if (b.children) collect(b.children);
    });
  }
  collect(blocks);
  if (debugBlocks.length === 0) return;
  const anyEnabled = debugBlocks.some(b => !b.disabled);
  debugBlocks.forEach(b => b.disabled = anyEnabled);
  renderBlocks();
}

function openTextPopupByPath(path, key, label) {
  const b = getBlockByPath(path);
  if (!b) return;
  textPopupTarget = { path, key };
  document.getElementById('textPopupTitle').textContent = label;
  document.getElementById('textPopupArea').value = b.vals[key] || '';
  document.getElementById('textPopup').style.display = '';
  document.getElementById('textPopupArea').focus();
}

function updateVal(idx, key, val) {
  blocks[idx].vals[key] = val;
}

function deleteBlock(idx) {
  blocks.splice(idx, 1);
  renderBlocks();
}

function toggleBlock(idx) {
  blocks[idx].disabled = !blocks[idx].disabled;
  renderBlocks();
}

function clearCanvas() {
  drillDown = null;
  document.getElementById('branchBar').style.display = 'none';
  blocks = [];
  variables = Object.create(null);
  debugStopped = false;
  currentExample = null;
  resumeDebug();
  renderBlocks();
  renderVersionBar();
  document.getElementById('outputBody').innerHTML = '';
  document.getElementById('consoleBody').innerHTML = '';
  document.getElementById('resumeBtn').style.display = 'none';
  document.getElementById('runBtn').style.display = '';
  updateVarsPanel();
  switchTab('output');
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
}

// ── OUTPUT ──
function log(text, type = '') {
  const body = document.getElementById('outputBody');
  const el = document.createElement('div');
  el.className = `output-line ${type}`;
  const labels = { ai: '🤖 AI', say: '💬 Skrypt', ask: '🙋 Pytanie', 'ask-answer': '✏️ Odpowiedź', error: '❌ Błąd', info: 'ℹ️ Info', debug: '⏸ Pauza' };
  if (labels[type]) {
    el.innerHTML = `<div class="output-label">${labels[type]}</div>${escHtml(text)}`;
  } else {
    el.textContent = text;
  }
  body.prepend(el);
  return el;
}

function logAsk(question) {
  const body = document.getElementById('outputBody');
  const el = document.createElement('div');
  el.className = 'output-line ask';
  el.innerHTML = `<div class="output-label">🙋 Pytanie</div>${escHtml(question)}
    <div class="ask-input-row">
      <input class="ask-input" type="text" placeholder="wpisz odpowiedź..." autofocus>
      <button class="ask-submit">OK</button>
    </div>`;
  body.prepend(el);
  const input = el.querySelector('.ask-input');
  const btn = el.querySelector('.ask-submit');
  input.focus();
  return new Promise(resolve => {
    function submit() {
      const val = input.value.trim() || '';
      el.querySelector('.ask-input-row').remove();
      el.innerHTML = `<div class="output-label">🙋 Pytanie</div>${escHtml(question)}`;
      resolve(val);
    }
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  });
}

function logAI(text) {
  const body = document.getElementById('outputBody');
  const el = document.createElement('div');
  el.className = 'output-line ai';
  el.innerHTML = `<div class="output-label">🤖 AI odpowiada</div><span id="ai-typing"></span>`;
  body.prepend(el);
  const span = el.querySelector('#ai-typing');
  span.id = '';
  let i = 0;
  const interval = setInterval(() => {
    span.textContent += text[i++] || '';
    if (i >= text.length) clearInterval(interval);
  }, 12);
}

function logLoading() {
  const body = document.getElementById('outputBody');
  const el = document.createElement('div');
  el.className = 'output-line ai';
  el.innerHTML = `<span class="spinner"></span> AI myśli...`;
  body.prepend(el);
  return el;
}

// ── AI CALL ──
async function callAI(prompt) {
  if (!apiKey) {
    throw new Error('Brak klucza API! Kliknij "brak klucza" przy logo, aby dodać.');
  }
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: 'Jesteś pomocnym asystentem dla dzieci w wieku 7-12 lat. Odpowiadaj po polsku, krótko (max 3-4 zdania), prostym językiem, z entuzjazmem! Używaj emoji na końcu.',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  return data.content[0]?.text || '(brak odpowiedzi)';
}

// ── RUNNER ──
class EndProgram {}
class GotoStart {}
class GotoGroup { constructor(name) { this.name = name; } }

const MAX_GOTO = 1000;
let gotoCount = 0;

function findGroup(name, blks) {
  for (const b of blks) {
    if (b.type === 'group' && (b.vals.name || '').trim() === name) return b;
    if (b.children) { const found = findGroup(name, b.children); if (found) return found; }
    if (b.elseChildren) { const found = findGroup(name, b.elseChildren); if (found) return found; }
  }
  return null;
}

async function runScript() {
  document.getElementById('outputBody').innerHTML = '';
  document.getElementById('consoleBody').innerHTML = '';
  variables = Object.create(null);
  debugStopped = false;
  gotoCount = 0;
  updateVarsPanel();
  switchTab('output');

  if (blocks.length === 0) {
    log('Brak bloków! Przeciągnij bloki na płótno.', 'error');
    return;
  }
  if (blocks[0]?.type !== 'start') {
    log('Zacznij od bloku "▶ Start programu"!', 'error');
    return;
  }
  if (blocks[blocks.length - 1]?.type !== 'end') {
    log('Dodaj blok "🛑 Zakończ program" na końcu programu!', 'error');
    return;
  }

  log('Uruchamiam program...', 'info');
  clog('▶ Program uruchomiony');
  clog(`Liczba bloków: ${blocks.length}`);

  try {
    let running = true;
    let pendingGoto = null;
    while (running) {
      try {
        if (pendingGoto) {
          const group = findGroup(pendingGoto, blocks);
          if (!group) throw new Error(`Grupa "${pendingGoto}" nie znaleziona!`);
          clog(`↩ Skok do grupy: "${pendingGoto}"`);
          pendingGoto = null;
          await executeBlocks(group.children, 0);
        } else {
          await executeBlocks(blocks, 1);
        }
        running = false;
      } catch (e) {
        if (e instanceof GotoStart) {
          clog('↩ Skok do startu');
          pendingGoto = null;
          continue;
        }
        if (e instanceof GotoGroup) {
          pendingGoto = e.name;
          continue;
        }
        throw e;
      }
    }
    if (!debugStopped) {
      log('✅ Program zakończony!', 'info');
      clog('✅ Program zakończony');
    }
  } catch (e) {
    if (e instanceof EndProgram) {
      clog('✅ Program zakończony (blok Zakończ)');
    } else {
      log(e.message, 'error');
      clog(`❌ Błąd: ${e.message}`);
    }
  }
}

async function executeBlocks(blks, startIdx) {
  for (let i = startIdx; i < blks.length; i++) {
    if (debugStopped) return;
    const b = blks[i];
    if (b.disabled) { clog(`Blok ${i + 1}: ${BLOCK_DEFS[b.type]?.label || b.type} [wyłączony]`); continue; }
    const vals = b.vals;
    clog(`Blok ${i + 1}: ${BLOCK_DEFS[b.type]?.label || b.type}`);

    switch (b.type) {
      case 'end': {
        log('🛑 Program zakończony przez blok "Zakończ"', 'info');
        clog('  🛑 Zakończ program');
        throw new EndProgram();
      }

      case 'say': {
        let text = vals.text || '(puste)';
        text = interpolateVars(text);
        log(text, 'say');
        clog(`  → "${text}"`);
        break;
      }

      case 'ask': {
        const question = interpolateVars(vals.text || 'Odpowiedz:');
        const varName = vals.name || 'odpowiedź';
        clog(`  🙋 "${question}" → ${varName}`);
        switchTab('output');
        const answer = await logAsk(question);
        setVar(varName, answer);
        log(`${answer}`, 'ask-answer');
        clog(`  ✏️ ${varName} = "${answer}"`);
        updateVarsPanel();
        break;
      }

      case 'wait': {
        const secs = parseFloat(vals.secs) || 1;
        clog(`  ⏱ czekam ${secs}s...`);
        await sleep(secs * 1000);
        break;
      }

      case 'repeat': {
        const times = parseInt(vals.times) || 3;
        const nextIdx = i + 1;
        if (nextIdx < blks.length) {
          const nextBlock = blks[nextIdx];
          const nextLabel = nextBlock.type === 'group' ? `grupa "${nextBlock.vals.name || ''}"` : (BLOCK_DEFS[nextBlock.type]?.label || '');
          clog(`  🔁 powtarzam ${times}x: ${nextLabel}`);
          for (let r = 0; r < times; r++) {
            if (debugStopped) return;
            clog(`  iteracja ${r + 1}/${times}`);
            if (nextBlock.type === 'group' && nextBlock.children) {
              await executeBlocks(nextBlock.children, 0);
            } else {
              await executeBlocks([nextBlock], 0);
            }
          }
          i++;
        }
        break;
      }

      case 'group': {
        const name = vals.name || 'grupa';
        clog(`  📎 wchodzę do grupy: "${name}" (${b.children?.length || 0} bloków)`);
        if (b.children && b.children.length > 0) {
          let looping = true;
          while (looping) {
            try {
              await executeBlocks(b.children, 0);
              looping = false;
            } catch (e) {
              if (e instanceof GotoGroup && e.name === name) {
                clog(`↩ Skok do grupy: "${name}"`);
                continue;
              }
              throw e; // different group or GotoStart — propagate up
            }
          }
        }
        break;
      }

      case 'if-else': {
        const left = interpolateVars(vals.left || '');
        const right = interpolateVars(vals.right || '');
        const op = vals.op || '=';
        let result = false;
        switch (op) {
          case '=':  result = left === right; break;
          case '!=': result = left !== right; break;
          case 'zawiera': result = left.includes(right); break;
          case '>':  result = Number(left) > Number(right); break;
          case '<':  result = Number(left) < Number(right); break;
        }
        clog(`  ❓ "${left}" ${op} "${right}" → ${result ? 'PRAWDA' : 'FAŁSZ'}`);
        log(`❓ ${left} ${op} ${right} → ${result ? '✓ PRAWDA' : '✗ FAŁSZ'}`, 'info');
        if (result) {
          if (b.children && b.children.length > 0) {
            await executeBlocks(b.children, 0);
          }
        } else {
          if (b.elseChildren && b.elseChildren.length > 0) {
            await executeBlocks(b.elseChildren, 0);
          }
        }
        break;
      }

      case 'if-random': {
        const opts = (vals.options || 'a, b').split(',').map(s => s.trim()).filter(Boolean);
        const chosen = opts[Math.floor(Math.random() * opts.length)];
        log(`🎲 Wylosowano: ${chosen}`, 'say');
        setVar('_random', chosen);
        clog(`  🎲 opcje: [${opts.join(', ')}] → "${chosen}"`);
        updateVarsPanel();
        break;
      }

      case 'set-var': {
        const name = interpolateVars(vals.name || 'x');
        const value = interpolateVars(vals.value || '');
        setVar(name, value);
        log(`📦 ${name} = "${value}"`, 'info');
        clog(`  📦 ${name} = "${value}"`);
        updateVarsPanel();
        break;
      }

      case 'show-var': {
        const name = interpolateVars(vals.name || 'x');
        const val = getVar(name);
        if (val === undefined) {
          log(`Zmienna "${name}" nie istnieje!`, 'error');
          clog(`  ❌ zmienna "${name}" nie znaleziona`);
        } else {
          log(`👁 ${name}: ${formatVar(val)}`, 'say');
          clog(`  👁 ${name} = ${formatVar(val)}`);
        }
        break;
      }

      case 'change-var': {
        const name = interpolateVars(vals.name || 'x');
        const delta = evalMath(vals.delta || '1');
        const current = Number(getVar(name)) || 0;
        const result = current + delta;
        setVar(name, result);
        log(`➕ ${name}: ${current} + ${delta} = ${result}`, 'info');
        clog(`  ➕ ${name}: ${current} + ${delta} = ${result}`);
        updateVarsPanel();
        break;
      }

      case 'math-set': {
        const name = interpolateVars(vals.name || 'wynik');
        const expr = vals.expr || '0';
        const result = evalMath(expr);
        setVar(name, result);
        log(`📐 ${name} = ${interpolateVars(expr)} = ${result}`, 'info');
        clog(`  📐 ${name} = ${expr} → ${result}`);
        updateVarsPanel();
        break;
      }

      case 'random-num': {
        const name = interpolateVars(vals.name || 'liczba');
        const min = parseInt(interpolateVars(vals.min || '1')) || 1;
        const max = parseInt(interpolateVars(vals.max || '6')) || 6;
        const result = Math.floor(Math.random() * (max - min + 1)) + min;
        setVar(name, result);
        log(`🎯 ${name} = ${result} (${min}–${max})`, 'info');
        clog(`  🎯 losowa ${min}–${max} → ${result}`);
        updateVarsPanel();
        break;
      }

      case 'obj-new': {
        const name = interpolateVars(vals.name || 'obiekt');
        const raw = vals.props || '';
        const obj = Object.create(null);
        if (raw) {
          // split on commas, but respect values that may contain commas inside {}
          raw.split(/,(?![^{]*})/).forEach(pair => {
            const eq = pair.indexOf('=');
            if (eq === -1) return;
            const key = pair.slice(0, eq).trim();
            const val = interpolateVars(pair.slice(eq + 1).trim());
            if (key) obj[key] = val;
          });
        }
        setVar(name, obj);
        const display = Object.keys(obj).map(k => `${k}=${obj[k]}`).join(', ');
        log(`🏗 ${name} = {${display}}`, 'info');
        clog(`  🏗 nowy obiekt: ${name} → {${display}}`);
        updateVarsPanel();
        break;
      }

      case 'list-new': {
        const name = interpolateVars(vals.name || 'lista');
        const raw = vals.values || '';
        const items = raw ? raw.split(',').map(s => interpolateVars(s.trim())).filter(Boolean) : [];
        setVar(name, items);
        log(`📋 ${name} = [${items.join(', ')}] (${items.length} el.)`, 'info');
        clog(`  📋 nowa lista: ${name} → [${items.join(', ')}]`);
        updateVarsPanel();
        break;
      }

      case 'list-add': {
        const name = interpolateVars(vals.name || 'lista');
        const rawValue = (vals.value || '').trim();
        let list = getVar(name);
        if (!Array.isArray(list)) {
          list = [];
          setVar(name, list);
        }
        let value;
        if (rawValue.startsWith('@')) {
          // @ref — deep copy of object/array
          const refPath = interpolateVars(rawValue.slice(1).trim());
          const resolved = getVar(refPath);
          if (resolved != null && typeof resolved === 'object') {
            value = JSON.parse(JSON.stringify(resolved));
          } else if (resolved !== undefined) {
            value = resolved;
          } else {
            throw new Error(`@${refPath} — nie znaleziono obiektu!`);
          }
        } else {
          value = interpolateVars(rawValue);
        }
        list.push(value);
        log(`➕ ${name} ← ${formatVar(value)} (${list.length} el.)`, 'info');
        clog(`  ➕ dodano ${formatVar(value)} do ${name}`);
        updateVarsPanel();
        break;
      }

      case 'debug-stop': {
        const msg = interpolateVars(vals.msg || 'breakpoint');
        log(`⏸ PAUZA: ${msg} — kliknij "Kontynuuj" aby wznowić`, 'debug');
        clog(`⏸ PAUZA: ${msg}`);
        clog('  Zmienne w momencie stopu:');
        Object.entries(variables).forEach(([k, v]) => clog(`    ${k} = "${v}"`));
        updateVarsPanel();
        switchTab('vars');
        document.getElementById('resumeBtn').style.display = '';
        document.getElementById('runBtn').style.display = 'none';
        debugStopped = true;
        await new Promise(resolve => { debugResolve = resolve; });
        document.getElementById('resumeBtn').style.display = 'none';
        document.getElementById('runBtn').style.display = '';
        if (debugStopped) return;
        clog('▶ Wznowiono po pauzie');
        switchTab('output');
        break;
      }

      case 'ai-ask': {
        const q = interpolateVars(vals.text || 'Co to jest AI?');
        const loader = logLoading();
        try {
          const ans = await callAI(q);
          loader.remove();
          logAI(ans);
          setVar('_odpowiedź', ans);
          clog(`  → odpowiedź: ${ans.slice(0, 80)}...`);
          updateVarsPanel();
        } catch(e) {
          loader.remove();
          log(e.message, 'error');
          clog(`  ❌ AI błąd: ${e.message}`);
        }
        break;
      }

      case 'ai-story': {
        const topic = interpolateVars(vals.topic || 'przygodach');
        clog(`  📖 temat: "${topic}"`);
        const loader = logLoading();
        try {
          const ans = await callAI(`Napisz krótką, ciekawą historyjkę dla dzieci o ${topic}. Maksymalnie 5 zdań.`);
          loader.remove();
          logAI(ans);
          setVar('_historia', ans);
          clog(`  → historia: ${ans.slice(0, 80)}...`);
          updateVarsPanel();
        } catch(e) {
          loader.remove();
          log(e.message, 'error');
          clog(`  ❌ AI błąd: ${e.message}`);
        }
        break;
      }

      case 'ai-explain': {
        const concept = interpolateVars(vals.concept || 'grawitacji');
        clog(`  💡 pojęcie: "${concept}"`);
        const loader = logLoading();
        try {
          const ans = await callAI(`Wyjaśnij dziecku w wieku 10 lat czym jest ${concept}. Użyj prostych słów i analogii.`);
          loader.remove();
          logAI(ans);
          clog(`  → wyjaśnienie: ${ans.slice(0, 80)}...`);
        } catch(e) {
          loader.remove();
          log(e.message, 'error');
          clog(`  ❌ AI błąd: ${e.message}`);
        }
        break;
      }

      case 'ai-translate': {
        const txt = interpolateVars(vals.text || 'Cześć');
        clog(`  🌍 tekst: "${txt}"`);
        const loader = logLoading();
        try {
          const ans = await callAI(`Przetłumacz to zdanie na język angielski i powiedz jak to wymówić: "${txt}"`);
          loader.remove();
          logAI(ans);
          clog(`  → tłumaczenie: ${ans.slice(0, 80)}...`);
        } catch(e) {
          loader.remove();
          log(e.message, 'error');
          clog(`  ❌ AI błąd: ${e.message}`);
        }
        break;
      }

      case 'ai-poem': {
        const topic = interpolateVars(vals.topic || 'gwiazdkach');
        clog(`  🎵 temat: "${topic}"`);
        const loader = logLoading();
        try {
          const ans = await callAI(`Napisz krótki, wesoły wierszyk (4-6 linijek) dla dzieci o ${topic}. Musi się rymować!`);
          loader.remove();
          logAI(ans);
          clog(`  → wiersz: ${ans.slice(0, 80)}...`);
        } catch(e) {
          loader.remove();
          log(e.message, 'error');
        }
        break;
      }

      case 'goto': {
        const target = interpolateVars(vals.target || '').trim();
        if (!target) { log('Blok "Idź do" — brak celu!', 'error'); break; }
        gotoCount++;
        if (gotoCount > MAX_GOTO) {
          throw new Error('Za dużo skoków (pętla nieskończona?) — zatrzymuję program.');
        }
        if (target === 'start') {
          log(`↩ Skok do startu`, 'info');
          throw new GotoStart();
        } else {
          log(`↩ Skok do grupy: "${target}"`, 'info');
          throw new GotoGroup(target);
        }
      }
    }

    await sleep(100); // small delay between blocks
  }
}

function interpolateVars(text) {
  // first pass: resolve nested refs like {drużyna.{i}} → {drużyna.0}
  let result = text.replace(/\{([^{}]*)\{([^{}]+)\}([^{}]*)\}/g, (m, pre, inner, post) => {
    const innerVal = getVar(inner.trim());
    if (innerVal !== undefined) return `{${pre}${formatVar(innerVal)}${post}}`;
    return m;
  });
  // second pass: resolve all expressions
  return result.replace(/\{([^}]+)\}/g, (m, expr) => {
    expr = expr.trim();
    // function call: {długość(kolory)} or {losowy(lista)}
    const fnMatch = expr.match(/^([\p{L}_][\p{L}\w]*)\((.+)\)$/u);
    if (fnMatch) {
      const fn = BUILTIN_FNS[fnMatch[1]];
      if (fn) {
        const val = getVar(fnMatch[2].trim());
        if (val !== undefined) { const r = fn(val); return formatVar(r); }
      }
      return m;
    }
    // dot path: {gracz.hp} or simple: {imię}
    const val = getVar(expr);
    if (val !== undefined) return formatVar(val);
    return m;
  });
}

function evalMath(expr) {
  // first interpolate variables
  const resolved = interpolateVars(expr);
  // tokenize: numbers (incl. negative), operators, parens
  const tokens = resolved.match(/-?\d+(\.\d+)?|[+\-*/()%]/g);
  if (!tokens) return NaN;
  // simple recursive descent parser
  let pos = 0;
  function peek() { return tokens[pos]; }
  function next() { return tokens[pos++]; }
  function parseExpr() {
    let val = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = next();
      const right = parseTerm();
      val = op === '+' ? val + right : val - right;
    }
    return val;
  }
  function parseTerm() {
    let val = parseFactor();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const op = next();
      const right = parseFactor();
      if (op === '*') val *= right;
      else if (op === '/') val = right !== 0 ? val / right : NaN;
      else val = right !== 0 ? val % right : NaN;
    }
    return val;
  }
  function parseFactor() {
    if (peek() === '(') { next(); const val = parseExpr(); next(); return val; }
    return parseFloat(next()) || 0;
  }
  const result = parseExpr();
  return Number.isInteger(result) ? result : Math.round(result * 1000) / 1000;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── EXAMPLES ──
const EXAMPLES = {
  askDemo: {
    icon: '🙋', title: 'Zapytaj', desc: 'Pytaj użytkownika i używaj odpowiedzi!',
    versions: [
      { label: 'powitanie', blocks: [
        { type: 'start', vals: {} },
        { type: 'ask', vals: { text: 'Jak masz na imię?', name: 'imię' } },
        { type: 'say', vals: { text: 'Cześć {imię}! 👋' } },
        { type: 'ask', vals: { text: 'Ile masz lat?', name: 'wiek' } },
        { type: 'say', vals: { text: '{imię} ma {wiek} lat!' } },
        { type: 'end', vals: {} },
      ]},
      { label: 'quiz', blocks: [
        { type: 'start', vals: {} },
        { type: 'set-var', vals: { name: 'punkty', value: '0' } },
        { type: 'say', vals: { text: '🧠 Quiz! Odpowiedz na 3 pytania.' } },
        { type: 'ask', vals: { text: 'Stolica Polski?', name: 'odp' } },
        { type: 'if-else', vals: { left: '{odp}', op: '=', right: 'Warszawa' },
          children: [
            { type: 'say', vals: { text: '✅ Brawo!' } },
            { type: 'change-var', vals: { name: 'punkty', delta: '1' } },
          ],
          elseChildren: [
            { type: 'say', vals: { text: '❌ Nie! To Warszawa.' } },
          ],
        },
        { type: 'ask', vals: { text: 'Ile nóg ma pająk?', name: 'odp' } },
        { type: 'if-else', vals: { left: '{odp}', op: '=', right: '8' },
          children: [
            { type: 'say', vals: { text: '✅ Brawo!' } },
            { type: 'change-var', vals: { name: 'punkty', delta: '1' } },
          ],
          elseChildren: [
            { type: 'say', vals: { text: '❌ Nie! Pająk ma 8 nóg.' } },
          ],
        },
        { type: 'ask', vals: { text: 'Największa planeta?', name: 'odp' } },
        { type: 'if-else', vals: { left: '{odp}', op: '=', right: 'Jowisz' },
          children: [
            { type: 'say', vals: { text: '✅ Brawo!' } },
            { type: 'change-var', vals: { name: 'punkty', delta: '1' } },
          ],
          elseChildren: [
            { type: 'say', vals: { text: '❌ Nie! To Jowisz.' } },
          ],
        },
        { type: 'say', vals: { text: '🏆 Wynik: {punkty}/3 punktów!' } },
        { type: 'end', vals: {} },
      ]},
      { label: 'zgadywanka', blocks: [
        { type: 'start', vals: {} },
        { type: 'random-num', vals: { name: 'sekret', min: '1', max: '10' } },
        { type: 'say', vals: { text: '🎯 Zgadnij liczbę od 1 do 10!' } },
        { type: 'set-var', vals: { name: 'próby', value: '0' } },
        { type: 'group', vals: { name: 'zgaduj' }, children: [
          { type: 'ask', vals: { text: 'Twój strzał?', name: 'strzał' } },
          { type: 'change-var', vals: { name: 'próby', delta: '1' } },
          { type: 'if-else', vals: { left: '{strzał}', op: '=', right: '{sekret}' },
            children: [
              { type: 'say', vals: { text: '🎉 Brawo! Zgadłeś w {próby} próbach!' } },
            ],
            elseChildren: [
              { type: 'if-else', vals: { left: '{strzał}', op: '<', right: '{sekret}' },
                children: [
                  { type: 'say', vals: { text: '📈 Za mało! Spróbuj wyżej.' } },
                ],
                elseChildren: [
                  { type: 'say', vals: { text: '📉 Za dużo! Spróbuj niżej.' } },
                ],
              },
              { type: 'goto', vals: { target: 'zgaduj' } },
            ],
          },
        ]},
        { type: 'end', vals: {} },
      ]},
    ],
  },
  hello: {
    icon: '👋', title: 'Powitanie', desc: 'Zapisz imię w zmiennej i przywitaj się!',
    versions: [
      { label: 'prosta', blocks: [
        { type: 'start', vals: {} },
        { type: 'say', vals: { text: 'Cześć Zosia!' } },
        { type: 'say', vals: { text: 'Miło Cię poznać!' } },
        { type: 'say', vals: { text: 'Pa pa!' } },
      ]},
      { label: 'ze zmienną', blocks: [
        { type: 'start', vals: {} },
        { type: 'set-var', vals: { name: 'imię', value: 'Zosia' } },
        { type: 'say', vals: { text: 'Cześć {imię}!' } },
        { type: 'say', vals: { text: 'Miło Cię poznać!' } },
        { type: 'wait', vals: { secs: '1' } },
        { type: 'say', vals: { text: 'Pa pa, {imię}! Do zobaczenia!' } },
      ]},
    ],
  },
  animal: {
    icon: '🐾', title: 'Losowe zwierzę', desc: 'Wylosuj zwierzę i powiedz co robi.',
    versions: [
      { label: 'jedno losowanie', blocks: [
        { type: 'start', vals: {} },
        { type: 'if-random', vals: { options: 'kot, pies, papuga, żółw, królik' } },
        { type: 'say', vals: { text: 'Mój zwierzak to: {_random}!' } },
      ]},
      { label: 'zwierzę + akcja', blocks: [
        { type: 'start', vals: {} },
        { type: 'if-random', vals: { options: 'kot, pies, papuga, żółw, królik' } },
        { type: 'set-var', vals: { name: 'zwierzę', value: '{_random}' } },
        { type: 'if-random', vals: { options: 'śpi, je, biega, tańczy, śpiewa' } },
        { type: 'say', vals: { text: 'Mój {zwierzę} właśnie {_random}!' } },
      ]},
      { label: '3 zwierzęta w pętli', blocks: [
        { type: 'start', vals: {} },
        { type: 'say', vals: { text: 'Losujemy 3 zwierzęta!' } },
        { type: 'repeat', vals: { times: '3' } },
        { type: 'group', vals: { name: 'losowanie' }, children: [
          { type: 'if-random', vals: { options: 'kot, pies, papuga, żółw, królik' } },
          { type: 'set-var', vals: { name: 'zwierzę', value: '{_random}' } },
          { type: 'if-random', vals: { options: 'śpi, je, biega, tańczy, śpiewa' } },
          { type: 'say', vals: { text: 'Mój {zwierzę} właśnie {_random}!' } },
          { type: 'wait', vals: { secs: '1' } },
        ]},
      ]},
    ],
  },
  countdown: {
    icon: '🚀', title: 'Odliczanie', desc: 'Odlicz do startu rakiety!',
    versions: [
      { label: 'ręczne 3-2-1', blocks: [
        { type: 'start', vals: {} },
        { type: 'say', vals: { text: 'Uwaga! Odliczam...' } },
        { type: 'say', vals: { text: '3...' } },
        { type: 'wait', vals: { secs: '1' } },
        { type: 'say', vals: { text: '2...' } },
        { type: 'wait', vals: { secs: '1' } },
        { type: 'say', vals: { text: '1...' } },
        { type: 'wait', vals: { secs: '1' } },
        { type: 'say', vals: { text: '🚀 START!' } },
      ]},
      { label: 'pętla + matematyka', blocks: [
        { type: 'start', vals: {} },
        { type: 'set-var', vals: { name: 'licznik', value: '5' } },
        { type: 'say', vals: { text: 'Uwaga! Odliczam od {licznik}...' } },
        { type: 'repeat', vals: { times: '5' } },
        { type: 'group', vals: { name: 'odliczanie' }, children: [
          { type: 'say', vals: { text: '{licznik}...' } },
          { type: 'change-var', vals: { name: 'licznik', delta: '-1' } },
          { type: 'wait', vals: { secs: '1' } },
        ]},
        { type: 'say', vals: { text: '🚀 START! Rakieta wystartowała!' } },
      ]},
    ],
  },
  story: {
    icon: '📖', title: 'Generator zdań', desc: 'Losuj słowa i buduj śmieszne zdania.',
    versions: [
      { label: 'jedno zdanie', blocks: [
        { type: 'start', vals: {} },
        { type: 'if-random', vals: { options: 'Wesoły, Śpiący, Odważny, Głodny' } },
        { type: 'set-var', vals: { name: 'jaki', value: '{_random}' } },
        { type: 'if-random', vals: { options: 'smok, robot, kotek, pirat' } },
        { type: 'say', vals: { text: '{jaki} {_random} poszedł na lody!' } },
      ]},
      { label: '3 zdania w pętli', blocks: [
        { type: 'start', vals: {} },
        { type: 'set-var', vals: { name: 'ile', value: '0' } },
        { type: 'say', vals: { text: 'Generuję 3 śmieszne zdania!' } },
        { type: 'repeat', vals: { times: '3' } },
        { type: 'group', vals: { name: 'generuj zdanie' }, children: [
          { type: 'change-var', vals: { name: 'ile', delta: '1' } },
          { type: 'if-random', vals: { options: 'Wesoły, Śpiący, Odważny, Głodny, Latający' } },
          { type: 'set-var', vals: { name: 'jaki', value: '{_random}' } },
          { type: 'if-random', vals: { options: 'smok, robot, kotek, pirat, astronauta' } },
          { type: 'set-var', vals: { name: 'kto', value: '{_random}' } },
          { type: 'if-random', vals: { options: 'poszedł na lody, poleciał na Marsa, znalazł skarb, nauczył się latać' } },
          { type: 'say', vals: { text: '{ile}. {jaki} {kto} {_random}!' } },
        ]},
        { type: 'say', vals: { text: 'Wygenerowano {ile} zdań!' } },
      ]},
    ],
  },
  quiz: {
    icon: '📎', title: 'Quiz zwierzęcy', desc: 'Grupa + Powtórz = 3 rundy quizu!',
    versions: [
      { label: 'bez punktów', blocks: [
        { type: 'start', vals: {} },
        { type: 'say', vals: { text: 'Quiz zwierzęcy! 3 rundy!' } },
        { type: 'repeat', vals: { times: '3' } },
        { type: 'group', vals: { name: 'runda quizu' }, children: [
          { type: 'if-random', vals: { options: 'kot, pies, papuga, żółw, delfin, orzeł' } },
          { type: 'set-var', vals: { name: 'zwierzę', value: '{_random}' } },
          { type: 'if-random', vals: { options: 'lata, pływa, biega, skacze, czołga się' } },
          { type: 'say', vals: { text: 'Czy {zwierzę} {_random}? 🤔' } },
          { type: 'wait', vals: { secs: '2' } },
        ]},
        { type: 'say', vals: { text: 'Koniec quizu! 🎉' } },
      ]},
      { label: 'z punktacją', blocks: [
        { type: 'start', vals: {} },
        { type: 'set-var', vals: { name: 'punkty', value: '0' } },
        { type: 'say', vals: { text: 'Quiz zwierzęcy z punktami! 3 rundy!' } },
        { type: 'repeat', vals: { times: '3' } },
        { type: 'group', vals: { name: 'runda quizu' }, children: [
          { type: 'if-random', vals: { options: 'kot, pies, papuga, żółw, delfin, orzeł' } },
          { type: 'set-var', vals: { name: 'zwierzę', value: '{_random}' } },
          { type: 'if-random', vals: { options: 'lata, pływa, biega, skacze, czołga się' } },
          { type: 'say', vals: { text: 'Czy {zwierzę} {_random}? 🤔' } },
          { type: 'random-num', vals: { name: 'runda_pkt', min: '1', max: '10' } },
          { type: 'change-var', vals: { name: 'punkty', delta: '{runda_pkt}' } },
          { type: 'say', vals: { text: '+{runda_pkt} pkt! Razem: {punkty}' } },
          { type: 'wait', vals: { secs: '2' } },
        ]},
        { type: 'say', vals: { text: 'Wynik końcowy: {punkty} punktów! 🏆' } },
      ]},
    ],
  },
  mathDemo: {
    icon: '🎲', title: 'Gra w kości', desc: 'Rzuć kostką, licz punkty i średnią!',
    versions: [
      { label: '1 rzut', blocks: [
        { type: 'start', vals: {} },
        { type: 'random-num', vals: { name: 'kostka', min: '1', max: '6' } },
        { type: 'say', vals: { text: '🎲 Wyrzuciłeś: {kostka}!' } },
      ]},
      { label: '3 rzuty + średnia', blocks: [
        { type: 'start', vals: {} },
        { type: 'set-var', vals: { name: 'punkty', value: '0' } },
        { type: 'say', vals: { text: 'Gra w kości! 3 rzuty.' } },
        { type: 'repeat', vals: { times: '3' } },
        { type: 'group', vals: { name: 'rzut kostką' }, children: [
          { type: 'random-num', vals: { name: 'kostka', min: '1', max: '6' } },
          { type: 'say', vals: { text: '🎲 Wyrzuciłeś: {kostka}' } },
          { type: 'change-var', vals: { name: 'punkty', delta: '{kostka}' } },
          { type: 'wait', vals: { secs: '1' } },
        ]},
        { type: 'say', vals: { text: 'Suma punktów: {punkty}' } },
        { type: 'math-set', vals: { name: 'średnia', expr: '{punkty} / 3' } },
        { type: 'say', vals: { text: 'Średnia: {średnia}' } },
        { type: 'if-else', vals: { left: '{punkty}', op: '>', right: '12' },
          children: [
            { type: 'say', vals: { text: '🏆 Świetny wynik!' } },
          ],
          elseChildren: [
            { type: 'say', vals: { text: '💪 Następnym razem będzie lepiej!' } },
          ],
        },
      ]},
    ],
  },
  ifElseDemo: {
    icon: '❓', title: 'Jeżeli... to...', desc: 'Losuj zwierzę i sprawdź czy to kot!',
    versions: [
      { label: 'prosty warunek', blocks: [
        { type: 'start', vals: {} },
        { type: 'if-random', vals: { options: 'kot, pies, papuga' } },
        { type: 'set-var', vals: { name: 'zwierzę', value: '{_random}' } },
        { type: 'if-else', vals: { left: '{zwierzę}', op: '=', right: 'kot' },
          children: [
            { type: 'say', vals: { text: '🐱 Miau! To kot!' } },
          ],
          elseChildren: [
            { type: 'say', vals: { text: '🤷 To nie kot, to {zwierzę}!' } },
          ],
        },
      ]},
      { label: 'wiele warunków', blocks: [
        { type: 'start', vals: {} },
        { type: 'if-random', vals: { options: 'kot, pies, papuga' } },
        { type: 'set-var', vals: { name: 'zwierzę', value: '{_random}' } },
        { type: 'if-else', vals: { left: '{zwierzę}', op: '=', right: 'kot' },
          children: [
            { type: 'say', vals: { text: '🐱 Miau! To kot!' } },
          ],
          elseChildren: [
            { type: 'say', vals: { text: '🤷 To nie kot, to {zwierzę}!' } },
          ],
        },
        { type: 'if-else', vals: { left: '{zwierzę}', op: '=', right: 'papuga' },
          children: [
            { type: 'say', vals: { text: '🦜 Papuga mówi: Witaj!' } },
          ],
          elseChildren: [],
        },
        { type: 'say', vals: { text: 'Koniec sprawdzania!' } },
      ]},
    ],
  },
  debugDemo: {
    icon: '⏸', title: 'Pauza demo', desc: 'Zatrzymaj program i sprawdź zmienne.',
    versions: [
      { label: 'z pauzami', blocks: [
        { type: 'start', vals: {} },
        { type: 'set-var', vals: { name: 'licznik', value: '0' } },
        { type: 'debug-stop', vals: { msg: 'przed losowaniem' } },
        { type: 'if-random', vals: { options: 'jabłko, banan, winogrono, arbuz' } },
        { type: 'set-var', vals: { name: 'owoc', value: '{_random}' } },
        { type: 'debug-stop', vals: { msg: 'po losowaniu — sprawdź zmienne' } },
        { type: 'say', vals: { text: 'Wylosowany owoc: {owoc}!' } },
        { type: 'say', vals: { text: 'Sprawdź zakładkę Zmienne i Konsolę!' } },
      ]},
    ],
  },
  mathDemo: {
    icon: '📐', title: 'Matematyka', desc: 'Obliczenia, wzory i kalkulator!',
    versions: [
      { label: 'proste działania', blocks: [
        { type: 'start', vals: {} },
        { type: 'set-var', vals: { name: 'a', value: '12' } },
        { type: 'set-var', vals: { name: 'b', value: '5' } },
        { type: 'math-set', vals: { name: 'suma', expr: '{a} + {b}' } },
        { type: 'math-set', vals: { name: 'różnica', expr: '{a} - {b}' } },
        { type: 'math-set', vals: { name: 'iloczyn', expr: '{a} * {b}' } },
        { type: 'say', vals: { text: '{a} + {b} = {suma}' } },
        { type: 'say', vals: { text: '{a} - {b} = {różnica}' } },
        { type: 'say', vals: { text: '{a} × {b} = {iloczyn}' } },
        { type: 'end', vals: {} },
      ]},
      { label: 'pole i obwód', blocks: [
        { type: 'start', vals: {} },
        { type: 'say', vals: { text: '📏 Obliczam pole i obwód prostokąta!' } },
        { type: 'set-var', vals: { name: 'bok_a', value: '8' } },
        { type: 'set-var', vals: { name: 'bok_b', value: '5' } },
        { type: 'math-set', vals: { name: 'pole', expr: '{bok_a} * {bok_b}' } },
        { type: 'math-set', vals: { name: 'obwód', expr: '2 * ({bok_a} + {bok_b})' } },
        { type: 'say', vals: { text: 'Prostokąt {bok_a} × {bok_b}' } },
        { type: 'say', vals: { text: '📐 Pole = {pole}' } },
        { type: 'say', vals: { text: '📏 Obwód = {obwód}' } },
        { type: 'wait', vals: { secs: '1' } },
        { type: 'say', vals: { text: '🔵 A teraz koło!' } },
        { type: 'set-var', vals: { name: 'r', value: '7' } },
        { type: 'math-set', vals: { name: 'pole_koła', expr: '3.14 * {r} * {r}' } },
        { type: 'math-set', vals: { name: 'obwód_koła', expr: '2 * 3.14 * {r}' } },
        { type: 'say', vals: { text: 'Koło o promieniu {r}' } },
        { type: 'say', vals: { text: '📐 Pole = {pole_koła}' } },
        { type: 'say', vals: { text: '📏 Obwód = {obwód_koła}' } },
        { type: 'end', vals: {} },
      ]},
      { label: 'tabliczka mnożenia', blocks: [
        { type: 'start', vals: {} },
        { type: 'set-var', vals: { name: 'liczba', value: '7' } },
        { type: 'say', vals: { text: '✖ Tabliczka mnożenia dla {liczba}!' } },
        { type: 'set-var', vals: { name: 'i', value: '1' } },
        { type: 'group', vals: { name: 'tabliczka' }, children: [
          { type: 'math-set', vals: { name: 'wynik', expr: '{liczba} * {i}' } },
          { type: 'say', vals: { text: '{liczba} × {i} = {wynik}' } },
          { type: 'change-var', vals: { name: 'i', delta: '1' } },
          { type: 'wait', vals: { secs: '0.3' } },
          { type: 'if-else', vals: { left: '{i}', op: '<', right: '11' },
            children: [
              { type: 'goto', vals: { target: 'tabliczka' } },
            ],
            elseChildren: [
              { type: 'say', vals: { text: '✅ Gotowe!' } },
            ],
          },
        ]},
        { type: 'end', vals: {} },
      ]},
    ],
  },
  objectsDemo: {
    icon: '🏗', title: 'Obiekty i listy', desc: 'Obiekt gracza, lista kolorów i metody!',
    versions: [
      { label: 'obiekt gracza', blocks: [
        { type: 'start', vals: {} },
        { type: 'say', vals: { text: '🏗 Tworzę obiekt gracza!' } },
        { type: 'obj-new', vals: { name: 'gracz', props: 'imię=Zosia, hp=100, atak=15' } },
        { type: 'say', vals: { text: '{gracz.imię}: HP={gracz.hp}, atak={gracz.atak}' } },
        { type: 'change-var', vals: { name: 'gracz.hp', delta: '-20' } },
        { type: 'say', vals: { text: '💥 Trafienie! HP spadło do {gracz.hp}' } },
        { type: 'end', vals: {} },
      ]},
      { label: 'lista + metody', blocks: [
        { type: 'start', vals: {} },
        { type: 'list-new', vals: { name: 'kolory', values: 'czerwony, niebieski, zielony, żółty' } },
        { type: 'say', vals: { text: 'Kolory: {połącz(kolory)}' } },
        { type: 'say', vals: { text: 'Ile: {długość(kolory)}' } },
        { type: 'say', vals: { text: 'Pierwszy: {pierwszy(kolory)}' } },
        { type: 'say', vals: { text: 'Ostatni: {ostatni(kolory)}' } },
        { type: 'say', vals: { text: 'Losowy: {losowy(kolory)}' } },
        { type: 'say', vals: { text: 'Element 0: {kolory.0}' } },
        { type: 'say', vals: { text: 'Element 2: {kolory.2}' } },
        { type: 'end', vals: {} },
      ]},
      { label: 'drużyna RPG', blocks: [
        { type: 'start', vals: {} },
        { type: 'say', vals: { text: '⚔️ Budujemy drużynę!' } },
        { type: 'set-var', vals: { name: 'wojownik.imię', value: 'Kuba' } },
        { type: 'set-var', vals: { name: 'wojownik.klasa', value: 'rycerz' } },
        { type: 'set-var', vals: { name: 'wojownik.hp', value: '120' } },
        { type: 'set-var', vals: { name: 'mag.imię', value: 'Ola' } },
        { type: 'set-var', vals: { name: 'mag.klasa', value: 'czarodziej' } },
        { type: 'set-var', vals: { name: 'mag.hp', value: '60' } },
        { type: 'say', vals: { text: '🛡 {wojownik.imię} ({wojownik.klasa}) — HP: {wojownik.hp}' } },
        { type: 'say', vals: { text: '🔮 {mag.imię} ({mag.klasa}) — HP: {mag.hp}' } },
        { type: 'list-new', vals: { name: 'drużyna' } },
        { type: 'list-add', vals: { name: 'drużyna', value: '{wojownik.imię}' } },
        { type: 'list-add', vals: { name: 'drużyna', value: '{mag.imię}' } },
        { type: 'say', vals: { text: 'Drużyna: {połącz(drużyna)} ({długość(drużyna)} os.)' } },
        { type: 'end', vals: {} },
      ]},
      { label: 'pętla po liście', blocks: [
        { type: 'start', vals: {} },
        { type: 'list-new', vals: { name: 'drużyna', values: 'Kuba, Ola, Janek, Maja' } },
        { type: 'say', vals: { text: '📋 Drużyna: {połącz(drużyna)}' } },
        { type: 'say', vals: { text: '👥 Członków: {długość(drużyna)}' } },
        { type: 'set-var', vals: { name: 'i', value: '0' } },
        { type: 'math-set', vals: { name: 'ile', expr: '{długość(drużyna)}' } },
        { type: 'group', vals: { name: 'pokaż' }, children: [
          { type: 'say', vals: { text: '👤 Nr {i}: {drużyna.{i}}' } },
          { type: 'change-var', vals: { name: 'i', delta: '1' } },
          { type: 'wait', vals: { secs: '0.3' } },
          { type: 'if-else', vals: { left: '{i}', op: '<', right: '{ile}' },
            children: [
              { type: 'goto', vals: { target: 'pokaż' } },
            ],
            elseChildren: [
              { type: 'say', vals: { text: '✅ Pokazano wszystkich!' } },
            ],
          },
        ]},
        { type: 'end', vals: {} },
      ]},
      { label: 'obiekty w pętli', blocks: [
        { type: 'start', vals: {} },
        { type: 'say', vals: { text: '⚔️ Tworzymy drużynę RPG!' } },
        { type: 'set-var', vals: { name: 'drużyna.0.imię', value: 'Kuba' } },
        { type: 'set-var', vals: { name: 'drużyna.0.klasa', value: '🛡 rycerz' } },
        { type: 'set-var', vals: { name: 'drużyna.0.hp', value: '120' } },
        { type: 'set-var', vals: { name: 'drużyna.1.imię', value: 'Ola' } },
        { type: 'set-var', vals: { name: 'drużyna.1.klasa', value: '🔮 czarodziej' } },
        { type: 'set-var', vals: { name: 'drużyna.1.hp', value: '60' } },
        { type: 'set-var', vals: { name: 'drużyna.2.imię', value: 'Janek' } },
        { type: 'set-var', vals: { name: 'drużyna.2.klasa', value: '🏹 łucznik' } },
        { type: 'set-var', vals: { name: 'drużyna.2.hp', value: '80' } },
        { type: 'set-var', vals: { name: 'ile', value: '3' } },
        { type: 'set-var', vals: { name: 'i', value: '0' } },
        { type: 'group', vals: { name: 'pokaż' }, children: [
          { type: 'say', vals: { text: '{drużyna.{i}.klasa} {drużyna.{i}.imię} — HP: {drużyna.{i}.hp}' } },
          { type: 'change-var', vals: { name: 'i', delta: '1' } },
          { type: 'wait', vals: { secs: '0.5' } },
          { type: 'if-else', vals: { left: '{i}', op: '<', right: '{ile}' },
            children: [
              { type: 'goto', vals: { target: 'pokaż' } },
            ],
            elseChildren: [
              { type: 'say', vals: { text: '✅ Drużyna gotowa! ({ile} postaci)' } },
            ],
          },
        ]},
        { type: 'end', vals: {} },
      ]},
      { label: 'generator drużyny', blocks: [
        { type: 'start', vals: {} },
        { type: 'say', vals: { text: '⚔️ Generator drużyny RPG!' } },
        { type: 'list-new', vals: { name: 'imiona', values: 'Kuba, Ola, Janek, Maja, Tomek, Zosia' } },
        { type: 'list-new', vals: { name: 'klasy', values: '🛡 rycerz, 🔮 czarodziej, 🏹 łucznik, 🗡 złodziej' } },
        { type: 'list-new', vals: { name: 'bronie', values: '⚔️ miecz, 🪄 różdżka, 🏹 łuk, 🗡 sztylet, 🔨 młot' } },
        { type: 'ask', vals: { text: 'Ilu członków drużyny? (1-6)', name: 'ile' } },
        { type: 'set-var', vals: { name: 'i', value: '0' } },
        { type: 'group', vals: { name: 'twórz' }, children: [
          { type: 'set-var', vals: { name: 'gracz.{i}.imię', value: '{losowy(imiona)}' } },
          { type: 'set-var', vals: { name: 'gracz.{i}.klasa', value: '{losowy(klasy)}' } },
          { type: 'set-var', vals: { name: 'gracz.{i}.broń', value: '{losowy(bronie)}' } },
          { type: 'random-num', vals: { name: 'gracz.{i}.hp', min: '50', max: '150' } },
          { type: 'random-num', vals: { name: 'gracz.{i}.atak', min: '5', max: '25' } },
          { type: 'say', vals: { text: '✨ Stworzono: {gracz.{i}.imię}!' } },
          { type: 'change-var', vals: { name: 'i', delta: '1' } },
          { type: 'wait', vals: { secs: '0.3' } },
          { type: 'if-else', vals: { left: '{i}', op: '<', right: '{ile}' },
            children: [
              { type: 'goto', vals: { target: 'twórz' } },
            ],
            elseChildren: [],
          },
        ]},
        { type: 'say', vals: { text: '📋 Drużyna ({ile} postaci):' } },
        { type: 'set-var', vals: { name: 'i', value: '0' } },
        { type: 'group', vals: { name: 'pokaż' }, children: [
          { type: 'say', vals: { text: '{gracz.{i}.klasa} {gracz.{i}.imię} — HP:{gracz.{i}.hp} ATK:{gracz.{i}.atak} Broń:{gracz.{i}.broń}' } },
          { type: 'change-var', vals: { name: 'i', delta: '1' } },
          { type: 'wait', vals: { secs: '0.3' } },
          { type: 'if-else', vals: { left: '{i}', op: '<', right: '{ile}' },
            children: [
              { type: 'goto', vals: { target: 'pokaż' } },
            ],
            elseChildren: [
              { type: 'say', vals: { text: '⚔️ Gotowi do walki!' } },
            ],
          },
        ]},
        { type: 'end', vals: {} },
      ]},
      { label: 'obiekty na liście', blocks: [
        { type: 'start', vals: {} },
        { type: 'say', vals: { text: '⚔️ Kreator postaci!' } },
        { type: 'list-new', vals: { name: 'imiona', values: 'Kuba, Ola, Janek, Maja, Tomek, Zosia' } },
        { type: 'list-new', vals: { name: 'klasy', values: '🛡 rycerz, 🔮 mag, 🏹 łucznik, 🗡 złodziej' } },
        { type: 'list-new', vals: { name: 'bronie', values: '⚔️ miecz, 🪄 różdżka, 🏹 łuk, 🗡 sztylet, 🔨 młot' } },
        { type: 'list-new', vals: { name: 'drużyna' } },
        { type: 'ask', vals: { text: 'Ile postaci stworzyć? (1-6)', name: 'ile' } },
        { type: 'set-var', vals: { name: 'i', value: '0' } },
        { type: 'group', vals: { name: 'twórz' }, children: [
          { type: 'obj-new', vals: { name: 'postać', props: 'imię={losowy(imiona)}, klasa={losowy(klasy)}, broń={losowy(bronie)}' } },
          { type: 'random-num', vals: { name: 'postać.hp', min: '50', max: '150' } },
          { type: 'random-num', vals: { name: 'postać.atak', min: '5', max: '25' } },
          { type: 'list-add', vals: { name: 'drużyna', value: '@postać' } },
          { type: 'say', vals: { text: '✨ #{i}: {postać.imię} ({postać.klasa})' } },
          { type: 'change-var', vals: { name: 'i', delta: '1' } },
          { type: 'wait', vals: { secs: '0.3' } },
          { type: 'if-else', vals: { left: '{i}', op: '<', right: '{ile}' },
            children: [
              { type: 'goto', vals: { target: 'twórz' } },
            ],
            elseChildren: [],
          },
        ]},
        { type: 'say', vals: { text: '📋 Drużyna ({długość(drużyna)} postaci):' } },
        { type: 'set-var', vals: { name: 'i', value: '0' } },
        { type: 'group', vals: { name: 'pokaż' }, children: [
          { type: 'say', vals: { text: '{drużyna.{i}.klasa} {drużyna.{i}.imię} — HP:{drużyna.{i}.hp} ATK:{drużyna.{i}.atak} {drużyna.{i}.broń}' } },
          { type: 'change-var', vals: { name: 'i', delta: '1' } },
          { type: 'wait', vals: { secs: '0.3' } },
          { type: 'if-else', vals: { left: '{i}', op: '<', right: '{długość(drużyna)}' },
            children: [
              { type: 'goto', vals: { target: 'pokaż' } },
            ],
            elseChildren: [
              { type: 'say', vals: { text: '⚔️ Drużyna gotowa do walki!' } },
            ],
          },
        ]},
        { type: 'end', vals: {} },
      ]},
    ],
  },
  gotoDemo: {
    icon: '↩', title: 'Idź do (goto)', desc: 'Pętla z licznikiem i gra z goto!',
    versions: [
      { label: 'pętla for', blocks: [
        { type: 'start', vals: {} },
        { type: 'set-var', vals: { name: 'i', value: '1' } },
        { type: 'say', vals: { text: 'Liczę do 5!' } },
        { type: 'group', vals: { name: 'pętla' }, children: [
          { type: 'say', vals: { text: '👉 Krok {i}' } },
          { type: 'change-var', vals: { name: 'i', delta: '1' } },
          { type: 'wait', vals: { secs: '0.5' } },
          { type: 'if-else', vals: { left: '{i}', op: '<', right: '6' },
            children: [
              { type: 'goto', vals: { target: 'pętla' } },
            ],
            elseChildren: [
              { type: 'say', vals: { text: '✅ Gotowe! Policzyłem do 5.' } },
            ],
          },
        ]},
      ]},
      { label: 'gra w kości', blocks: [
        { type: 'start', vals: {} },
        { type: 'set-var', vals: { name: 'punkty', value: '0' } },
        { type: 'set-var', vals: { name: 'rzuty', value: '0' } },
        { type: 'say', vals: { text: '🎲 Zbierz 20 punktów!' } },
        { type: 'group', vals: { name: 'gra' }, children: [
          { type: 'random-num', vals: { name: 'kostka', min: '1', max: '6' } },
          { type: 'change-var', vals: { name: 'punkty', delta: '{kostka}' } },
          { type: 'change-var', vals: { name: 'rzuty', delta: '1' } },
          { type: 'say', vals: { text: '🎲 Rzut {rzuty}: wypadło {kostka} → razem {punkty}' } },
          { type: 'wait', vals: { secs: '0.5' } },
          { type: 'if-else', vals: { left: '{punkty}', op: '<', right: '20' },
            children: [
              { type: 'goto', vals: { target: 'gra' } },
            ],
            elseChildren: [
              { type: 'say', vals: { text: '🏆 Wygrałeś! {punkty} pkt w {rzuty} rzutach!' } },
            ],
          },
        ]},
      ]},
      { label: 'restart', blocks: [
        { type: 'start', vals: {} },
        { type: 'if-random', vals: { options: 'orzeł, reszka' } },
        { type: 'say', vals: { text: '🪙 Wypadło: {_random}' } },
        { type: 'wait', vals: { secs: '1' } },
        { type: 'if-else', vals: { left: '{_random}', op: '=', right: 'reszka' },
          children: [
            { type: 'say', vals: { text: '↩ Reszka — rzucam jeszcze raz!' } },
            { type: 'goto', vals: { target: 'start' } },
          ],
          elseChildren: [
            { type: 'say', vals: { text: '✅ Orzeł — koniec gry!' } },
          ],
        },
      ]},
    ],
  },
};

function cloneBlocks(arr) {
  return arr.map(b => {
    const clone = { id: ++blockCounter, type: b.type, vals: { ...b.vals } };
    if (b.children) clone.children = cloneBlocks(b.children);
    if (b.elseChildren) clone.elseChildren = cloneBlocks(b.elseChildren);
    return clone;
  });
}

function loadExample(name, vIdx) {
  const example = EXAMPLES[name];
  if (!example) return;
  const idx = vIdx !== undefined ? vIdx : example.versions.length - 1;
  const ver = example.versions[idx];
  if (!ver) return;
  blocks = cloneBlocks(ver.blocks);
  if (blocks.length === 0 || blocks[blocks.length - 1].type !== 'end') {
    blocks.push({ id: ++blockCounter, type: 'end', vals: {} });
  }
  currentExample = { name, vIdx: idx };
  renderBlocks();
  renderVersionBar();
}

function renderVersionBar() {
  const bar = document.getElementById('versionBar');
  if (!currentExample) {
    bar.style.display = 'none';
    return;
  }
  const ex = EXAMPLES[currentExample.name];
  if (!ex || ex.versions.length <= 1) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'flex';
  document.getElementById('versionBarTitle').textContent = ex.icon + ' ' + ex.title + ':';
  const chips = document.getElementById('versionBarChips');
  let html = `<select onchange="loadExample('${currentExample.name}',Number(this.value))" style="background:var(--card);border:1px solid var(--border);border-radius:6px;padding:4px 8px;color:var(--text);font-family:'Nunito',sans-serif;font-weight:700;font-size:12px;cursor:pointer;">`;
  ex.versions.forEach((v, i) => {
    html += `<option value="${i}" ${i === currentExample.vIdx ? 'selected' : ''}>v${i + 1} · ${v.label}</option>`;
  });
  html += `</select>`;
  chips.innerHTML = html;
}

// ── RENDER EXAMPLES ──
function renderExamplesGrid() {
  const grid = document.getElementById('examplesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.entries(EXAMPLES).forEach(([key, ex]) => {
    const lastIdx = ex.versions.length - 1;
    let html = `<div class="example-card" onclick="loadExample('${key}')">`;
    html += `<div class="ex-icon">${ex.icon}</div>`;
    html += `<div class="ex-title">${ex.title}</div>`;
    html += `<div class="ex-desc">${ex.desc}</div>`;
    if (ex.versions.length > 1) {
      html += `<select onclick="event.stopPropagation()" onchange="event.stopPropagation();loadExample('${key}',Number(this.value))" style="margin-top:6px;width:100%;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:5px 8px;color:var(--text);font-family:'Nunito',sans-serif;font-weight:700;font-size:11px;cursor:pointer;">`;
      ex.versions.forEach((v, i) => {
        html += `<option value="${i}" ${i === lastIdx ? 'selected' : ''}>v${i + 1} · ${v.label}</option>`;
      });
      html += `</select>`;
    }
    html += `</div>`;
    grid.insertAdjacentHTML('beforeend', html);
  });
}

// ── DRILL-DOWN MODE ──
let drillDown = null; // { arr, pathPrefix, label }

function openDrillDown(arr, pathPrefix, label) {
  drillDown = { arr, pathPrefix, label };
  document.getElementById('branchBar').style.display = 'flex';
  document.getElementById('branchBarLabel').textContent = label;
  renderDrillView();
}

function openBranchDrill(path, branch, label) {
  const b = getBlockByPath(path);
  if (!b) return;
  const arr = branch === 'then' ? b.children : b.elseChildren;
  openDrillDown(arr, path + '.' + branch, `❓ Jeżeli → ${label}`);
}

function openBlockDrill(path) {
  const b = getBlockByPath(path);
  if (!b) return;
  const def = BLOCK_DEFS[b.type];
  if (!def) return;
  if (def.isGroup) {
    openDrillDown(b.children, path, `📎 Grupa: ${b.vals.name || 'grupa'}`);
  } else if (def.isIfElse) {
    drillDown = { arr: [b], path, label: `❓ Jeżeli ${b.vals.left || ''} ${b.vals.op || '='} ${b.vals.right || ''}`, isBlock: true };
    document.getElementById('branchBar').style.display = 'flex';
    document.getElementById('branchBarLabel').textContent = drillDown.label;
    renderDrillView();
  }
}

function exitDrillDown() {
  drillDown = null;
  document.getElementById('branchBar').style.display = 'none';
  renderBlocks();
}

function renderDrillView() {
  if (!drillDown) return;
  const stack = document.getElementById('scriptStack');
  const hint = document.getElementById('dropHint');
  hint.style.display = 'none';
  stack.innerHTML = '';
  renderBlockList(drillDown.arr, stack, null);
  if (drillDown.arr.length === 0) {
    stack.innerHTML = '<div class="block-group-hint" style="padding:20px;text-align:center;">Przeciągnij bloki tutaj</div>';
  }
}

// ── INIT ──
const BUILD_HASH = '__COMMIT_HASH__';
renderBlocks();
renderExamplesGrid();
toggleAiBlocks(false);
document.getElementById('commitHash').textContent = BUILD_HASH;
