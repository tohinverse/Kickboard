"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui";

type Format = "LEAGUE" | "KNOCKOUT" | "GROUPS_KNOCKOUT";

const formats: { key: Format; label: string; hint: string }[] = [
  { key: "GROUPS_KNOCKOUT", label: "Groups → Knockout", hint: "Group round-robin, then a bracket" },
  { key: "LEAGUE", label: "League", hint: "Everyone plays everyone" },
  { key: "KNOCKOUT", label: "Knockout", hint: "Single elimination" },
];

function stagesFor(format: Format, groupSize: number, advancePerGroup: number) {
  if (format === "LEAGUE") {
    return [{ name: "League", type: "LEAGUE", config: { pointsWin: 3, pointsDraw: 1 } }];
  }
  if (format === "KNOCKOUT") {
    return [{ name: "Knockout", type: "KNOCKOUT", config: {} }];
  }
  return [
    {
      name: "Group Stage",
      type: "GROUPS",
      config: { pointsWin: 3, pointsDraw: 1, groupSize, advancePerGroup },
    },
    { name: "Knockout", type: "KNOCKOUT", config: {} },
  ];
}

export function CreateTournamentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<Format>("GROUPS_KNOCKOUT");
  const [groupSize, setGroupSize] = useState(4);
  const [advancePerGroup, setAdvancePerGroup] = useState(2);
  const [teamsText, setTeamsText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const teams = teamsText
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        teams,
        stages: stagesFor(format, groupSize, advancePerGroup),
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push(`/admin/tournaments/${body.tournament.id}`);
    } else {
      setError(body.error ?? "Could not create tournament.");
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold">New tournament</h2>
      <form onSubmit={submit} className="mt-3 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Summer Cup 2026"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Format</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-3">
            {formats.map((f) => (
              <label
                key={f.key}
                className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${
                  format === f.key
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={f.key}
                  checked={format === f.key}
                  onChange={() => setFormat(f.key)}
                  className="sr-only"
                />
                <span className="block font-medium">{f.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{f.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {format === "GROUPS_KNOCKOUT" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="groupSize" className="block text-sm font-medium text-slate-700">
                Teams per group
              </label>
              <input
                id="groupSize"
                type="number"
                min={2}
                max={16}
                value={groupSize}
                onChange={(e) => setGroupSize(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label htmlFor="advance" className="block text-sm font-medium text-slate-700">
                Advance per group
              </label>
              <input
                id="advance"
                type="number"
                min={1}
                max={8}
                value={advancePerGroup}
                onChange={(e) => setAdvancePerGroup(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="teams" className="block text-sm font-medium text-slate-700">
            Teams <span className="font-normal text-slate-500">— one per line ({teams.length})</span>
          </label>
          <textarea
            id="teams"
            value={teamsText}
            onChange={(e) => setTeamsText(e.target.value)}
            rows={8}
            placeholder={"Arsenal\nChelsea\nLiverpool\n…"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-slate-900"
          />
          <p className="mt-1 text-xs text-slate-500">
            Order sets the seeding. You can edit the list later.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create tournament"}
        </button>
      </form>
    </Card>
  );
}
