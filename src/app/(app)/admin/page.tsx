import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { LoginForm } from "./LoginForm";
import { CreateTournamentForm } from "./CreateTournamentForm";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthenticated())) {
    return <LoginForm />;
  }

  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { teams: true, stages: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <LogoutButton />
      </div>

      <CreateTournamentForm />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Tournaments</h2>
        {tournaments.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing yet — create one above.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tournaments.map((t) => (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{t.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {t._count.teams} teams · {t._count.stages} stages ·{" "}
                      <span className="capitalize">{t.status}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-3 text-sm">
                  <Link
                    href={`/admin/tournaments/${t.id}`}
                    className="font-medium text-slate-900 underline"
                  >
                    Manage
                  </Link>
                  <Link href={`/${t.id}`} className="text-slate-500 underline">
                    Public view
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
