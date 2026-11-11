// Advertising packages, Stripe checkout and webhook handling for My Kiez Berlin.
// Same packages as Berliner Kiez-Check /werben: 29 / 49 / 89 € per month,
// the first 3 months 19 € per month, cancel monthly.

export const PACKAGES = {
  s: { amount: 2900, label: "My Kiez Berlin Kiez Basic" },
  m: { amount: 4900, label: "My Kiez Berlin Kiez Plus" },
  l: { amount: 8900, label: "My Kiez Berlin Kiez Premium" },
};
export const INTRO = { amount: 1900, months: 3 };
export const REQUEST_SIZES = ["s", "m", "l", "banner", "gp"];
const DAY_MS = 86400000;

async function stripe(env, path, params) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  return response.json();
}

// One reusable coupon per package that brings the first 3 months down to 19 €.
async function introCoupon(env, size) {
  const id = `mkb_intro_${size}`;
  const coupon = await stripe(env, "coupons", {
    id,
    amount_off: String(PACKAGES[size].amount - INTRO.amount),
    currency: "eur",
    duration: "repeating",
    duration_in_months: String(INTRO.months),
    name: `Startangebot ${INTRO.months} Monate 19 €`,
  });
  return coupon.id || (coupon.error?.code === "resource_already_exists" ? id : null);
}

export async function createCheckout(env, origin, request) {
  if (!env.STRIPE_SECRET_KEY || !PACKAGES[request.size]) return null;
  const pkg = PACKAGES[request.size];
  const coupon = await introCoupon(env, request.size);
  const params = {
    mode: "subscription",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(pkg.amount),
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][price_data][product_data][name]": `${pkg.label}: ${request.company}`,
    "metadata[request_id]": request.id,
    "metadata[size]": request.size,
    "subscription_data[metadata][request_id]": request.id,
    "subscription_data[metadata][size]": request.size,
    customer_email: request.email,
    success_url: `${origin}/werben?paid=1&r=${request.id}`,
    cancel_url: `${origin}/werben?canceled=1&r=${request.id}`,
  };
  if (coupon) params["discounts[0][coupon]"] = coupon;
  const session = await stripe(env, "checkout/sessions", params);
  return session.url ? { url: session.url, id: session.id } : { error: session.error?.message || "stripe" };
}

async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Checks the Stripe-Signature header (t=...,v1=...) against STRIPE_WEBHOOK_SECRET.
export async function verifyStripeEvent(request, env) {
  const body = await request.text();
  const parts = {};
  (request.headers.get("stripe-signature") || "").split(",").forEach((item) => {
    const i = item.indexOf("=");
    const k = item.slice(0, i);
    if (!parts[k]) parts[k] = item.slice(i + 1);
  });
  if (!env.STRIPE_WEBHOOK_SECRET || !parts.t || !parts.v1) return null;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return null;
  const expected = await hmacHex(env.STRIPE_WEBHOOK_SECRET, `${parts.t}.${body}`);
  return safeEqual(expected, parts.v1) ? JSON.parse(body) : null;
}

// A paid request keeps its linked ads running until the paid period ends.
async function extendAds(database, requestId, until) {
  await database.prepare(`UPDATE ads SET end_at = ?, active = 1, updated_at = ? WHERE request_id = ?`).bind(until, Date.now(), requestId).run();
  // First payment without an ad yet: create it automatically from the request, placed by its package.
  // The admin can add image and texts later; the business is visible right away.
  const exists = await database.prepare(`SELECT id FROM ads WHERE request_id = ?`).bind(requestId).first();
  if (exists) return;
  const req = await database.prepare(`SELECT company, phone, size, message FROM ad_requests WHERE id = ?`).bind(requestId).first();
  if (!req) return;
  const plan = ["s", "m", "l", "banner", "gp"].includes(req.size) ? req.size : "s";
  const now = Date.now();
  const text = String(req.message || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 200);
  await database.prepare(`INSERT INTO ads (id, name, image, headline_de, headline_tr, headline_en, link_tel, places, plan, request_id, priority, start_at, end_at, active, extra, created_at, updated_at) VALUES (?, ?, '', ?, ?, ?, ?, '', ?, ?, ?, ?, ?, 1, '', ?, ?)`)
    .bind(`ad_${crypto.randomUUID().slice(0, 8)}`, req.company, text, text, text, String(req.phone || "").replace(/[^\d+ ]/g, ""), plan, requestId, plan === "l" ? 30 : plan === "s" ? 10 : 20, now, until, now, now)
    .run();
}

export async function handleStripeEvent(event, database) {
  const o = event.data?.object || {};
  const already = (id) => database.prepare(`SELECT id FROM payments WHERE id = ?`).bind(id).first();

  if (event.type === "checkout.session.completed" && o.metadata?.request_id) {
    if (await already(o.id)) return;
    const until = Date.now() + 33 * DAY_MS;
    await database.batch([
      database.prepare(`UPDATE ad_requests SET status = 'paid', stripe_session = ?, stripe_sub = ?, paid_until = MAX(paid_until, ?) WHERE id = ?`).bind(o.id, o.subscription || "", until, o.metadata.request_id),
      database.prepare(`INSERT INTO payments (id, request_id, kind, amount, created_at) VALUES (?, ?, ?, ?, ?)`).bind(o.id, o.metadata.request_id, `sub_${o.metadata.size || ""}`, o.amount_total || 0, Date.now()),
    ]);
    await extendAds(database, o.metadata.request_id, until);
    return;
  }
  if (event.type === "invoice.paid") {
    const sub = o.subscription || o.parent?.subscription_details?.subscription;
    if (!sub || (await already(o.id))) return;
    const row = await database.prepare(`SELECT id FROM ad_requests WHERE stripe_sub = ?`).bind(sub).first();
    if (!row) return;
    const end = o.lines?.data?.[0]?.period?.end;
    const until = end ? end * 1000 + 2 * DAY_MS : Date.now() + 33 * DAY_MS;
    await database.batch([
      database.prepare(`UPDATE ad_requests SET status = 'paid', paid_until = MAX(paid_until, ?) WHERE id = ?`).bind(until, row.id),
      database.prepare(`INSERT INTO payments (id, request_id, kind, amount, created_at) VALUES (?, ?, 'invoice', ?, ?)`).bind(o.id, row.id, o.amount_paid || 0, Date.now()),
    ]);
    await extendAds(database, row.id, until);
    return;
  }
  if (event.type === "customer.subscription.deleted") {
    // The ad keeps running until the paid period ends, then stops by its end date.
    await database.prepare(`UPDATE ad_requests SET status = 'canceled' WHERE stripe_sub = ?`).bind(o.id).run();
  }
}
