import { notFound } from "next/navigation";
import { getPublicTournament } from "@/lib/public-data";
import { StandingsClient } from "./StandingsClient";

export const dynamic = "force-dynamic";

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  // Rendered on the server so spectators see scores immediately; SWR then
  // keeps it fresh from this same payload.
  const initial = await getPublicTournament(tournamentId);
  if (!initial) notFound();

  return <StandingsClient tournamentId={tournamentId} initial={initial} />;
}
