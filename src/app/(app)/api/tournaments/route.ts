import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAGE_TYPES, type StageType } from "@/lib/types";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { teams: true, stages: true } } },
  });
  return Response.json({ tournaments });
}

type StageInput = { name?: unknown; type?: unknown; config?: unknown };

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return Response.json({ error: "Tournament name is required." }, { status: 400 });

  const rawStages: StageInput[] = Array.isArray(body?.stages) ? body.stages : [];
  if (rawStages.length === 0) {
    return Response.json({ error: "Add at least one stage." }, { status: 400 });
  }

  const unknown = rawStages.find(
    (stage) => !STAGE_TYPES.includes(String(stage?.type) as StageType),
  );
  if (unknown) {
    return Response.json(
      { error: `Unknown stage type: ${String(unknown.type)}` },
      { status: 400 },
    );
  }

  const stages = rawStages.map((stage, index) => {
    const type = String(stage?.type) as StageType;
    return {
      name: typeof stage?.name === "string" && stage.name.trim() ? stage.name.trim() : type,
      type,
      order: index,
      config: (stage?.config ?? {}) as object,
    };
  });

  const teamNames: string[] = Array.isArray(body?.teams)
    ? body.teams
        .map((t: unknown) => (typeof t === "string" ? t.trim() : ""))
        .filter((t: string) => t.length > 0)
    : [];

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name,
        status: "draft",
        stages: { create: stages },
        teams: { create: teamNames.map((teamName, i) => ({ name: teamName, seed: i + 1 })) },
      },
      include: { stages: { orderBy: { order: "asc" } }, teams: true },
    });
    return Response.json({ tournament }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create tournament.";
    return Response.json({ error: message }, { status: 400 });
  }
}
