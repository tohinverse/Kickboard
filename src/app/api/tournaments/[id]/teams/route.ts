import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** Replaces the team list, or appends to it when `mode` is "append". */
export async function POST(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const names: string[] = Array.isArray(body?.teams)
    ? body.teams
        .map((t: unknown) => (typeof t === "string" ? t.trim() : ""))
        .filter((t: string) => t.length > 0)
    : [];

  if (names.length === 0) {
    return Response.json({ error: "No team names provided." }, { status: 400 });
  }

  const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
  if (duplicates.length > 0) {
    return Response.json(
      { error: `Duplicate team names: ${[...new Set(duplicates)].join(", ")}` },
      { status: 400 },
    );
  }

  const append = body?.mode === "append";

  await prisma.$transaction(async (tx) => {
    if (!append) {
      // Fixtures reference teams, so replacing the roster invalidates them.
      await tx.match.deleteMany({ where: { stage: { tournamentId: id } } });
      await tx.team.deleteMany({ where: { tournamentId: id } });
    }
    const offset = append ? await tx.team.count({ where: { tournamentId: id } }) : 0;
    await tx.team.createMany({
      data: names.map((name, i) => ({ tournamentId: id, name, seed: offset + i + 1 })),
    });
  });

  const teams = await prisma.team.findMany({
    where: { tournamentId: id },
    orderBy: { seed: "asc" },
  });
  return Response.json({ teams });
}

export async function DELETE(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId");
  if (!teamId) return Response.json({ error: "teamId is required." }, { status: 400 });

  await prisma.team.delete({ where: { id: teamId, tournamentId: id } });
  return Response.json({ ok: true });
}
