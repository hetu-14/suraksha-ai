// Server-side WhatsApp sender. Two free providers, selected by env:
//   • CallMeBot  — zero account; each recipient registers once and shares an apikey.
//   • Twilio     — WhatsApp sandbox (free trial); recipients join the sandbox once.
// Nothing configured => not configured (UI falls back to a simulated send).

export type SendResult = { phone: string; status: "sent" | "failed"; error?: string };
export type Provider = "callmebot" | "twilio" | null;

export function whatsappConfig(): { configured: boolean; provider: Provider } {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM
  )
    return { configured: true, provider: "twilio" };
  if (process.env.CALLMEBOT_RECIPIENTS) return { configured: true, provider: "callmebot" };
  return { configured: false, provider: null };
}

async function sendCallMeBot(message: string): Promise<SendResult[]> {
  let list: { phone: string; apikey: string }[] = [];
  try {
    list = JSON.parse(process.env.CALLMEBOT_RECIPIENTS || "[]");
  } catch {
    return [{ phone: "-", status: "failed", error: "CALLMEBOT_RECIPIENTS is not valid JSON" }];
  }
  const out: SendResult[] = [];
  for (const r of list) {
    try {
      const url =
        `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(r.phone)}` +
        `&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(r.apikey)}`;
      const res = await fetch(url);
      const body = await res.text();
      if (res.ok && !/error|invalid|apikey/i.test(body)) out.push({ phone: r.phone, status: "sent" });
      else out.push({ phone: r.phone, status: "failed", error: body.slice(0, 120) });
    } catch (e) {
      out.push({ phone: r.phone, status: "failed", error: String(e).slice(0, 120) });
    }
  }
  return out;
}

async function sendTwilio(message: string): Promise<SendResult[]> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM!; // e.g. "whatsapp:+14155238886"
  let to: string[] = [];
  try {
    to = JSON.parse(process.env.WHATSAPP_RECIPIENTS || "[]");
  } catch {
    return [{ phone: "-", status: "failed", error: "WHATSAPP_RECIPIENTS is not valid JSON" }];
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const out: SendResult[] = [];
  for (const num of to) {
    try {
      const params = new URLSearchParams({ From: from, To: `whatsapp:${num}`, Body: message });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });
      if (res.ok) out.push({ phone: num, status: "sent" });
      else {
        const b = await res.text();
        out.push({ phone: num, status: "failed", error: b.slice(0, 160) });
      }
    } catch (e) {
      out.push({ phone: num, status: "failed", error: String(e).slice(0, 120) });
    }
  }
  return out;
}

export async function sendWhatsApp(message: string): Promise<{ provider: Provider; results: SendResult[] }> {
  const { provider } = whatsappConfig();
  if (provider === "twilio") return { provider, results: await sendTwilio(message) };
  if (provider === "callmebot") return { provider, results: await sendCallMeBot(message) };
  return { provider: null, results: [] };
}
