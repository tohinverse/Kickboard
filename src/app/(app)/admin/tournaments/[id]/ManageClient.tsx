"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Card, StatusBadge } from "@/components/ui";
import type { PublicMatch } from "@/lib/public-data";
import { useTournament } from "@/lib/use-tournament";

type Props = { tournament: { id: string; name: string; status: string } };

async function post(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

function ScoreEditor({
  match,
  onSaved,
  onError,
}: {
  match: PublicMatch;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  // A refresh can land while this row is on screen. Rather than syncing state
  // from an effect, the server values are treated as the source of truth and
  // local edits are held as an override that is dropped whenever the server
  // values change.
  const serverKey = `${match.homeScore ?? ""}-${match.awayScore ?? ""}-${match.status}`;
  const [draft, setDraft] = useState<{ key: string; home: string; away: string } | null>(null);
  const current = draft?.key === serverKey ? draft : null;

  const home = current?.home ?? match.homeScore?.toString() ?? "";
  const away = current?.away ?? match.awayScore?.toString() ?? "";
  const status = match.status;

  const setHome = (value: string) =>
    setDraft({ key: serverKey, home: value, away });
  const setAway = (value: string) =>
    setDraft({ key: serverKey, home, away: value });

  const save = async (nextStatus?: string, options?: { clearScores?: boolean }) => {
    setBusy(true);
    try {
      const clear = options?.clearScores ?? false;
      await fetch(`/api/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore: clear || home === "" ? null : Number(home),
          awayScore: clear || away === "" ? null : Number(away),
          status: nextStatus ?? status,
        }),
      }).then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Could not save.");
      });
      setDraft(null);
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  const bothPlaceholders = !match.homeTeam || !match.awayTeam;

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">
          {match.homeTeam?.name ?? <span className="text-slate-400">TBC</span>}
          <span className="mx-1.5 text-slate-400">v</span>
          {match.awayTeam?.name ?? <span className="text-slate-400">TBC</span>}
        </p>
        <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <StatusBadge status={match.status} />
          <span>{match.groupName ?? `Round ${match.round}`}</span>
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <input
          inputMode="numeric"
          value={home}
          disabled={bothPlaceholders || busy}
          onChange={(e) => setHome(e.target.value.replace(/\D/g, ""))}
          className="w-12 rounded-md border border-slate-300 px-2 py-1 text-center text-sm tabular-nums outline-none focus:border-slate-900 disabled:bg-slate-50"
          aria-label="Home score"
        />
        <span className="text-slate-400">–</span>
        <input
          inputMode="numeric"
          value={away}
          disabled={bothPlaceholders || busy}
          onChange={(e) => setAway(e.target.value.replace(/\D/g, ""))}
          className="w-12 rounded-md border border-slate-300 px-2 py-1 text-center text-sm tabular-nums outline-none focus:border-slate-900 disabled:bg-slate-50"
          aria-label="Away score"
        />
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={bothPlaceholders || busy}
          onClick={() => save("live")}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
        >
          Live
        </button>
        <button
          type="button"
          disabled={bothPlaceholders || busy}
          onClick={() => save("finished")}
          className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-40"
        >
          Final
        </button>
        <button
          type="button"
          disabled={bothPlaceholders || busy}
          onClick={() => {
            setDraft(null);
            void save("scheduled", { clearScores: true });
          }}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
        >
          Reset
        </button>
      </div>
    </li>
  );
}

export function ManageClient({ tournament }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // SWR owns fetching here too, so another organiser's entries show up without
  // a manual refresh. `mutate` re-reads after every write.
  const { data, error: loadError, mutate } = useTournament(tournament.id);
  const load = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (!data) {
    const message = error ?? (loadError as Error | undefined)?.message;
    return <p className="text-sm text-slate-500">{message ?? "Loading…"}</p>;
  }

  const groupStage = data.stages.find((s) => s.type === "GROUPS");
  const hasKnockoutAfterGroups =
    groupStage && data.stages.some((s) => s.type === "KNOCKOUT" && s.order > groupStage.order);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tournament.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            <Link href="/admin" className="underline">
              Admin
            </Link>
            <span className="mx-1.5">·</span>
            <Link href={`/${tournament.id}`} className="underline">
              Public view
            </Link>
            <span className="mx-1.5">·</span>
            <span className="capitalize">{data.status}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {(["draft", "active", "completed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy || data.status === s}
              onClick={() =>
                run(
                  () =>
                    fetch(`/api/tournaments/${tournament.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: s }),
                    }),
                  `Tournament marked ${s}.`,
                )
              }
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize ring-1 ring-slate-200 disabled:opacity-40 ${
                data.status === s ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
          {notice}
        </p>
      )}

      <Card>
        <h2 className="text-sm font-semibold">Stages</h2>
        <div className="mt-3 space-y-2">
          {data.stages.map((stage) => (
            <div
              key={stage.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{stage.name}</p>
                <p className="text-xs text-slate-500">
                  {stage.type} · {stage.matchCount} matches
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => post(`/api/stages/${stage.id}/generate`),
                      `Fixtures generated for ${stage.name}.`,
                    )
                  }
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-40"
                >
                  {stage.matchCount > 0 ? "Regenerate fixtures" : "Generate fixtures"}
                </button>
                {stage.type === "GROUPS" && hasKnockoutAfterGroups && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => post(`/api/stages/${stage.id}/advance`),
                        "Knockout bracket seeded from the group tables.",
                      )
                    }
                    className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-40"
                  >
                    Advance to knockout
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Regenerating fixtures replaces every match in that stage, including entered scores.
        </p>
      </Card>

      {data.stages.map((stage) => {
        const matches = data.matches.filter((m) => m.stageId === stage.id);
        if (matches.length === 0) return null;

        const sections = new Map<string, PublicMatch[]>();
        for (const m of matches) {
          const key = m.groupName ?? `Round ${m.round}`;
          const list = sections.get(key) ?? [];
          list.push(m);
          sections.set(key, list);
        }

        return (
          <section key={stage.id} className="space-y-3">
            <h2 className="text-sm font-semibold">{stage.name}</h2>
            {[...sections.entries()].map(([label, list]) => (
              <Card key={label} className="p-0">
                <h3 className="border-b border-slate-100 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </h3>
                <ul className="divide-y divide-slate-100">
                  {list.map((m) => (
                    <ScoreEditor
                      key={m.id}
                      match={m}
                      onSaved={() => {
                        setNotice("Score saved.");
                        setError(null);
                        void load();
                      }}
                      onError={(message) => {
                        setError(message);
                        setNotice(null);
                      }}
                    />
                  ))}
                </ul>
              </Card>
            ))}
          </section>
        );
      })}
    </div>
  );
}
