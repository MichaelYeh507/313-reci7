import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

// Valid by construction: a start plus a non-negative length, so start <= end.
// Small ranges make overlapping and touching intervals common.
const interval: fc.Arbitrary<Interval> = fc
  .tuple(fc.integer({ min: -20, max: 20 }), fc.nat(10))
  .map(([start, length]): Interval => [start, start + length]);
const intervalList = fc.array(interval);

// Is point p inside some interval of the list?
const covers = (list: readonly Interval[], p: number) =>
  list.some(([s, e]) => s <= p && p <= e);

// Disjoint by construction: each interval starts at least 1 past the
// previous end, so no two intervals overlap or touch.
const disjointList: fc.Arbitrary<Interval[]> = fc
  .tuple(fc.integer({ min: -20, max: 20 }), fc.array(fc.tuple(fc.integer({ min: 1, max: 5 }), fc.nat(5))))
  .map(([first, steps]) => {
    const out: Interval[] = [];
    let end = first - 1;
    for (const [gap, length] of steps) {
      const start = end + gap;
      end = start + length;
      out.push([start, end]);
    }
    return out;
  });


describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Pattern: invariant. Each output interval has start <= end, and consecutive intervals are sorted with a gap between them.
  it('returns valid, sorted intervals that neither overlap nor touch', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (const [s, e] of out) expect(s).toBeLessThanOrEqual(e);
        for (let i = 0; i + 1 < out.length; i++) expect(out[i][1]).toBeLessThan(out[i + 1][0]);
      }),
    );
  });

  // Pattern: differential. A point is covered by the output exactly when it is covered by the input.
  it('covers exactly the same points as the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const ends = [...xs, ...out].flat();
        const lo = Math.min(...ends) - 1;
        const hi = Math.max(...ends) + 1;
        for (let p = lo; p <= hi; p += 0.5) {
          expect(covers(out, p), `point ${p}`).toBe(covers(xs, p));
        }
      }),
    );
  });

  // Pattern: metamorphic. Shuffling the input does not change the output.
  it('ignores the order of the input', () => {
    fc.assert(
      fc.property(
        intervalList.chain(xs => fc.tuple(fc.constant(xs), fc.shuffledSubarray(xs, { minLength: xs.length }))),
        ([xs, shuffled]) => {
          expect(mergeIntervals(shuffled)).toEqual(mergeIntervals(xs));
        },
      ),
    );
  });

  // Pattern: algebraic. Merging is idempotent: merging an already-merged list changes nothing.
  it('merging twice is the same as merging once', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: conditional. If no two input intervals overlap or touch, the output is the input unchanged.
  it('leaves already-disjoint intervals alone', () => {
    fc.assert(
      fc.property(disjointList, xs => {
        expect(mergeIntervals(xs)).toEqual(xs);
      }),
    );
  });

  // Pattern: invariant. Merging never modifies the input array or the intervals in it.
  it('does not modify its input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const before = xs.map(([s, e]) => [s, e]);
        mergeIntervals(xs);
        expect(xs).toEqual(before);
      }),
    );
  });

});
