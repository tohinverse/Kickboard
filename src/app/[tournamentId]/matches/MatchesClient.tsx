"use client";

import { useState } from "react";
import { useTournament } from "@/lib/use-tournament";
import { Card, EmptyState } from "@/components/ui";
import { LiveIndicator } from "@/components/LiveIndicator";
import { MatchRow } from "@/components/MatchRow";
import type { PublicTournament } from "@/lib/public-data";

type Filter = "all" | "live" | "scheduled" | "finished";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "scheduled", label: "Upcoming" },
  { key: "finished", label: "Results" },
];

export function MatchesClient({
  tournamentId,
  initial,
}: {
  tournamentId: string;
  initial: PublicTournament;
}) {
  const { data, error, isValidating } = useTournament(tournamentId, initial);
  const [filter, setFilter] = useState<Filter>("all");

  if (error) return <p className="text-sm text-red-600">{(error as Error).message}</p>;
  if (!data) return null;

  if (data.matches.length === 0) {
    return <EmptyState title="No fixtures yet" hint="Fixtures appear once a stage is generated." />;
  }

  const visible =
    filter === "all" ? data.matches : data.matches.filter((m) => m.status === filter);

  // Group by stage, then by group/round, so a 32-team schedule stays readable.
  const sections = new Map<string, typeof visible>();
  for (const m of visible) {
    const key = m.groupName ? `${m.stageName} — ${m.groupName}` : m.stageName;
    const list = sections.get(key) ?? [];
    list.push(m);
    sections.set(key, list);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => {
            const count =
              f.key === "all"
                ? data.matches.length
                : data.matches.filter((m) => m.status === f.key).length;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  filter === f.key
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {f.label}
                <span className="ml-1.5 tabular-nums opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <LiveIndicator isValidating={isValidating} />
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Nothing to show" hint="Try a different filter." />
      ) : (
        <div className="space-y-5">
          {[...sections.entries()].map(([name, list]) => (
            <Card key={name} className="p-0">
              <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">{name}</h2>
              <ul className="divide-y divide-slate-100">
                {list.map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
