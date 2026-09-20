/*
  The heading block every marketing section opens with: an optional small
  eyebrow label, the heading itself, and an optional lead paragraph. The lead is
  width constrained so long copy never stretches to an unreadable line length.
*/
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p className="text-sm font-semibold tracking-wide text-accent uppercase">{eyebrow}</p>
      )}
      <h2
        className={`text-3xl font-semibold tracking-tight text-balance sm:text-4xl ${
          eyebrow ? "mt-3" : ""
        }`}
      >
        {title}
      </h2>
      {lead && <p className="mt-4 text-lg leading-relaxed text-slate-600">{lead}</p>}
    </div>
  );
}
