import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STAGE_TYPES, type StageType } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const type = String(body?.type) as StageType;

  if (!STAGE_TYPES.includes(type)) {
    return Response.json({ error: "Unknown stage type." }, { status: 400 });
  }

  const last = await prisma.stage.findFirst({
    where: { tournamentId: id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const stage = await prisma.stage.create({
    data: {
      tournamentId: id,
      name: typeof body?.name === "string" && body.name.trim() ? body.name.trim() : type,
      type,
      order: (last?.order ?? -1) + 1,
      config: (body?.config ?? {}) as object,
    },
  });

  return Response.json({ stage }, { status: 201 });
}
