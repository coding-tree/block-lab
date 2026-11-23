// Tests for scripts/check-steps.mjs. Run: node --test scripts/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts', 'check-steps.mjs');
const tools = ['bit-stack', 'pixel-stack', 'radio-room', 'ai-block-studio', 'sort-lab'];

function run(dir) {
  return spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
}

// Copy the two JSON files and the mapped tools' pages into a temp dir.
function copyRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'check-steps-'));
  for (const f of ['curriculum-steps.json', 'curriculum-step-ids.json']) cpSync(join(root, f), join(dir, f));
  for (const t of tools) cpSync(join(root, t, 'index.html'), join(dir, t, 'index.html'));
  return dir;
}

test('the repo passes', () => {
  const r = run(root);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /5 tools/);
});

test('maps the five tools to their step ids', () => {
  const steps = JSON.parse(readFileSync(join(root, 'curriculum-steps.json'), 'utf8'));
  assert.deepEqual(steps, {
    'bit-stack': ['belt.white.first-programs'],
    'pixel-stack': ['belt.orange.games-with-logic'],
    'radio-room': ['belt.orange-blue.devices-and-messages'],
    'ai-block-studio': ['belt.orange-blue.devices-and-messages'],
    'sort-lab': ['side.algorithms'],
  });
});

test('fails and names an id that is not in the list', () => {
  const dir = copyRepo();
  const f = join(dir, 'curriculum-steps.json');
  const steps = JSON.parse(readFileSync(f, 'utf8'));
  steps['bit-stack'] = ['belt.white.no-such-step'];
  writeFileSync(f, JSON.stringify(steps));
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /bit-stack: unknown step id "belt\.white\.no-such-step"/);
});

test('fails when a page has no step line for its step', () => {
  const dir = copyRepo();
  const f = join(dir, 'pixel-stack', 'index.html');
  writeFileSync(f, readFileSync(f, 'utf8').replace(/data-curriculum-step="[^"]*"/, ''));
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /pixel-stack\/index\.html: no step line for "belt\.orange\.games-with-logic"/);
});

test('fails when the step line text does not match the list', () => {
  const dir = copyRepo();
  const f = join(dir, 'sort-lab', 'index.html');
  writeFileSync(f, readFileSync(f, 'utf8').replace('Algorytmy i zawody', 'Coś innego'));
  const r = run(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /sort-lab\/index\.html: step line should read "Ten krok w Coding Tree: Ścieżka boczna — Algorytmy i zawody"/);
});

// The map's `ranks` names, copied from curriculum-map.json in
// ctdojo-curriculum (commit 61244f5f0bf01ac9791264dc8c659fb7278a61a7).
const mapRanks = {
  'baby-bird': 'Baby Bird',
  white: 'Biały pas',
  orange: 'Pomarańczowy pas',
  'orange-blue': 'Pas pomarańczowy z niebieskim paskiem',
  blue: 'Niebieski pas',
  'blue-yellow': 'Pas niebieski z żółtym paskiem',
  yellow: 'Żółty pas',
  'yellow-green': 'Pas żółty z zielonym paskiem',
  green: 'Zielony pas',
  'green-brown': 'Pas zielony z brązowym paskiem',
  brown: 'Brązowy pas',
  'brown-gold': 'Pas brązowy ze złotym paskiem',
  black: 'Czarny pas',
};

test('belt names are the map ranks names', () => {
  const ids = JSON.parse(readFileSync(join(root, 'curriculum-step-ids.json'), 'utf8'));
  const belts = ids.filter((s) => s.id.startsWith('belt.'));
  assert.equal(belts.length, Object.keys(mapRanks).length);
  for (const s of belts) assert.equal(s.belt, mapRanks[s.id.split('.')[1]], s.id);
});

test('the radio-room step line uses the map name for a striped rank', () => {
  const html = readFileSync(join(root, 'radio-room', 'index.html'), 'utf8');
  assert.match(html, /Ten krok w Coding Tree: Pas pomarańczowy z niebieskim paskiem — Urządzenia i wiadomości/);
});
