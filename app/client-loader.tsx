"use client";

/**
 * ClientLoader — a "use client" component that dynamically imports
 * the full landing page with { ssr: false }.
 *
 * This is the correct pattern for Next.js 15 App Router:
 *   - `ssr: false` is only allowed inside Client Components.
 *   - page.tsx is a Server Component; it renders <ClientLoader />.
 *   - ClientLoader dynamically loads the real page, client-only.
 *
 * Result: the browser receives a simple dark <div> from the server,
 * then the full animated page is mounted exactly once — no double paint.
 */
import dynamic from "next/dynamic";

const Landing = dynamic(() => import("./landing-client"), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: "100vh", background: "#020617" }} />
  ),
});

export default function ClientLoader() {
  return <Landing />;
}
