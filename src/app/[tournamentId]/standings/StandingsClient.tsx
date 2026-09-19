"use client";

import { useTournament } from "@/lib/use-tournament";
import { Card, EmptyState } from "@/components/ui";
import { LiveIndicator } from "@/components/LiveIndicator";
import type { PublicTable, PublicTournament } from "@/lib/public-data";

function Table({ table }: { table: PublicTable }) {
  const cut = table.advancePerGroup;

  return (
    <Card className="p-0">
      <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
        {table.groupName ?? table.stageName}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-2 py-2 font-medium">Team</th>
              <th className="px-2 py-2 text-right font-medium">P</th>
              <th className="px-2 py-2 text-right font-medium">W</th>
              <th className="px-2 py-2 text-right font-medium">D</th>
              <th className="px-2 py-2 text-right font-medium">L</th>
              <th className="px-2 py-2 text-right font-medium">GF</th>
              <th className="px-2 py-2 text-right font-medium">GA</th>
              <th className="px-2 py-2 text-right font-medium">GD</th>
              <th className="px-4 py-2 text-right font-medium">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.rows.map((row) => {
              const qualifies = cut !== null && row.position <= cut;
              return (
                <tr key={row.teamId} className={qualifies ? "bg-emerald-50/60" : undefined}>
                  <td className="px-4 py-2 tabular-nums text-slate-500">{row.position}</td>
                  <td className="px-2 py-2 font-medium">{row.teamName}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{row.played}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{row.won}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{row.drawn}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{row.lost}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{row.goalsFor}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{row.goalsAgainst}</td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {cut !== null && (
        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
          Top {cut} advance (highlighted).
        </p>
      )}
    </Card>
  );
}

export function StandingsClient({
  tournamentId,
  initial,
}: {
  tournamentId: string;
  initial: PublicTournament;
}) {
  const { data, error, isValidating } = useTournament(tournamentId, initial);

  if (error) return <p className="text-sm text-red-600">{(error as Error).message}</p>;
  if (!data) return null;

  if (data.tables.length === 0) {
    return (
      <EmptyState
        title="No tables yet"
        hint="Standings appear once a league or group stage has fixtures."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <LiveIndicator isValidating={isValidating} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {data.tables.map((table) => (
          <Table key={`${table.stageId}-${table.groupId ?? "league"}`} table={table} />
        ))}
      </div>
    </div>
  );
}
