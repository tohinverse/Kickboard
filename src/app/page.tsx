import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tournaments = await prisma.tournament.findMany({
    where: { status: { in: ["active", "completed"] } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { teams: true } } },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tournaments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live scores, standings and brackets — no login needed.
        </p>
      </div>

      {tournaments.length === 0 ? (
        <EmptyState
          title="No tournaments are live yet"
          hint="An organiser can create one from the admin area."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/${t.id}`} className="block">
              <Card className="transition hover:border-slate-300 hover:shadow">
                <h2 className="font-medium">{t.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t._count.teams} teams · <span className="capitalize">{t.status}</span>
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
