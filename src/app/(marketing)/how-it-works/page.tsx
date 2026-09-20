import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { Hero } from "@/components/marketing/Hero";
import { Section } from "@/components/marketing/Section";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Steps } from "@/components/marketing/Steps";
import { ScreenshotFrame } from "@/components/marketing/ScreenshotFrame";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Create a tournament, add your teams, pick a format, enter scores and share one public link. Here is the whole flow, step by step.",
};

/*
  A page header plus an honest outline of the flow. The full treatment, with a
  visual per step and the formats named in detail, belongs to the "How it works
  page" scope feature; this exists so the nav link is not dead and so that
  feature composes these pieces rather than inventing its own.
*/
export default function HowItWorksPage() {
  return (
    <>
      <Hero
        title="How Kickboard works"
        lead="From an empty tournament to live scores on a shared link, in five steps."
        primaryAction={{ label: "Create a tournament", href: "/admin" }}
        secondaryAction={{ label: "Watch a tournament", href: "/tournaments" }}
      />

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Step by step"
            title="The whole flow, start to finish"
            lead="Each step takes a minute or two. Nothing here needs a spreadsheet or a second tool."
          />
          <div className="mt-12">
            <Steps
              steps={[
                {
                  title: "Create the tournament",
                  body: "Give it a name in the admin area. That is the whole setup; everything else hangs off it.",
                },
                {
                  title: "Add your teams",
                  body: "Type the teams in one by one. You can keep adding until you generate the fixtures.",
                },
                {
                  title: "Pick a format",
                  body: "A league, a knockout, or groups feeding into a knockout. Kickboard generates the fixtures to match.",
                  visual: (
                    <ScreenshotFrame
                      src="/screenshots/bracket.png"
                      alt="A Kickboard knockout bracket running from the round of 16 through to the final"
                      width={2400}
                      height={2160}
                    />
                  ),
                },
                {
                  title: "Enter scores as they finish",
                  body: "Put in each result and the table reorders itself. In a knockout the winner advances on its own.",
                  visual: (
                    <ScreenshotFrame
                      src="/screenshots/admin-score-entry.png"
                      alt="The Kickboard admin screen, entering scores for each match in a round"
                      width={2000}
                      height={1520}
                    />
                  ),
                },
                {
                  title: "Share the public link",
                  body: "Send one link to everyone. They see the current scores without signing in, and the page keeps itself up to date.",
                },
              ]}
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
