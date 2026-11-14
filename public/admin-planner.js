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
  const added = [...files].map((file) => plannerAddRow(file));
  // Empty fields are filled from the picture (KI), one after another
  plannerAiQueue(added.filter(Boolean));
}

// ---- KI: read the picture / video frame and fill empty fields (DE + TR) ----
let plannerAiBusy = Promise.resolve();
function plannerAiQueue(rows) {
  rows.forEach((row) => { plannerAiBusy = plannerAiBusy.then(() => plannerAiFill(row, false)).catch(() => {}); });
}

function plannerFrame(row) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(row.file);
    const done = (canvasSource, w, h) => {
      const scale = Math.min(1, 1024 / Math.max(w, h));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      canvas.getContext("2d").drawImage(canvasSource, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("frame"))), "image/jpeg", 0.85);
    };
    if (row.isVideo) {
      const video = document.createElement("video");
      video.muted = true;
      video.preload = "auto";
      video.onloadeddata = () => { video.currentTime = Math.min(1, (video.duration || 2) / 2); };
      video.onseeked = () => done(video, video.videoWidth, video.videoHeight);
      video.onerror = () => reject(new Error("video"));
      video.src = url;
    } else {
      const img = new Image();
      img.onload = () => done(img, img.naturalWidth, img.naturalHeight);
      img.onerror = () => reject(new Error("image"));
      img.src = url;
    }
  });
}

async function plannerAiFill(row, force) {
  if (!row || !row.file || !plannerRows.includes(row)) return;
  row.ai = "busy";
  renderPlannerRows();
  try {
    const form = new FormData();
    form.set("image", await plannerFrame(row), "frame.jpg");
    const res = await fetch("/api/story-ai", { method: "POST", headers: { "x-admin-token": plannerToken() }, body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error === "ai_unbound" ? "KI nicht verbunden" : data.error || `HTTP ${res.status}`);
    // Only empty fields – what the admin typed stays (✨ button = overwrite)
    if (force || !row.headline.trim()) row.headline = data.headline || row.headline;
    if (force || !row.subtext.trim()) row.subtext = data.subtext || row.subtext;
    if (force || !row.link.trim()) row.link = data.link || row.link;
    if (data.kiez && (force || !row.kiez.trim() || row.kiez === "Ganz Berlin")) row.kiez = data.kiez;
    if (data.kind && (force || !row.kind.trim() || row.kind === "news")) row.kind = data.kind;
    row.ai = "ok";
  } catch (e) {
    row.ai = "error";
    row.aiError = e.message;
  }
  renderPlannerRows();
}

function plannerAiButton(key) {
  const row = plannerRows.find((r) => r.key === key);
  if (row) plannerAiFill(row, true);
}

function plannerStartNow(key) {
  const row = plannerRows.find((r) => r.key === key);
  if (!row) return;
  const length = row.end - row.start;
  row.start = Date.now();
  row.end = row.start + (length > 0 ? length : 24 * 3600000);
  renderPlannerRows();
}

function plannerAddRow(file) {
  const last = plannerRows[plannerRows.length - 1];
  const start = last && last.start ? last.start + 3 * 3600000 : Math.ceil((Date.now() + 15 * 60000) / 300000) * 300000;
  plannerRows.push({
    key: ++plannerSeq, file, preview: file ? URL.createObjectURL(file) : "", isVideo: !!(file && file.type.startsWith("video/")),
    headline: "", subtext: "", kiez: "Ganz Berlin", kind: "news", link: "", start, end: start + 24 * 3600000, status: "", ai: "",
  });
  renderPlannerRows();
  return plannerRows[plannerRows.length - 1];
}

// ---- 2026-11-13 (owner): one admin story with any number of pictures/videos (e.g. sponsor ad: 4 pictures + 2 videos).
// The row's own picture/video is #1, the extras follow in this order. Viewers swipe through them.
function plannerExtrasHtml(row) {
  if (!row.file) return `<div style="color: #8b949e;">Ek resim/video için önce bu story'ye bir resim veya video seç.</div>`;
  const extras = row.extras || [];
  const thumb = (x, n) => `
    <div style="width: 70px; flex: none; text-align: center;">
      ${x.isVideo ? `<div style="position: relative; cursor: pointer;" onclick="mkAdminMedia('${x.preview}', true)"><video src="${x.preview}#t=0.5" preload="metadata" muted playsinline style="width: 70px; height: 96px; object-fit: cover; border-radius: 6px; background: #000;"></video><span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">▶️</span></div>`
        : `<img src="${x.preview}" alt="" onclick="mkAdminMedia('${x.preview}', false)" style="width: 70px; height: 96px; object-fit: cover; border-radius: 6px; cursor: zoom-in;">`}
      <div>#${n + 2}</div>
      <input class="form-control" style="font-size: 11px; padding: 2px 4px;" placeholder="Metin" value="${adminEsc(x.caption || "")}" oninput="plannerExtraCaption(${row.key}, ${n}, this.value)">
      <div style="display: flex; gap: 2px; justify-content: center; margin-top: 2px;">
        <button class="chip-btn" style="padding: 1px 6px;" onclick="plannerExtraMove(${row.key}, ${n}, -1)">←</button>
        <button class="chip-btn" style="padding: 1px 6px;" onclick="plannerExtraMove(${row.key}, ${n}, 1)">→</button>
        <button class="chip-btn" style="padding: 1px 6px;" onclick="plannerExtraRemove(${row.key}, ${n})">✕</button>
      </div>
    </div>`;
  return `
    <div style="border: 1px dashed #30363d; border-radius: 8px; padding: 6px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
        <b>🎞️ Bu story'de ${1 + extras.length} resim/video</b>
        <label class="chip-btn" style="cursor: pointer;">➕ Resim / video ekle<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple style="display: none;" onchange="plannerAddExtras(${row.key}, this.files); this.value='';"></label>
      </div>
      ${extras.length ? `<div style="display: flex; gap: 6px; overflow-x: auto; margin-top: 6px;">${extras.map(thumb).join("")}</div>` : ""}
    </div>`;
}

function plannerAddExtras(key, files) {
  const row = plannerRows.find((r) => r.key === key);
  if (!row) return;
  row.extras = row.extras || [];
  [...files].forEach((file) => row.extras.push({ file, preview: URL.createObjectURL(file), isVideo: file.type.startsWith("video/"), caption: "" }));
  if (row.status === "ok") row.status = "";
  renderPlannerRows();
}

function plannerExtraCaption(key, n, value) {
  const row = plannerRows.find((r) => r.key === key);
  if (row && row.extras && row.extras[n]) row.extras[n].caption = value;
}

function plannerExtraMove(key, n, step) {
  const row = plannerRows.find((r) => r.key === key);
  if (!row || !row.extras) return;
  const m = n + step;
  if (m < 0 || m >= row.extras.length) return;
  [row.extras[n], row.extras[m]] = [row.extras[m], row.extras[n]];
  renderPlannerRows();
}

function plannerExtraRemove(key, n) {
  const row = plannerRows.find((r) => r.key === key);
  if (!row || !row.extras) return;
  row.extras.splice(n, 1);
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
        ${row.preview ? (row.isVideo ? `<div style="position: relative; width: 84px; height: 120px; flex: none; cursor: pointer;" onclick="mkAdminMedia('${row.preview}', true)"><video src="${row.preview}#t=0.5" preload="metadata" muted playsinline style="width: 84px; height: 120px; object-fit: cover; border-radius: 8px; background: #000;"></video><span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 26px;">▶️</span></div>` : `<img src="${row.preview}" alt="" onclick="mkAdminMedia('${row.preview}', false)" style="width: 84px; height: 120px; object-fit: cover; border-radius: 8px; cursor: zoom-in;">`) : `<div style="width: 84px; height: 120px; border-radius: 8px; background: #E30613; display: flex; align-items: center; justify-content: center; font-weight: 800;">Aa</div>`}
        <div style="margin-top: 4px;">#${i + 1}</div>
        <div style="display: flex; gap: 4px; justify-content: center;"><button class="chip-btn" onclick="plannerMove(${row.key}, -1)">↑</button><button class="chip-btn" onclick="plannerMove(${row.key}, 1)">↓</button></div>
      </div>
      <div style="flex: 1; display: grid; gap: 5px;">
        ${input(row, "headline", "Başlık *", 'maxlength="300"')}
        <textarea class="form-control" rows="6" maxlength="10000" placeholder="Metin (admin: 10.000 karaktere kadar)" oninput="plannerSet(${row.key}, 'subtext', this.value)">${adminEsc(row.subtext)}</textarea>
        <div style="display: flex; gap: 5px;">${input(row, "kiez", "Kiez", 'style="flex: 1;"')}${input(row, "kind", "Kategori", 'list="planner-kinds" style="flex: 1;"')}</div>
        ${input(row, "link", "Web linki (isteğe bağlı) https://…")}
        <div style="display: flex; gap: 5px; flex-wrap: wrap;" title="2026-11-14: doluysa story 'Özel Kiez İndirimleri' bölümünde de görünür">🏷️ ${input(row, "deal_what", "İndirim: ne? (örn. Ayran 1 L)", 'maxlength="80" style="flex: 2; min-width: 160px;"')}${input(row, "deal_price", "Yeni fiyat (0,99 €)", 'maxlength="30" style="flex: 1; min-width: 90px;"')}${input(row, "deal_old", "Eski fiyat (isteğe bağlı)", 'maxlength="30" style="flex: 1; min-width: 90px;"')}</div>
        ${plannerExtrasHtml(row)}
        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
          <label style="display: grid; gap: 2px; flex: 1;">▶️ Başlangıç<input type="datetime-local" class="form-control" value="${toLocalInput(row.start)}" onchange="plannerSet(${row.key}, 'start', this.value)"></label>
          <label style="display: grid; gap: 2px; flex: 1;">⏹️ Bitiş<input type="datetime-local" class="form-control" value="${toLocalInput(row.end)}" onchange="plannerSet(${row.key}, 'end', this.value)"></label>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #8b949e;">${row.status === "ok" ? "✅ Planlandı" : row.status === "error" ? `❌ ${adminEsc(row.error || "Hata")}` : row.status === "busy" ? "⏳ Yükleniyor…" : row.ai === "busy" ? "✨ KI resmi okuyor…" : row.ai === "error" ? `KI: ${adminEsc(row.aiError || "Fehler")} · ` + `${Math.max(1, Math.ceil((row.end - row.start) / 3600000))} saat yayında` : `${Math.max(1, Math.ceil((row.end - row.start) / 3600000))} saat yayında`}</span>
          <span style="display: flex; gap: 5px;">
            ${row.file ? `<button class="chip-btn" title="Resimden yeniden doldur" onclick="plannerAiButton(${row.key})">${row.ai === "busy" ? "⏳ KI…" : row.ai === "ok" ? "✨ KI ✓" : row.ai === "error" ? `✨ KI ✗` : "✨ KI"}</button>` : ""}
            <button class="chip-btn" onclick="plannerStartNow(${row.key})">▶️ Şimdi</button>
            <button class="chip-btn" onclick="plannerRemove(${row.key})">Kaldır</button>
          </span>
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
      // 2026-11-14: offer of the story (also shown under "Exklusive Kiez-Vorteile")
      form.set("deal_what", (row.deal_what || "").trim());
      form.set("deal_price", (row.deal_price || "").trim());
      form.set("deal_old", (row.deal_old || "").trim());
      form.set("author", "My Kiez Berlin");
      form.set("publishAt", String(row.start));
      form.set("endAt", String(row.end));
      if (row.file) form.set("file", await plannerPrepareFile(row.file));
      // 2026-11-13: further pictures/videos of the same story (only with a first picture/video)
      if (row.file && row.extras && row.extras.length) {
        for (let n = 0; n < row.extras.length; n++) {
          const x = row.extras[n];
          if (x.isVideo && x.file.size > 50 * 1024 * 1024) throw new Error(`Ek video ${n + 2}: 50 MB'den büyük`);
          form.append("file", await plannerPrepareFile(x.file));
          form.set(`caption_${n + 2}`, (x.caption || "").trim());
        }
      }
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
          ${s.media_key ? (s.media_type === "video" ? `<div style="position: relative; width: 60px; height: 84px; flex: none; cursor: pointer;" onclick="mkAdminMedia('/media/${adminEsc(s.media_key)}', true)"><video src="/media/${adminEsc(s.media_key)}#t=0.5" preload="metadata" muted playsinline style="width: 60px; height: 84px; object-fit: cover; border-radius: 6px; background: #000;"></video><span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;">▶️</span></div>` : `<img src="/media/${adminEsc(s.media_key)}" alt="" onclick="mkAdminMedia('/media/${adminEsc(s.media_key)}', false)" style="width: 60px; height: 84px; object-fit: cover; border-radius: 6px; cursor: zoom-in;">`) : `<div style="width: 44px; height: 60px; border-radius: 6px; background: #E30613; display: flex; align-items: center; justify-content: center;">Aa</div>`}
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
  if (res.status === 401) alert("Oturum süresi doldu – lütfen yeniden giriş yapın · Bitte neu anmelden");
  else if (!res.ok) alert("İşlem başarısız (" + res.status + ")");
  else if (action === "publishNow") alert("✅ Story şimdi yayında · jetzt online");
  loadPlannedList();
}
