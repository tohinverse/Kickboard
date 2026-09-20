import type { ReactNode } from "react";

/*
  A full bleed band. The caller puts a Container inside to supply the width,
  which is what lets a tinted section run edge to edge while its content stays
  aligned with everything else on the page.
*/
export function Section({
  children,
  tint = "white",
  size = "default",
  id,
}: {
  children: ReactNode;
  tint?: "white" | "slate";
  size?: "default" | "lg";
  id?: string;
}) {
  const background = tint === "slate" ? "bg-slate-50" : "bg-white";
  const padding = size === "lg" ? "py-(--spacing-section-lg)" : "py-(--spacing-section)";

  return (
    <section id={id} className={`${background} ${padding}`}>
      {children}
    </section>
  );
}
