import { describe, expect, it } from 'vitest';
import fc from 'fast-check';  
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABC';

// Step 1: a generator for five-letter uppercase words.
// const word = ...

const wordFrom = (letters: string) =>
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5 }).map(cs => cs.join(''));
const word = wordFrom(ALPHABET);

// A secret plus a guess that rearranges the secret's letters.
const secretAndAnagram = fc
  .tuple(word, fc.shuffledSubarray([0, 1, 2, 3, 4], { minLength: 5 }))
  .map(([secret, order]) => [secret, order.map(i => secret[i]).join('')] as const);

// A consistent renaming of letters: ALPHABET[i] becomes renamed[i].
const renaming = fc.shuffledSubarray([...ALPHABET], { minLength: ALPHABET.length });

describe('matchGuess', () => {
  // Pattern: invariant. The result always has exactly five colors.
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        expect(matchGuess(secret, guess)).toHaveLength(5);
      }),
    );
  });

  // Pattern: invariant. Every color in the result is G, Y, or B.
  it('only uses the colors G, Y, B', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        for (const c of matchGuess(secret, guess)) expect(['G', 'Y', 'B']).toContain(c);
      }),
    );
  });

  // Pattern: conditional. If the guess equals the secret, every color is green.
  it('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(word, w => {
        expect(matchGuess(w, w)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });

  // Pattern: invariant. No letter is credited (green or yellow) more times than it appears in the secret.
  it('never credits a letter more times than the secret contains it', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        const result = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const credited = [...guess].filter((c, i) => c === letter && result[i] !== 'B').length;
          const inSecret = [...secret].filter(c => c === letter).length;
          expect(credited).toBeLessThanOrEqual(inSecret);
        }
      }),
    );
  });

  // Pattern: conditional. If the guess is an anagram of the secret, every
  // letter is credited, so nothing is black.
  it('an anagram of the secret has no blacks', () => {
    fc.assert(
      fc.property(secretAndAnagram, ([secret, guess]) => {
        expect(matchGuess(secret, guess)).not.toContain('B');
      }),
    );
  });

  // Pattern: metamorphic. Renaming letters consistently in both words does not change the colors.
  it('renaming letters consistently does not change the colors', () => {
    fc.assert(
      fc.property(word, word, renaming, (secret, guess, renamed) => {
        const rename = (w: string) => [...w].map(c => renamed[ALPHABET.indexOf(c)]).join('');
        expect(matchGuess(rename(secret), rename(guess))).toEqual(matchGuess(secret, guess));
      }),
    );
  });
});
