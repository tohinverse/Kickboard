import Link from "next/link";
import { Container } from "@/components/ui";
import { footerGroups, pagesInGroup } from "./pages";

/*
  Renders from the same existing pages list the header reads, so the two can
  never disagree about what exists. A group whose pages are all absent is not
  rendered at all rather than rendered empty, which today leaves Product and
  Tournaments only.

  No copyright year: a locale and clock dependent value has no place on a
  statically prerendered page.
*/
export function MarketingFooter() {
  const groups = footerGroups
    .map((group) => ({ group, pages: pagesInGroup(group) }))
    .filter(({ pages }) => pages.length > 0);

  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container>
        <div className="flex flex-col gap-10 py-12 sm:flex-row sm:justify-between">
          <div>
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span aria-hidden="true" className="text-xl">⚽</span>
              <span className="text-lg">Kickboard</span>
            </Link>
            <p className="mt-2 text-sm text-slate-500">Kickboard — live tournament scores</p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-10">
            {groups.map(({ group, pages }) => (
              <div key={group}>
                <h2 className="text-sm font-semibold tracking-tight text-slate-900">{group}</h2>
                <ul className="mt-3 space-y-2">
                  {pages.map((page) => (
                    <li key={page.href}>
                      <Link
                        href={page.href}
                        className="text-sm text-slate-500 transition hover:text-slate-900"
                      >
                        {page.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-900">Watch</h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href="/tournaments"
                    className="text-sm text-slate-500 transition hover:text-slate-900"
                  >
                    Tournaments
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
