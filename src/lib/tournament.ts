import { prisma } from "@/lib/prisma";
import { roundRobinPairings } from "@/lib/formats/league";
import { buildBracket } from "@/lib/formats/knockout";
import { computeStandings } from "@/lib/formats/standings";
import { pointsFromConfig, stageConfig, type StageType } from "@/lib/types";

/** Shuffle used when splitting teams into groups without explicit seeds. */
function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function groupLabel(index: number): string {
  // A..Z, then AA, AB, ... for very large tournaments.
  let n = index;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

/**
 * Seed order for teams entering a bracket: explicit `seed` first (ascending),
 * then anything unseeded in name order.
 */
function bySeed<T extends { id: string; seed: number | null; name: string }>(teams: T[]): T[] {
  return [...teams].sort((a, b) => {
    if (a.seed !== null && b.seed !== null) return a.seed - b.seed;
    if (a.seed !== null) return -1;
    if (b.seed !== null) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function generateLeagueFixtures(stageId: string) {
  const stage = await prisma.stage.findUniqueOrThrow({
    where: { id: stageId },
    include: { tournament: { include: { teams: true } } },
  });

  const teams = bySeed(stage.tournament.teams);
  const pairings = roundRobinPairings(teams.map((t) => t.id));

  await prisma.$transaction([
    prisma.match.deleteMany({ where: { stageId } }),
    prisma.match.createMany({
      data: pairings.map((p, i) => ({
        stageId,
        round: p.round,
        slot: i,
        homeTeamId: p.homeId,
        awayTeamId: p.awayId,
      })),
    }),
  ]);

  return pairings.length;
}

export async function generateGroupFixtures(stageId: string) {
  const stage = await prisma.stage.findUniqueOrThrow({
    where: { id: stageId },
    include: { tournament: { include: { teams: true } } },
  });

  const config = stageConfig(stage.config);
  const groupSize = Math.max(2, config.groupSize ?? 4);
  const teams = stage.tournament.teams;
  if (teams.length < 2) return 0;

  // Seeded teams are distributed across groups rather than clustered, so the
  // strongest sides don't all land in one group.
  const ordered = bySeed(teams);
  const anySeeded = ordered.some((t) => t.seed !== null);
  const pool = anySeeded ? ordered : shuffle(ordered);

  const groupCount = Math.max(1, Math.ceil(pool.length / groupSize));
  const buckets: string[][] = Array.from({ length: groupCount }, () => []);
  pool.forEach((team, i) => {
    buckets[i % groupCount].push(team.id);
  });

  await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({ where: { stageId } });
    await tx.team.updateMany({
      where: { group: { stageId } },
      data: { groupId: null },
    });
    await tx.group.deleteMany({ where: { stageId } });

    for (let i = 0; i < buckets.length; i++) {
      const memberIds = buckets[i];
      if (memberIds.length === 0) continue;

      const group = await tx.group.create({
        data: { stageId, name: `Group ${groupLabel(i)}` },
      });

      await tx.team.updateMany({
        where: { id: { in: memberIds } },
        data: { groupId: group.id },
      });

      const pairings = roundRobinPairings(memberIds);
      if (pairings.length > 0) {
        await tx.match.createMany({
          data: pairings.map((p, idx) => ({
            stageId,
            groupId: group.id,
            round: p.round,
            slot: idx,
            homeTeamId: p.homeId,
            awayTeamId: p.awayId,
          })),
        });
      }
    }
  });

  const count = await prisma.match.count({ where: { stageId } });
  return count;
}

/**
 * Create every knockout match up front and wire `nextMatchId` so a finished
 * result can push the winner straight into the following round.
 */
export async function generateKnockoutFixtures(stageId: string, seededTeamIds?: string[]) {
  const stage = await prisma.stage.findUniqueOrThrow({
    where: { id: stageId },
    include: { tournament: { include: { teams: true } } },
  });

  const teamIds = seededTeamIds ?? bySeed(stage.tournament.teams).map((t) => t.id);
  const bracket = buildBracket(teamIds);
  if (bracket.length === 0) return 0;

  await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({ where: { stageId } });

    // Created in order so array index -> created id can be resolved for linking.
    const ids: string[] = [];
    for (const m of bracket) {
      const created = await tx.match.create({
        data: {
          stageId,
          round: m.round,
          slot: m.slot,
          homeTeamId: m.homeSeatId,
          awayTeamId: m.awaySeatId,
        },
        select: { id: true },
      });
      ids.push(created.id);
    }

    for (let i = 0; i < bracket.length; i++) {
      const m = bracket[i];
      if (m.nextIndex === null) continue;
      await tx.match.update({
        where: { id: ids[i] },
        data: { nextMatchId: ids[m.nextIndex], nextSlot: m.nextSlot },
      });
    }
  });

  return bracket.length;
}

export async function generateFixturesForStage(stageId: string) {
  const stage = await prisma.stage.findUniqueOrThrow({ where: { id: stageId } });
  const type = stage.type as StageType;

  if (type === "LEAGUE") return generateLeagueFixtures(stageId);
  if (type === "GROUPS") return generateGroupFixtures(stageId);
  return generateKnockoutFixtures(stageId);
}

/**
 * Apply a result and, for knockout matches, advance the winner. Clearing a
 * score or un-finishing a match withdraws a previously advanced team so an
 * entry mistake can be corrected.
 */
export async function setMatchResult(
  matchId: string,
  input: { homeScore: number | null; awayScore: number | null; status: string },
) {
  const match = await prisma.match.findUniqueOrThrow({ where: { id: matchId } });

  const finished = input.status === "finished";
  const hasScores = input.homeScore !== null && input.awayScore !== null;

  if (finished && !hasScores) {
    throw new Error("A finished match needs both scores.");
  }

  let winnerId: string | null = null;
  if (finished && hasScores) {
    const hs = input.homeScore as number;
    const as = input.awayScore as number;
    if (hs === as && match.nextMatchId) {
      throw new Error("A knockout match cannot end level — enter the result after extra time or penalties.");
    }
    if (hs > as) winnerId = match.homeTeamId;
    else if (as > hs) winnerId = match.awayTeamId;
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        status: input.status,
      },
    });

    if (!match.nextMatchId) return;

    // Work out who this match previously sent forward, so an edited result
    // replaces that team rather than leaving a stale one in the next round.
    const previousWinnerId =
      match.status === "finished" &&
      match.homeScore !== null &&
      match.awayScore !== null &&
      match.homeScore !== match.awayScore
        ? match.homeScore > match.awayScore
          ? match.homeTeamId
          : match.awayTeamId
        : null;

    if (previousWinnerId === winnerId) return;

    const next = await tx.match.findUnique({ where: { id: match.nextMatchId } });
    if (!next) return;

    const slot = match.nextSlot ?? 0;
    const occupant = slot === 0 ? next.homeTeamId : next.awayTeamId;

    // Only overwrite the slot this match feeds; never clobber the other side.
    if (occupant !== null && occupant !== previousWinnerId) return;

    await tx.match.update({
      where: { id: next.id },
      data: slot === 0 ? { homeTeamId: winnerId } : { awayTeamId: winnerId },
    });
  });
}

/**
 * Seed a knockout stage from the finished group stage that precedes it:
 * the top N of every group, ordered so group winners are spread across the
 * bracket and never meet a runner-up from their own group in round one.
 */
export async function advanceGroupsToKnockout(groupStageId: string, knockoutStageId: string) {
  const stage = await prisma.stage.findUniqueOrThrow({
    where: { id: groupStageId },
    include: {
      groups: { include: { teams: true }, orderBy: { name: "asc" } },
      matches: true,
    },
  });

  const config = stageConfig(stage.config);
  const advancePerGroup = Math.max(1, config.advancePerGroup ?? 2);
  const points = pointsFromConfig(config);

  const unfinished = stage.matches.filter((m) => m.status !== "finished");
  if (unfinished.length > 0) {
    throw new Error(`${unfinished.length} group match(es) still unplayed.`);
  }

  // qualifiers[position][groupIndex] = team id
  const qualifiers: (string | null)[][] = Array.from({ length: advancePerGroup }, () => []);

  stage.groups.forEach((group, groupIndex) => {
    const rows = computeStandings(
      group.teams.map((t) => ({ id: t.id, name: t.name })),
      stage.matches.filter((m) => m.groupId === group.id),
      points,
    );
    for (let pos = 0; pos < advancePerGroup; pos++) {
      qualifiers[pos][groupIndex] = rows[pos]?.teamId ?? null;
    }
  });

  // Seed order decides who meets whom: in a bracket of `size`, seed index i
  // meets index size-1-i. With G group winners listed first, winner k sits at
  // index k and meets whatever occupies index size-1-k. Placing the runners-up
  // reversed *and* shifted by one puts group k's runner-up somewhere other than
  // opposite its own winner, so no round-one tie is a group rematch.
  const groupCount = Math.max(stage.groups.length, 1);
  const seeded: string[] = [];
  qualifiers.forEach((row, pos) => {
    const ordered =
      pos === 0
        ? row
        : row.map((_, i) => row[(groupCount - 1 - i + pos) % groupCount]);
    for (const id of ordered) if (id) seeded.push(id);
  });

  if (seeded.length < 2) {
    throw new Error("Not enough qualified teams to build a knockout bracket.");
  }

  const created = await generateKnockoutFixtures(knockoutStageId, seeded);

  await prisma.stage.update({
    where: { id: knockoutStageId },
    data: { config: { ...config, seededFromStageId: groupStageId } },
  });

  return { matches: created, teams: seeded.length };
}
