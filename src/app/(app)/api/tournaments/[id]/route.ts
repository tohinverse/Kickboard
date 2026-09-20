import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      teams: { orderBy: { name: "asc" } },
      stages: { orderBy: { order: "asc" }, include: { groups: true, _count: { select: { matches: true } } } },
    },
  });

  if (!tournament) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ tournament });
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const data: { name?: string; status?: string } = {};

  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.status === "string" && ["draft", "active", "completed"].includes(body.status)) {
    data.status = body.status;
  }
  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const tournament = await prisma.tournament.update({ where: { id }, data });
  return Response.json({ tournament });
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.tournament.delete({ where: { id } });
  return Response.json({ ok: true });
}
