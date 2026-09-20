import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { Hero } from "@/components/marketing/Hero";
import { Section } from "@/components/marketing/Section";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Three tournament formats, standings that keep themselves right, live scores without refreshing, and public pages spectators reach without an account.",
};

/*
  A page header plus the honest headline features. The deeper comparison
  treatment belongs to the "Features page" scope feature; this exists so the nav
  link is not dead and so that feature composes these pieces.
*/
export default function FeaturesPage() {
  return (
    <>
      <Hero
        title="What Kickboard does"
        lead="Enough to run a real tournament properly, and deliberately nothing beyond it."
        primaryAction={{ label: "Create a tournament", href: "/admin" }}
        secondaryAction={{ label: "Watch a tournament", href: "/tournaments" }}
      />

      <Section>
        <Container>
          <SectionHeading
            eyebrow="Formats"
            title="Three ways to run it"
            lead="Pick the shape your tournament already has. Kickboard generates the fixtures and keeps the maths right from there."
          />
          <div className="mt-12">
            <FeatureGrid
              columns={3}
              features={[
                {
                  title: "League",
                  body: "Everyone plays everyone. The table ranks on points, then goal difference, and reorders itself as results land.",
                },
                {
                  title: "Knockout",
                  body: "A straight bracket. Enter a result and the winner moves into the next round without you redrawing anything.",
                },
                {
                  title: "Groups into a knockout",
                  body: "Group tables first, then the qualifiers feed into a bracket, the way most cup competitions actually run.",
                },
              ]}
            />
          </div>
        </Container>
      </Section>

      <Section tint="slate">
        <Container>
          <SectionHeading
            eyebrow="Running it on the day"
            title="Built for the side of a pitch"
            lead="The parts that matter once the football has actually started."
          />
          <div className="mt-12">
            <FeatureGrid
              columns={2}
              features={[
                {
                  title: "Live scores without refreshing",
                  body: "Public pages pick up new scores every fifteen seconds, so a result entered on the touchline appears on its own.",
                },
                {
                  title: "No login for spectators",
                  body: "One shared link is the whole thing. Nobody creates an account and nobody installs an app.",
                },
                {
                  title: "A password gated admin area",
                  body: "Only whoever runs the tournament can enter results, so the scores everyone is reading stay trustworthy.",
                },
                {
                  title: "Standings, bracket and matches per tournament",
                  body: "Each tournament has its own tabs for the table, the bracket and the full match list, all laid out for a phone.",
                },
              ]}
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
