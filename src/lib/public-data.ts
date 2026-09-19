import { prisma } from "@/lib/prisma";
import { computeStandings, type StandingsRow } from "@/lib/formats/standings";
import { pointsFromConfig, stageConfig } from "@/lib/types";

export type PublicMatch = {
  id: string;
  round: number;
  slot: number;
  stageId: string;
  stageName: string;
  stageType: string;
  groupName: string | null;
  homeTeam: { id: string; name: string } | null;
  awayTeam: { id: string; name: string } | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  scheduledAt: string | null;
  venue: string | null;
  nextMatchId: string | null;
};

export type PublicTable = {
  stageId: string;
  stageName: string;
  groupId: string | null;
  groupName: string | null;
  advancePerGroup: number | null;
  rows: StandingsRow[];
};

export type PublicTournament = {
  id: string;
  name: string;
  status: string;
  teamCount: number;
  stages: { id: string; name: string; type: string; order: number; matchCount: number }[];
  currentStage: { id: string; name: string; type: string } | null;
  matches: PublicMatch[];
  tables: PublicTable[];
  updatedAt: string;
};

export async function getPublicTournament(id: string): Promise<PublicTournament | null> {
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: true,
      stages: {
        orderBy: { order: "asc" },
        include: {
          groups: { orderBy: { name: "asc" }, include: { teams: true } },
          matches: {
            orderBy: [{ round: "asc" }, { slot: "asc" }],
            include: { homeTeam: true, awayTeam: true, group: true },
          },
        },
      },
    },
  });

  if (!tournament) return null;

  const matches: PublicMatch[] = [];
  const tables: PublicTable[] = [];

  for (const stage of tournament.stages) {
    for (const m of stage.matches) {
      matches.push({
        id: m.id,
        round: m.round,
        slot: m.slot,
        stageId: stage.id,
        stageName: stage.name,
        stageType: stage.type,
        groupName: m.group?.name ?? null,
        homeTeam: m.homeTeam ? { id: m.homeTeam.id, name: m.homeTeam.name } : null,
        awayTeam: m.awayTeam ? { id: m.awayTeam.id, name: m.awayTeam.name } : null,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: m.status,
        scheduledAt: m.scheduledAt ? m.scheduledAt.toISOString() : null,
        venue: m.venue,
        nextMatchId: m.nextMatchId,
      });
    }

    const config = stageConfig(stage.config);
    const points = pointsFromConfig(config);

    if (stage.type === "LEAGUE") {
      tables.push({
        stageId: stage.id,
        stageName: stage.name,
        groupId: null,
        groupName: null,
        advancePerGroup: null,
        rows: computeStandings(
          tournament.teams.map((t) => ({ id: t.id, name: t.name })),
          stage.matches,
          points,
        ),
      });
    } else if (stage.type === "GROUPS") {
      for (const group of stage.groups) {
        tables.push({
          stageId: stage.id,
          stageName: stage.name,
          groupId: group.id,
          groupName: group.name,
          advancePerGroup: config.advancePerGroup ?? 2,
          rows: computeStandings(
            group.teams.map((t) => ({ id: t.id, name: t.name })),
            stage.matches.filter((m) => m.groupId === group.id),
            points,
          ),
        });
      }
    }
  }

  // "Current" stage: the earliest one that still has unfinished matches,
  // else the last stage with any fixtures at all.
  const withMatches = tournament.stages.filter((s) => s.matches.length > 0);
  const active =
    withMatches.find((s) => s.matches.some((m) => m.status !== "finished")) ??
    withMatches[withMatches.length - 1] ??
    null;

  return {
    id: tournament.id,
    name: tournament.name,
    status: tournament.status,
    teamCount: tournament.teams.length,
    stages: tournament.stages.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      order: s.order,
      matchCount: s.matches.length,
    })),
    currentStage: active ? { id: active.id, name: active.name, type: active.type } : null,
    matches,
    tables,
    updatedAt: new Date().toISOString(),
  };
}
