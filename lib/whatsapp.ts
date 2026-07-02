// Server-side WhatsApp sender. Free providers, selected by env:
//   • GREEN-API  — RECOMMENDED. Free Developer plan; link your own WhatsApp via QR,
//                  then send to ANY number (up to 3 recipients on the free tier).
//   • Twilio     — WhatsApp sandbox (free trial); recipients join the sandbox once.
//   • CallMeBot  — zero account, but flaky and only messages numbers that registered.
// Nothing configured => not configured (UI falls back to a simulated send).

export type SendResult = { phone: string; status: "sent" | "failed"; error?: string };
export type Provider = "greenapi" | "twilio" | "callmebot" | null;

export function whatsappConfig(): { configured: boolean; provider: Provider } {
  if (process.env.GREENAPI_ID_INSTANCE && process.env.GREENAPI_API_TOKEN)
    return { configured: true, provider: "greenapi" };
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM)
    return { configured: true, provider: "twilio" };
  if (process.env.CALLMEBOT_RECIPIENTS) return { configured: true, provider: "callmebot" };
  return { configured: false, provider: null };
}

function parseRecipients(raw: string | undefined): string[] {
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

async function sendGreenApi(message: string): Promise<SendResult[]> {
  const id = process.env.GREENAPI_ID_INSTANCE!;
  const token = process.env.GREENAPI_API_TOKEN!;
  const base = (process.env.GREENAPI_BASE || "https://api.green-api.com").replace(/\/$/, "");
  const to = parseRecipients(process.env.WHATSAPP_RECIPIENTS);
  if (to.length === 0) return [{ phone: "-", status: "failed", error: "WHATSAPP_RECIPIENTS is empty/invalid JSON" }];

  const out: SendResult[] = [];
  for (const num of to) {
    const chatId = num.replace(/[^0-9]/g, "") + "@c.us";
    try {
      const res = await fetch(`${base}/waInstance${id}/sendMessage/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message }),
      });
      const body = await res.text();
      if (res.ok && /idMessage/i.test(body)) out.push({ phone: num, status: "sent" });
      else out.push({ phone: num, status: "failed", error: body.slice(0, 160) });
    } catch (e) {
      out.push({ phone: num, status: "failed", error: String(e).slice(0, 120) });
    }
  }
  return out;
}

async function sendTwilio(message: string): Promise<SendResult[]> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM!; // "whatsapp:+14155238886"
  const to = parseRecipients(process.env.WHATSAPP_RECIPIENTS);
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
      else out.push({ phone: num, status: "failed", error: (await res.text()).slice(0, 160) });
    } catch (e) {
      out.push({ phone: num, status: "failed", error: String(e).slice(0, 120) });
    }
  }
  return out;
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

export async function sendWhatsApp(message: string): Promise<{ provider: Provider; results: SendResult[] }> {
  const { provider } = whatsappConfig();
  if (provider === "greenapi") return { provider, results: await sendGreenApi(message) };
  if (provider === "twilio") return { provider, results: await sendTwilio(message) };
  if (provider === "callmebot") return { provider, results: await sendCallMeBot(message) };
  return { provider: null, results: [] };
}
