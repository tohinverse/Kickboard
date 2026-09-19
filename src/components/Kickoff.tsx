"use client";

import { useSyncExternalStore } from "react";

// Nothing to subscribe to — the value only differs between server and client.
const noop = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * Kick-off times are formatted by the browser, not the server.
 *
 * `toLocaleString` resolves against the host's timezone and locale, so the
 * server (UTC inside a container) and the viewer's browser would render the
 * same instant differently and React would report a hydration mismatch.
 * `useSyncExternalStore` gives the server and the first client render the same
 * UTC text, then re-renders with the localised version — so every spectator
 * sees the kick-off in their own timezone with no mismatch.
 */
export function Kickoff({ iso }: { iso: string | null }) {
  const hydrated = useSyncExternalStore(noop, onClient, onServer);

  if (!iso) return <>TBC</>;

  const text = hydrated
    ? new Date(iso).toLocaleString(undefined, {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "short",
      })
    : `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;

  return <time dateTime={iso}>{text}</time>;
}
