import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MATCH_STATUSES, type MatchStatus } from "@/lib/types";
import { setMatchResult } from "@/lib/tournament";

type Params = { params: Promise<{ id: string }> };

function parseScore(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 999) throw new Error("Scores must be whole numbers from 0 to 999.");
  return n;
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  try {
    const status = String(body?.status ?? "scheduled") as MatchStatus;
    if (!MATCH_STATUSES.includes(status)) {
      return Response.json({ error: "Unknown match status." }, { status: 400 });
    }

    const homeScore = parseScore(body?.homeScore);
    const awayScore = parseScore(body?.awayScore);

    await setMatchResult(id, { homeScore, awayScore, status });

    // Venue and kick-off time are plain edits with no knock-on effects.
    const extra: { venue?: string | null; scheduledAt?: Date | null } = {};
    if ("venue" in (body ?? {})) {
      extra.venue = typeof body.venue === "string" && body.venue.trim() ? body.venue.trim() : null;
    }
    if ("scheduledAt" in (body ?? {})) {
      extra.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    }
    if (Object.keys(extra).length > 0) {
      await prisma.match.update({ where: { id }, data: extra });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true },
    });
    return Response.json({ match });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update match.";
    return Response.json({ error: message }, { status: 400 });
  }
}
