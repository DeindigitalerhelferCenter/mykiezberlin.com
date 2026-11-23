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
import { isVipAd } from "../_lib/story-vip.js";
import { sendMail } from "../_lib/mail.js";
import { adsForEmail, createSponsorToken, ensureSponsorTables, MEDIA_ORDER, moveSponsorMedia, panelUrl, sponsorFromToken, TOKEN_DAYS } from "../_lib/sponsor-panel.js";

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
  // 2026-11-21 (owner): trusted sponsor -> no limit (the panel shows "ohne Limit")
  if (await isVipAd(database, ad.id).catch(() => false)) return { ...q, images: 999, videos: 999, unlimited: true, usedImages: row?.images || 0, usedVideos: row?.videos || 0 };
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
  // pictures under /assets (seeded 2026-11-13) are not in R2 – only the row is removed
  if (row.media_key && !row.media_key.startsWith("/") && !row.media_key.startsWith("https://") && env.BUCKET) await env.BUCKET.delete(row.media_key).catch(() => {});
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
    // 2026-11-13: all sponsors incl. paused ones, and a quick package change (Basic/Plus/Premium)
    if (action === "adminAds") {
      const { results } = await database.prepare(`SELECT * FROM ads ORDER BY active DESC, name`).all();
      // 2026-11-17: offer state for ended / paused sponsors (reminder + renewal offer)
      return json({ ads: results.map((a) => { const x = parseExtra(a.extra); return { ...shape(a), link_wa: a.link_wa, active: a.active ? 1 : 0, start_at: a.start_at || 0, updated_at: a.updated_at || 0, own: !!x.own, offer_log: Array.isArray(x.offer_log) ? x.offer_log : [], offer_next: x.offer_next || 0, offer_stop: !!x.offer_stop }; }), now: Date.now() });
    }
    if (action === "adminPlan") {
      const plan = ["s", "m", "l"].includes(body.plan) ? body.plan : "";
      if (!plan) return json({ error: "bad_request" }, 400);
      const r = await database.prepare(`UPDATE ads SET plan = ?, priority = ?, updated_at = ? WHERE id = ?`).bind(plan, { l: 30, m: 20, s: 10 }[plan], Date.now(), cleanText(body.adId, 40)).run();
      return r.meta && r.meta.changes === 0 ? json({ error: "not_found" }, 404) : json({ ok: true });
    }
    if (action === "adminUpdate") {
      const ad = await database.prepare(`SELECT * FROM ads WHERE id = ?`).bind(cleanText(body.adId, 40)).first();
      if (!ad) return json({ error: "not_found" }, 404);
      return applyUpdate(database, ad, body.fields);
    }
    // ---------- 2026-11-17 (owner): sponsor media grouped per sponsor, paged (the list grows a lot) ----------
    if (action === "adminMediaGroups") {
      const week = Date.now() - 7 * 86400000;
      const { results } = await database
        .prepare(`SELECT m.ad_id, a.name, COUNT(*) AS total, SUM(CASE WHEN m.status = 'hidden' THEN 1 ELSE 0 END) AS hidden,
                  SUM(CASE WHEN m.created_at > ? THEN 1 ELSE 0 END) AS week, MAX(m.created_at) AS last
                  FROM sponsor_media m LEFT JOIN ads a ON a.id = m.ad_id GROUP BY m.ad_id ORDER BY last DESC`)
        .bind(week)
        .all();
      return json({ groups: results });
    }
    if (action === "adminMediaOf") {
      const limit = Math.min(Math.max(Number(body.limit) || 24, 1), 60);
      const offset = Math.max(Number(body.offset) || 0, 0);
      const since = body.days ? Date.now() - Math.min(Number(body.days) || 7, 365) * 86400000 : 0;
      const adId = cleanText(body.adId, 40);
      const where = `${adId ? "m.ad_id = ? AND " : ""}m.created_at > ?`;
      const args = adId ? [adId, since] : [since];
      const { results } = await database
        .prepare(`SELECT m.id, m.ad_id, m.media_key, m.media_type, m.caption, m.status, m.created_at, m.by_admin, m.bytes, a.name FROM sponsor_media m LEFT JOIN ads a ON a.id = m.ad_id WHERE ${where} ORDER BY ${adId ? "COALESCE(NULLIF(m.sort, 0), m.created_at) DESC" : "m.created_at DESC"} LIMIT ? OFFSET ?`)
        .bind(...args, limit + 1, offset)
        .all();
      return json({ media: results.slice(0, limit), more: results.length > limit });
    }
    // ---------- 2026-11-17 (owner): big sponsor pictures made smaller (they slowed down web and app) ----------
    // adminMediaBig -> pictures in R2 that are bigger than 300 KB; adminMediaReplace {id, data} -> the admin browser
    // sends a smaller WebP/JPEG (data URL). The original file stays in R2, the row only points to the new file.
    // 2026-11-17: every made-smaller picture back to its original file
    if (action === "adminMediaRestore") {
      await database.prepare(`CREATE TABLE IF NOT EXISTS media_optimized (id TEXT, old_key TEXT, new_key TEXT, old_bytes INTEGER, new_bytes INTEGER, created_at INTEGER)`).run();
      const { results } = await database.prepare(`SELECT id, old_key, new_key, old_bytes FROM media_optimized`).all();
      let n = 0;
      for (const r of results) {
        const key = String(r.new_key).replace(/ \(restored\)$/, "");
        const res = await database.prepare(`UPDATE sponsor_media SET media_key = ?, bytes = ? WHERE id = ? AND media_key = ?`).bind(r.old_key, Number(r.old_bytes) || 0, r.id, key).run();
        n += (res.meta && res.meta.changes) || 0;
      }
      return json({ ok: true, restored: n });
    }
    if (action === "adminMediaBig") {
      await database.prepare(`CREATE TABLE IF NOT EXISTS media_optimized (id TEXT, old_key TEXT, new_key TEXT, old_bytes INTEGER, new_bytes INTEGER, created_at INTEGER)`).run();
      const { results } = await database
        .prepare(`SELECT m.id, m.ad_id, m.media_key, m.bytes, a.name FROM sponsor_media m LEFT JOIN ads a ON a.id = m.ad_id WHERE m.media_type = 'image' AND m.media_key LIKE 'ads/%' AND m.media_key NOT LIKE '%-opt%' ORDER BY m.created_at DESC LIMIT 300`)
        .all();
      const big = [];
      for (const m of results) {
        let bytes = Number(m.bytes) || 0;
        if (!bytes && env.BUCKET) { const head = await env.BUCKET.head(m.media_key).catch(() => null); bytes = head ? head.size : 0; }
        if (bytes > 300 * 1024) big.push({ ...m, bytes, url: `/media/${m.media_key}` });
      }
      return json({ media: big });
    }
    if (action === "adminMediaReplace") {
      if (!env.BUCKET) return json({ error: "r2_unbound" }, 503);
      const row = await database.prepare(`SELECT * FROM sponsor_media WHERE id = ?`).bind(cleanText(body.id, 60)).first();
      if (!row || row.media_type !== "image" || !String(row.media_key).startsWith("ads/")) return json({ error: "not_found" }, 404);
      const m = String(body.data || "").match(/^data:(image\/(?:webp|jpeg));base64,([A-Za-z0-9+/=]+)$/);
      if (!m) return json({ error: "bad_request" }, 400);
      const bin = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      if (bin.length > 1.5 * 1024 * 1024) return json({ error: "file_too_large" }, 413);
      // 2026-11-17: a real photo is never below 8 KB – tiny files are empty/white pictures (broken original)
      if (bin.length < 8 * 1024 && (Number(row.bytes) || 0) > 100 * 1024) return json({ error: "looks_empty" }, 422);
      const ext = m[1] === "image/webp" ? "webp" : "jpg";
      // 2026-11-17: always a NEW file name – /media is cached 30 days, an old (white) -opt file must never come back
      const key = String(row.media_key).replace(/\.[a-z0-9]+$/i, "") + `-opt-${Date.now().toString(36)}.${ext}`;
      await env.BUCKET.put(key, bin, { httpMetadata: { contentType: m[1] } });
      await database.prepare(`CREATE TABLE IF NOT EXISTS media_optimized (id TEXT, old_key TEXT, new_key TEXT, old_bytes INTEGER, new_bytes INTEGER, created_at INTEGER)`).run();
      await database.prepare(`INSERT INTO media_optimized (id, old_key, new_key, old_bytes, new_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(row.id, row.media_key, key, Number(row.bytes) || 0, bin.length, Date.now()).run();
      await database.prepare(`UPDATE sponsor_media SET media_key = ?, bytes = ? WHERE id = ?`).bind(key, bin.length, row.id).run();
      return json({ ok: true, key, bytes: bin.length });
    }
    // ---------- 2026-11-17 (owner): ended / paused sponsors – reminder for the admin and a renewal offer ----------
    // adminOffer {adId, email, subject, text} -> mail from info@ (only after the admin read and approved the text)
    // adminOfferLater {adId, days} -> reminder again after N days; days = 0 -> never remind again
    if (action === "adminOffer" || action === "adminOfferLater") {
      const ad = await database.prepare(`SELECT * FROM ads WHERE id = ?`).bind(cleanText(body.adId, 40)).first();
      if (!ad) return json({ error: "not_found" }, 404);
      const extra = parseExtra(ad.extra);
      const now = Date.now();
      let mailed = false;
      if (action === "adminOffer") {
        const to = cleanText(body.email, 120);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json({ error: "email_invalid" }, 400);
        const subject = cleanText(body.subject, 160) || `My Kiez Berlin – ${ad.name}`;
        const text = cleanLongText(body.text, 5000);
        if (!text) return json({ error: "missing_fields" }, 400);
        mailed = await sendMail(env, { to, subject, text });
        if (!mailed) return json({ error: "mail_failed" }, 502);
        extra.offer_log = [...(Array.isArray(extra.offer_log) ? extra.offer_log : []), { at: now, to }].slice(-20);
        extra.offer_next = now + 30 * 86400000; // "from time to time": the reminder comes back after 30 days
      } else {
        const days = Math.min(Math.max(Number(body.days) || 0, 0), 365);
        if (days === 0) extra.offer_stop = true;
        else { extra.offer_next = now + days * 86400000; delete extra.offer_stop; }
      }
      await database.prepare(`UPDATE ads SET extra = ?, updated_at = ? WHERE id = ?`).bind(JSON.stringify(extra), now, ad.id).run();
      return json({ ok: true, mailed, offer_next: extra.offer_next || 0, offer_stop: !!extra.offer_stop });
    }
    // 2026-11-17 (owner): admin changes the order of a sponsor's pictures/videos
    if (action === "adminMove") {
      const row = await database.prepare(`SELECT ad_id FROM sponsor_media WHERE id = ?`).bind(cleanText(body.id, 60)).first();
      if (!row) return json({ error: "not_found" }, 404);
      return (await moveSponsorMedia(database, row.ad_id, cleanText(body.id, 60), String(body.to || ""))) ? json({ ok: true }) : json({ error: "not_found" }, 404);
    }
    if (action === "adminActivate") {
      // paused or ended sponsor back online (end date removed; the admin can set a new one in the ad form)
      const r = await database.prepare(`UPDATE ads SET active = 1, end_at = 0, updated_at = ? WHERE id = ?`).bind(Date.now(), cleanText(body.adId, 40)).run();
      return r.meta && r.meta.changes === 0 ? json({ error: "not_found" }, 404) : json({ ok: true });
    }
    return json({ error: "bad_request" }, 400);
  }

  // ---------- sponsor ----------
  const ad = await sponsorFromToken(database, request.headers.get("x-sponsor-token") || "");
  if (!ad) return json({ error: "unauthorized" }, 401);
  if (action === "me") {
    const { results } = await database
      .prepare(`SELECT id, media_key, media_type, caption, status, created_at, days FROM sponsor_media WHERE ad_id = ? ORDER BY ${MEDIA_ORDER} LIMIT 200`) /* 2026-11-23: + days */
      .bind(ad.id)
      .all();
    const stats = await database.prepare(`SELECT SUM(imp) AS imp, SUM(clk) AS clk FROM ad_stats WHERE ad_id = ? AND day >= ?`).bind(ad.id, new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)).first();
    return json({ ad: shape(ad), media: results, quota: await usage(database, ad), stats: { days: 30, views: stats?.imp || 0, clicks: stats?.clk || 0 } });
  }
  if (action === "update") return applyUpdate(database, ad, body.fields);
  // 2026-11-17 (owner): the sponsor changes the order of his own pictures/videos
  if (action === "moveMedia") {
    const row = await database.prepare(`SELECT id FROM sponsor_media WHERE id = ? AND ad_id = ?`).bind(cleanText(body.id, 60), ad.id).first();
    if (!row) return json({ error: "not_found" }, 404);
    await moveSponsorMedia(database, ad.id, row.id, String(body.to || ""));
    return json({ ok: true });
  }
  if (action === "deleteMedia") {
    const row = await database.prepare(`SELECT * FROM sponsor_media WHERE id = ? AND ad_id = ?`).bind(cleanText(body.id, 60), ad.id).first();
    if (!row) return json({ error: "not_found" }, 404);
    await deleteMedia(env, database, row);
    return json({ ok: true });
  }
  // 2026-11-23 (owner "UYGULA 11"): the sponsor changes how long an upload stays in the story (1, 2, 3 or 7 days)
  if (action === "setDays") {
    const days = [1, 2, 3, 7].includes(Number(body.days)) ? Number(body.days) : 1;
    const r = await database.prepare(`UPDATE sponsor_media SET days = ? WHERE id = ? AND ad_id = ?`).bind(days, cleanText(body.id, 60), ad.id).run();
    if (!r.meta || !r.meta.changes) return json({ error: "not_found" }, 404);
    return json({ ok: true, days });
  }
  return json({ error: "bad_request" }, 400);
}
