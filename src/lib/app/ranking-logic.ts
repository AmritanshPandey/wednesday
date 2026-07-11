import type { RankingRound } from "@/types/ranking";

/** Ranking is complete once every pool round is submitted and — when there is
 *  more than one pool round — the finals round is in too. */
export function rankingComplete(rounds: RankingRound[]): boolean {
  if (rounds.length === 0) return false;
  const poolRounds = rounds.filter((round) => !round.isFinal);
  const finalRound = rounds.find((round) => round.isFinal);
  if (!poolRounds.every((round) => round.submitted)) return false;
  return poolRounds.length <= 1 ? true : Boolean(finalRound?.submitted);
}

export function currentRound(rounds: RankingRound[]): RankingRound | undefined {
  return rounds.find((round) => !round.submitted);
}

/** Given a just-submitted round, returns the next rounds array — adding the
 *  finals round of pool-round winners when the pool rounds are all in. */
export function withRoundSubmitted(rounds: RankingRound[], roundNumber: number): RankingRound[] {
  const next = rounds.map((r) => (r.round === roundNumber && !r.submitted ? { ...r, submitted: true } : r));
  const round = next.find((r) => r.round === roundNumber);
  if (!round) return rounds;

  const poolRounds = next.filter((r) => !r.isFinal);
  const hasFinal = next.some((r) => r.isFinal);
  if (!round.isFinal && poolRounds.every((r) => r.submitted) && poolRounds.length > 1 && !hasFinal) {
    const winners = poolRounds.map((r) => r.rankedOrder[0]).filter(Boolean);
    next.push({
      round: next.length + 1,
      isFinal: true,
      profileIds: [...winners],
      rankedOrder: [...winners],
      submitted: false
    });
  }
  return next;
}

/** Full preference order over the pool: finalists first, then the rest by
 *  in-round rank. Falls back to compat order for anyone unranked. */
export function buildRankedIds(rounds: RankingRound[]): string[] {
  const finalRound = rounds.find((round) => round.isFinal);
  const poolRounds = rounds.filter((round) => !round.isFinal);
  const ranked: string[] = finalRound ? [...finalRound.rankedOrder] : [];
  const seen = new Set(ranked);
  const maxLength = Math.max(0, ...poolRounds.map((round) => round.rankedOrder.length));
  for (let position = 0; position < maxLength; position += 1) {
    for (const round of poolRounds) {
      const id = round.rankedOrder[position];
      if (id && !seen.has(id)) {
        ranked.push(id);
        seen.add(id);
      }
    }
  }
  return ranked;
}
