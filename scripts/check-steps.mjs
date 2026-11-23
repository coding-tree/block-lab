#!/usr/bin/env node
// Checks curriculum-steps.json against the vendored curriculum-step-ids.json:
// every step id must be in the list, and each mapped tool's index.html must
// show the step line for its first step with the list's belt name and skill.
// Usage: node scripts/check-steps.mjs [repo root]   (no dependencies)
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'));

const known = new Map(readJson('curriculum-step-ids.json').map((s) => [s.id, s]));
const steps = readJson('curriculum-steps.json');
const errors = [];

const unescape = (s) => s.replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

for (const [tool, ids] of Object.entries(steps)) {
  if (!Array.isArray(ids) || ids.length === 0) {
    errors.push(`${tool}: expected a non-empty list of step ids`);
    continue;
  }
  for (const id of ids) {
    if (!known.has(id)) errors.push(`${tool}: unknown step id "${id}" (not in curriculum-step-ids.json)`);
  }
  const page = `${tool}/index.html`;
  if (!existsSync(join(root, page))) {
    errors.push(`${page}: page not found`);
    continue;
  }
  const step = known.get(ids[0]);
  if (!step) continue;
  const html = readFileSync(join(root, page), 'utf8');
  const m = html.match(new RegExp(`data-curriculum-step="${ids[0].replace(/\./g, '\\.')}"[^>]*>([^<]*)<`));
  const want = `Ten krok w Coding Tree: ${step.belt} — ${step.skill}`;
  if (!m) errors.push(`${page}: no step line for "${ids[0]}" (data-curriculum-step)`);
  else if (unescape(m[1]) !== want) errors.push(`${page}: step line should read "${want}", found "${unescape(m[1])}"`);
}

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}
console.log(`curriculum steps OK: ${Object.keys(steps).length} tools, ${known.size} known step ids`);
