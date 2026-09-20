import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";

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

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 ${className}`}>{children}</div>;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "unstyled";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline-slate-900",
  secondary:
    "bg-white text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-900",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-slate-900",
  /* Unstyled: the caller supplies the colour. CtaButton uses this to apply the
     marketing accent without the slate classes needing to be overridden. */
  unstyled: "",
};

/*
  The shared button primitive for both surfaces. Deliberately accent free: the
  marketing green lives in CtaButton alone, so this file carries no marketing
  specific colour. Renders a Link when href is given, otherwise a button.
*/
export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  ...rest
}: {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">) {
  const { "aria-label": ariaLabel, ...buttonProps } = rest as { "aria-label"?: string } & typeof rest;
  const classes =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 " +
    `disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} aria-label={ariaLabel} {...buttonProps}>
      {children}
    </button>
  );
}
