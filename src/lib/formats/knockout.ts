/**
 * Single-elimination bracket generation.
 *
 * The bracket is padded to the next power of two with byes. Seeds are placed
 * using the standard recursive pattern (1 v 16, 8 v 9, ...) so the top seeds
 * only meet in the later rounds, and a bye always falls to the stronger seed.
 */

export type BracketSlotTeam = string | null;

export type BracketMatch = {
  round: number;
  slot: number;
  homeSeatId: BracketSlotTeam;
  awaySeatId: BracketSlotTeam;
  /** Index into the returned array of the match the winner feeds into. */
  nextIndex: number | null;
  /** Which side of the next match the winner occupies. */
  nextSlot: 0 | 1 | null;
};

export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return Math.max(p, 1);
}

/**
 * Seed order for a bracket of `size` (a power of two), as 1-based seeds.
 * Produces [1, 16, 9, 8, 5, 12, 13, 4, ...] for size 16 — reading in pairs
 * gives the first-round matchups.
 */
export function seedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    // Each expansion mirrors the bracket: a block of N seeds becomes 2N, with
    // every seed paired against its complement (2N + 1 - seed). Pairing each
    // existing seat with its complement in place keeps 1 and 2 on opposite
    // halves, so they can only meet in the final.
    const complement = order.length * 2 + 1;
    const next: number[] = [];
    for (let i = 0; i < order.length; i += 2) {
      const a = order[i];
      const b = order[i + 1];
      next.push(a, complement - a, complement - b, b);
    }
    order = next;
  }
  return order;
}

/**
 * Build every round up front. `teamIds` must already be in seed order
 * (strongest first); missing entries are byes.
 */
export function buildBracket(teamIds: string[]): BracketMatch[] {
  const teamCount = teamIds.length;
  if (teamCount < 2) return [];

  const size = nextPowerOfTwo(teamCount);
  const order = seedOrder(size);

  // Map seed position -> team id, with byes (null) for padded slots.
  const bySeat: BracketSlotTeam[] = order.map((seed) =>
    seed <= teamCount ? teamIds[seed - 1] : null,
  );

  const matches: BracketMatch[] = [];
  const roundCount = Math.log2(size);

  // Round 1 from the seeded seats, then empty shells for every later round.
  let roundStart = 0;
  for (let round = 1; round <= roundCount; round++) {
    const matchesInRound = size / 2 ** round;
    for (let slot = 0; slot < matchesInRound; slot++) {
      if (round === 1) {
        matches.push({
          round,
          slot,
          homeSeatId: bySeat[slot * 2],
          awaySeatId: bySeat[slot * 2 + 1],
          nextIndex: null,
          nextSlot: null,
        });
      } else {
        matches.push({
          round,
          slot,
          homeSeatId: null,
          awaySeatId: null,
          nextIndex: null,
          nextSlot: null,
        });
      }
    }

    // Link the previous round into this one.
    if (round > 1) {
      const prevStart = roundStart;
      const prevCount = size / 2 ** (round - 1);
      const thisStart = prevStart + prevCount;
      for (let slot = 0; slot < prevCount; slot++) {
        const m = matches[prevStart + slot];
        m.nextIndex = thisStart + Math.floor(slot / 2);
        m.nextSlot = slot % 2 === 0 ? 0 : 1;
      }
      roundStart = thisStart;
    }
  }

  // Byes: a first-round match with one empty side resolves immediately, so
  // push the present team straight into the next round's slot.
  for (const m of matches) {
    if (m.round !== 1) continue;
    const home = m.homeSeatId;
    const away = m.awaySeatId;
    const walkover = home && !away ? home : away && !home ? away : null;
    if (!walkover || m.nextIndex === null) continue;

    const next = matches[m.nextIndex];
    if (m.nextSlot === 0) next.homeSeatId = walkover;
    else next.awaySeatId = walkover;
  }

  return matches;
}

export function roundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semi-finals";
  if (fromEnd === 2) return "Quarter-finals";
  return `Round of ${2 ** (fromEnd + 1)}`;
}
