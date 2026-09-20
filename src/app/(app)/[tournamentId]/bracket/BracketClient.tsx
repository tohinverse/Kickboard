"use client";

import { useTournament } from "@/lib/use-tournament";
import { EmptyState } from "@/components/ui";
import { LiveIndicator } from "@/components/LiveIndicator";
import { roundName } from "@/lib/formats/knockout";
import type { PublicMatch, PublicTournament } from "@/lib/public-data";

function Side({
  team,
  score,
  won,
  decided,
}: {
  team: { name: string } | null;
  score: number | null;
  won: boolean;
  decided: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-2.5 py-1.5 ${
        decided && won ? "font-semibold text-slate-900" : "text-slate-600"
      }`}
    >
      <span className="truncate text-sm">
        {team?.name ?? <span className="text-slate-400">TBC</span>}
      </span>
      <span className="shrink-0 font-mono text-sm tabular-nums">
        {score === null ? "–" : score}
      </span>
    </div>
  );
}

function BracketMatch({ match }: { match: PublicMatch }) {
  const decided = match.homeScore !== null && match.awayScore !== null;
  const homeWon = decided && (match.homeScore as number) > (match.awayScore as number);
  const awayWon = decided && (match.awayScore as number) > (match.homeScore as number);

  return (
    <div
      className={`w-56 divide-y divide-slate-100 rounded-lg border bg-white shadow-sm ${
        match.status === "live" ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"
      }`}
    >
      <Side team={match.homeTeam} score={match.homeScore} won={homeWon} decided={decided} />
      <Side team={match.awayTeam} score={match.awayScore} won={awayWon} decided={decided} />
    </div>
  );
}

export function BracketClient({
  tournamentId,
  initial,
}: {
  tournamentId: string;
  initial: PublicTournament;
}) {
  const { data, error, isValidating } = useTournament(tournamentId, initial);

  if (error) return <p className="text-sm text-red-600">{(error as Error).message}</p>;
  if (!data) return null;

  const knockoutStages = data.stages.filter((s) => s.type === "KNOCKOUT" && s.matchCount > 0);

  if (knockoutStages.length === 0) {
    return (
      <EmptyState
        title="No bracket yet"
        hint="The bracket appears once a knockout stage has been generated."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <LiveIndicator isValidating={isValidating} />
      </div>

      {knockoutStages.map((stage) => {
        const matches = data.matches.filter((m) => m.stageId === stage.id);
        const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
        const totalRounds = rounds.length;

        return (
          <section key={stage.id}>
            <h2 className="mb-3 text-sm font-semibold">{stage.name}</h2>
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-max gap-8">
                {rounds.map((round) => {
                  const inRound = matches
                    .filter((m) => m.round === round)
                    .sort((a, b) => a.slot - b.slot);
                  return (
                    <div key={round} className="flex flex-col">
                      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {roundName(round, totalRounds)}
                      </h3>
                      {/* Each later round has half the matches, so spacing doubles
                          to keep every tie level with the pair that feeds it. */}
                      <div className="flex flex-1 flex-col justify-around gap-3">
                        {inRound.map((m) => (
                          <BracketMatch key={m.id} match={m} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
