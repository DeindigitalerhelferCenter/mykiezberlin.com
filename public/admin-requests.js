/**
 * Admin: advertising requests – reply by mail, mail log, edit, delete, filter (2026-11-12).
 * Loaded after admin-werbung.js; uses its globals (adminAdRequests, adminAds, SIZE_LABELS, loadWerbungSection).
 * Mails always go out from info@mykiezberlin.com (server: functions/_lib/ad-requests.js).
 */
const MAIL_KINDS = { welcome: "Willkommens-Mail", copy: "Kopie an info@", reply: "Antwort", paid: "Zahlungs-Mail" };
const REPLY_KIND_LABELS = { callback: "Rückruf / Termin", paylink: "Zahlungslink (Stripe)", online: "Anzeige ist online", free: "Freier Text" };

function isFinishedRequest(r) {
  return r.status === "done" || r.status === "canceled";
}

function filteredRequests(list, filter = adRequestFilter) {
  if (filter === "all") return list;
  return list.filter((r) => (filter === "done" ? isFinishedRequest(r) : !isFinishedRequest(r)));
}

function requestFilterBar(list) {
  const chip = (f, label) => `<button class="chip-btn ${adRequestFilter === f ? "active" : ""}" onclick="adRequestFilter='${f}'; loadWerbungSection();">${label} (${filteredRequests(list, f).length})</button>`;
  return `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;">${chip("open", "Offen")}${chip("done", "Erledigt")}${chip("all", "Alle")}</div>
    <p style="font-size: 11.5px; color: #8b949e; margin-bottom: 10px;">„Erledigt“ und „Gekündigt“ werden ${adRequestKeepDays} Tage danach automatisch gelöscht. Mails gehen von info@mykiezberlin.com raus.${adMailReady ? "" : ` <b style="color: #ff7b72;">Mail-Anbieter fehlt – es geht keine Mail raus.</b>`}</p>`;
}

function requestMailLog(r) {
  const log = Array.isArray(r.mail_log) ? r.mail_log : [];
  const welcome = [...log].reverse().find((m) => m.kind === "welcome");
  const head = welcome
    ? `<div style="margin-top: 4px; color: ${welcome.ok ? "#3fb950" : "#ff7b72"};">✉️ Willkommens-Mail an Kunde: ${welcome.ok ? "gesendet" : "FEHLGESCHLAGEN"} · ${new Date(welcome.at).toLocaleString("de-DE")}${welcome.ok ? "" : ` · ${adminEsc(welcome.error)}`}</div>`
    : `<div style="margin-top: 4px; color: #ff7b72;">✉️ Keine Willkommens-Mail im Protokoll (Anfrage vor dem 12.11.2026) – bei Bedarf „Willkommens-Mail erneut“.</div>`;
  if (!log.length) return head;
  const rows = log.slice().reverse().map((m) => `<div style="border-top: 1px solid #30363d; padding: 4px 0;">${m.ok ? "✅" : "❌"} ${adminEsc(MAIL_KINDS[m.kind] || m.kind)} → ${adminEsc(m.to)} · ${new Date(m.at).toLocaleString("de-DE")}<br><b>${adminEsc(m.subject)}</b>${m.error ? `<br><span style="color: #ff7b72;">${adminEsc(m.error)}</span>` : ""}${m.text ? `<div style="white-space: pre-wrap; color: #8b949e;">${adminEsc(m.text)}</div>` : ""}</div>`).join("");
  return `${head}<details style="margin-top: 4px;"><summary style="cursor: pointer; color: #58a6ff;">Mail-Verlauf (${log.length})</summary>${rows}</details>`;
}

async function requestApi(body) {
  const res = await adminRequest("POST", body);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && data.ok !== false, data };
}

async function loadReplyTemplate(id) {
  const kind = document.getElementById("rq-kind").value;
  const lang = document.getElementById("rq-lang").value;
  const { ok, data } = await requestApi({ action: "requestTemplate", id, kind, lang });
  if (!ok) return;
  document.getElementById("rq-subject").value = data.subject || "";
  document.getElementById("rq-text").value = data.text || "";
}

function openRequestReply(id, contactedMode = false) {
  const r = adminAdRequests.find((x) => x.id === id);
  if (!r) return;
  document.getElementById("rq-modal")?.remove();
  const modal = document.createElement("div");
  modal.id = "rq-modal";
  modal.className = "modal-overlay";
  const langs = { de: "Deutsch", tr: "Türkçe", en: "English" };
  modal.innerHTML = `
    <div class="modal-card" style="max-height: 90vh; overflow: auto; display: grid; gap: 8px;">
      <h3 class="modal-title">Antwort an ${adminEsc(r.company)}</h3>
      <div style="font-size: 12px; color: #8b949e;">An: ${adminEsc(r.email)} · Von: info@mykiezberlin.com${r.phone ? ` · Tel. ${adminEsc(r.phone)}` : ""}</div>
      <label style="display: grid; gap: 3px; font-size: 12px;">Vorlage<select id="rq-kind" class="form-control" onchange="loadReplyTemplate('${adminEsc(id)}')">${Object.entries(REPLY_KIND_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
      <label style="display: grid; gap: 3px; font-size: 12px;">Sprache<select id="rq-lang" class="form-control" onchange="loadReplyTemplate('${adminEsc(id)}')">${Object.entries(langs).map(([k, v]) => `<option value="${k}" ${(r.lang || "de") === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label style="display: grid; gap: 3px; font-size: 12px;">Betreff<input id="rq-subject" class="form-control"></label>
      <label style="display: grid; gap: 3px; font-size: 12px;">Text – {paylink} wird beim Senden durch einen neuen Stripe-Link ersetzt<textarea id="rq-text" class="form-control" rows="11"></textarea></label>
      <div id="rq-msg" style="font-size: 12px;"></div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <button class="btn-primary" id="rq-send" onclick="sendRequestReply('${adminEsc(id)}')">Senden</button>
        ${contactedMode ? `<button class="chip-btn" onclick="markContactedOnly('${adminEsc(id)}')">Ohne Mail als kontaktiert markieren (z. B. telefoniert)</button>` : ""}
        <button class="chip-btn" onclick="document.getElementById('rq-modal').remove()">Abbrechen</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  loadReplyTemplate(id);
}

async function sendRequestReply(id) {
  const btn = document.getElementById("rq-send");
  const msg = document.getElementById("rq-msg");
  btn.disabled = true;
  msg.style.color = "#8b949e";
  msg.textContent = "Wird gesendet …";
  const { ok, data } = await requestApi({ action: "requestReply", id, subject: document.getElementById("rq-subject").value, text: document.getElementById("rq-text").value });
  btn.disabled = false;
  if (!ok) { msg.style.color = "#ff7b72"; msg.textContent = `Nicht gesendet: ${data.error || "Fehler"}`; return; }
  document.getElementById("rq-modal")?.remove();
  loadWerbungSection();
}

async function markContactedOnly(id) {
  document.getElementById("rq-modal")?.remove();
  await setRequestStatus(id, "contacted");
}

async function resendRequestWelcome(id) {
  const r = adminAdRequests.find((x) => x.id === id);
  if (!r || !confirm(`Willkommens-Mail erneut an ${r.email} senden?`)) return;
  const { ok, data } = await requestApi({ action: "requestResend", id });
  if (!ok) alert(`Nicht gesendet: ${data.error || "Fehler"}`);
  loadWerbungSection();
}

function openRequestEdit(id) {
  const r = adminAdRequests.find((x) => x.id === id);
  if (!r) return;
  document.getElementById("rq-modal")?.remove();
  const modal = document.createElement("div");
  modal.id = "rq-modal";
  modal.className = "modal-overlay";
  const field = (key, label) => `<label style="display: grid; gap: 3px; font-size: 12px;">${label}<input id="rqe-${key}" class="form-control" value="${adminEsc(r[key] || "")}"></label>`;
  const area = (key, label) => `<label style="display: grid; gap: 3px; font-size: 12px;">${label}<textarea id="rqe-${key}" class="form-control" rows="3">${adminEsc(r[key] || "")}</textarea></label>`;
  modal.innerHTML = `
    <div class="modal-card" style="max-height: 90vh; overflow: auto; display: grid; gap: 8px;">
      <h3 class="modal-title">Anfrage bearbeiten</h3>
      ${field("company", "Firma *")}${field("person", "Ansprechperson")}${field("email", "E-Mail *")}${field("phone", "Telefon")}${field("address", "Adresse")}
      <label style="display: grid; gap: 3px; font-size: 12px;">Paket<select id="rqe-size" class="form-control">${Object.entries(SIZE_LABELS).map(([k, v]) => `<option value="${k}" ${r.size === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label style="display: grid; gap: 3px; font-size: 12px;">Sprache der Mails<select id="rqe-lang" class="form-control">${["de", "tr", "en"].map((k) => `<option value="${k}" ${(r.lang || "de") === k ? "selected" : ""}>${k.toUpperCase()}</option>`).join("")}</select></label>
      ${area("message", "Nachricht des Kunden")}${area("note", "Interne Notiz (nur Admin)")}
      <div style="display: flex; gap: 8px;"><button class="btn-primary" onclick="saveRequestEdit('${adminEsc(id)}')">Speichern</button><button class="chip-btn" onclick="document.getElementById('rq-modal').remove()">Abbrechen</button></div>
    </div>`;
  document.body.appendChild(modal);
}

async function saveRequestEdit(id) {
  const v = (k) => document.getElementById(`rqe-${k}`)?.value ?? "";
  const fields = { company: v("company"), person: v("person"), email: v("email"), phone: v("phone"), address: v("address"), size: v("size"), lang: v("lang"), message: v("message"), note: v("note") };
  const { ok, data } = await requestApi({ action: "requestEdit", id, fields });
  if (!ok) { alert(`Nicht gespeichert: ${data.field || data.error || "Fehler"}`); return; }
  document.getElementById("rq-modal")?.remove();
  loadWerbungSection();
}

async function deleteRequest(id) {
  const r = adminAdRequests.find((x) => x.id === id);
  if (!r || !confirm(`Anfrage von „${r.company}“ endgültig löschen?`)) return;
  const linked = adminAds.filter((a) => a.request_id === id);
  let withAds = false;
  if (linked.length) withAds = confirm(`Zu dieser Anfrage gehören ${linked.length} Anzeige(n): ${linked.map((a) => a.name).join(", ")}.\n\nOK = Anzeige(n) auch löschen\nAbbrechen = Anzeige(n) bleiben online`);
  await requestApi({ action: "requestDelete", id, withAds });
  loadWerbungSection();
}
