import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootDocument } from "@/components/RootDocument";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: {
    default: "Kickboard, run your football tournament",
    template: "%s · Kickboard",
  },
  description:
    "League tables, knockout brackets and live scores for your football tournament. Spectators watch without logging in.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚽</text></svg>",
  },
};

/*
  Root layout for the marketing surface. Nothing here reads data, cookies or
  headers, and nothing sets force-dynamic, because any of those would silently
  drop these pages out of static prerendering.

  The main carries no width or padding of its own: Section runs full bleed and
  the Container inside it supplies the width.
*/
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <RootDocument>
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </RootDocument>
  );
}
