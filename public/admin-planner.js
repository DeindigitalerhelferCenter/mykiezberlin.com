/**
 * Admin: Story-Planer. Many stories (picture/video + text) prepared at once, each with its own start and end
 * (day, hour, minute). The server shows a story only from its start time and notifies the users then.
 * Same functions as the planner in the app (AdminStoryPlanner.kt).
 */
let plannerRows = [];
let plannerList = [];
let plannerSeq = 0;
const PLANNER_KINDS = ["news", "event", "info", "traffic", "warn", "politics", "sport", "kultur", "angebot"];

const basePlannerLoadQueue = loadModerationQueue;
loadModerationQueue = async function () {
  await basePlannerLoadQueue();
  renderPlannerSection();
  loadPlannedList();
};

function plannerToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// ms -> value for <input type="datetime-local"> (local time = Berlin on the admin's computer)
function toLocalInput(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fromLocalInput(value) {
  const ms = value ? new Date(value).getTime() : 0;
  return Number.isNaN(ms) ? 0 : ms;
}

function plannerDate(ms) {
  return new Date(ms).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function renderPlannerSection() {
  const host = document.querySelector("main") || document.body;
  let box = document.getElementById("admin-planner");
  if (!box) {
    box = document.createElement("section");
    box.id = "admin-planner";
    box.style.cssText = "margin-top: 26px; color: #fff;";
    const werbung = document.getElementById("admin-werbung");
    if (werbung) host.insertBefore(box, werbung); else host.appendChild(box);
  }
  const today = toLocalInput(Date.now()).slice(0, 10);
  box.innerHTML = `
    <h2 style="font-size: 17px; font-weight: 800; margin-bottom: 6px;">📅 Story Planlayıcı</h2>
    <div style="font-size: 12.5px; color: #8b949e; margin-bottom: 10px;">Bir seferde çok sayıda resimli/videolu story hazırla. Her biri için gün, saat ve dakikayla başlangıç ve bitiş belirle. Story tam o saatte yayına girer ve kullanıcılara bildirim gider. Bitiş boşsa 24 saat.</div>
    <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 10px;">
      <label class="chip-btn active" style="cursor: pointer;">🖼️ Resim / video seç (çoklu)<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple style="display: none;" onchange="plannerAddFiles(this.files); this.value='';"></label>
      <button class="chip-btn" onclick="plannerAddRow(null)">+ Metin story (resimsiz)</button>
    </div>
    <div id="planner-auto" style="background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 10px; font-size: 12.5px; display: grid; gap: 6px; margin-bottom: 10px;">
      <b>⚡ Otomatik dağıt (toplu)</b>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: end;">
        <label style="display: grid; gap: 2px;">Başlangıç günü<input id="planner-day" type="date" class="form-control" value="${today}"></label>
        <label style="display: grid; gap: 2px; flex: 1; min-width: 220px;">Saatler (virgülle, dakikaya kadar)<input id="planner-times" class="form-control" value="09:00, 12:00, 15:00, 18:00, 21:00"></label>
        <label style="display: grid; gap: 2px; width: 110px;">Süre (saat)<input id="planner-hours" type="number" min="1" max="720" class="form-control" value="24"></label>
        <button class="chip-btn active" onclick="plannerDistribute()">Dağıt</button>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: end;">
        <label style="display: grid; gap: 2px;">Hepsi için Kiez<input id="planner-all-kiez" class="form-control" placeholder="Ganz Berlin"></label>
        <label style="display: grid; gap: 2px;">Hepsi için kategori<input id="planner-all-kind" class="form-control" list="planner-kinds" placeholder="news"></label>
        <button class="chip-btn" onclick="plannerApplyAll()">Hepsine uygula</button>
      </div>
      <datalist id="planner-kinds">${PLANNER_KINDS.map((k) => `<option value="${k}">`).join("")}</datalist>
    </div>
    <div id="planner-rows"></div>
    <div id="planner-actions"></div>
    <h3 style="font-size: 15px; font-weight: 800; margin: 16px 0 8px;">🗓️ Planlanmış story'ler</h3>
    <div id="planner-list" style="font-size: 12.5px; color: #8b949e;">Yükleniyor…</div>`;
  renderPlannerRows();
  renderPlannedList();
}

function plannerAddFiles(files) {
  [...files].forEach((file) => plannerAddRow(file));
}

function plannerAddRow(file) {
  const last = plannerRows[plannerRows.length - 1];
  const start = last && last.start ? last.start + 3 * 3600000 : Math.ceil((Date.now() + 15 * 60000) / 300000) * 300000;
  plannerRows.push({
    key: ++plannerSeq, file, preview: file ? URL.createObjectURL(file) : "", isVideo: !!(file && file.type.startsWith("video/")),
    headline: "", subtext: "", kiez: "Ganz Berlin", kind: "news", link: "", start, end: start + 24 * 3600000, status: "",
  });
  renderPlannerRows();
}

function plannerSet(key, field, value) {
  const row = plannerRows.find((r) => r.key === key);
  if (!row) return;
  if (field === "start" || field === "end") {
    row[field] = fromLocalInput(value);
    if (field === "start" && row.end <= row.start) row.end = row.start + 24 * 3600000;
    renderPlannerRows();
  } else {
    row[field] = value;
  }
}

function plannerRemove(key) {
  plannerRows = plannerRows.filter((r) => r.key !== key);
  renderPlannerRows();
}

function plannerMove(key, step) {
  const i = plannerRows.findIndex((r) => r.key === key);
  const j = i + step;
  if (i < 0 || j < 0 || j >= plannerRows.length) return;
  [plannerRows[i], plannerRows[j]] = [plannerRows[j], plannerRows[i]];
  renderPlannerRows();
}

// Fills start/end of all rows in order: day by day, one story per given time; times already past are skipped.
function plannerDistribute() {
  const day = document.getElementById("planner-day").value;
  const hours = Math.min(Math.max(Number(document.getElementById("planner-hours").value) || 24, 1), 720);
  const times = document.getElementById("planner-times").value.split(/[,;\s]+/).map((t) => t.trim()).filter((t) => /^\d{1,2}:\d{2}$/.test(t))
    .map((t) => t.split(":").map(Number)).sort((a, b) => a[0] * 60 + a[1] - (b[0] * 60 + b[1]));
  if (!day || !times.length) { alert("Gün ve en az bir saat gir (ör. 09:00, 12:30)."); return; }
  const base = new Date(`${day}T00:00`);
  let d = 0;
  let t = 0;
  plannerRows.forEach((row) => {
    let start;
    do {
      const date = new Date(base);
      date.setDate(base.getDate() + d);
      date.setHours(times[t][0], times[t][1], 0, 0);
      start = date.getTime();
      t += 1;
      if (t >= times.length) { t = 0; d += 1; }
    } while (start < Date.now());
    row.start = start;
    row.end = start + hours * 3600000;
  });
  renderPlannerRows();
}

function plannerApplyAll() {
  const kiez = document.getElementById("planner-all-kiez").value.trim();
  const kind = document.getElementById("planner-all-kind").value.trim();
  plannerRows.forEach((row) => {
    if (kiez) row.kiez = kiez;
    if (kind) row.kind = kind;
  });
  renderPlannerRows();
}

function renderPlannerRows() {
  const list = document.getElementById("planner-rows");
  const actions = document.getElementById("planner-actions");
  if (!list || !actions) return;
  const input = (row, field, placeholder, extra = "") => `<input class="form-control" value="${adminEsc(row[field])}" placeholder="${placeholder}" ${extra} oninput="plannerSet(${row.key}, '${field}', this.value)">`;
  list.innerHTML = plannerRows.map((row, i) => `
    <div style="display: flex; gap: 10px; background: #161b22; border: 1px solid ${row.status === "ok" ? "#2ea043" : row.status === "error" ? "#da3633" : "#30363d"}; border-radius: 10px; padding: 10px; margin-bottom: 8px; font-size: 12px;">
      <div style="width: 84px; flex: none; text-align: center;">
        ${row.preview ? (row.isVideo ? `<video src="${row.preview}" muted style="width: 84px; height: 120px; object-fit: cover; border-radius: 8px;"></video>` : `<img src="${row.preview}" alt="" style="width: 84px; height: 120px; object-fit: cover; border-radius: 8px;">`) : `<div style="width: 84px; height: 120px; border-radius: 8px; background: #E30613; display: flex; align-items: center; justify-content: center; font-weight: 800;">Aa</div>`}
        <div style="margin-top: 4px;">#${i + 1}</div>
        <div style="display: flex; gap: 4px; justify-content: center;"><button class="chip-btn" onclick="plannerMove(${row.key}, -1)">↑</button><button class="chip-btn" onclick="plannerMove(${row.key}, 1)">↓</button></div>
      </div>
      <div style="flex: 1; display: grid; gap: 5px;">
        ${input(row, "headline", "Başlık *", 'maxlength="120"')}
        ${input(row, "subtext", "Metin", 'maxlength="500"')}
        <div style="display: flex; gap: 5px;">${input(row, "kiez", "Kiez", 'style="flex: 1;"')}${input(row, "kind", "Kategori", 'list="planner-kinds" style="flex: 1;"')}</div>
        ${input(row, "link", "Web linki (isteğe bağlı) https://…")}
        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
          <label style="display: grid; gap: 2px; flex: 1;">▶️ Başlangıç<input type="datetime-local" class="form-control" value="${toLocalInput(row.start)}" onchange="plannerSet(${row.key}, 'start', this.value)"></label>
          <label style="display: grid; gap: 2px; flex: 1;">⏹️ Bitiş<input type="datetime-local" class="form-control" value="${toLocalInput(row.end)}" onchange="plannerSet(${row.key}, 'end', this.value)"></label>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #8b949e;">${row.status === "ok" ? "✅ Planlandı" : row.status === "error" ? `❌ ${adminEsc(row.error || "Hata")}` : row.status === "busy" ? "⏳ Yükleniyor…" : `${Math.max(1, Math.ceil((row.end - row.start) / 3600000))} saat yayında`}</span>
          <button class="chip-btn" onclick="plannerRemove(${row.key})">Kaldır</button>
        </div>
      </div>
    </div>`).join("");
  actions.innerHTML = plannerRows.length
    ? `<div style="display: flex; gap: 8px; margin: 6px 0 4px;"><button class="btn-primary" onclick="plannerUploadAll()">📤 ${plannerRows.filter((r) => r.status !== "ok").length} story'yi planla</button><button class="chip-btn" onclick="plannerRows = plannerRows.filter((r) => r.status !== 'ok'); renderPlannerRows();">Planlananları listeden temizle</button></div>`
    : "";
}

// Pictures over 4.5 MB are reduced (server limit 5 MB); videos up to 50 MB stay unchanged.
async function plannerPrepareFile(file) {
  if (!file || file.type.startsWith("video/") || file.size <= 4.5 * 1024 * 1024) return file;
  const url = URL.createObjectURL(file);
  const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
  URL.revokeObjectURL(url);
  const scale = Math.min(1, 1920 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  return new File([blob], "story.jpg", { type: "image/jpeg" });
}

async function plannerUploadAll() {
  const todo = plannerRows.filter((r) => r.status !== "ok");
  const missing = todo.filter((r) => !r.headline.trim());
  if (missing.length) { alert(`${missing.length} story'de başlık eksik.`); return; }
  for (const row of todo) {
    row.status = "busy";
    renderPlannerRows();
    try {
      if (row.file && row.file.type.startsWith("video/") && row.file.size > 50 * 1024 * 1024) throw new Error("Video 50 MB'den büyük");
      const form = new FormData();
      form.set("planned", "1");
      form.set("headline", row.headline.trim());
      form.set("subtext", row.subtext.trim());
      form.set("kiez", row.kiez.trim() || "Ganz Berlin");
      form.set("kind", row.kind.trim() || "news");
      form.set("link", row.link.trim());
      form.set("author", "My Kiez Berlin");
      form.set("publishAt", String(row.start));
      form.set("endAt", String(row.end));
      if (row.file) form.set("file", await plannerPrepareFile(row.file));
      const res = await fetch("/api/stories", { method: "POST", headers: { "x-admin-token": plannerToken() }, body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      row.status = "ok";
    } catch (e) {
      row.status = "error";
      row.error = e.message;
    }
    renderPlannerRows();
  }
  loadPlannedList();
}

async function loadPlannedList() {
  try {
    const res = await fetch("/api/admin-planned", { headers: { "x-admin-token": plannerToken() } });
    plannerList = res.ok ? (await res.json()).stories || [] : [];
  } catch (e) {
    plannerList = [];
  }
  renderPlannedList();
}

function renderPlannedList() {
  const box = document.getElementById("planner-list");
  if (!box) return;
  if (!plannerList.length) { box.innerHTML = "Şu an planlanmış story yok."; return; }
  const days = {};
  plannerList.forEach((s) => {
    const day = new Date(s.approved_at).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
    (days[day] = days[day] || []).push(s);
  });
  box.innerHTML = Object.entries(days).map(([day, items]) => `
    <div style="margin-bottom: 10px;">
      <div style="color: #F2B705; font-weight: 800; margin-bottom: 4px;">${adminEsc(day)} · ${items.length} story</div>
      ${items.map((s) => `
        <div style="display: flex; gap: 8px; align-items: center; background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 8px; margin-bottom: 6px; color: #fff;">
          ${s.media_key ? (s.media_type === "video" ? `<div style="width: 44px; height: 60px; border-radius: 6px; background: #333; display: flex; align-items: center; justify-content: center;">🎬</div>` : `<img src="/media/${adminEsc(s.media_key)}" alt="" style="width: 44px; height: 60px; object-fit: cover; border-radius: 6px;">`) : `<div style="width: 44px; height: 60px; border-radius: 6px; background: #E30613; display: flex; align-items: center; justify-content: center;">Aa</div>`}
          <div style="flex: 1; min-width: 0;">
            <b>${new Date(s.approved_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</b> · ${adminEsc(s.headline)}
            <div style="color: #8b949e;">📍 ${adminEsc(s.kiez)} · ${adminEsc(s.kind)} · bitiş ${plannerDate(s.approved_at + s.duration_hours * 3600000)}</div>
            <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-top: 4px;">
              <input type="datetime-local" class="form-control" style="max-width: 200px;" id="re-start-${adminEsc(s.id)}" value="${toLocalInput(s.approved_at)}">
              <input type="datetime-local" class="form-control" style="max-width: 200px;" id="re-end-${adminEsc(s.id)}" value="${toLocalInput(s.approved_at + s.duration_hours * 3600000)}">
              <button class="chip-btn" onclick="plannerReschedule('${adminEsc(s.id)}')">Saati kaydet</button>
              <button class="chip-btn" onclick="plannerAction('${adminEsc(s.id)}', 'publishNow')">Hemen yayınla</button>
              <button class="chip-btn" onclick="plannerAction('${adminEsc(s.id)}', 'delete')">Sil</button>
            </div>
          </div>
        </div>`).join("")}
    </div>`).join("");
}

async function plannerReschedule(id) {
  const start = fromLocalInput(document.getElementById(`re-start-${id}`).value);
  const end = fromLocalInput(document.getElementById(`re-end-${id}`).value);
  if (!start) return;
  const res = await adminRequest("POST", { type: "story", id, action: "reschedule", publishAt: start, endAt: end > start ? end : 0 });
  if (!res.ok) alert("Kaydedilemedi");
  loadPlannedList();
}

async function plannerAction(id, action) {
  if (action === "delete" && !confirm("Bu planlanmış story silinsin mi?")) return;
  const res = await adminRequest("POST", { type: "story", id, action });
  if (!res.ok) alert("İşlem başarısız");
  loadPlannedList();
}
