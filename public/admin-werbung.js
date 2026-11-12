/**
 * Admin: advertising requests (/werben, Stripe) and sponsor ads shown in the web and the app.
 * Adds its own section below the moderation queue.
 */

const AD_PLACES = { slider: "Sponsor-Leiste", home: "Startseite", quiz: "Kiez-Quiz", page: "Seitenwechsel", list: "In Listen", kiez: "Eigener Kiez oben" };
// Same rules as functions/_lib/plans.js: the package decides size, places and how often an ad is shown.
const PLAN_INFO = {
  l: { label: "Kiez Premium 89 €", size: "große Karte", weight: 3, places: ["home", "slider", "page", "list"] },
  m: { label: "Kiez Plus 49 €", size: "mittleres Banner", weight: 2, places: ["slider", "page", "list"] },
  gp: { label: "Gründungspartner", size: "mittleres Banner", weight: 2, places: ["slider", "page", "list"] },
  s: { label: "Kiez Basic 29 €", size: "kleiner Streifen", weight: 1, places: ["page", "kiez"] },
  banner: { label: "Banner", size: "Banner", weight: 2, places: ["slider", "page"] },
};
function adPlanLine(a) {
  const info = PLAN_INFO[a.plan];
  if (!info) return "";
  const running = (x) => x.active && (!x.end_at || x.end_at > Date.now());
  const total = adminAds.filter((x) => running(x) && PLAN_INFO[x.plan]).reduce((n, x) => n + PLAN_INFO[x.plan].weight, 0) || 1;
  const share = running(a) ? Math.round((info.weight / total) * 100) : 0;
  return `<div style="color: #F2B705;">📦 ${info.label} · ${info.size} · ${info.weight}× · Anteil Seitenwechsel ${share} % · automatisch: ${info.places.map((p) => AD_PLACES[p]).join(", ")}</div>`;
}
const REQUEST_LABELS = { new: "Neu", contacted: "Kontaktiert", paid: "Bezahlt", done: "Erledigt", canceled: "Gekündigt" };
const SIZE_LABELS = { s: "Kiez Basic 29 €", m: "Kiez Plus 49 €", l: "Kiez Premium 89 €", banner: "Banner", gp: "Gründungspartner" };
let adminAds = [];
let adminAdRequests = [];
// 2026-11-12: filter for the request list (open = new/contacted/paid, done = done/canceled)
let adRequestFilter = "open";
let adRequestKeepDays = 90;
let adMailReady = true;

const baseLoadModerationQueue = loadModerationQueue;
loadModerationQueue = async function () {
  await baseLoadModerationQueue();
  loadWerbungSection();
};

function adDate(ms) {
  return ms ? new Date(ms).toLocaleDateString("de-DE") : "–";
}

async function loadWerbungSection() {
  const host = document.querySelector("main") || document.body;
  document.getElementById("admin-werbung")?.remove();
  const box = document.createElement("section");
  box.id = "admin-werbung";
  box.style.marginTop = "26px";
  host.appendChild(box);
  try {
    const res = await adminRequest("GET");
    if (!res.ok) return;
    const data = await res.json();
    const requests = data.adRequests || [];
    adminAds = data.ads || [];
    adminAdRequests = requests;
    adRequestKeepDays = data.requestKeepDays || 90;
    adMailReady = data.mailReady !== false;
    const fresh = requests.filter((r) => r.status === "new").length;
    box.innerHTML = `
      <h2 style="font-size: 17px; font-weight: 800; color: #fff; margin-bottom: 6px;">Werbeanfragen (${requests.length}${fresh ? `, ${fresh} neu` : ""})</h2>
      <p style="font-size: 12px; color: #8b949e; margin-bottom: 10px;">Stripe: ${data.stripe ? "verbunden" : "STRIPE_SECRET_KEY fehlt"} · Webhook: ${data.stripeWebhook ? "aktiv" : "STRIPE_WEBHOOK_SECRET fehlt"} · <a href="/werben" target="_blank" style="color: #58a6ff;">/werben öffnen</a></p>
      ${requestFilterBar(requests)}
      ${filteredRequests(requests).map(requestCard).join("") ||`<p style="font-size: 12px; color: #8b949e;">Noch keine Anfragen.</p>`}
      <h2 style="font-size: 17px; font-weight: 800; color: #fff; margin: 20px 0 10px;">Sponsor-Anzeigen (${adminAds.length})</h2>
      <button class="chip-btn active" onclick="openAdForm()">+ Neue Anzeige</button>
      <div style="margin-top: 10px;">${adminAds.map(adCard).join("") || `<p style="font-size: 12px; color: #8b949e;">Noch keine Anzeigen. Web und App zeigen dann Beispiel-Plätze.</p>`}</div>`;
  } catch (e) {
    box.innerHTML = `<p style="font-size: 12px; color: #8b949e;">Werbung nicht erreichbar.</p>`;
  }
}

function requestCard(r) {
  return `
    <div style="background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 10px; margin-bottom: 8px; color: #fff; font-size: 12.5px;">
      <div style="display: flex; justify-content: space-between; gap: 8px;"><b>${adminEsc(r.company)}</b><span>${adminEsc(REQUEST_LABELS[r.status] || r.status)}</span></div>
      <div style="color: #8b949e;">${adminEsc(SIZE_LABELS[r.size] || r.size)} · ${adminEsc(r.person)} · <a style="color: #58a6ff;" href="mailto:${adminEsc(r.email)}">${adminEsc(r.email)}</a> · ${adminEsc(r.phone)} · ${adDate(r.created_at)}${r.paid_until ? ` · bezahlt bis ${adDate(r.paid_until)}` : ""}</div>
      ${r.address ? `<div style="color: #8b949e;">📍 ${adminEsc(r.address)}</div>` : ""}
      ${r.message ? `<div style="margin-top: 4px;">${adminEsc(r.message)}</div>` : ""}
      ${r.note ? `<div style="margin-top: 4px; color: #F2B705;">📝 ${adminEsc(r.note)}</div>` : ""}
      ${requestMailLog(r)}
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
        <button class="chip-btn active" onclick="openRequestReply('${adminEsc(r.id)}')">✉️ Antworten</button>
        <button class="chip-btn" onclick="openRequestReply('${adminEsc(r.id)}', true)">Kontaktiert</button>
        <button class="chip-btn" onclick="setRequestStatus('${adminEsc(r.id)}', 'done')">Erledigt</button>
        <button class="chip-btn" onclick="openAdForm(null, '${adminEsc(r.id)}')">Anzeige anlegen</button>
        <button class="chip-btn" onclick="openRequestEdit('${adminEsc(r.id)}')">✏️ Bearbeiten</button>
        <button class="chip-btn" onclick="resendRequestWelcome('${adminEsc(r.id)}')">🔁 Willkommens-Mail erneut</button>
        <button class="chip-btn" onclick="deleteRequest('${adminEsc(r.id)}')">🗑 Löschen</button>
      </div>
    </div>`;
}

function adCard(a) {
  const running = a.active && (!a.end_at || a.end_at > Date.now());
  return `
    <div style="display: flex; gap: 10px; background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 10px; margin-bottom: 8px; color: #fff; font-size: 12.5px;">
      ${a.image ? `<img src="${adminEsc(a.image)}" alt="" style="width: 72px; height: 72px; object-fit: cover; border-radius: 8px;">` : ""}
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between;"><b>${adminEsc(a.name)}</b><span>${running ? "🟢 aktiv" : "⚪ aus"}</span></div>
        <div style="color: #8b949e;">${adminEsc(a.headline_de)}</div>
        ${adPlanLine(a)}
        <div style="color: #8b949e;">${String(a.places || "").split(",").map((p) => AD_PLACES[p] || p).join(", ")} · ${adDate(a.start_at)} – ${adDate(a.end_at)} · 30 Tage: ${a.imp30} Aufrufe, ${a.clk30} Klicks</div>
        <div style="display: flex; gap: 6px; margin-top: 6px;">
          <button class="chip-btn" onclick="openAdForm('${adminEsc(a.id)}')">Bearbeiten</button>
          <button class="chip-btn" onclick="toggleAd('${adminEsc(a.id)}')">${a.active ? "Pausieren" : "Aktivieren"}</button>
          <button class="chip-btn" onclick="deleteAd('${adminEsc(a.id)}')">Löschen</button>
        </div>
      </div>
    </div>`;
}

async function setRequestStatus(id, status) {
  await adminRequest("POST", { action: "requestStatus", id, status });
  loadWerbungSection();
}

async function toggleAd(id) {
  const ad = adminAds.find((a) => a.id === id);
  if (!ad) return;
  await adminRequest("POST", { action: "adSave", ad: { ...ad, active: ad.active ? 0 : 1 } });
  loadWerbungSection();
}

async function deleteAd(id) {
  if (!confirm("Anzeige wirklich löschen?")) return;
  await adminRequest("POST", { action: "adDelete", id });
  loadWerbungSection();
}

function toDateInput(ms) {
  return ms ? new Date(ms).toISOString().slice(0, 10) : "";
}

function openAdForm(id, requestId = "") {
  const request = adminAdRequests.find((r) => r.id === requestId) || {};
  const company = request.company || "";
  const size = request.size || "";
  const ad = adminAds.find((a) => a.id === id) || { name: company, request_id: requestId, places: size === "l" || size === "banner" ? "slider,home" : "slider", plan: size };
  document.getElementById("ad-form-modal")?.remove();
  const places = String(ad.places || "slider,home").split(",");
  const field = (key, label, value = ad[key] || "") => `<label style="display: grid; gap: 3px; font-size: 12px;">${label}<input id="ad-${key}" class="form-control" value="${adminEsc(value)}"></label>`;
  const modal = document.createElement("div");
  modal.id = "ad-form-modal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-card" style="max-height: 90vh; overflow: auto; display: grid; gap: 8px;">
      <h3 class="modal-title">${id ? "Anzeige bearbeiten" : "Neue Anzeige"}</h3>
      ${field("name", "Name *")}
      <label style="display: grid; gap: 3px; font-size: 12px;">Bild (JPG/PNG/WebP, max. 3 MB)<input id="ad-file" type="file" accept="image/jpeg,image/png,image/webp" class="form-control"></label>
      ${field("image", "oder Bild-URL")}
      ${field("headline_de", "Text Deutsch")}${field("headline_tr", "Text Türkisch")}${field("headline_en", "Text Englisch")}
      ${field("cta_de", "Button DE (z. B. Ansehen)")}${field("cta_tr", "Button TR (ör. Gör)")}${field("cta_en", "Button EN")}
      ${field("link_web", "Webseite (https://…)")}${field("link_wa", "WhatsApp-Nummer")}${field("link_tel", "Telefon")}${field("link_ig", "Instagram (https://…)")}
      <div style="font-size: 12px;">Platzierung: ${Object.entries(AD_PLACES).map(([k, v]) => `<label style="margin-right: 10px;"><input type="checkbox" class="ad-place" value="${k}" ${places.includes(k) ? "checked" : ""}> ${v}</label>`).join("")}</div>
      <label style="display: grid; gap: 3px; font-size: 12px;">Paket (legt Größe, Plätze und Häufigkeit automatisch fest)<select id="ad-plan" class="form-control"><option value="">– kein Paket (nur gewählte Plätze) –</option>${Object.entries(PLAN_INFO).map(([k, v]) => `<option value="${k}" ${ad.plan === k ? "selected" : ""}>${v.label} – ${v.size}, ${v.weight}×</option>`).join("")}</select></label>
      ${field("kieze", "Kiez des Betriebs (Kiez Basic: dort ganz oben)")}${field("priority", "Priorität 0–100", ad.priority ?? 0)}
      <label style="display: grid; gap: 3px; font-size: 12px;">Start<input id="ad-start" type="date" class="form-control" value="${toDateInput(ad.start_at)}"></label>
      <label style="display: grid; gap: 3px; font-size: 12px;">Ende (leer = unbegrenzt; bei Stripe-Zahlung automatisch)<input id="ad-end" type="date" class="form-control" value="${toDateInput(ad.end_at)}"></label>
      <div style="display: flex; gap: 8px;"><button class="btn-primary" onclick="saveAdForm('${adminEsc(id || "")}')">Speichern</button><button class="chip-btn" onclick="document.getElementById('ad-form-modal').remove()">Abbrechen</button></div>
      <input id="ad-request_id" type="hidden" value="${adminEsc(ad.request_id || "")}">
    </div>`;
  document.body.appendChild(modal);
}

async function saveAdForm(id) {
  const value = (key) => document.getElementById(`ad-${key}`)?.value.trim() || "";
  let image = value("image");
  const file = document.getElementById("ad-file")?.files[0];
  if (file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin-ad-image", { method: "POST", headers: { "x-admin-token": sessionStorage.getItem(ADMIN_TOKEN_KEY) || "" }, body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(`Bild-Upload fehlgeschlagen: ${data.error || res.status}`); return; }
    image = data.url;
  }
  const date = (key) => (value(key) ? Date.parse(`${value(key)}T00:00:00`) : 0);
  const ad = {
    id: id || undefined,
    name: value("name"), image,
    headline_de: value("headline_de"), headline_tr: value("headline_tr"), headline_en: value("headline_en"),
    cta_de: value("cta_de"), cta_tr: value("cta_tr"), cta_en: value("cta_en"),
    link_web: value("link_web"), link_wa: value("link_wa"), link_tel: value("link_tel"), link_ig: value("link_ig"),
    places: [...document.querySelectorAll(".ad-place:checked")].map((c) => c.value).join(","),
    kieze: value("kieze"), priority: Number(value("priority")) || 0,
    start_at: date("start"), end_at: date("end"),
    request_id: value("request_id"), plan: value("plan"),
    active: (adminAds.find((a) => a.id === id) || { active: 1 }).active,
  };
  if (!ad.name) { alert("Name fehlt."); return; }
  const res = await adminRequest("POST", { action: "adSave", ad });
  if (!res.ok) { alert("Speichern fehlgeschlagen."); return; }
  document.getElementById("ad-form-modal")?.remove();
  loadWerbungSection();
}
