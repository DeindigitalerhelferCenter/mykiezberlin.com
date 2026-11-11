// Outgoing e-mail from the server (2026-11-11). The sender is ALWAYS an address of mykiezberlin.com
// (info@ or support@) – never the private address the mails are forwarded to.
// Needs a Cloudflare Email Service binding named EMAIL on the Pages project. Without it nothing is sent,
// the data is still saved in D1 and the admin phone is still notified.
export const INFO = "info@mykiezberlin.com";
export const SUPPORT = "support@mykiezberlin.com";

export function mailReady(env) {
  return Boolean(env.EMAIL && typeof env.EMAIL.send === "function");
}

/** Sends a plain-text mail. Returns true when the binding accepted it. */
export async function sendMail(env, { to, subject, text, from = INFO, replyTo = "" }) {
  if (!mailReady(env) || !to) return false;
  try {
    const msg = { from: { email: from, name: "My Kiez Berlin" }, to, subject, text };
    if (replyTo) msg.replyTo = replyTo;
    await env.EMAIL.send(msg);
    return true;
  } catch (e) {
    return false;
  }
}
