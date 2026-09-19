import { requireAdmin } from "@/lib/auth";
import { generateFixturesForStage } from "@/lib/tournament";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const created = await generateFixturesForStage(id);
    return Response.json({ ok: true, matches: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate fixtures.";
    return Response.json({ error: message }, { status: 400 });
  }
}
