import type { ReactNode } from "react";
import { Container } from "@/components/ui";
import { CtaButton } from "./CtaButton";

/*
  The opening band of a marketing page. Two column once there is a visual and
  the viewport is wide enough, single column otherwise, so it reads the same on
  a phone as an inner page header with no visual at all.
*/
export function Hero({
  title,
  lead,
  primaryAction,
  secondaryAction,
  visual,
}: {
  title: string;
  lead: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  visual?: ReactNode;
}) {
  return (
    <section className="border-b border-slate-200 bg-white py-(--spacing-section-lg)">
      <Container>
        <div
          className={
            visual ? "grid items-center gap-12 lg:grid-cols-2" : "mx-auto max-w-3xl text-center"
          }
        >
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">{lead}</p>
            <div
              className={`mt-8 flex flex-wrap gap-3 ${visual ? "" : "justify-center"}`}
            >
              <CtaButton href={primaryAction.href}>{primaryAction.label}</CtaButton>
              {secondaryAction && (
                <CtaButton href={secondaryAction.href} variant="secondary">
                  {secondaryAction.label}
                </CtaButton>
              )}
            </div>
          </div>
          {visual && <div className="min-w-0">{visual}</div>}
        </div>
      </Container>
    </section>
  );
}
