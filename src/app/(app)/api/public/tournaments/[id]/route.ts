import { getPublicTournament } from "@/lib/public-data";

type Params = { params: Promise<{ id: string }> };

// Spectator-facing and polled every 15s, so it must never be statically cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const tournament = await getPublicTournament(id);

  if (!tournament) {
    return Response.json({ error: "Tournament not found." }, { status: 404 });
  }

  return Response.json(
    { tournament },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
