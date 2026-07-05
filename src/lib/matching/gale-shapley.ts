export type Matching = {
  candidateOfSeeker: number[];
  seekerOfCandidate: number[];
};

/**
 * Classic deferred acceptance (Gale & Shapley, 1962). Seekers propose in
 * order of their preference lists; candidates hold their best offer and
 * trade up. Terminates with a stable matching.
 */
export function galeShapley(seekerPrefs: number[][], candidatePrefs: number[][]): Matching {
  const seekerCount = seekerPrefs.length;
  const candidateCount = candidatePrefs.length;

  // candidateRank[c][s] = how candidate c ranks seeker s (lower is better).
  const candidateRank: number[][] = candidatePrefs.map((prefs) => {
    const rank = new Array<number>(seekerCount).fill(Number.MAX_SAFE_INTEGER);
    prefs.forEach((seeker, position) => {
      rank[seeker] = position;
    });
    return rank;
  });

  const candidateOfSeeker = new Array<number>(seekerCount).fill(-1);
  const seekerOfCandidate = new Array<number>(candidateCount).fill(-1);
  const nextProposal = new Array<number>(seekerCount).fill(0);
  const freeSeekers: number[] = Array.from({ length: seekerCount }, (_, index) => index);

  while (freeSeekers.length > 0) {
    const seeker = freeSeekers.pop() as number;
    const prefs = seekerPrefs[seeker];
    if (nextProposal[seeker] >= prefs.length) continue; // exhausted list, stays unmatched

    const candidate = prefs[nextProposal[seeker]];
    nextProposal[seeker] += 1;

    const currentHolder = seekerOfCandidate[candidate];
    if (currentHolder === -1) {
      seekerOfCandidate[candidate] = seeker;
      candidateOfSeeker[seeker] = candidate;
    } else if (candidateRank[candidate][seeker] < candidateRank[candidate][currentHolder]) {
      seekerOfCandidate[candidate] = seeker;
      candidateOfSeeker[seeker] = candidate;
      candidateOfSeeker[currentHolder] = -1;
      freeSeekers.push(currentHolder);
    } else {
      freeSeekers.push(seeker);
    }
  }

  return { candidateOfSeeker, seekerOfCandidate };
}

/**
 * A pair (s, c) blocks the matching when both would rather be together than
 * stay with their assigned partners. A stable matching has zero.
 */
export function countBlockingPairs(
  seekerScores: number[][],
  candidateScores: number[][],
  matching: Matching
): number {
  let blocking = 0;
  const { candidateOfSeeker, seekerOfCandidate } = matching;
  for (let seeker = 0; seeker < seekerScores.length; seeker += 1) {
    for (let candidate = 0; candidate < candidateScores.length; candidate += 1) {
      if (candidateOfSeeker[seeker] === candidate) continue;
      const seekerCurrent = candidateOfSeeker[seeker];
      const candidateCurrent = seekerOfCandidate[candidate];
      const seekerPrefersOther =
        seekerCurrent === -1 || seekerScores[seeker][candidate] > seekerScores[seeker][seekerCurrent];
      const candidatePrefersOther =
        candidateCurrent === -1 || candidateScores[candidate][seeker] > candidateScores[candidate][candidateCurrent];
      if (seekerPrefersOther && candidatePrefersOther) blocking += 1;
    }
  }
  return blocking;
}
