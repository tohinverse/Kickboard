import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/*
  The single source of document setup for both root layouts. There is no top
  level layout.tsx, so `(app)` and `(marketing)` each own an <html>/<body> pair;
  routing them both through here is what stops the two from drifting apart.

  It owns exactly <html> and <body>. No <main>, no header, no footer — each root
  layout supplies its own chrome, because the app's fixed width main and the
  marketing full bleed sections need different treatment.
*/
export function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/*
        Browser extensions (password managers, ad blockers, Grammarly) commonly
        stamp attributes onto <body> before React hydrates, which React reports
        as a mismatch even though the server markup is correct. This suppresses
        the warning for this element's own attributes only — mismatches in the
        tree below are still reported.
      */}
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col bg-slate-50 text-slate-900"
      >
        {children}
      </body>
    </html>
  );
}
