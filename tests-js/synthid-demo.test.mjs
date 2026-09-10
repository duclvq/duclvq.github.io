import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeTokenIds,
  applyTopKWatermark,
  DEFAULT_SYNTHID_CONFIG,
} from "../assets/demos/synthid-text/synthid-demo.mjs";

test("matches Hugging Face SynthID g-values for a fixed token sequence", () => {
  const result = analyzeTokenIds([10, 20, 30, 40, 50, 60, 70, 80]);

  assert.deepEqual(result.trace.map((row) => row.gValues), [
    [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1],
    [0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
  ]);
  assert.equal(result.tokensScored, 4);
  assert.equal(result.depth, DEFAULT_SYNTHID_CONFIG.keys.length);
  assert.equal(result.trace.every((row) => row.scored), true);
});

test("excludes repeated four-token contexts from the signal score", () => {
  const result = analyzeTokenIds([1, 2, 3, 4, 5, 1, 2, 3, 4, 6]);

  assert.deepEqual(result.trace.map((row) => row.scored), [true, true, true, true, true, false]);
  assert.equal(result.tokensScored, 5);
});

test("top-k watermarking keeps only candidates and changes their distribution", () => {
  const logits = new Float32Array([0, 1, 2, 3, 4, 5]);
  const plain = applyTopKWatermark(logits, [10n, 20n, 30n, 40n], {
    topK: 3,
    watermark: false,
  });
  const marked = applyTopKWatermark(logits, [10n, 20n, 30n, 40n], {
    topK: 3,
    watermark: true,
  });

  assert.deepEqual(
    Array.from(plain, (value, index) => Number.isFinite(value) ? index : null).filter((value) => value !== null),
    [3, 4, 5],
  );
  assert.notDeepEqual(Array.from(marked), Array.from(plain));
  assert.equal(Array.from(marked).filter(Number.isFinite).length, 3);
});
