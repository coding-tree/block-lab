// SortLab shared core — algorithm generators, item model, render, counters.
// Exposed on window.sortlab for the three sub-apps to consume. Inline tests
// run when the loading page has ?dev=1 in its query string.

(function () {
  'use strict';

  // 12-colour palette tuned for the dark block-lab theme. Items keep their
  // colour through swaps, so kids can track an individual card's journey
  // through the algorithm.
  const PALETTE = [
    '#ff5566', '#ffaa00', '#ffe066', '#00ff88',
    '#00ddff', '#4488ff', '#bb66ff', '#ff66cc',
    '#66bbff', '#88ffaa', '#ff8866', '#ddff66',
  ];

  // Seedable PRNG (mulberry32) so dev tests and demos are reproducible.
  function mulberry32(seed) {
    let s = (seed | 0) >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Deal n items with random values 1..99 and palette colours indexed by id.
  // Same colour always sticks to the same id, so swapping items moves both
  // the value AND the colour together — visually obvious in animations.
  function dealRandomHand(n, seed) {
    const rng = (seed === undefined || seed === null) ? Math.random : mulberry32(seed);
    const items = [];
    for (let i = 0; i < n; i++) {
      items.push({
        id: i,
        value: Math.floor(rng() * 99) + 1,
        color: PALETTE[i % PALETTE.length],
      });
    }
    return items;
  }

  // Apply a single op to a working items array. Used by consumers that want
  // to maintain their own visual copy independent of the algorithm's state.
  function applyOp(items, op) {
    if (op.kind === 'swap') {
      const t = items[op.i]; items[op.i] = items[op.j]; items[op.j] = t;
    } else if (op.kind === 'set') {
      items[op.i] = op.item;
    }
    // 'compare', 'mark', 'done' are read-only signals.
  }

  // Drain a generator and return both the final items and the full op stream.
  function runAlgorithm(initial, algo) {
    const items = initial.slice();
    const ops = [];
    for (const op of algo(initial)) {
      ops.push(op);
      applyOp(items, op);
    }
    return { items, ops };
  }

  // === Algorithms ===
  // Each generator works on a private copy of values (or items, for merge)
  // and yields position-indexed ops. Consumer keeps its own visual array
  // in sync via applyOp.

  function* bubbleSort(items) {
    const a = items.map(x => x.value);
    const n = a.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        yield { kind: 'compare', i: j, j: j + 1 };
        if (a[j] > a[j + 1]) {
          const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
          yield { kind: 'swap', i: j, j: j + 1 };
        }
      }
    }
    yield { kind: 'done' };
  }

  function* selectionSort(items) {
    const a = items.map(x => x.value);
    const n = a.length;
    for (let i = 0; i < n; i++) {
      let minIdx = i;
      yield { kind: 'mark', i, label: 'i' };
      for (let j = i + 1; j < n; j++) {
        yield { kind: 'compare', i: minIdx, j };
        if (a[j] < a[minIdx]) {
          minIdx = j;
          yield { kind: 'mark', i: minIdx, label: 'min' };
        }
      }
      if (minIdx !== i) {
        const t = a[i]; a[i] = a[minIdx]; a[minIdx] = t;
        yield { kind: 'swap', i, j: minIdx };
      }
    }
    yield { kind: 'done' };
  }

  function* insertionSort(items) {
    const a = items.map(x => x.value);
    const n = a.length;
    for (let i = 1; i < n; i++) {
      let j = i;
      while (j > 0) {
        yield { kind: 'compare', i: j - 1, j };
        if (a[j - 1] > a[j]) {
          const t = a[j - 1]; a[j - 1] = a[j]; a[j] = t;
          yield { kind: 'swap', i: j - 1, j };
          j--;
        } else {
          break;
        }
      }
    }
    yield { kind: 'done' };
  }

  // Merge sort uses 'set' ops because the natural shape of merge is "place
  // value v at position k", not a sequence of swaps. We track items (not just
  // values) so the consumer can keep colours pinned to ids during the merge.
  function* mergeSort(items) {
    const a = items.map(x => ({ ...x }));
    function* mergeRange(lo, hi) {
      if (hi - lo <= 1) return;
      const mid = (lo + hi) >> 1;
      yield* mergeRange(lo, mid);
      yield* mergeRange(mid, hi);
      const left = a.slice(lo, mid);
      const right = a.slice(mid, hi);
      let i = 0, j = 0, k = lo;
      while (i < left.length && j < right.length) {
        yield { kind: 'compare', i: lo + i, j: mid + j };
        if (left[i].value <= right[j].value) {
          a[k] = left[i++];
        } else {
          a[k] = right[j++];
        }
        yield { kind: 'set', i: k, item: { ...a[k] } };
        k++;
      }
      while (i < left.length) { a[k] = left[i++]; yield { kind: 'set', i: k, item: { ...a[k] } }; k++; }
      while (j < right.length) { a[k] = right[j++]; yield { kind: 'set', i: k, item: { ...a[k] } }; k++; }
    }
    yield* mergeRange(0, a.length);
    yield { kind: 'done' };
  }

  // Quick sort with Lomuto partition. Pivot is the last element of each
  // sub-range so the kid sees a single element get marked, then partitioned
  // around. Easy to follow visually.
  function* quickSort(items) {
    const a = items.map(x => x.value);
    function* qs(lo, hi) {
      if (lo >= hi) return;
      const pivotPos = hi;
      const pivot = a[pivotPos];
      yield { kind: 'mark', i: pivotPos, label: 'pivot' };
      let p = lo;
      for (let i = lo; i < hi; i++) {
        yield { kind: 'compare', i, j: pivotPos };
        if (a[i] < pivot) {
          if (i !== p) {
            const t = a[i]; a[i] = a[p]; a[p] = t;
            yield { kind: 'swap', i: p, j: i };
          }
          p++;
        }
      }
      if (p !== pivotPos) {
        const t = a[p]; a[p] = a[pivotPos]; a[pivotPos] = t;
        yield { kind: 'swap', i: p, j: pivotPos };
      }
      yield* qs(lo, p - 1);
      yield* qs(p + 1, hi);
    }
    yield* qs(0, a.length - 1);
    yield { kind: 'done' };
  }

  const ALGORITHMS = {
    bubble:    { name: 'Bubble',    fn: bubbleSort    },
    selection: { name: 'Selection', fn: selectionSort },
    insertion: { name: 'Insertion', fn: insertionSort },
    merge:     { name: 'Merge',     fn: mergeSort     },
    quick:     { name: 'Quick',     fn: quickSort     },
  };

  // Counters for live UI strips. Consumers reset and feed each op.
  function makeCounters() {
    return { compares: 0, swaps: 0, sets: 0, ticks: 0 };
  }
  function tallyOp(counters, op) {
    counters.ticks++;
    if (op.kind === 'compare') counters.compares++;
    else if (op.kind === 'swap') counters.swaps++;
    else if (op.kind === 'set')  counters.sets++;
  }

  // Canvas render — draws each item as a card (number on top + coloured bar).
  // `highlights` optional: { glow: [i,...], mark: { i: 'label' } }.
  function renderBars(canvas, items, highlights) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const n = items.length;
    if (!n) return;
    highlights = highlights || {};
    const headerH = 22;
    const footerH = highlights.mark ? 14 : 4;
    const barAreaH = H - headerH - footerH;
    const slotW = W / n;
    const cardW = Math.max(2, slotW * 0.84);
    const padX = (slotW - cardW) / 2;
    const maxValue = Math.max(...items.map(x => x.value), 1);

    for (let i = 0; i < n; i++) {
      const item = items[i];
      const x = i * slotW + padX;
      const valFrac = item.value / maxValue;
      const barH = Math.max(2, valFrac * barAreaH);
      const barY = H - footerH - barH;
      const glow = highlights.glow && highlights.glow.includes(i);
      if (glow) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillStyle = item.color;
      ctx.fillRect(x, barY, cardW, barH);
      ctx.shadowBlur = 0;
      // number on top
      ctx.fillStyle = '#e8e8f0';
      ctx.font = '12px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(item.value), x + cardW / 2, headerH / 2 + 2);
      // mark below (e.g., 'i', 'j', 'pivot')
      if (highlights.mark && highlights.mark[i]) {
        ctx.fillStyle = '#00ddff';
        ctx.font = '10px "DM Mono", monospace';
        ctx.fillText(highlights.mark[i], x + cardW / 2, H - 2);
      }
    }
  }

  // === Inline tests (run when ?dev=1) ===
  function isSorted(items) {
    for (let i = 1; i < items.length; i++) if (items[i - 1].value > items[i].value) return false;
    return true;
  }
  function valuesOf(items) { return items.map(x => x.value); }
  function multisetEqual(a, b) {
    if (a.length !== b.length) return false;
    const sa = a.slice().sort((x, y) => x - y);
    const sb = b.slice().sort((x, y) => x - y);
    for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
    return true;
  }

  function runDevTests() {
    const fail = [], pass = [];
    const t = (name, cond) => (cond ? pass : fail).push(name);

    const seeds = [1, 7, 42, 123];
    const sizes = [0, 1, 2, 8, 20];
    const algos = Object.keys(ALGORITHMS);

    for (const algoKey of algos) {
      const algo = ALGORITHMS[algoKey].fn;
      for (const seed of seeds) {
        for (const n of sizes) {
          const initial = dealRandomHand(n, seed);
          const initialValues = valuesOf(initial);
          const { items, ops } = runAlgorithm(initial, algo);
          t(`${algoKey} n=${n} seed=${seed} sorted`, isSorted(items));
          t(`${algoKey} n=${n} seed=${seed} same multiset`,
            multisetEqual(valuesOf(items), initialValues));
          t(`${algoKey} n=${n} seed=${seed} ops end with done`,
            ops.length > 0 && ops[ops.length - 1].kind === 'done');
        }
      }
    }

    // Already-sorted input: still produces sorted output.
    for (const algoKey of algos) {
      const sortedInput = dealRandomHand(10, 1)
        .map((it, i) => ({ ...it, value: i + 1 }));
      const { items } = runAlgorithm(sortedInput, ALGORITHMS[algoKey].fn);
      t(`${algoKey} idempotent on sorted input`, isSorted(items));
    }

    // Reverse-sorted input.
    for (const algoKey of algos) {
      const reverseInput = dealRandomHand(10, 1)
        .map((it, i) => ({ ...it, value: 10 - i }));
      const { items } = runAlgorithm(reverseInput, ALGORITHMS[algoKey].fn);
      t(`${algoKey} sorts reversed input`, isSorted(items));
    }

    // All-same-values input.
    for (const algoKey of algos) {
      const flat = dealRandomHand(8, 1).map(it => ({ ...it, value: 5 }));
      const { items } = runAlgorithm(flat, ALGORITHMS[algoKey].fn);
      t(`${algoKey} stable-ish on uniform input`, isSorted(items) && items.length === 8);
    }

    // Op semantics.
    {
      const init = dealRandomHand(5, 42);
      const { items, ops } = runAlgorithm(init, bubbleSort);
      // Re-derive items by replaying ops on a fresh copy:
      const replay = init.slice();
      for (const op of ops) applyOp(replay, op);
      t('replay matches generator final state',
        replay.every((it, i) => it.id === items[i].id && it.value === items[i].value));
    }

    console.log('%cSortLab core dev tests', 'font-weight:bold',
                `${pass.length} pass, ${fail.length} fail`);
    pass.forEach(n => console.log('  ✅', n));
    fail.forEach(n => console.warn('  ❌', n));
    return { pass: pass.length, fail: fail.length };
  }

  // Expose
  const sortlab = {
    PALETTE, mulberry32, dealRandomHand,
    applyOp, runAlgorithm,
    bubbleSort, selectionSort, insertionSort, mergeSort, quickSort,
    ALGORITHMS,
    makeCounters, tallyOp,
    renderBars,
    runDevTests,
  };
  if (typeof window !== 'undefined') window.sortlab = sortlab;
  if (typeof module !== 'undefined' && module.exports) module.exports = sortlab;

  if (typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('dev') === '1') {
    window.addEventListener('load', () => setTimeout(runDevTests, 50));
  }
})();
