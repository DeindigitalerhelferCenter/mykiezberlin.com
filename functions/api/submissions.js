// Moderated businesses, events, jobs, free classifieds and B2B booking requests.
import { currentUser } from "../_lib/auth.js";
import { cleanText, db, ipHash, json, noDb, rateLimited } from "../_lib/util.js";

const FIELDS = {
  business: { name: 120, category: 80, kiezName: 60, address: 160, phone: 40, whatsapp: 40, website: 200, openingHours: 100, description: 600 },
  event: { title: 120, dateText: 60, time: 40, kiezName: 60, price: 40, category: 40, description: 600, officialUrl: 200 },
  job: { title: 120, company: 120, kiez: 60, jobType: 30, salary: 60, description: 800, contactPhone: 40, contactEmail: 120 },
  booking: { packageName: 60, billing: 20, companyName: 120, email: 120, kiez: 60 },
  classified: { title: 120, category: 40, kiezName: 60, price: 40, description: 800, contact: 120 },
};
const PUBLIC_TYPES = ["business", "event", "job", "classified"];
const REQUIRED = { business: "name", event: "title", job: "title", booking: "email", classified: "title" };
const CLASSIFIED_DAYS = 3;

export async function onRequestGet({ env }) {
  const database = await db(env);
  if (!database) return noDb();
  const marks = PUBLIC_TYPES.map(() => "?").join(",");
  const { results } = await database
    .prepare(`SELECT id, type, payload, created_at FROM submissions WHERE status = 'approved' AND type IN (${marks}) AND (type != 'classified' OR created_at > ?) ORDER BY created_at DESC LIMIT 200`)
    .bind(...PUBLIC_TYPES, Date.now() - CLASSIFIED_DAYS * 86400000)
    .all();
  return json({ items: results.map((r) => ({ ...JSON.parse(r.payload), id: r.id, type: r.type, createdAt: r.created_at })) });
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();

  const body = await request.json().catch(() => ({}));
  const fields = FIELDS[body.type];
  if (!fields) return json({ error: "bad_type" }, 400);

  const source = { ...body };
  const aliases = { kiezName: "kiez", phone: "contact", dateText: "date", contactPhone: "contact", companyName: "company" };
  for (const [field, alias] of Object.entries(aliases)) {
    if (field in fields && !source[field]) source[field] = source[alias];
  }
  const payload = {};
  for (const [key, max] of Object.entries(fields)) payload[key] = cleanText(source[key], max);
  if (!payload[REQUIRED[body.type]]) return json({ error: "missing_fields" }, 400);

  const ip = await ipHash(request, env);
  if (await rateLimited(database, "submissions", ip)) return json({ error: "rate_limited" }, 429);

  const user = body.type === "classified" ? await currentUser(request, database) : null;
  const status = user?.trusted ? "approved" : "pending";
  const id = crypto.randomUUID();
  await database
    .prepare(`INSERT INTO submissions (id, type, payload, status, ip, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(id, body.type, JSON.stringify(payload), status, ip, Date.now())
    .run();
  return json({ id, status }, 201);
}
