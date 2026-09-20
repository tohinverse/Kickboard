"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui";
import { CtaButton } from "./CtaButton";
import { marketingPages } from "./pages";

/*
  A client component, following the pattern PublicNav already sets in this repo:
  it needs local state for the disclosure panel and usePathname to mark the
  current page.

  The panel closes on Escape and on a route change, and hands focus back to the
  toggle when it does, so a link tap never leaves it covering the page it just
  navigated to.
*/
export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /*
    Close on route change, adjusted during render rather than in an effect: an
    effect would paint the panel over the new page for a frame first, and React
    warns against the cascading render it causes. Focus stays wherever the
    navigation put it, since pulling it back to the toggle after a page change
    would be disorienting.
  */
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  // Escape closes the panel and returns focus to the toggle. The listener is
  // only attached while the panel is open, so Escape does nothing when it is
  // already closed.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const navLinkClasses = (href: string) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${
      pathname === href
        ? "bg-slate-100 text-slate-900"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <Container>
        <div className="flex items-center justify-between gap-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <span aria-hidden="true" className="text-2xl">⚽</span>
            <span className="text-xl">Kickboard</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {marketingPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className={navLinkClasses(page.href)}
                aria-current={pathname === page.href ? "page" : undefined}
              >
                {page.label}
              </Link>
            ))}
            <Link
              href="/tournaments"
              className="rounded-md px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Tournaments
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {/* Stays visible beside the toggle at every width. The label
                shortens on a phone so it cannot wrap and squeeze the logo; the
                full wording is still what a screen reader announces. */}
            <CtaButton href="/admin" label="Create a tournament">
              <span className="sm:hidden">Create</span>
              <span className="hidden sm:inline">Create a tournament</span>
            </CtaButton>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((wasOpen) => !wasOpen)}
              aria-expanded={open}
              aria-controls="marketing-menu"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 md:hidden"
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-5 w-5"
              >
                {open ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Kept mounted so the toggle's aria-controls always resolves to a real
            element, and hidden rather than unmounted so nothing inside it is
            reachable by keyboard while it is closed. */}
        <nav
          id="marketing-menu"
          aria-label="Main menu"
          hidden={!open}
          className="border-t border-slate-200 py-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {marketingPages.map((page) => (
              <li key={page.href}>
                <Link
                  href={page.href}
                  className={`block ${navLinkClasses(page.href)}`}
                  aria-current={pathname === page.href ? "page" : undefined}
                >
                  {page.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/tournaments"
                className="block rounded-md px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Tournaments
              </Link>
            </li>
          </ul>
        </nav>
      </Container>
    </header>
  );
}
