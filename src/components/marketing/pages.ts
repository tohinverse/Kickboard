/*
  The one list of marketing pages that exist. The header and the footer both
  render from it, so a link cannot appear in one and be missing from the other,
  and a link can never point at a page that has not been built.

  Switching a page on when it ships is a one line edit here. About, Contact,
  Privacy and Terms are absent until their own scope features build them, so
  today they render nowhere.
*/
export type FooterGroup = "Product" | "Company" | "Legal";

export type MarketingPage = {
  href: string;
  label: string;
  group: FooterGroup;
};

export const marketingPages: MarketingPage[] = [
  { href: "/how-it-works", label: "How it works", group: "Product" },
  { href: "/features", label: "Features", group: "Product" },
];

/* The order groups appear in the footer. A group with no live pages is not
   rendered at all, rather than rendered empty. */
export const footerGroups: FooterGroup[] = ["Product", "Company", "Legal"];

export function pagesInGroup(group: FooterGroup): MarketingPage[] {
  return marketingPages.filter((page) => page.group === group);
}
