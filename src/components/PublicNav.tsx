"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "", label: "Overview" },
  { href: "/standings", label: "Standings" },
  { href: "/bracket", label: "Bracket" },
  { href: "/matches", label: "Matches" },
];

export function PublicNav({ tournamentId }: { tournamentId: string }) {
  const pathname = usePathname();
  const base = `/${tournamentId}`;

  return (
    <nav className="mb-5 flex flex-wrap gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`;
        const active = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              active
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
