// Advertising requests from /werben. Packages S/M/L can be paid right away by card (Stripe).
import { cleanText, db, isAdmin, json, noDb } from "../_lib/util.js";
import { createCheckout, REQUEST_SIZES } from "../_lib/werbung.js";
import { INFO, sendMail } from "../_lib/mail.js";
import { lang as pickLang, werbenReply } from "../_lib/mail-templates.js";
import { cleanupOldRequests, REQUEST_COLUMNS, sendLogged, shapeRequest } from "../_lib/ad-requests.js";

const SIZE_NAMES = { s: "Kiez Basic (29 €)", m: "Kiez Plus (49 €)", l: "Kiez Premium (89 €)", banner: "Banner", gp: "Gründungspartner" };

const MAX_REQUESTS_PER_DAY = 3;

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  const body = await request.json().catch(() => ({}));
  if (body.hp) return json({ ok: true }); // honeypot

  const row = {
    id: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
    company: cleanText(body.company, 120),
    person: cleanText(body.person, 80),
    email: cleanText(body.email, 120).toLowerCase(),
    phone: cleanText(body.phone, 40).replace(/[^\d+ ()/-]/g, ""),
    address: cleanText(body.address, 200),
    size: REQUEST_SIZES.includes(body.size) ? body.size : "s",
    message: String(body.message ?? "").replace(/[<>]/g, "").trim().slice(0, 1000),
  };
  if (row.company.length < 2) return json({ error: "field", field: "company" }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) return json({ error: "field", field: "email" }, 400);

  const recent = await database.prepare(`SELECT COUNT(*) AS n FROM ad_requests WHERE email = ? AND created_at > ?`).bind(row.email, Date.now() - 86400000).first();
  if (recent && recent.n >= MAX_REQUESTS_PER_DAY) return json({ error: "rate" }, 429);

  await database
    .prepare(`INSERT INTO ad_requests (id, company, person, email, phone, size, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`)
    .bind(row.id, row.company, row.person, row.email, row.phone, row.size, row.message, Date.now())
    .run();
  if (row.address) await database.prepare(`UPDATE ad_requests SET address = ? WHERE id = ?`).bind(row.address, row.id).run().catch(() => {});

  let checkoutUrl = "";
  const checkout = await createCheckout(env, new URL(request.url).origin, row).catch(() => null);
  if (checkout?.url) {
    checkoutUrl = checkout.url;
    await database.prepare(`UPDATE ad_requests SET stripe_session = ? WHERE id = ?`).bind(checkout.id, row.id).run();
  }
  // Copy of the request to info@mykiezberlin.com (only if the EMAIL binding exists; the admin panel always has it).
  // From = info@, Reply-To = the customer, so an answer never shows a private address.
  // Every mail is written into the request's mail log, so the admin sees whether it went out (2026-11-12).
  await sendLogged(env, database, row.id, "copy", {
    to: INFO,
    replyTo: row.email,
    subject: `Neue Werbeanfrage: ${row.company} – ${SIZE_NAMES[row.size] || row.size}`,
    text: [
      `Firma: ${row.company}`, `Ansprechpartner: ${row.person || "-"}`, `E-Mail: ${row.email}`, `Telefon: ${row.phone || "-"}`, `Adresse: ${row.address || "-"}`,
      `Paket: ${SIZE_NAMES[row.size] || row.size}`, "", row.message || "(keine Nachricht)", "", `Anfrage-ID: ${row.id}`,
    ].join("\n"),
  });
  // Automatic welcome reply to the customer (DE/TR/EN), sender info@ (2026-11-11)
  const l = pickLang(body.lang);
  await database.prepare(`UPDATE ad_requests SET lang = ? WHERE id = ?`).bind(l, row.id).run().catch(() => {});
  const reply = werbenReply(l, { name: row.person || row.company, company: row.company, package: SIZE_NAMES[row.size] || row.size, payable: Boolean(checkoutUrl) });
  const welcome = await sendLogged(env, database, row.id, "welcome", { to: row.email, from: INFO, subject: reply.subject, text: reply.text });
  return json({ ok: true, id: row.id, checkoutUrl, payable: Boolean(checkoutUrl), mailSent: welcome.ok });
}

// Admin: newest requests (also used by the app to notify the admin).
export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
  const database = await db(env);
  if (!database) return noDb();
  await cleanupOldRequests(database);
  const { results } = await database
    .prepare(`SELECT ${REQUEST_COLUMNS} FROM ad_requests ORDER BY created_at DESC LIMIT 100`)
    .all();
  return json({ requests: results.map(shapeRequest), stripe: Boolean(env.STRIPE_SECRET_KEY), webhook: Boolean(env.STRIPE_WEBHOOK_SECRET) });
}
