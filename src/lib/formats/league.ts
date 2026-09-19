/**
 * Round-robin fixture generation via the circle method.
 *
 * Teams are fixed in two rows except for one pivot; rotating the remaining
 * teams each round produces every pairing exactly once in N-1 rounds (N even).
 * An odd N gets a BYE placeholder, so each team sits out exactly one round.
 */

export type Pairing = { round: number; homeId: string; awayId: string };

const BYE = "__BYE__";

export function roundRobinPairings(teamIds: string[]): Pairing[] {
  const ids = [...teamIds];
  if (ids.length < 2) return [];

  if (ids.length % 2 === 1) ids.push(BYE);

  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;
  const pairings: Pairing[] = [];

  // The pivot stays at index 0; the rest rotate clockwise each round.
  const rotating = ids.slice(1);

  // Seat parity alone leaves a team permanently at home once a BYE is in play
  // (its real fixtures all land on the same parity), so home advantage is
  // assigned by whoever has had fewer home games so far, with seat parity
  // only as the tie-breaker.
  const homeCount = new Map<string, number>(ids.map((id) => [id, 0]));

  for (let round = 0; round < rounds; round++) {
    const line = [ids[0], ...rotating];

    for (let i = 0; i < half; i++) {
      const a = line[i];
      const b = line[n - 1 - i];
      if (a === BYE || b === BYE) continue;

      const ha = homeCount.get(a) ?? 0;
      const hb = homeCount.get(b) ?? 0;
      let homeFirst: boolean;
      if (ha !== hb) {
        homeFirst = ha < hb;
      } else {
        homeFirst = round % 2 === 0 ? i % 2 === 0 : i % 2 === 1;
      }

      const homeId = homeFirst ? a : b;
      const awayId = homeFirst ? b : a;
      homeCount.set(homeId, (homeCount.get(homeId) ?? 0) + 1);
      pairings.push({ round: round + 1, homeId, awayId });
    }

    rotating.unshift(rotating.pop() as string);
  }

  return pairings;
}
