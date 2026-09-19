import type { ReactNode } from "react";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "bg-red-100 text-red-700 ring-red-200",
    finished: "bg-slate-100 text-slate-600 ring-slate-200",
    scheduled: "bg-sky-100 text-sky-700 ring-sky-200",
  };
  const label = status === "live" ? "Live" : status === "finished" ? "FT" : "Scheduled";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        styles[status] ?? styles.scheduled
      }`}
    >
      {status === "live" && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
      <p className="font-medium text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export function formatKickoff(iso: string | null): string {
  if (!iso) return "TBC";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}
