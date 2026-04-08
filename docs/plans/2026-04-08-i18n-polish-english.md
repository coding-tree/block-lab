# i18n: Polish/English Language Support

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add English translations with a language switcher; Polish is the default.

**Architecture:** Single `TRANSLATIONS` object with `pl`/`en` keys. A `t(key)` function resolves strings. `BLOCK_DEFS` labels/placeholders/suffixes are translation keys. HTML uses `data-i18n` attributes. Language toggle in header. On switch: update `currentLang`, re-render palette, canvas, and output tabs. Stored in localStorage for persistence.

**Tech Stack:** Vanilla JS, no libraries.

---

## Scope

### What gets translated (3 layers):

1. **Static UI** (HTML) — palette headers, buttons, tabs, mode labels, tooltips
2. **Block definitions** — labels, placeholders, suffixes in BLOCK_DEFS
3. **Runtime messages** — log labels, console output, error messages

### What does NOT get translated:

- User-entered text in blocks (variable names, values, expressions)
- Example block content (the actual program data — variable names like `gracz`, `imię` stay Polish)
- Example titles/descriptions — these are Polish curriculum content, keep as-is
- Built-in function names — already have PL+EN aliases (`długość`/`length`)

---

## Tasks

### Task 1: Create translation system (`i18n.js` section in script.js)

**Files:**
- Modify: `ai-scratch/script.js` (top of file, before BLOCK_DEFS)

**Step 1: Add translation infrastructure**

Add at top of script.js (after `let currentExample`):

```js
// ── i18n ──
let currentLang = localStorage.getItem('ai-scratch-lang') || 'pl';

const TRANSLATIONS = {
  pl: {
    // block labels
    'block.start': '▶ Start programu',
    'block.end': '🛑 Zakończ program',
    'block.say': '💬 Powiedz:',
    'block.ask': '🙋 Zapytaj:',
    'block.wait': '⏱ Czekaj:',
    'block.repeat': '🔁 Powtórz:',
    'block.if-random': '🎲 Losowo jeden z:',
    'block.set-var': '📦 Ustaw zmienną:',
    'block.show-var': '👁 Pokaż zmienną:',
    'block.change-var': '➕ Zmień zmienną o:',
    'block.math-set': '📐 Oblicz:',
    'block.random-num': '🎯 Losowa liczba:',
    'block.group': '📎 Grupa',
    'block.if-else': '❓ Jeżeli',
    'block.goto': '↩ Idź do:',
    'block.obj-new': '🏗 Nowy obiekt:',
    'block.list-new': '📋 Nowa lista:',
    'block.list-add': '➕ Dodaj do:',
    'block.debug-stop': '⏸ Pauza:',
    'block.ai-ask': '🤖 Zapytaj AI:',
    'block.ai-story': '📖 Napisz historię o:',
    'block.ai-explain': '💡 Wyjaśnij:',
    'block.ai-translate': '🌍 Przetłumacz na angielski:',
    'block.ai-poem': '🎵 Ułóż wiersz o:',

    // suffixes
    'suffix.sek': 'sek',
    'suffix.razy': 'razy',

    // placeholders
    'ph.text': 'tekst',
    'ph.question': 'Jak masz na imię?',
    'ph.answer': 'odpowiedź',
    'ph.secs': '1',
    'ph.times': '3',
    'ph.options': 'pies, kot, ryba',
    'ph.varName': 'imię',
    'ph.varValue': 'Zosia',
    'ph.delta': '1',
    'ph.mathName': 'wynik',
    'ph.mathExpr': '{x} + {y} * 2',
    'ph.dieName': 'kostka',
    'ph.groupName': 'moja grupa',
    'ph.checkpoint': 'checkpoint',
    'ph.gotoTarget': 'wybierz cel',
    'ph.objName': 'gracz',
    'ph.objProps': 'imię=Zosia, hp=100, atak=15',
    'ph.listName': 'kolory',
    'ph.listValues': 'czerwony, niebieski, zielony',
    'ph.listAddValue': 'czerwony',
    'ph.aiAsk': 'Skąd bierze się tęcza?',
    'ph.aiStory': 'dinozaurach',
    'ph.aiExplain': 'grawitację',
    'ph.aiTranslate': 'Cześć świecie',
    'ph.aiPoem': 'kosmosie',
    'ph.varPoints': 'punkty',

    // UI
    'ui.run': '▶ Uruchom',
    'ui.clear': '🗑 Wyczyść',
    'ui.projects': '💾 Projekty',
    'ui.noKey': 'brak klucza AI',
    'ui.keyActive': 'klucz aktywny',
    'ui.output': '📺 Output',
    'ui.console': '🖥 Konsola',
    'ui.vars': '📦 Zmienne',
    'ui.modeSay': '💬 Powiedz',
    'ui.modeAll': '📋 Wszystko',
    'ui.togglePause': '⏸ Wyłącz wszystkie pauzy',
    'ui.togglePauseOn': '▶ Włącz wszystkie pauzy',
    'ui.dragHint': 'Przeciągnij bloki tutaj i zbuduj swój program!',
    'ui.exampleHint': '...albo wypróbuj gotowy przykład:',
    'ui.dropHint': 'Przeciągnij bloki tutaj',
    'ui.dropHintBranch': 'Upuść blok lub grupę',
    'ui.dropHintBranchOpt': 'Upuść blok lub grupę (opcjonalne)',
    'ui.noVars': 'Brak zmiennych — uruchom program.',
    'ui.thenLabel': '✓ to:',
    'ui.elseLabel': '✗ inaczej:',
    'ui.ifLabel': '❓ Jeżeli',

    // palette headers
    'palette.program': '▶ Program',
    'palette.io': '💬 Wejście / Wyjście',
    'palette.control': '🔁 Sterowanie',
    'palette.data': '📦 Dane',
    'palette.math': '📐 Matematyka',
    'palette.ai': '🤖 AI',
    'palette.debug': '⏸ Pauza',

    // log labels
    'log.ai': '🤖 AI',
    'log.say': '💬 Skrypt',
    'log.ask': '🙋 Pytanie',
    'log.askAnswer': '✏️ Odpowiedź',
    'log.error': '❌ Błąd',
    'log.info': 'ℹ️ Info',
    'log.debug': '⏸ Pauza',

    // runtime messages
    'rt.programStart': 'Uruchamiam program...',
    'rt.programDone': '✅ Program zakończony!',
    'rt.programEndBlock': '🛑 Program zakończony przez blok "Zakończ"',
    'rt.noBlocks': 'Brak bloków! Przeciągnij bloki na płótno.',
    'rt.noStart': 'Zacznij od bloku "▶ Start programu"!',
    'rt.noEnd': 'Dodaj blok "🛑 Zakończ program" na końcu programu!',
    'rt.gotoNoTarget': 'Blok "Idź do" — brak celu!',
    'rt.gotoTooMany': 'Za dużo skoków (pętla nieskończona?) — zatrzymuję program.',
    'rt.gotoStart': '↩ Skok do startu',
    'rt.gotoGroup': '↩ Skok do grupy:',
    'rt.groupNotFound': 'Grupa nie znaleziona!',
    'rt.refNotFound': 'nie znaleziono obiektu!',
    'rt.varNotFound': 'nie istnieje!',
    'rt.askPlaceholder': 'wpisz odpowiedź...',

    // vars panel
    'var.name': 'Nazwa',
    'var.type': 'Typ',
    'var.value': 'Wartość',
    'var.list': 'lista',
    'var.object': 'obiekt',
    'var.number': 'liczba',
    'var.text': 'tekst',
  },
  en: {
    'block.start': '▶ Start program',
    'block.end': '🛑 End program',
    'block.say': '💬 Say:',
    'block.ask': '🙋 Ask:',
    'block.wait': '⏱ Wait:',
    'block.repeat': '🔁 Repeat:',
    'block.if-random': '🎲 Random pick:',
    'block.set-var': '📦 Set variable:',
    'block.show-var': '👁 Show variable:',
    'block.change-var': '➕ Change variable by:',
    'block.math-set': '📐 Calculate:',
    'block.random-num': '🎯 Random number:',
    'block.group': '📎 Group',
    'block.if-else': '❓ If',
    'block.goto': '↩ Go to:',
    'block.obj-new': '🏗 New object:',
    'block.list-new': '📋 New list:',
    'block.list-add': '➕ Add to:',
    'block.debug-stop': '⏸ Pause:',
    'block.ai-ask': '🤖 Ask AI:',
    'block.ai-story': '📖 Write story about:',
    'block.ai-explain': '💡 Explain:',
    'block.ai-translate': '🌍 Translate to English:',
    'block.ai-poem': '🎵 Write poem about:',

    'suffix.sek': 'sec',
    'suffix.razy': 'times',

    'ph.text': 'text',
    'ph.question': 'What is your name?',
    'ph.answer': 'answer',
    'ph.secs': '1',
    'ph.times': '3',
    'ph.options': 'dog, cat, fish',
    'ph.varName': 'name',
    'ph.varValue': 'Anna',
    'ph.delta': '1',
    'ph.mathName': 'result',
    'ph.mathExpr': '{x} + {y} * 2',
    'ph.dieName': 'dice',
    'ph.groupName': 'my group',
    'ph.checkpoint': 'checkpoint',
    'ph.gotoTarget': 'choose target',
    'ph.objName': 'player',
    'ph.objProps': 'name=Anna, hp=100, attack=15',
    'ph.listName': 'colors',
    'ph.listValues': 'red, blue, green',
    'ph.listAddValue': 'red',
    'ph.aiAsk': 'Where do rainbows come from?',
    'ph.aiStory': 'dinosaurs',
    'ph.aiExplain': 'gravity',
    'ph.aiTranslate': 'Hello world',
    'ph.aiPoem': 'space',
    'ph.varPoints': 'points',

    'ui.run': '▶ Run',
    'ui.clear': '🗑 Clear',
    'ui.projects': '💾 Projects',
    'ui.noKey': 'no AI key',
    'ui.keyActive': 'key active',
    'ui.output': '📺 Output',
    'ui.console': '🖥 Console',
    'ui.vars': '📦 Variables',
    'ui.modeSay': '💬 Say',
    'ui.modeAll': '📋 All',
    'ui.togglePause': '⏸ Disable all pauses',
    'ui.togglePauseOn': '▶ Enable all pauses',
    'ui.dragHint': 'Drag blocks here and build your program!',
    'ui.exampleHint': '...or try a ready-made example:',
    'ui.dropHint': 'Drag blocks here',
    'ui.dropHintBranch': 'Drop block or group',
    'ui.dropHintBranchOpt': 'Drop block or group (optional)',
    'ui.noVars': 'No variables — run the program.',
    'ui.thenLabel': '✓ then:',
    'ui.elseLabel': '✗ else:',
    'ui.ifLabel': '❓ If',

    'palette.program': '▶ Program',
    'palette.io': '💬 Input / Output',
    'palette.control': '🔁 Control',
    'palette.data': '📦 Data',
    'palette.math': '📐 Math',
    'palette.ai': '🤖 AI',
    'palette.debug': '⏸ Pause',

    'log.ai': '🤖 AI',
    'log.say': '💬 Script',
    'log.ask': '🙋 Question',
    'log.askAnswer': '✏️ Answer',
    'log.error': '❌ Error',
    'log.info': 'ℹ️ Info',
    'log.debug': '⏸ Pause',

    'rt.programStart': 'Starting program...',
    'rt.programDone': '✅ Program finished!',
    'rt.programEndBlock': '🛑 Program ended by "End" block',
    'rt.noBlocks': 'No blocks! Drag blocks to the canvas.',
    'rt.noStart': 'Start with "▶ Start program" block!',
    'rt.noEnd': 'Add "🛑 End program" block at the end!',
    'rt.gotoNoTarget': '"Go to" block — no target!',
    'rt.gotoTooMany': 'Too many jumps (infinite loop?) — stopping program.',
    'rt.gotoStart': '↩ Jump to start',
    'rt.gotoGroup': '↩ Jump to group:',
    'rt.groupNotFound': 'Group not found!',
    'rt.refNotFound': 'object not found!',
    'rt.varNotFound': 'does not exist!',
    'rt.askPlaceholder': 'type your answer...',

    'var.name': 'Name',
    'var.type': 'Type',
    'var.value': 'Value',
    'var.list': 'list',
    'var.object': 'object',
    'var.number': 'number',
    'var.text': 'text',
  },
};

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS.pl[key] ?? key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('ai-scratch-lang', lang);
  initBlockDefs();
  renderPalette();
  renderBlocks();
  renderVersionBar();
  updateVarsPanel();
  updateLangUI();
}
```

**Step 2: Make BLOCK_DEFS dynamic**

Replace static `BLOCK_DEFS` with a function that rebuilds it from translations:

```js
let BLOCK_DEFS = {};

function initBlockDefs() {
  BLOCK_DEFS = {
    'start':      { label: t('block.start'), cls: 'b-start', inputs: [] },
    'end':        { label: t('block.end'), cls: 'b-end', inputs: [] },
    // ... all block defs using t() for label, placeholder, suffix
  };
}
initBlockDefs(); // call once at load
```

**Step 3: Update log labels to use t()**

**Step 4: Update runtime messages to use t()**

**Step 5: Update vars panel to use t()**

### Task 2: Add language switcher to HTML

**Files:**
- Modify: `ai-scratch/index.html`

Add a language toggle in the header bar (next to the API key dot):

```html
<div class="lang-switch" onclick="setLang(currentLang === 'pl' ? 'en' : 'pl')">
  <span id="langLabel">PL</span>
</div>
```

Make palette headers use `data-i18n` attributes and render dynamically via `renderPalette()`.

### Task 3: Dynamic palette rendering

**Files:**
- Modify: `ai-scratch/script.js`

Move palette HTML from static index.html to a `renderPalette()` function in JS that generates it from BLOCK_DEFS + translations. This way language switch re-renders the palette.

### Task 4: Update updateLangUI() helper

Updates all `data-i18n` elements + button labels + tab names + the lang toggle label.

### Task 5: Test both languages

Verify in Playwright:
- Default is Polish
- Switch to English — all UI, palette, tabs update
- Run an example — runtime messages in English
- Switch back to Polish — everything reverts
- Reload — language persists (localStorage)

### Task 6: Commit

```bash
git add ai-scratch/
git commit -m "Add English translations with PL/EN language switcher"
```

---

## Estimated changes

- `script.js`: ~200 lines added (translations object), ~50 lines modified (t() calls)
- `index.html`: ~5 lines added (lang switch), palette becomes minimal shell
- `style.css`: ~10 lines (lang switch styling)
