import { Container } from "@/components/ui";
import { Hero } from "@/components/marketing/Hero";
import { Section } from "@/components/marketing/Section";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { ScreenshotFrame } from "@/components/marketing/ScreenshotFrame";
import { CtaButton } from "@/components/marketing/CtaButton";

/*
  Sets no metadata of its own, so the marketing root's title.default renders
  alone. A title template only applies to child segments, so the default is not
  wrapped in "%s · Kickboard" here.
*/
export default function LandingPage() {
  return (
    <>
      <Hero
        title="Run your football tournament without the spreadsheet"
        lead="Kickboard keeps the table, the bracket and the scores in one place. You enter results; everyone else just watches, no login and no app to install."
        primaryAction={{ label: "Create a tournament", href: "/admin" }}
        secondaryAction={{ label: "Watch a tournament", href: "/tournaments" }}
        visual={
          <ScreenshotFrame
            src="/screenshots/standings.png"
            alt="A Kickboard league table showing played, won, drawn, lost, goal difference and points per team"
            width={2000}
            height={1400}
          />
        }
      />

      <Section tint="slate">
        <Container>
          <SectionHeading
            eyebrow="Why Kickboard"
            title="Everything a tournament needs, nothing it does not"
            lead="Built for the person running a Sunday league, a five a side night or a work cup, who would rather watch the football than maintain a spreadsheet."
          />
          <div className="mt-12">
            <FeatureGrid
              features={[
                {
                  title: "Three formats, worked out for you",
                  body: "A league, a straight knockout, or groups feeding into a knockout. Kickboard generates the fixtures and keeps the maths right as results come in.",
                },
                {
                  title: "Standings that update themselves",
                  body: "Enter a score and the table reorders, goal difference and all. The bracket advances the winner into the next round on its own.",
                },
                {
                  title: "Spectators never sign in",
                  body: "Share one link. Players, parents and anyone else opens it and sees the current scores, with no account to create and nothing to install.",
                },
                {
                  title: "Live scores at the side of a pitch",
                  body: "The public pages refresh themselves every fifteen seconds, so a score entered on the touchline shows up without anyone reloading.",
                },
                {
                  title: "One person holds the keys",
                  body: "The admin area sits behind a password, so results are only ever entered by whoever is running the tournament.",
                },
                {
                  title: "Reads properly on a phone",
                  body: "The tables, brackets and match lists are laid out for a phone held in one hand, which is where most people will read them.",
                },
              ]}
            />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center sm:px-12">
            <SectionHeading
              align="center"
              title="Set your tournament up in a few minutes"
              lead="Add your teams, pick a format, and Kickboard builds the fixtures. Share the link and start entering scores."
            />
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <CtaButton href="/admin">Create a tournament</CtaButton>
              <CtaButton href="/how-it-works" variant="secondary">
                See how it works
              </CtaButton>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
