export type StandingsMatch = {
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

export type StandingsTeam = { id: string; name: string };

export type StandingsRow = {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
};

export type PointsConfig = { pointsWin: number; pointsDraw: number; pointsLoss: number };

export const DEFAULT_POINTS: PointsConfig = { pointsWin: 3, pointsDraw: 1, pointsLoss: 0 };

function isCounted(m: StandingsMatch): boolean {
  return (
    m.status === "finished" &&
    m.homeTeamId !== null &&
    m.awayTeamId !== null &&
    m.homeScore !== null &&
    m.awayScore !== null
  );
}

/**
 * Standings sorted by points, then goal difference, then goals for, then the
 * head-to-head record among the teams still tied, then name.
 */
export function computeStandings(
  teams: StandingsTeam[],
  matches: StandingsMatch[],
  config: PointsConfig = DEFAULT_POINTS,
): StandingsRow[] {
  const rows = new Map<string, StandingsRow>();
  for (const team of teams) {
    rows.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      position: 0,
    });
  }

  const played = matches.filter(isCounted);

  for (const m of played) {
    const home = rows.get(m.homeTeamId as string);
    const away = rows.get(m.awayTeamId as string);
    if (!home || !away) continue;

    const hs = m.homeScore as number;
    const as = m.awayScore as number;

    home.played++;
    away.played++;
    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;

    if (hs > as) {
      home.won++;
      away.lost++;
      home.points += config.pointsWin;
      away.points += config.pointsLoss;
    } else if (hs < as) {
      away.won++;
      home.lost++;
      away.points += config.pointsWin;
      home.points += config.pointsLoss;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += config.pointsDraw;
      away.points += config.pointsDraw;
    }
  }

  for (const row of rows.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
  }

  const all = [...rows.values()];

  // Head-to-head is only meaningful within a tied set, so it is computed
  // lazily per group of teams level on points/GD/GF.
  const headToHead = (tied: StandingsRow[]) => {
    const ids = new Set(tied.map((r) => r.teamId));
    const mini = new Map<string, { points: number; gd: number; gf: number }>();
    for (const id of ids) mini.set(id, { points: 0, gd: 0, gf: 0 });

    for (const m of played) {
      const h = m.homeTeamId as string;
      const a = m.awayTeamId as string;
      if (!ids.has(h) || !ids.has(a)) continue;

      const hs = m.homeScore as number;
      const as = m.awayScore as number;
      const hm = mini.get(h);
      const am = mini.get(a);
      if (!hm || !am) continue;

      hm.gf += hs;
      hm.gd += hs - as;
      am.gf += as;
      am.gd += as - hs;

      if (hs > as) {
        hm.points += config.pointsWin;
        am.points += config.pointsLoss;
      } else if (hs < as) {
        am.points += config.pointsWin;
        hm.points += config.pointsLoss;
      } else {
        hm.points += config.pointsDraw;
        am.points += config.pointsDraw;
      }
    }
    return mini;
  };

  all.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return 0;
  });

  // Re-sort each tied block using the head-to-head mini-table.
  const result: StandingsRow[] = [];
  let i = 0;
  while (i < all.length) {
    let j = i + 1;
    while (
      j < all.length &&
      all[j].points === all[i].points &&
      all[j].goalDifference === all[i].goalDifference &&
      all[j].goalsFor === all[i].goalsFor
    ) {
      j++;
    }

    const block = all.slice(i, j);
    if (block.length > 1) {
      const mini = headToHead(block);
      block.sort((x, y) => {
        const mx = mini.get(x.teamId) ?? { points: 0, gd: 0, gf: 0 };
        const my = mini.get(y.teamId) ?? { points: 0, gd: 0, gf: 0 };
        if (my.points !== mx.points) return my.points - mx.points;
        if (my.gd !== mx.gd) return my.gd - mx.gd;
        if (my.gf !== mx.gf) return my.gf - mx.gf;
        return x.teamName.localeCompare(y.teamName);
      });
    }
    result.push(...block);
    i = j;
  }

  result.forEach((row, idx) => {
    row.position = idx + 1;
  });

  return result;
}
