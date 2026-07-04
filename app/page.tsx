/**
 * page.tsx — Server Component entry point (no "use client").
 *
 * Renders <ClientLoader>, which uses next/dynamic with { ssr: false }
 * to load the full animated landing page only on the client.
 *
 * This eliminates the SSR → hydration double-paint that caused the page
 * to visually reload twice on every hard refresh (Cmd+Shift+R).
 */
import ClientLoader from "./client-loader";

export default function Page() {
  return <ClientLoader />;
}
