# Reflection

**Name / Andrew ID:** Michael Yeh / myeh2

**Recitation group members (Task 2):** Daniel Chen

---

### 1. Valid but weak

- **Property**: "returns exactly 5 colors" (Wordle). In the mutant run it killed 0 of 5 mutants because every mutant still returns 5 colors.
- **Why it's still valid**: the spec says the function "returns five colors, one per position of guess". That holds for every valid input, so the property doesn't give false alarm on the correct code. Killing only means these particular bugs are somewhere else, the check itself is still correct.
- **A bug it would catch**: an implementation that builds the result with push and only adds colors that matched. For example matchGuess('AAAAA', 'BBBBB') returns [] instead of five Bs. An off-by-one loop (i <= 5) that reutnrs 6 colors also fails. 


### 2. A generator problem, not a property problem

- **Mutant**: ignoresCounts and singlePass in Wordle. Both are supposed to be killed by "never credits a letter more times than the secret contains it", but with the full alphabet they were flaky (killed in only 4/5 runs).
- **What the generator failed to produce**: with the full A-Z alphabet, random 5-letter words don't line up the right repeated letters very often. These bugs only show up when the guess has a letter more times than the secret does, so the property was right but the inputs only sometimes reached the bug, which made the kill flaky.
- **How I fixed it**: shrank the alphabet to 'ABC' so repeated letters show up in almost every word.
- **Before** (ALPHABET = A-Z):

```
Running against 5 mutants (5 runs each)...

  ✔ allBlack       killed  by: guessing the secret gives all greens; an anagram of the secret has no blacks
      Counterexample: ["AAAAA"]
      AssertionError: expected [ 'B', 'B', 'B', 'B', 'B' ] to deeply equal [ 'G', 'G', 'G', 'G', 'G' ]
  ✔ greensOnly     killed  by: an anagram of the secret has no blacks
      Counterexample: [["AAAAP","PAAAA"]]
      AssertionError: expected [ 'B', 'G', 'G', 'G', 'B' ] to not include 'B'
  ~ ignoresCounts  flaky: killed in 4/5 runs  by: never credits a letter more times than the secret contains it
      Counterexample: ["KAAAA","AKAKA"]
      AssertionError: expected 2 to be less than or equal to 1
  ~ singlePass     flaky: killed in 4/5 runs  by: never credits a letter more times than the secret contains it
      Counterexample: ["AADAA","DADAA"]
      AssertionError: expected 2 to be less than or equal to 1
  ✔ swapped        killed  by: never credits a letter more times than the secret contains it
      Counterexample: ["AOAAA","AAMAA"]
      AssertionError: expected 1 to be less than or equal to 0

Mutation score: 3/5 killed (60%)
```

- **After** (ALPHABET = 'ABC'):

```
Running against 5 mutants (5 runs each)...

  ✔ allBlack       killed  by: guessing the secret gives all greens; an anagram of the secret has no blacks
      Counterexample: ["AAAAA"]
      AssertionError: expected [ 'B', 'B', 'B', 'B', 'B' ] to deeply equal [ 'G', 'G', 'G', 'G', 'G' ]
  ✔ greensOnly     killed  by: an anagram of the secret has no blacks
      Counterexample: [["AAACA","AAAAC"]]
      AssertionError: expected [ 'G', 'G', 'G', 'B', 'B' ] to not include 'B'
  ✔ ignoresCounts  killed  by: never credits a letter more times than the secret contains it
      Counterexample: ["ABAAA","AABAB"]
      AssertionError: expected 2 to be less than or equal to 1
  ✔ singlePass     killed  by: never credits a letter more times than the secret contains it
      Counterexample: ["AAAAB","AAABB"]
      AssertionError: expected 2 to be less than or equal to 1
  ✔ swapped        killed  by: never credits a letter more times than the secret contains it
      Counterexample: ["AAAAC","ABAAA"]
      AssertionError: expected 1 to be less than or equal to 0

Mutation score: 5/5 killed (100%)
```

### 3. Reading a counterexample

- **Counterexample** (mergesIntegerNeighbors, Intervals):

```
✔ mergesIntegerNeighbors  killed  by: covers exactly the same points as the input; leaves already-disjoint intervals alone
    Counterexample: [[[-8,-5],[-4,-4]]]
    AssertionError: point -4.5: expected true to be false // Object.is equality
```

- **Why it exposes the bug**: the spec says the result has to cover exactly the same points as the input, and "points means all real numbers, not just integers". [-8,-5] and [-4,-4] don't touch, so -4.5 sits in the gap between them and isn't covered by the input. The mutant merged them anyway because -5 and -4 are neighboring integers, so its output covers -4.5 and the differential check fails.

### 4. Your project

- **Function**: `ChangeContext.extract(file, original, proposed)` in `packages/core/src/change-context.ts`. It turns a proposed edit into a diff (patch + addition/deletion counts) that learn mode uses to generate the comprehension question.
- **Property 1 (conditional)**: if the original is `undefined` (a new file), the status is "added", there are 0 deletions, and the additions equal the number of lines in the proposed file.
- **Property 2 (metamorphic)**: swapping original and proposed swaps the counts, so the additions of one direction equal the deletions of the other.
- **Generator**: build the original as a list of lines from a small set of words so lines repeat, then build the proposed by applying random line edits (insert, delete, replace) to it. Sometimes leave off the trailing newline, and sometimes pass an empty original or `undefined` (new file).
- **What a naive generator gets wrong**: two random `fc.string()`s almost never contain newlines or share any lines, so every diff is just "delete everything, add everything". It would never test edits that are far apart (separate hunks) or close together (merged hunks), the missing trailing newline, or empty file vs. new file, which is where the bugs would be.
