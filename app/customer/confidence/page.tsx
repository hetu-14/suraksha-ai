import { redirect } from "next/navigation";

// The confidence concepts (score, tiers, referrals) were folded into
// Health Score and TrustPoints; this route stays alive for old links.
export default function ConfidencePage() {
  redirect("/customer/health");
}
