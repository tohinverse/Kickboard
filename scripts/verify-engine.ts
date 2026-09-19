import { prisma } from "../src/lib/prisma";
import { generateFixturesForStage, setMatchResult, advanceGroupsToKnockout } from "../src/lib/tournament";
import { getPublicTournament } from "../src/lib/public-data";

let fail = 0;
const ok = (c: boolean, m: string) => { if (!c) { console.log("FAIL:", m); fail++; } else console.log("  ok:", m); };

async function main() {
  // This suite wipes every table, so it must never be pointed at a database
  // holding data you care about. Set ALLOW_DESTRUCTIVE_TEST=1 to override.
  if (process.env.ALLOW_DESTRUCTIVE_TEST !== "1") {
    const existing = await prisma.tournament.count();
    const seeded = await prisma.tournament.count({
      where: { name: { in: ["Kickboard Cup", "League Test"] } },
    });
    if (existing > seeded) {
      console.error(
        `Refusing to run: the database holds ${existing} tournament(s) this suite would delete.\n` +
          `Point DATABASE_URL at a scratch database, or re-run with ALLOW_DESTRUCTIVE_TEST=1.`,
      );
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  await prisma.match.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.stage.deleteMany({});
  await prisma.tournament.deleteMany({});

  const t = await prisma.tournament.create({
    data: {
      name: "Kickboard Cup",
      status: "active",
      stages: {
        create: [
          { name: "Group Stage", type: "GROUPS", order: 0, config: { groupSize: 4, advancePerGroup: 2 } },
          { name: "Knockout", type: "KNOCKOUT", order: 1, config: {} },
        ],
      },
      teams: { create: Array.from({ length: 32 }, (_, i) => ({ name: `Team ${i + 1}`, seed: i + 1 })) },
    },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  const [groupStage, koStage] = t.stages;

  // --- group stage ---
  const n = await generateFixturesForStage(groupStage.id);
  ok(n === 48, `32 teams / 8 groups of 4 => 48 group matches (got ${n})`);
  const groups = await prisma.group.findMany({ where: { stageId: groupStage.id }, include: { teams: true } });
  ok(groups.length === 8, `8 groups created (got ${groups.length})`);
  ok(groups.every(g => g.teams.length === 4), `every group has 4 teams`);

  // cannot advance before group matches finish
  let blocked = false;
  try { await advanceGroupsToKnockout(groupStage.id, koStage.id); } catch { blocked = true; }
  ok(blocked, "advancing an unfinished group stage is rejected");

  // play all group matches deterministically: lower seed number wins
  const gms = await prisma.match.findMany({ where: { stageId: groupStage.id }, include: { homeTeam: true, awayTeam: true } });
  for (const m of gms) {
    const hs = Number(m.homeTeam!.name.split(" ")[1]);
    const as = Number(m.awayTeam!.name.split(" ")[1]);
    await setMatchResult(m.id, { homeScore: hs < as ? 2 : 0, awayScore: hs < as ? 0 : 2, status: "finished" });
  }

  // --- advance ---
  const adv = await advanceGroupsToKnockout(groupStage.id, koStage.id);
  ok(adv.teams === 16, `16 teams advance (got ${adv.teams})`);
  ok(adv.matches === 15, `16-team bracket = 15 matches (got ${adv.matches})`);

  const r1 = await prisma.match.findMany({ where: { stageId: koStage.id, round: 1 }, include: { homeTeam: true, awayTeam: true }, orderBy: { slot: "asc" } });
  ok(r1.length === 8, "8 round-1 ties");
  ok(r1.every(m => m.homeTeamId && m.awayTeamId), "no byes in a full 16-team bracket");
  // no team should face a side from its own group in round 1
  const groupOf = new Map<string,string>();
  for (const g of groups) for (const tm of g.teams) groupOf.set(tm.id, g.id);
  const sameGroup = r1.filter(m => groupOf.get(m.homeTeamId!) === groupOf.get(m.awayTeamId!));
  ok(sameGroup.length === 0, `no round-1 tie repeats a group pairing (got ${sameGroup.length})`);

  // --- knockout progression ---
  const first = r1[0];
  await setMatchResult(first.id, { homeScore: 3, awayScore: 1, status: "finished" });
  let next = await prisma.match.findUnique({ where: { id: first.nextMatchId! } });
  const slot = first.nextSlot ?? 0;
  ok((slot === 0 ? next!.homeTeamId : next!.awayTeamId) === first.homeTeamId, "winner advances into the next round slot");

  // correcting a result should replace the advanced team, not duplicate it
  await setMatchResult(first.id, { homeScore: 1, awayScore: 3, status: "finished" });
  next = await prisma.match.findUnique({ where: { id: first.nextMatchId! } });
  ok((slot === 0 ? next!.homeTeamId : next!.awayTeamId) === first.awayTeamId, "editing the result swaps who advanced");

  // reverting to scheduled withdraws the team
  await setMatchResult(first.id, { homeScore: null, awayScore: null, status: "scheduled" });
  next = await prisma.match.findUnique({ where: { id: first.nextMatchId! } });
  ok((slot === 0 ? next!.homeTeamId : next!.awayTeamId) === null, "un-finishing a match withdraws the advanced team");

  // a knockout draw is rejected
  let drawRejected = false;
  try { await setMatchResult(first.id, { homeScore: 2, awayScore: 2, status: "finished" }); } catch { drawRejected = true; }
  ok(drawRejected, "a level knockout result is rejected");

  // finished without scores is rejected
  let noScore = false;
  try { await setMatchResult(first.id, { homeScore: null, awayScore: null, status: "finished" }); } catch { noScore = true; }
  ok(noScore, "finishing without scores is rejected");

  // --- public payload ---
  const pub = await getPublicTournament(t.id);
  ok(pub !== null, "public payload builds");
  ok(pub!.tables.length === 8, `8 group tables (got ${pub!.tables.length})`);
  ok(pub!.tables.every(tb => tb.rows.length === 4), "each table has 4 rows");
  ok(pub!.tables[0].rows[0].played === 3, "each team played 3 group games");
  ok(pub!.matches.length === 48 + 15, `63 total matches (got ${pub!.matches.length})`);
  ok(pub!.currentStage?.type === "KNOCKOUT", `current stage is the knockout (got ${pub!.currentStage?.type})`);

  // --- league format standalone ---
  const lt = await prisma.tournament.create({
    data: {
      name: "League Test", status: "active",
      stages: { create: [{ name: "League", type: "LEAGUE", order: 0, config: {} }] },
      teams: { create: Array.from({ length: 10 }, (_, i) => ({ name: `L${i + 1}`, seed: i + 1 })) },
    },
    include: { stages: true },
  });
  const ln = await generateFixturesForStage(lt.stages[0].id);
  ok(ln === 45, `10-team league = 45 fixtures (got ${ln})`);

  console.log(fail === 0 ? "\nE2E ALL PASS" : `\n${fail} E2E FAILURES`);
  await prisma.$disconnect();
  process.exit(fail === 0 ? 0 : 1);
}
main().catch(async (e) => { console.error("ERROR", e); await prisma.$disconnect(); process.exit(1); });
