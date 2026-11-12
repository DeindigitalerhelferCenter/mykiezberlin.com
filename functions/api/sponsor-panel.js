// Sponsor self-service panel (2026-11-13) – POST JSON { action, ... }.
// Sponsor (header x-sponsor-token):
//   requestLink {email}      -> mails a login link to the stored sponsor address (always answers ok)
//   me                       -> own data, own pictures/videos, quota of the chosen period
//   update {fields}          -> texts, address, hours, phone, WhatsApp, website, Instagram, media period
//   deleteMedia {id}         -> removes an own picture/video
// Admin (header x-admin-token):
//   adminLink {adId, email?} -> creates a login link (to send by hand, e.g. WhatsApp); mails it when an e-mail is given
//   adminList                -> latest sponsor pictures/videos of all sponsors (to check them)
//   adminMedia {id, status}  -> "hidden" | "live" | "delete"
//   adminUpdate {adId, fields} -> same fields as the sponsor can edit (emergency edit)
import { cleanText, db, ipHash, isAdmin, json, noDb } from "../_lib/util.js";
import { isBlockedUrl } from "../_lib/blocklist.js";
import { mediaQuota, parseExtra, planRule } from "../_lib/plans.js";
import { sendMail } from "../_lib/mail.js";
import { adsForEmail, createSponsorToken, ensureSponsorTables, panelUrl, sponsorFromToken, TOKEN_DAYS } from "../_lib/sponsor-panel.js";

const MAX_DESCRIPTION = 5000; // "text without limit" for people – a hard cap only against abuse

// Long text keeps its line breaks (cleanText would join all lines); no markup.
function cleanLongText(value, max) {
  return String(value ?? "").replace(/[<>]/g, "").replace(/\r/g, "").split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
}

function webUrl(value) {
  const v = cleanText(value, 300);
  if (!v) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
    return isBlockedUrl(u.toString()) ? "" : u.toString();
  } catch (e) {
    return "";
  }
}

async function usage(database, ad) {
  const extra = parseExtra(ad.extra);
  const q = mediaQuota(ad.plan, extra.media_period);
  const since = Date.now() - q.windowMs;
  const row = await database
    .prepare(`SELECT SUM(CASE WHEN media_type = 'image' THEN 1 ELSE 0 END) AS images, SUM(CASE WHEN media_type = 'video' THEN 1 ELSE 0 END) AS videos FROM sponsor_media WHERE ad_id = ? AND created_at > ? AND by_admin = 0`)
    .bind(ad.id, since)
    .first();
  return { ...q, usedImages: row?.images || 0, usedVideos: row?.videos || 0 };
}

function shape(ad) {
  const extra = parseExtra(ad.extra);
  const rule = planRule(ad.plan);
  return {
    id: ad.id, name: ad.name, plan: ad.plan || "", size: rule ? rule.size : "medium", image: ad.image, logo: extra.logo || "",
    headline_de: ad.headline_de, headline_tr: ad.headline_tr, headline_en: ad.headline_en,
    description: extra.description || "", address: extra.address || "", hours: extra.hours || "",
    link_tel: ad.link_tel, link_wa: ad.link_wa, link_web: ad.link_web, link_ig: ad.link_ig,
    email: extra.email || "", media_period: extra.media_period === "day" ? "day" : "week",
    end_at: ad.end_at || 0, active: ad.active,
  };
}

// Fields a sponsor (or the admin in an emergency) may change.
async function applyUpdate(database, ad, f) {
  if (!f || typeof f !== "object") return json({ error: "bad_request" }, 400);
  const extra = parseExtra(ad.extra);
  const set = (k, v) => { if (f[k] !== undefined) extra[k] = v; };
  // long text keeps its line breaks (cleanText would join the lines)
  set("description", cleanLongText(f.description, MAX_DESCRIPTION));
  set("address", cleanText(f.address, 120));
  set("hours", cleanText(f.hours, 80));
  if (f.email !== undefined) {
    const mail = cleanText(f.email, 120);
    if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return json({ error: "email_invalid" }, 400);
    extra.email = mail;
  }
  if (f.media_period !== undefined) extra.media_period = f.media_period === "day" ? "day" : "week";
  const cols = {
    headline_de: f.headline_de !== undefined ? cleanText(f.headline_de, 200) : ad.headline_de,
    headline_tr: f.headline_tr !== undefined ? cleanText(f.headline_tr, 200) : ad.headline_tr,
    headline_en: f.headline_en !== undefined ? cleanText(f.headline_en, 200) : ad.headline_en,
    link_tel: f.link_tel !== undefined ? cleanText(f.link_tel, 40).replace(/[^\d+ ]/g, "") : ad.link_tel,
    link_wa: f.link_wa !== undefined ? cleanText(f.link_wa, 40).replace(/[^\d+]/g, "") : ad.link_wa,
    link_web: f.link_web !== undefined ? webUrl(f.link_web) : ad.link_web,
    link_ig: f.link_ig !== undefined ? webUrl(f.link_ig) : ad.link_ig,
  };
  if ((f.link_web && !cols.link_web) || (f.link_ig && !cols.link_ig)) return json({ error: "link_blocked" }, 400);
  await database
    .prepare(`UPDATE ads SET headline_de=?, headline_tr=?, headline_en=?, link_tel=?, link_wa=?, link_web=?, link_ig=?, extra=?, updated_at=? WHERE id=?`)
    .bind(cols.headline_de, cols.headline_tr, cols.headline_en, cols.link_tel, cols.link_wa, cols.link_web, cols.link_ig, JSON.stringify(extra), Date.now(), ad.id)
    .run();
  return json({ ok: true });
}

async function deleteMedia(env, database, row) {
  if (row.media_key && env.BUCKET) await env.BUCKET.delete(row.media_key).catch(() => {});
  await database.prepare(`DELETE FROM sponsor_media WHERE id = ?`).bind(row.id).run();
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  await ensureSponsorTables(database);
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");

  // ---------- login link by e-mail ----------
  if (action === "requestLink") {
    const ip = await ipHash(request, env);
    const hour = Date.now() - 3600000;
    const recent = await database.prepare(`SELECT COUNT(*) AS n FROM sponsor_login_requests WHERE ip = ? AND created_at > ?`).bind(ip, hour).first();
    if ((recent?.n || 0) >= 5) return json({ error: "too_many_attempts" }, 429);
    await database.prepare(`INSERT INTO sponsor_login_requests (ip, created_at) VALUES (?, ?)`).bind(ip, Date.now()).run();
    const email = cleanText(body.email, 120).toLowerCase();
    const ads = await adsForEmail(database, email);
    for (const ad of ads.slice(0, 3)) {
      const token = await createSponsorToken(database, ad.id, email);
      await sendMail(env, {
        to: email,
        subject: `Dein Sponsor-Panel – ${ad.name} · Sponsor panelin`,
        text: `Hallo,\n\nhier ist dein Link zum Sponsor-Panel von My Kiez Berlin für „${ad.name}“ (gültig ${TOKEN_DAYS} Tage):\n${panelUrl(token)}\n\nDort kannst du Texte, Adresse, Öffnungszeiten, Telefon und Links ändern und eigene Bilder und Videos hochladen.\n\n—\n\nMerhaba,\n„${ad.name}“ için My Kiez Berlin sponsor paneli linkin (${TOKEN_DAYS} gün geçerli):\n${panelUrl(token)}\n\nBurada metinleri, adresi, çalışma saatlerini, telefonu ve linkleri değiştirebilir, kendi resim ve videolarını yükleyebilirsin.\n\nMy Kiez Berlin`,
      });
    }
    // Same answer whether the address is known or not (nobody can test which addresses are sponsors).
    return json({ ok: true });
  }

  // ---------- admin ----------
  if (action.startsWith("admin")) {
    if (!(await isAdmin(request, env))) return json({ error: "unauthorized" }, 401);
    if (action === "adminLink") {
      const ad = await database.prepare(`SELECT * FROM ads WHERE id = ?`).bind(cleanText(body.adId, 40)).first();
      if (!ad) return json({ error: "not_found" }, 404);
      const email = cleanText(body.email, 120);
      const token = await createSponsorToken(database, ad.id, email);
      const link = panelUrl(token);
      let mailed = false;
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const extra = parseExtra(ad.extra);
        extra.panel_email = email; // later the sponsor can request new links with this address
        await database.prepare(`UPDATE ads SET extra = ? WHERE id = ?`).bind(JSON.stringify(extra), ad.id).run();
        mailed = await sendMail(env, {
          to: email,
          subject: `Dein Sponsor-Panel – ${ad.name} · Sponsor panelin`,
          text: `Hallo,\n\nhier ist dein Link zum Sponsor-Panel von My Kiez Berlin für „${ad.name}“ (gültig ${TOKEN_DAYS} Tage):\n${link}\n\n—\n\nMerhaba,\n„${ad.name}“ için sponsor paneli linkin (${TOKEN_DAYS} gün geçerli):\n${link}\n\nMy Kiez Berlin`,
        });
      }
      return json({ ok: true, link, mailed, days: TOKEN_DAYS });
    }
    if (action === "adminList") {
      const { results } = await database
        .prepare(`SELECT m.id, m.ad_id, m.media_key, m.media_type, m.caption, m.status, m.created_at, m.by_admin, a.name FROM sponsor_media m LEFT JOIN ads a ON a.id = m.ad_id ORDER BY m.created_at DESC LIMIT 100`)
        .all();
      return json({ media: results });
    }
    if (action === "adminMedia") {
      const row = await database.prepare(`SELECT * FROM sponsor_media WHERE id = ?`).bind(cleanText(body.id, 60)).first();
      if (!row) return json({ error: "not_found" }, 404);
      if (body.status === "delete") await deleteMedia(env, database, row);
      else await database.prepare(`UPDATE sponsor_media SET status = ? WHERE id = ?`).bind(body.status === "hidden" ? "hidden" : "live", row.id).run();
      return json({ ok: true });
    }
    if (action === "adminUpdate") {
      const ad = await database.prepare(`SELECT * FROM ads WHERE id = ?`).bind(cleanText(body.adId, 40)).first();
      if (!ad) return json({ error: "not_found" }, 404);
      return applyUpdate(database, ad, body.fields);
    }
    return json({ error: "bad_request" }, 400);
  }

  // ---------- sponsor ----------
  const ad = await sponsorFromToken(database, request.headers.get("x-sponsor-token") || "");
  if (!ad) return json({ error: "unauthorized" }, 401);
  if (action === "me") {
    const { results } = await database
      .prepare(`SELECT id, media_key, media_type, caption, status, created_at FROM sponsor_media WHERE ad_id = ? ORDER BY created_at DESC LIMIT 100`)
      .bind(ad.id)
      .all();
    const stats = await database.prepare(`SELECT SUM(imp) AS imp, SUM(clk) AS clk FROM ad_stats WHERE ad_id = ? AND day >= ?`).bind(ad.id, new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)).first();
    return json({ ad: shape(ad), media: results, quota: await usage(database, ad), stats: { days: 30, views: stats?.imp || 0, clicks: stats?.clk || 0 } });
  }
  if (action === "update") return applyUpdate(database, ad, body.fields);
  if (action === "deleteMedia") {
    const row = await database.prepare(`SELECT * FROM sponsor_media WHERE id = ? AND ad_id = ?`).bind(cleanText(body.id, 60), ad.id).first();
    if (!row) return json({ error: "not_found" }, 404);
    await deleteMedia(env, database, row);
    return json({ ok: true });
  }
  return json({ error: "bad_request" }, 400);
}
