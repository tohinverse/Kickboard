"use client";

export function LiveIndicator({ isValidating }: { isValidating: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isValidating ? "animate-pulse bg-emerald-500" : "bg-slate-300"
        }`}
        aria-hidden="true"
      />
      Auto-updating
    </span>
  );
}
