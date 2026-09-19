import type { PublicMatch } from "@/lib/public-data";
import { StatusBadge, formatKickoff } from "@/components/ui";

export function MatchRow({ match, showStage = false }: { match: PublicMatch; showStage?: boolean }) {
  const decided = match.homeScore !== null && match.awayScore !== null;
  const homeWon = decided && (match.homeScore as number) > (match.awayScore as number);
  const awayWon = decided && (match.awayScore as number) > (match.homeScore as number);

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className={`truncate text-sm ${homeWon ? "font-semibold" : ""}`}>
            {match.homeTeam?.name ?? <span className="text-slate-400">TBC</span>}
          </span>
          <span className="shrink-0 font-mono text-sm tabular-nums">
            {decided ? match.homeScore : "–"}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className={`truncate text-sm ${awayWon ? "font-semibold" : ""}`}>
            {match.awayTeam?.name ?? <span className="text-slate-400">TBC</span>}
          </span>
          <span className="shrink-0 font-mono text-sm tabular-nums">
            {decided ? match.awayScore : "–"}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <StatusBadge status={match.status} />
          {showStage && <span>{match.groupName ?? match.stageName}</span>}
          {match.venue && <span>· {match.venue}</span>}
          {match.scheduledAt && <span>· {formatKickoff(match.scheduledAt)}</span>}
        </div>
      </div>
    </li>
  );
}
