import type { ReactNode } from "react";

/*
  Feature cards in a responsive grid, collapsing to a single column on a phone.
*/
export function FeatureGrid({
  features,
  columns = 3,
}: {
  features: { title: string; body: string; icon?: ReactNode }[];
  columns?: 2 | 3;
}) {
  const grid = columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <ul className={`grid gap-6 ${grid}`}>
      {features.map((feature) => (
        <li
          key={feature.title}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {feature.icon && (
            <div aria-hidden="true" className="mb-4 text-accent">
              {feature.icon}
            </div>
          )}
          <h3 className="text-lg font-semibold tracking-tight">{feature.title}</h3>
          <p className="mt-2 text-base leading-relaxed text-slate-600">{feature.body}</p>
        </li>
      ))}
    </ul>
  );
}
