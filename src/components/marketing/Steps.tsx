import type { ReactNode } from "react";

/*
  Numbered steps. The number comes from the item's index, so a caller can
  reorder or insert a step without renumbering anything by hand.
*/
export function Steps({
  steps,
}: {
  steps: { title: string; body: string; visual?: ReactNode }[];
}) {
  return (
    <ol className="space-y-12">
      {steps.map((step, index) => (
        <li
          key={step.title}
          /* Only split into two columns when there is actually a visual to put
             in the second one, so a step without one does not leave half the
             row empty. */
          className={`grid items-center gap-8 ${step.visual ? "lg:grid-cols-2" : ""}`}
        >
          <div className={step.visual ? "" : "max-w-2xl"}>
            <span
              aria-hidden="true"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-base font-semibold text-white"
            >
              {index + 1}
            </span>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-600">{step.body}</p>
          </div>
          {step.visual && <div className="min-w-0">{step.visual}</div>}
        </li>
      ))}
    </ol>
  );
}
