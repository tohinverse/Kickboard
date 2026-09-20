import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { RootDocument } from "@/components/RootDocument";

export const metadata: Metadata = {
  title: "Kickboard",
  description: "Live football tournament scores, standings and brackets.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚽</text></svg>",
  },
};

/*
  Root layout for the app surface: the tournament list, the spectator pages and
  the admin area. Its chrome is deliberately compact — spectators read these
  pages at the side of a pitch — and none of the marketing chrome reaches here,
  because that lives under a separate root layout in the (marketing) group.
*/
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RootDocument>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/tournaments" className="flex items-center gap-2 font-semibold tracking-tight">
            <span aria-hidden="true" className="text-xl">⚽</span>
            <span className="text-lg">Kickboard</span>
          </Link>
          <Link
            href="/admin"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Admin
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-slate-500">
          Kickboard — live tournament scores
        </div>
      </footer>
    </RootDocument>
  );
}
