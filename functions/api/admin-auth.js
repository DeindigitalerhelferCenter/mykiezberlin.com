// Admin login and account management (2026-11-11). Used by the web admin (admin-auth-ui.js) and the app (AdminAuthClient.kt).
// GET  /api/admin-auth                      -> { setup: bool, emailReset: bool }  (public, no secrets)
// POST /api/admin-auth { action, ... }
//   login    { email?, password }            -> { ok, token, name, email, setupRequired }
//   me       (x-admin-token)                  -> { ok, name, email, setupRequired }
//   setup    { name, email, password }       -> first account; { ok, token, recoveryCode }
//   change   { oldPassword, newPassword }     -> { ok }
//   recovery (x-admin-token)                  -> new recovery code { ok, recoveryCode }
//   recover  { email, code, newPassword }     -> password forgotten, with recovery code; { ok, token, recoveryCode }
//   forgot   { email }                        -> e-mail with reset link (only if env.EMAIL is bound); { ok, emailReset }
//   reset    { resetToken, newPassword }      -> { ok, token }
//   addAdmin { name, email, password }        -> { ok, recoveryCode }
//   admins / removeAdmin { id }               -> list / remove other admins
//   logout                                    -> ends this session
import { cleanText, db, ipHash, json, noDb } from "../_lib/util.js";
import {
  DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_NAME, adminCount, checkAdminToken, createSession, findByPassword, newRecoveryCode, noteFailedAttempt,
  normRecovery, randomHex, saveAccount, sessionAdmin, setPassword, sha256, tooManyAttempts,
} from "../_lib/admin-auth.js";

const MIN_LEN = 8;
const okEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function onRequestGet({ env }) {
  const database = await db(env);
  if (!database) return noDb();
  return json({ setup: (await adminCount(database)) > 0, emailReset: Boolean(env.EMAIL) }, 200, { "cache-control": "no-store" });
}

export async function onRequestPost({ request, env }) {
  const database = await db(env);
  if (!database) return noDb();
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  const token = request.headers.get("x-admin-token") || "";
  const ip = await ipHash(request, env);
  const email = cleanText(body.email, 120).toLowerCase();
  const count = await adminCount(database);

  if (action === "login") {
    if (await tooManyAttempts(database, ip)) return json({ error: "too_many_attempts" }, 429);
    const password = String(body.password || "");
    if (env.ADMIN_TOKEN && password === env.ADMIN_TOKEN) {
      return json({ ok: true, token: env.ADMIN_TOKEN, name: "Master", email: "", setupRequired: count === 0 });
    }
    if (count === 0 && password === "admin123" && !env.ADMIN_TOKEN) {
      // First start: the old test password opens the setup once; afterwards it stops working.
      return json({ ok: true, token: await createSession(database, "bootstrap"), name: DEFAULT_ADMIN_NAME, email: DEFAULT_ADMIN_EMAIL, setupRequired: true });
    }
    const admin = password ? await findByPassword(database, email, password) : null;
    if (!admin) {
      await noteFailedAttempt(database, ip);
      return json({ error: "wrong_password" }, 401);
    }
    return json({ ok: true, token: await createSession(database, admin.id), name: admin.name, email: admin.email, setupRequired: false });
  }

  if (action === "recover") {
    if (await tooManyAttempts(database, ip)) return json({ error: "too_many_attempts" }, 429);
    const newPassword = String(body.newPassword || "");
    if (newPassword.length < MIN_LEN) return json({ error: "password_too_short", min: MIN_LEN }, 400);
    const row = await database.prepare(`SELECT * FROM admin_accounts WHERE lower(email) = lower(?)`).bind(email).first();
    if (!row || row.recovery_hash !== (await sha256(normRecovery(body.code)))) {
      await noteFailedAttempt(database, ip);
      return json({ error: "wrong_code" }, 401);
    }
    await setPassword(database, row.id, newPassword);
    const code = newRecoveryCode();
    await database.prepare(`UPDATE admin_accounts SET recovery_hash = ? WHERE id = ?`).bind(await sha256(normRecovery(code)), row.id).run();
    return json({ ok: true, token: await createSession(database, row.id), name: row.name, email: row.email, recoveryCode: code });
  }

  if (action === "forgot") {
    // Same answer whether or not the address exists.
    if (!env.EMAIL) return json({ ok: false, emailReset: false });
    if (await tooManyAttempts(database, ip)) return json({ error: "too_many_attempts" }, 429);
    await noteFailedAttempt(database, ip); // counts as an attempt, limits mail flooding
    const row = okEmail(email) ? await database.prepare(`SELECT * FROM admin_accounts WHERE lower(email) = lower(?)`).bind(email).first() : null;
    if (row) {
      const reset = randomHex(24);
      await database.prepare(`INSERT INTO admin_resets (token_hash, admin_id, expires_at) VALUES (?, ?, ?)`).bind(await sha256(reset), row.id, Date.now() + 3600000).run();
      await sendResetMail(env, row, `https://mykiezberlin.com/admin.html?reset=${reset}`).catch(() => {});
    }
    return json({ ok: true, emailReset: true });
  }

  if (action === "reset") {
    const newPassword = String(body.newPassword || "");
    if (newPassword.length < MIN_LEN) return json({ error: "password_too_short", min: MIN_LEN }, 400);
    const hash = await sha256(String(body.resetToken || ""));
    const row = await database.prepare(`SELECT * FROM admin_resets WHERE token_hash = ? AND expires_at > ?`).bind(hash, Date.now()).first();
    if (!row) return json({ error: "link_expired" }, 400);
    await setPassword(database, row.admin_id, newPassword);
    await database.prepare(`DELETE FROM admin_resets WHERE admin_id = ?`).bind(row.admin_id).run();
    return json({ ok: true, token: await createSession(database, row.admin_id) });
  }

  // ---- everything below needs a valid admin token ----
  if (!(await checkAdminToken(env, database, token))) return json({ error: "unauthorized" }, 401);
  const me = await sessionAdmin(database, token); // null for master key / first-start session

  if (action === "me") {
    return json({ ok: true, name: me?.name || DEFAULT_ADMIN_NAME, email: me?.email || DEFAULT_ADMIN_EMAIL, setupRequired: count === 0 });
  }

  if (action === "setup") {
    if (count > 0) return json({ error: "already_set_up" }, 409);
    const password = String(body.password || "");
    if (password.length < MIN_LEN) return json({ error: "password_too_short", min: MIN_LEN }, 400);
    const name = cleanText(body.name, 80) || DEFAULT_ADMIN_NAME;
    const mail = okEmail(email) ? email : DEFAULT_ADMIN_EMAIL;
    const code = await saveAccount(database, { id: "admin1", name, email: mail, password });
    await database.prepare(`DELETE FROM admin_sessions WHERE admin_id = 'bootstrap'`).run();
    return json({ ok: true, token: await createSession(database, "admin1"), name, email: mail, recoveryCode: code });
  }

  if (action === "change") {
    if (!me) return json({ error: "login_with_account" }, 400);
    const newPassword = String(body.newPassword || "");
    if (newPassword.length < MIN_LEN) return json({ error: "password_too_short", min: MIN_LEN }, 400);
    const check = await findByPassword(database, me.email, String(body.oldPassword || ""));
    if (!check || check.id !== me.id) return json({ error: "wrong_password" }, 401);
    await setPassword(database, me.id, newPassword);
    return json({ ok: true });
  }

  if (action === "recovery") {
    if (!me) return json({ error: "login_with_account" }, 400);
    const code = newRecoveryCode();
    await database.prepare(`UPDATE admin_accounts SET recovery_hash = ?, updated_at = ? WHERE id = ?`).bind(await sha256(normRecovery(code)), Date.now(), me.id).run();
    return json({ ok: true, recoveryCode: code });
  }

  if (action === "addAdmin") {
    if (count === 0) return json({ error: "setup_first" }, 400);
    const password = String(body.password || "");
    if (password.length < MIN_LEN) return json({ error: "password_too_short", min: MIN_LEN }, 400);
    if (!okEmail(email)) return json({ error: "email_invalid" }, 400);
    const exists = await database.prepare(`SELECT 1 FROM admin_accounts WHERE lower(email) = lower(?)`).bind(email).first();
    if (exists) return json({ error: "email_exists" }, 409);
    const name = cleanText(body.name, 80) || email;
    const code = await saveAccount(database, { id: "admin-" + randomHex(6), name, email, password });
    return json({ ok: true, recoveryCode: code });
  }

  if (action === "admins") {
    const { results } = await database.prepare(`SELECT id, name, email, created_at FROM admin_accounts ORDER BY created_at`).all();
    return json({ ok: true, admins: results, me: me?.id || "" });
  }

  if (action === "removeAdmin") {
    const id = cleanText(body.id, 40);
    if (!id || id === me?.id) return json({ error: "cannot_remove_self" }, 400);
    if (count <= 1) return json({ error: "last_admin" }, 400);
    await database.batch([
      database.prepare(`DELETE FROM admin_accounts WHERE id = ?`).bind(id),
      database.prepare(`DELETE FROM admin_sessions WHERE admin_id = ?`).bind(id),
    ]);
    return json({ ok: true });
  }

  if (action === "logout") {
    await database.prepare(`DELETE FROM admin_sessions WHERE token_hash = ?`).bind(await sha256(token)).run();
    return json({ ok: true });
  }

  return json({ error: "unknown_action" }, 400);
}

// Reset mail through a Cloudflare send_email binding named EMAIL (Email Routing must be active for mykiezberlin.com
// and the admin address must be a verified destination). Without the binding the recovery code is the way back in.
async function sendResetMail(env, admin, link) {
  const { EmailMessage } = await import("cloudflare:email");
  const from = "info@mykiezberlin.com";
  const text = [
    `Hallo ${admin.name},`,
    "",
    "für dein My Kiez Berlin Admin-Konto wurde ein neues Passwort angefordert.",
    "Der Link gilt 1 Stunde:",
    link,
    "",
    "Wenn du das nicht warst, ignoriere diese E-Mail.",
    "",
    "— Merhaba, admin şifren için sıfırlama istendi. Link 1 saat geçerli (yukarıda).",
  ].join("\r\n");
  const raw = [
    `From: My Kiez Berlin <${from}>`,
    `To: ${admin.email}`,
    "Subject: =?UTF-8?B?" + btoa(unescape(encodeURIComponent("My Kiez Berlin – Admin-Passwort zurücksetzen"))) + "?=",
    `Message-ID: <${randomHex(12)}@mykiezberlin.com>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
  ].join("\r\n");
  await env.EMAIL.send(new EmailMessage(from, admin.email, raw));
}
