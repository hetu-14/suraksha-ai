import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-950 text-white flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold">404 · Page Not Found</h2>
      <p className="text-ink-400 mt-2 text-sm">The page you are looking for does not exist or has been relocated.</p>
      <Link href="/" className="mt-6 text-sm font-semibold text-brand-400 hover:underline">
        Return to SuRaksha AI Portal
      </Link>
    </div>
  );
}
