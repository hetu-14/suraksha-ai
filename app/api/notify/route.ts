import { NextRequest, NextResponse } from "next/server";
import { sendWhatsApp, whatsappConfig } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET → report whether WhatsApp is configured (used by the UI badge)
export async function GET() {
  return NextResponse.json(whatsappConfig());
}

// POST { message } → actually send the WhatsApp notification to configured recipients
export async function POST(req: NextRequest) {
  let message = "";
  try {
    const body = await req.json();
    message = String(body?.message ?? "").trim();
  } catch {
    /* ignore */
  }
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const cfg = whatsappConfig();
  if (!cfg.configured) {
    return NextResponse.json({ configured: false, provider: null, sent: 0, total: 0, results: [] });
  }

  const { provider, results } = await sendWhatsApp(message);
  const sent = results.filter((r) => r.status === "sent").length;
  return NextResponse.json({ configured: true, provider, sent, total: results.length, results });
}
