import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { advanceGroupsToKnockout } from "@/lib/tournament";

type Params = { params: Promise<{ id: string }> };

/**
 * Advance a finished GROUPS stage into the KNOCKOUT stage that follows it.
 * `id` is the group stage; the target is the next knockout stage by order.
 */
export async function POST(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const stage = await prisma.stage.findUnique({ where: { id } });
  if (!stage) return Response.json({ error: "Stage not found." }, { status: 404 });
  if (stage.type !== "GROUPS") {
    return Response.json({ error: "Only a group stage can be advanced." }, { status: 400 });
  }

  const target = await prisma.stage.findFirst({
    where: { tournamentId: stage.tournamentId, type: "KNOCKOUT", order: { gt: stage.order } },
    orderBy: { order: "asc" },
  });

  if (!target) {
    return Response.json(
      { error: "No knockout stage follows this group stage. Add one first." },
      { status: 400 },
    );
  }

  try {
    const result = await advanceGroupsToKnockout(id, target.id);
    return Response.json({ ok: true, ...result, knockoutStageId: target.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not advance.";
    return Response.json({ error: message }, { status: 400 });
  }
}
