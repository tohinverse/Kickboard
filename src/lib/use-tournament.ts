"use client";

import useSWR from "swr";
import type { PublicTournament } from "@/lib/public-data";

/** Spectator pages poll instead of holding a socket open. */
export const POLL_INTERVAL_MS = 15_000;

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Could not load tournament.");
  }
  const data = await res.json();
  return data.tournament as PublicTournament;
};

export function useTournament(id: string, fallbackData?: PublicTournament) {
  return useSWR<PublicTournament>(`/api/public/tournaments/${id}`, fetcher, {
    refreshInterval: POLL_INTERVAL_MS,
    revalidateOnFocus: true,
    keepPreviousData: true,
    fallbackData,
  });
}
