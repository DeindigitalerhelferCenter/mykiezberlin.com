// Outgoing e-mail from the server (2026-11-11). The sender is ALWAYS an address of mykiezberlin.com
// (info@ or support@) – never the private address the mails are forwarded to.
// Provider: Brevo (secret BREVO_API_KEY in the Pages project, domain mykiezberlin.com verified in Brevo).
// Fallback: a Cloudflare Email Service binding named EMAIL. Without either, nothing is sent –
// the data is still saved in D1 and the admin phone is still notified.
export const INFO = "info@mykiezberlin.com";
export const SUPPORT = "support@mykiezberlin.com";

export function mailReady(env) {
  return Boolean(env.BREVO_API_KEY || (env.EMAIL && typeof env.EMAIL.send === "function"));
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Simple branded HTML version of a plain-text mail. */
function toHtml(text) {
  const body = esc(text).replace(/\n/g, "<br>");
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">
<div style="background:#E30613;color:#fff;font-weight:bold;padding:12px 16px;border-radius:10px 10px 0 0">My Kiez Berlin</div>
<div style="border:1px solid #eee;border-top:0;padding:16px;border-radius:0 0 10px 10px">${body}</div>
<p style="font-size:12px;color:#888">mykiezberlin.com · info@mykiezberlin.com</p></div>`;
}

/** Last provider error (for the admin mail test), e.g. "brevo 401: …". */
export let lastError = "";

/** Sends a mail. Returns true when the provider accepted it. */
export async function sendMail(env, { to, subject, text, from = INFO, replyTo = "" }) {
  if (!to || !mailReady(env)) return false;
  try {
    if (env.BREVO_API_KEY) {
      const msg = {
        sender: { name: "My Kiez Berlin", email: from },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: toHtml(text),
      };
      if (replyTo) msg.replyTo = { email: replyTo };
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(msg),
      });
      if (!res.ok) lastError = `brevo ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`;
      return res.ok;
    }
    const msg = { from: { email: from, name: "My Kiez Berlin" }, to, subject, text };
    if (replyTo) msg.replyTo = replyTo;
    await env.EMAIL.send(msg);
    return true;
  } catch (e) {
    lastError = String(e && e.message || e).slice(0, 200);
    return false;
  }
}
