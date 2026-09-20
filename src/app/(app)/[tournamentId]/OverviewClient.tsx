"use client";

import Link from "next/link";
import { useTournament } from "@/lib/use-tournament";
import { Card, EmptyState } from "@/components/ui";
import { LiveIndicator } from "@/components/LiveIndicator";
import { MatchRow } from "@/components/MatchRow";
import type { PublicTournament } from "@/lib/public-data";

export function OverviewClient({
  tournamentId,
  initial,
}: {
  tournamentId: string;
  initial: PublicTournament;
}) {
  const { data, error, isValidating } = useTournament(tournamentId, initial);

  if (error) return <p className="text-sm text-red-600">{(error as Error).message}</p>;
  if (!data) return null;

  const live = data.matches.filter((m) => m.status === "live");
  const upcoming = data.matches.filter((m) => m.status === "scheduled").slice(0, 8);
  const recent = data.matches.filter((m) => m.status === "finished").slice(-6).reverse();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
          <span className="rounded-md bg-white px-2.5 py-1 ring-1 ring-slate-200">
            {data.teamCount} teams
          </span>
          {data.currentStage && (
            <span className="rounded-md bg-white px-2.5 py-1 ring-1 ring-slate-200">
              Current: {data.currentStage.name}
            </span>
          )}
        </div>
        <LiveIndicator isValidating={isValidating} />
      </div>

      {live.length > 0 && (
        <Card className="p-0">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Live now</h2>
          <ul className="divide-y divide-slate-100">
            {live.map((m) => (
              <MatchRow key={m.id} match={m} showStage />
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-0">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
            Upcoming matches
          </h2>
          {upcoming.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">No scheduled matches.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((m) => (
                <MatchRow key={m.id} match={m} showStage />
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-0">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
            Latest results
          </h2>
          {recent.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">No results yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((m) => (
                <MatchRow key={m.id} match={m} showStage />
              ))}
            </ul>
          )}
        </Card>
      </div>

      {data.stages.length === 0 && (
        <EmptyState title="No stages yet" hint="An organiser still needs to set up this tournament." />
      )}

      <p className="text-sm text-slate-500">
        See the{" "}
        <Link href={`/${tournamentId}/matches`} className="underline hover:text-slate-800">
          full fixture list
        </Link>
        .
      </p>
    </div>
  );
}
