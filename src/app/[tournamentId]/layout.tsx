import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicNav } from "@/components/PublicNav";

export const dynamic = "force-dynamic";

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true, status: true },
  });

  if (!tournament) notFound();

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{tournament.name}</h1>
        <p className="mt-0.5 text-sm text-slate-500 capitalize">{tournament.status}</p>
      </div>
      <PublicNav tournamentId={tournament.id} />
      {children}
    </div>
  );
}
