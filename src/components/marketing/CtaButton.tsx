import type { ReactNode } from "react";
import { Button } from "@/components/ui";

/*
  The only component in the repo that touches the marketing accent. Everything
  else reaches for Button, which stays slate. Keeping the green in one file is
  what makes a later change to it a single edit.
*/
export function CtaButton({
  children,
  href,
  variant = "primary",
  label,
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
  /* Set this when the visible text shortens by viewport, so the accessible
     name stays the full wording rather than the abbreviated one. */
  label?: string;
}) {
  if (variant === "secondary") {
    return (
      <Button href={href} variant="secondary" aria-label={label}>
        {children}
      </Button>
    );
  }

  return (
    <Button
      href={href}
      variant="unstyled"
      aria-label={label}
      className="bg-accent text-white hover:bg-accent-hover focus-visible:outline-accent"
    >
      {children}
    </Button>
  );
}
