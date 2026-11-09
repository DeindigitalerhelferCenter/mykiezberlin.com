/**
 * My Kiez Berlin - APK parity layer.
 * Adds real live data, shared stories and the screens of the Android app.
 * Loaded after app.js; functions declared here replace their app.js versions.
 */

const LIVE_REFRESH_MS = 180000;
const STORAGE_FAVORITES_KEY = "mykiez_favorites_v1";
const STORAGE_REDEEMED_KEY = "mykiez_redeemed_v1";
const STORAGE_LANGUAGE_KEY = "mykiez_language_v1";

let liveData = null;
let liveFailed = false;
let serverStories = null;
let reporterPosts = null;
let reporterAvailable = false;
let activeBusinessCategory = "all";
let sponsorIndex = 0;

function tr(de, turkish) {
  if (currentLanguage === "tr") return turkish;
  return currentLanguage === "en" ? EN_TEXT[de] || de : de;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Only http(s), tel and relative asset links may reach an href or src.
function safeUrl(value) {
  const url = String(value ?? "");
  return /^(https:\/\/|http:\/\/|tel:|assets\/|\/media\/)/.test(url) ? esc(url) : "#";
}

function jsArg(value) {
  return esc(JSON.stringify(String(value ?? "")));
}

function readList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (e) {
    return [];
  }
}

function timeAgo(ms) {
  if (!ms) return tr("Aktuell", "Güncel");
  const minutes = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (minutes < 1) return tr("Gerade eben", "Az önce");
  if (minutes < 60) return tr(`Vor ${minutes} Min.`, `${minutes} dk önce`);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return tr(`Vor ${hours} Std.`, `${hours} saat önce`);
  return new Date(ms).toLocaleDateString("de-DE");
}

/* ---------- Real live data ---------- */

async function refreshLive(manual = false) {
  try {
    const res = await fetch("/api/live", { cache: manual ? "reload" : "default" });
    if (!res.ok) throw new Error(String(res.status));
    liveData = await res.json();
    liveFailed = false;
  } catch (e) {
    liveFailed = true;
  }
  applyLiveAlerts();
  renderAlertTicker();
  if (["bulletin", "sport", "home"].includes(currentTab)) renderTabContent();
}

function applyLiveAlerts() {
  const alerts = liveData?.alerts || [];
  BERLIN_LIVE_ALERTS.length = 0;
  alerts.forEach((a, index) => {
    BERLIN_LIVE_ALERTS.push({
      id: index + 1,
      tag: esc(a.tag),
      color: esc(a.color),
      bgLight: esc(a.bgLight),
      titleDe: esc(a.title),
      titleTr: esc(a.title),
      bodyDe: esc(a.body),
      bodyTr: esc(a.body),
      officialUrl: safeUrl(a.url),
      timestamp: esc(timeAgo(a.publishedAt)),
    });
  });
  currentAlertIndex = 0;
}

const baseRenderAlertTicker = renderAlertTicker;
renderAlertTicker = function () {
  const container = document.getElementById("live-alert-ticker-container");
  if (!BERLIN_LIVE_ALERTS.length) {
    if (container) container.innerHTML = "";
    return;
  }
  baseRenderAlertTicker();
};

function cycleNextAlert(forceOpen = false) {
  if (!BERLIN_LIVE_ALERTS.length) return;
  currentAlertIndex = (currentAlertIndex + 1) % BERLIN_LIVE_ALERTS.length;
  if (forceOpen) alertDismissed = false;
  renderAlertTicker();
}

function startAlertAutoCycle() {
  clearInterval(alertAutoCycleTimer);
  alertAutoCycleTimer = setInterval(() => {
    if (!alertDismissed) cycleNextAlert();
  }, 14000);
}

const baseRenderBulletinTab = renderBulletinTab;
renderBulletinTab = function (container) {
  baseRenderBulletinTab(container);
  container.querySelector(".test-trigger-btn")?.remove();
  const refresh = container.querySelector(".bulletin-header-box .chip-btn");
  if (refresh) refresh.setAttribute("onclick", "refreshLive(true)");
  const stamp = container.querySelector(".bulletin-header-box strong");
  if (stamp) stamp.textContent = liveData ? new Date(liveData.updatedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "–";
  [...container.querySelectorAll(".category-chips-scroll .chip-btn")].find((b) => b.textContent === "Bürgeramt")?.remove();
  if (!BERLIN_LIVE_ALERTS.length) {
    const list = container.querySelector(".bulletin-cards-list");
    if (list) list.innerHTML = `<div class="card-item" style="padding: 20px; text-align: center; color: var(--text-muted);">${esc(liveFailed ? tr("Live-Daten sind gerade nicht erreichbar. Bitte nutze die offiziellen Seiten.", "Canlı veriler şu an alınamıyor. Lütfen resmi siteleri kullanın.") : tr("Live-Daten werden geladen…", "Canlı veriler yükleniyor…"))}</div>`;
  }
};

/* ---------- Shared stories ---------- */

function getStories() {
  const saved = localStorage.getItem(STORAGE_STORIES_KEY);
  let local = DEFAULT_STORIES;
  if (saved) {
    try {
      local = JSON.parse(saved);
    } catch (e) {}
  }
  return [...(serverStories || []), ...local.map(escapeStory)];
}

function escapeStory(story) {
  return { ...story, author: esc(story.author), kiez: esc(story.kiez), headline: esc(story.headline), subtext: esc(story.subtext), image: story.image ? safeUrl(story.image) : "" };
}

async function loadServerStories() {
  try {
    const res = await fetch("/api/stories");
    if (!res.ok) return;
    const { stories } = await res.json();
    serverStories = stories.map((s) => escapeStory({
      id: s.id,
      author: s.author,
      kiez: s.kiez,
      headline: s.headline,
      subtext: s.subtext,
      image: s.media_key && s.media_type !== "video" ? `/media/${s.media_key}` : "assets/images/hero_berlin.jpg",
      isVideo: s.media_type === "video",
      videoUri: s.media_type === "video" ? `/media/${s.media_key}` : "",
      durationHours: s.duration_hours,
      status: "approved",
      link: safeUrl(s.link || "https://mykiezberlin.com"),
      instagram: /^https:\/\/www\.instagram\.com\/(p|reel|tv)\//.test(s.link || "") ? s.link : "",
    }));
    renderStoriesBar();
  } catch (e) {}
}

async function submitUserStory() {
  const headline = document.getElementById("new-story-headline").value.trim();
  const subtext = document.getElementById("new-story-subtext").value.trim();
  const kiez = document.getElementById("new-story-kiez").value;
  const file = await prepareStoryFile(document.getElementById("new-story-file").files[0], headline, subtext);
  if (!headline) {
    showToast(tr("Bitte gib einen Titel ein.", "Lütfen bir başlık girin."));
    return;
  }
  // Name is required (weekly Kiez-Stars, see kiez-stars.js)
  const authorField = document.getElementById("new-story-author");
  if (authorField && !authorField.value.trim()) {
    showToast(tr("Bitte gib deinen Namen ein.", "Lütfen adını yaz."));
    authorField.focus();
    return;
  }

  const form = new FormData();
  form.append("headline", headline);
  form.append("subtext", subtext);
  form.append("kiez", kiez);
  form.append("kind", document.getElementById("new-story-kind")?.value || "news");
  form.append("durationHours", document.getElementById("new-story-duration")?.value || "24");
  if (file) form.append("file", file);

  try {
    const res = await fetch("/api/stories", { method: "POST", body: form });
    if (res.status === 201) {
      showToast(tr("Danke! Deine Story wird geprüft und dann veröffentlicht.", "Teşekkürler! Hikâyeniz onaylandıktan sonra yayınlanacak."));
    } else if (res.status === 429) {
      showToast(tr("Zu viele Beiträge. Bitte versuche es später.", "Çok fazla gönderi. Lütfen sonra deneyin."));
      return;
    } else if (res.status === 413 || res.status === 415) {
      showToast(tr("Bitte ein Bild bis 5 MB oder ein Video bis 50 MB wählen.", "Lütfen 5 MB'a kadar görsel veya 50 MB'a kadar video seçin."));
      return;
    } else {
      showToast(tr("Veröffentlichen ist gerade nicht möglich.", "Şu anda yayınlanamıyor."));
      return;
    }
  } catch (e) {
    showToast(tr("Keine Verbindung. Bitte versuche es erneut.", "Bağlantı yok. Lütfen tekrar deneyin."));
    return;
  }
  document.getElementById("create-story-modal").remove();
}

/* ---------- Navigation ---------- */

const baseUpdateStaticLabels = updateStaticLabels;
updateStaticLabels = function () {
  baseUpdateStaticLabels();
  const labels = {
    home: tr("Betriebe", "İşletmeler"),
    bulletin: tr("Live-Ticker", "Canlı Ticker"),
    sport: tr("Sport & Kurse", "Spor & Kurlar"),
    deals: tr("Gutscheine", "Kuponlar"),
    more: tr("Mehr", "Daha Fazla"),
  };
  document.querySelectorAll(".nav-item").forEach((item) => {
    const span = item.querySelector("span");
    const label = labels[item.getAttribute("data-tab")];
    if (span && label) span.innerText = label;
  });
  const storiesAdd = document.querySelector(".stories-add-btn");
  if (storiesAdd) storiesAdd.innerText = I18N[currentLanguage].shareStory;
  document.documentElement.lang = currentLanguage;
  localStorage.setItem(STORAGE_LANGUAGE_KEY, currentLanguage);
};

const EXTRA_TABS = {
  sport: renderSportTab,
  deals: renderDealsTab,
  more: renderMoreTab,
  food: renderFoodTab,
  favorites: renderFavoritesTab,
  reporter: renderReporterTab,
  profile: renderProfileTab,
  tips: renderTipsTab,
  knowledge: renderKnowledgeTab,
  portal: renderPortalTab,
};

const baseRenderTabContent = renderTabContent;
renderTabContent = function () {
  const content = document.getElementById("main-tab-content");
  if (content && EXTRA_TABS[currentTab]) {
    EXTRA_TABS[currentTab](content);
    return;
  }
  baseRenderTabContent();
};

function renderMoreTab(container) {
  const tiles = [
    ["kieze", "bi-compass-fill", tr("Kieze", "Kiezler")],
    ["food", "bi-egg-fried", tr("Gastronomie", "Yeme & İçme")],
    ["events", "bi-calendar-event-fill", tr("Events", "Etkinlikler")],
    ["jobs", "bi-briefcase-fill", tr("Kiez-Jobs", "İş İlanları")],
    ["reporter", "bi-megaphone-fill", "Kiez-Reporter"],
    ["tips", "bi-signpost-2-fill", tr("Berlin-Tipps", "Berlin Önerileri")],
    ["knowledge", "bi-book-fill", tr("Wissen", "Bilgi")],
    ["quiz", "bi-trophy-fill", "Quiz"],
    ["emergency", "bi-telephone-fill", tr("Notruf", "Acil")],
    ["favorites", "bi-heart-fill", tr("Favoriten", "Favoriler")],
    ["portal", "bi-building", tr("B2B & Werbung", "B2B & Reklam")],
    ["profile", "bi-person-fill", tr("Profil", "Profil")],
  ];
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Alle Bereiche", "Tüm Bölümler"))}</h2>
    <div class="ext-grid">
      ${tiles.map(([tab, icon, label]) => `<button class="ext-tile" onclick="switchTab('${tab}')"><i class="bi ${icon}"></i><span>${esc(label)}</span></button>`).join("")}
    </div>`;
}

/* ---------- Home: businesses, sponsors, headlines ---------- */

function businessCategory(b) {
  return String(b.category).split("·")[0].trim();
}

function renderHomeTab(container) {
  const categories = [...new Set(BUSINESSES.map(businessCategory))];
  const list = BUSINESSES.filter((b) => activeBusinessCategory === "all" || businessCategory(b) === activeBusinessCategory);
  const news = (liveData?.news || []).slice(0, 5);

  container.innerHTML = `
    ${renderSponsorCard()}
    ${news.length ? `
      <h3 class="ext-subheading">${esc(tr("Aktuelle Schlagzeilen", "Güncel Manşetler"))}</h3>
      ${news.map(renderNewsItem).join("")}` : ""}
    <div class="category-chips-scroll" style="margin: 12px -16px;">
      <button class="chip-btn ${activeBusinessCategory === "all" ? "active" : ""}" onclick="setBusinessCategory('all')">${esc(I18N[currentLanguage].all)}</button>
      ${categories.map((c) => `<button class="chip-btn ${activeBusinessCategory === c ? "active" : ""}" onclick="setBusinessCategory(${jsArg(c)})">${esc(c)}</button>`).join("")}
    </div>
    ${list.map((b) => renderPlaceCard(b, "business")).join("")}`;
}

function setBusinessCategory(category) {
  activeBusinessCategory = category;
  renderTabContent();
}

function renderNewsItem(item) {
  return `
    <a class="ext-news" href="${safeUrl(item.link)}" target="_blank" rel="noopener">
      <div class="ext-news-source">${esc(item.source)} · ${esc(timeAgo(item.publishedAt))}</div>
      <div class="ext-news-title">${esc(item.title)}</div>
    </a>`;
}

function renderSponsorCard() {
  if (!SPONSORS.length) return "";
  const s = SPONSORS[sponsorIndex % SPONSORS.length];
  return `
    <a class="card-item ext-sponsor" href="${safeUrl(s.linkWeb)}" target="_blank" rel="noopener sponsored">
      <span class="ext-ad-label">Anzeige</span>
      <img src="${safeUrl(s.drawableRes)}" alt="${esc(s.name)}" class="ext-sponsor-img">
      <div class="card-body">
        <div class="card-title">${esc(currentLanguage === "tr" ? s.headlineTr : s.headlineDe)}</div>
      </div>
    </a>`;
}

function isFavorite(id) {
  return readList(STORAGE_FAVORITES_KEY).includes(id);
}

function toggleFavorite(id) {
  const list = readList(STORAGE_FAVORITES_KEY);
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(next));
  renderTabContent();
}

function renderPlaceCard(p, kind) {
  const sub = kind === "food" ? p.cuisine : p.category;
  return `
    <div class="card-item">
      <img src="${safeUrl(p.imageUrl)}" class="card-cover" alt="${esc(p.name)}" loading="lazy" onclick="openPlaceDetail(${jsArg(p.id)})">
      <div class="card-body">
        <div class="ext-row">
          <div class="card-title" onclick="openPlaceDetail(${jsArg(p.id)})">${esc(p.name)}</div>
          <button class="ext-heart ${isFavorite(p.id) ? "on" : ""}" onclick="toggleFavorite(${jsArg(p.id)})" aria-label="${esc(tr("Favorit", "Favori"))}"><i class="bi bi-heart-fill"></i></button>
        </div>
        <div class="card-subtitle">📍 ${esc(p.kiezName)} · ${esc(sub)}${p.rating ? ` · ⭐ ${esc(p.rating)} (${esc(p.reviewsCount)})` : ""}</div>
        <div class="card-footer">
          <span class="card-tag">${esc(p.distance || p.priceRange || "")}</span>
          <span class="ext-link" onclick="openPlaceDetail(${jsArg(p.id)})">${esc(tr("Details ansehen →", "Detayları gör →"))}</span>
        </div>
      </div>
    </div>`;
}

function openDetailModal(html) {
  closeDetailModal();
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "ext-detail-modal";
  modal.innerHTML = `<div class="modal-card ext-detail"><button class="btn-icon-circle ext-close" onclick="closeDetailModal()" aria-label="${esc(I18N[currentLanguage].dismissBtn)}"><i class="bi bi-x-lg"></i></button>${html}</div>`;
  document.body.appendChild(modal);
}

function closeDetailModal() {
  document.getElementById("ext-detail-modal")?.remove();
}

function contactButtons(p) {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address || p.name)}`;
  const phone = String(p.phone || "").replace(/\s+/g, "");
  const wa = String(p.whatsapp || "").replace(/\D/g, "");
  return `
    <div class="ext-actions">
      ${phone ? `<a class="chip-btn active" href="tel:${esc(phone)}"><i class="bi bi-telephone-fill"></i> ${esc(tr("Anrufen", "Ara"))}</a>` : ""}
      ${wa ? `<a class="chip-btn" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> WhatsApp</a>` : ""}
      ${p.website ? `<a class="chip-btn" href="${safeUrl(p.website)}" target="_blank" rel="noopener"><i class="bi bi-globe"></i> Web</a>` : ""}
      <a class="chip-btn" href="${safeUrl(maps)}" target="_blank" rel="noopener"><i class="bi bi-geo-alt-fill"></i> ${esc(tr("Route", "Yol tarifi"))}</a>
    </div>`;
}

function openPlaceDetail(id) {
  const p = [...BUSINESSES, ...FOOD_SPOTS].find((x) => x.id === id);
  if (!p) return;
  const dishes = p.popularDishes?.length ? `<p class="card-desc">🍽️ ${esc(p.popularDishes.join(", "))}</p>` : "";
  const gallery = (p.galleryImages || []).slice(0, 4).map((g) => `<img src="${safeUrl(g)}" alt="" loading="lazy">`).join("");
  openDetailModal(`
    <img src="${safeUrl(p.imageUrl)}" class="card-cover" alt="${esc(p.name)}">
    <h3 class="modal-title" style="margin-top: 12px;">${esc(p.name)}</h3>
    <div class="card-subtitle">📍 ${esc(p.address || p.kiezName)}</div>
    ${p.openingHours ? `<div class="card-subtitle">🕒 ${esc(p.openingHours)}</div>` : ""}
    ${p.description ? `<p class="card-desc">${esc(p.description)}</p>` : ""}
    ${dishes}
    ${p.hasCoupon && p.couponText ? `<div class="ext-coupon">🎟️ ${esc(p.couponText)}</div>` : ""}
    ${gallery ? `<div class="ext-gallery">${gallery}</div>` : ""}
    ${contactButtons(p)}`);
}

/* ---------- Kieze ---------- */

function renderKiezeTab(container) {
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Berliner Kieze & Bezirke", "Berlin Kiezleri & Semtleri"))}</h2>
    ${KIEZE_FULL.map((k) => `
      <div class="card-item" onclick="openKiezDetail(${jsArg(k.id)})" style="cursor: pointer;">
        <img src="${safeUrl(k.imageUrl)}" class="card-cover" alt="${esc(k.name)}" loading="lazy">
        <div class="card-body">
          <div class="card-title">${esc(k.name)}</div>
          <div class="card-subtitle">📍 ${esc(k.subtitle)}</div>
          <div class="card-desc">${esc(tr("Einwohner", "Nüfus"))}: ${esc(k.population)}</div>
        </div>
      </div>`).join("")}`;
}

function openKiezDetail(id) {
  const k = KIEZE_FULL.find((x) => x.id === id);
  if (!k) return;
  const row = (label, value) => (value ? `<div class="card-subtitle"><strong>${esc(label)}:</strong> ${esc(value)}</div>` : "");
  const map = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(k.lat)}&mlon=${encodeURIComponent(k.lng)}#map=15/${encodeURIComponent(k.lat)}/${encodeURIComponent(k.lng)}`;
  openDetailModal(`
    <img src="${safeUrl(k.imageUrl)}" class="card-cover" alt="${esc(k.name)}">
    <h3 class="modal-title" style="margin-top: 12px;">${esc(k.name)}</h3>
    <p class="card-desc">${esc(k.description)}</p>
    ${row("PLZ", k.postalCodes)}
    ${row(tr("Einwohner", "Nüfus"), k.population)}
    ${row(tr("Miete", "Kira"), k.rentIndex)}
    ${row("Flair", k.vibe)}
    ${row("ÖPNV", k.transitLines)}
    ${row(tr("Parks", "Parklar"), (k.parks || []).join(", "))}
    ${row(tr("Beliebte Orte", "Popüler Yerler"), (k.popularSpots || k.highlights || []).join(", "))}
    ${row(tr("Sehenswert", "Görülecek Yerler"), (k.highlights || []).join(", "))}
    ${row("Bürgeramt", [k.buergeramtName, k.buergeramtAddress].filter(Boolean).join(", "))}
    ${row(tr("Polizei", "Polis"), [k.policeStation, k.policeAddress].filter(Boolean).join(", "))}
    <div class="ext-actions"><a class="chip-btn active" href="${safeUrl(map)}" target="_blank" rel="noopener"><i class="bi bi-map-fill"></i> ${esc(tr("Karte", "Harita"))}</a></div>`);
}

/* ---------- Events, jobs, emergency ---------- */

function renderEventsTab(container) {
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Berlin Events", "Berlin Etkinlikleri"))}</h2>
    ${EVENTS_FULL.map((e) => `
      <div class="card-item">
        ${e.imageUrl ? `<img src="${safeUrl(e.imageUrl)}" class="card-cover" alt="${esc(e.title)}" loading="lazy">` : ""}
        <div class="card-body">
          <div class="ext-row">
            <div class="card-title">${esc(e.title)}</div>
            <span class="card-tag">${esc(e.dayLabel)} ${esc(e.dateNum)} ${esc(e.monthLabel)}</span>
          </div>
          <div class="card-subtitle">📍 ${esc(e.kiezName)} · ⏰ ${esc(e.time)} · 💶 ${esc(e.price)}</div>
          <div class="card-desc">${esc(e.description)}</div>
          <div class="card-footer">
            <span class="card-tag">${esc(e.category)}</span>
            <a class="ext-link" href="${safeUrl(e.officialUrl || "https://www.berlin.de/events/volksfeste/")}" target="_blank" rel="noopener">${esc(I18N[currentLanguage].officialSource)} →</a>
          </div>
        </div>
      </div>`).join("")}`;
}

function renderJobsTab(container) {
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Kiez-Jobs", "Kiez İş İlanları"))}</h2>
    ${JOBS.map((j) => {
      const wa = String(j.contactWa || "").replace(/\D/g, "");
      return `
      <div class="card-item" style="padding: 16px;">
        <div class="ext-row">
          <div class="card-title">${esc(j.title)}</div>
          ${j.isUrgent ? `<span class="card-tag">${esc(tr("Dringend", "Acil"))}</span>` : ""}
        </div>
        <div class="card-subtitle">📍 ${esc(j.company)}, ${esc(j.kiez)} · ${esc(j.jobType)} · ${esc(j.salary)}</div>
        <div class="card-desc">${esc(j.description)}</div>
        <div class="ext-actions">
          ${wa ? `<a class="chip-btn active" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> WhatsApp</a>` : ""}
          ${j.contactPhone ? `<a class="chip-btn" href="tel:${esc(String(j.contactPhone).replace(/\s+/g, ""))}"><i class="bi bi-telephone-fill"></i> ${esc(tr("Anrufen", "Ara"))}</a>` : ""}
          ${j.contactEmail ? `<a class="chip-btn" href="mailto:${esc(j.contactEmail)}"><i class="bi bi-envelope-fill"></i> E-Mail</a>` : ""}
        </div>
      </div>`;
    }).join("")}`;
}

const baseRenderEmergencyTab = renderEmergencyTab;
renderEmergencyTab = function (container) {
  baseRenderEmergencyTab(container);
  const extra = EMERGENCY_CONTACTS.map((c) => `
    <div class="card-item ext-call-row">
      <div>
        <div class="card-title" style="font-size: 15px;">${esc(currentLanguage === "tr" ? c.nameTr : c.nameDe)}</div>
        <div class="card-subtitle">${esc(currentLanguage === "tr" ? c.descTr : c.descDe)}</div>
      </div>
      <a href="tel:${esc(String(c.number).replace(/\s+/g, ""))}" class="chip-btn active">📞 ${esc(c.number)}</a>
    </div>`).join("");
  container.insertAdjacentHTML("beforeend", `<h3 class="ext-subheading">${esc(tr("Weitere Hilfe", "Diğer Yardım Hatları"))}</h3>${extra}`);
};

/* ---------- Sport & rates ---------- */

const WEATHER_LABELS = [[0, "☀️"], [3, "⛅"], [48, "🌫️"], [67, "🌧️"], [77, "🌨️"], [82, "🌦️"], [99, "⛈️"]];

function weatherIcon(code) {
  return (WEATHER_LABELS.find(([max]) => code <= max) || [0, "🌡️"])[1];
}

function renderSportTab(container) {
  if (!liveData) {
    container.innerHTML = `<div class="card-item" style="padding: 20px; text-align: center;">${esc(liveFailed ? tr("Live-Daten sind gerade nicht erreichbar.", "Canlı veriler şu an alınamıyor.") : tr("Wird geladen…", "Yükleniyor…"))}</div>`;
    return;
  }
  const w = liveData.weather;
  const number = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 4 });
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Sport, Wetter & Kurse", "Spor, Hava & Kurlar"))}</h2>
    ${w ? `
      <div class="card-item" style="padding: 16px;">
        <div class="card-title">${weatherIcon(w.code)} Berlin ${esc(w.temperature)} °C</div>
        <div class="ext-weather">
          ${w.days.map((d) => `<div><span>${esc(new Date(d.date).toLocaleDateString("de-DE", { weekday: "short" }))}</span>${weatherIcon(d.code)}<small>${esc(Math.round(d.max))}° / ${esc(Math.round(d.min))}°</small></div>`).join("")}
        </div>
      </div>` : ""}
    ${liveData.quotes.length ? `
      <h3 class="ext-subheading">${esc(tr("Kurse", "Kurlar"))}</h3>
      <div class="card-item" style="padding: 8px 16px;">
        ${liveData.quotes.map((q) => `<div class="ext-quote"><span>${esc(q.name)}</span><strong>${esc(number.format(q.value))}</strong></div>`).join("")}
      </div>` : ""}
    ${liveData.sport.length ? `<h3 class="ext-subheading">Sport</h3>${liveData.sport.map(renderNewsItem).join("")}` : ""}
    <p class="ext-note">${esc(tr("Aktualisiert", "Güncellendi"))}: ${esc(new Date(liveData.updatedAt).toLocaleTimeString("de-DE"))}</p>`;
}

/* ---------- Deals ---------- */

function renderDealsTab(container) {
  const redeemed = readList(STORAGE_REDEEMED_KEY);
  const items = [
    ...DEALS.map((d) => ({ id: d.id, title: d.title, business: d.businessName, badge: d.discountBadge, code: d.code, valid: d.validUntil, image: d.imageUrl })),
    ...COUPONS.map((c) => ({ id: c.id, title: c.title, business: c.businessName, badge: c.discount, code: c.code, valid: c.validUntil, image: "" })),
  ];
  const active = items.filter((d) => !isExpired(d.valid));
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Gutscheine", "Kuponlar"))}</h2>
    ${active.length ? "" : `<div class="card-item" style="padding: 20px; text-align: center; color: var(--text-muted);">${esc(tr("Aktuell gibt es keine gültigen Gutscheine.", "Şu anda geçerli kupon yok."))}</div>`}
    ${active.map((d) => `
      <div class="card-item">
        ${d.image ? `<img src="${safeUrl(d.image)}" class="card-cover" alt="${esc(d.title)}" loading="lazy">` : ""}
        <div class="card-body">
          <div class="ext-row">
            <div class="card-title">${esc(d.title)}</div>
            <span class="card-tag">${esc(d.badge)}</span>
          </div>
          <div class="card-subtitle">${esc(d.business)} · ${esc(d.valid)}</div>
          <div class="ext-actions">
            <button class="chip-btn ${redeemed.includes(d.id) ? "" : "active"}" onclick="redeemDeal(${jsArg(d.id)}, ${jsArg(d.code)})">
              <i class="bi bi-ticket-perforated-fill"></i> ${redeemed.includes(d.id) ? esc(d.code) : esc(tr("Code anzeigen", "Kodu göster"))}
            </button>
          </div>
        </div>
      </div>`).join("")}`;
}

function redeemDeal(id, code) {
  const list = readList(STORAGE_REDEEMED_KEY);
  if (!list.includes(id)) localStorage.setItem(STORAGE_REDEEMED_KEY, JSON.stringify([...list, id]));
  copyToClipboard(code);
  showToast(tr("Code kopiert!", "Kod kopyalandı!"));
  renderTabContent();
}

/* ---------- Food, favorites, tips, knowledge ---------- */

function renderFoodTab(container) {
  container.innerHTML = `<h2 class="ext-heading">${esc(tr("Gastronomie", "Yeme & İçme"))}</h2>${FOOD_SPOTS.map((f) => renderPlaceCard(f, "food")).join("")}`;
}

function renderFavoritesTab(container) {
  const ids = readList(STORAGE_FAVORITES_KEY);
  const business = BUSINESSES.filter((b) => ids.includes(b.id)).map((b) => renderPlaceCard(b, "business"));
  const food = FOOD_SPOTS.filter((f) => ids.includes(f.id)).map((f) => renderPlaceCard(f, "food"));
  const cards = [...business, ...food];
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Favoriten", "Favoriler"))}</h2>
    ${cards.length ? cards.join("") : `<div class="card-item" style="padding: 20px; text-align: center; color: var(--text-muted);">${esc(tr("Noch keine Favoriten.", "Henüz favori yok."))}</div>`}`;
}

function renderTipsTab(container) {
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Berlin-Tipps", "Berlin Önerileri"))}</h2>
    ${BERLIN_TIPS.map((t) => {
      const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.address || t.name)}`;
      return `
      <div class="card-item" style="padding: 16px;">
        <div class="ext-row">
          <div class="card-title">${esc(t.name)}</div>
          ${t.isFree ? `<span class="card-tag">${esc(tr("Gratis", "Ücretsiz"))}</span>` : ""}
        </div>
        <div class="card-subtitle">📍 ${esc(t.address)}</div>
        <div class="card-desc">${esc(currentLanguage === "tr" ? t.descTr : t.descDe)}</div>
        <div class="ext-actions"><a class="chip-btn" href="${safeUrl(map)}" target="_blank" rel="noopener"><i class="bi bi-geo-alt-fill"></i> ${esc(tr("Route", "Yol tarifi"))}</a></div>
      </div>`;
    }).join("")}`;
}

function renderKnowledgeTab(container) {
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Wissen", "Bilgi"))}</h2>
    ${ARTICLES.map((a) => `
      <div class="card-item" onclick="openArticle(${jsArg(a.id)})" style="cursor: pointer;">
        <img src="${safeUrl(a.imageUrl)}" class="card-cover" alt="${esc(a.title)}" loading="lazy">
        <div class="card-body">
          <div class="card-title">${esc(a.title)}</div>
          <div class="card-subtitle">${esc(a.category)} · ${esc(a.readTimeMinutes)} Min.</div>
          <div class="card-desc">${esc(a.subtitle)}</div>
        </div>
      </div>`).join("")}`;
}

function openArticle(id) {
  const a = ARTICLES.find((x) => x.id === id);
  if (!a) return;
  openDetailModal(`
    <img src="${safeUrl(a.imageUrl)}" class="card-cover" alt="${esc(a.title)}">
    <h3 class="modal-title" style="margin-top: 12px;">${esc(a.title)}</h3>
    <p class="card-desc" style="white-space: pre-line;">${esc(a.fullContent)}</p>`);
}

/* ---------- Kiez-Reporter ---------- */

async function loadReporter() {
  try {
    const res = await fetch("/api/reporter");
    reporterAvailable = res.ok;
    if (res.ok) reporterPosts = (await res.json()).posts;
  } catch (e) {
    reporterAvailable = false;
  }
  if (currentTab === "reporter") renderTabContent();
}

function renderReporterTab(container) {
  if (reporterPosts === null) loadReporter();
  const posts = reporterPosts || [];
  const kiezOptions = KIEZE_FULL.map((k) => `<option value="${esc(k.name)}">${esc(k.name)}</option>`).join("");
  container.innerHTML = `
    <h2 class="ext-heading">Kiez-Reporter</h2>
    <div class="card-item" style="padding: 16px;">
      <div class="form-group"><input id="rep-title" class="form-control" maxlength="120" placeholder="${esc(tr("Titel", "Başlık"))}"></div>
      <div class="form-group"><textarea id="rep-desc" class="form-control" rows="3" maxlength="1000" placeholder="${esc(tr("Was ist in deinem Kiez los?", "Mahallende neler oluyor?"))}"></textarea></div>
      <div class="form-group"><select id="rep-kiez" class="form-control">${kiezOptions}</select></div>
      <div class="form-group"><select id="rep-cat" class="form-control">${["Verkehr", "Baustelle", "Neueröffnung", "Kultur", "Fundbüro"].map((c) => `<option>${c}</option>`).join("")}</select></div>
      <button class="btn-primary" onclick="submitReporterPost()">${esc(tr("Einreichen", "Gönder"))}</button>
      <p class="ext-note">${esc(tr("Beiträge erscheinen nach Prüfung.", "Gönderiler onaydan sonra yayınlanır."))}</p>
    </div>
    ${posts.map((p) => `
      <div class="card-item" style="padding: 16px;">
        <div class="ext-row"><div class="card-title">${esc(p.title)}</div><span class="card-tag">${esc(p.category)}</span></div>
        <div class="card-subtitle">📍 ${esc(p.kiez)} · ${esc(timeAgo(p.created_at))}</div>
        <div class="card-desc">${esc(p.description)}</div>
        <button class="chip-btn" onclick="upvoteReporter(${jsArg(p.id)})">👍 ${esc(p.upvotes)}</button>
      </div>`).join("")}
    ${posts.length ? "" : `<div class="card-item" style="padding: 20px; text-align: center; color: var(--text-muted);">${esc(tr("Noch keine Beiträge.", "Henüz gönderi yok."))}</div>`}`;
}

async function submitReporterPost() {
  const body = {
    title: document.getElementById("rep-title").value.trim(),
    description: document.getElementById("rep-desc").value.trim(),
    kiez: document.getElementById("rep-kiez").value,
    category: document.getElementById("rep-cat").value,
  };
  if (!body.title || !body.description) {
    showToast(tr("Bitte Titel und Text ausfüllen.", "Lütfen başlık ve metni doldurun."));
    return;
  }
  try {
    const res = await fetch("/api/reporter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    showToast(res.status === 201 ? tr("Danke! Dein Beitrag wird geprüft.", "Teşekkürler! Gönderiniz incelenecek.") : tr("Senden ist gerade nicht möglich.", "Şu anda gönderilemiyor."));
    if (res.status === 201) renderTabContent();
  } catch (e) {
    showToast(tr("Keine Verbindung.", "Bağlantı yok."));
  }
}

async function upvoteReporter(id) {
  await fetch("/api/reporter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ upvote: id }) }).catch(() => {});
  loadReporter();
}

/* ---------- Business portal & profile ---------- */

function renderPortalTab(container) {
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("B2B & Werbung", "B2B & Reklam"))}</h2>
    ${PRICING_PACKAGES.map((p) => `
      <div class="card-item" style="padding: 16px;">
        <div class="ext-row"><div class="card-title">${esc(p.name)}</div>${p.isPopular ? `<span class="card-tag">${esc(tr("Beliebt", "Popüler"))}</span>` : ""}</div>
        <div class="card-subtitle">${esc(p.priceMonthly)}</div>
        <ul class="ext-list">${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      </div>`).join("")}
    <h3 class="ext-subheading">${esc(tr("Zusatzoptionen", "Ek Seçenekler"))}</h3>
    ${ADD_ONS.map((a) => `
      <div class="card-item" style="padding: 14px;">
        <div class="ext-row"><div class="card-title" style="font-size: 15px;">${esc(a.title)}</div><span class="card-tag">${esc(a.pricePerWeek)}</span></div>
        <div class="card-desc">${esc(a.description)}</div>
      </div>`).join("")}
    <a class="btn-primary ext-cta" href="https://wa.me/4915126509586" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> ${esc(tr("Anfrage per WhatsApp", "WhatsApp ile başvur"))}</a>`;
}

function renderProfileTab(container) {
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Profil & Einstellungen", "Profil & Ayarlar"))}</h2>
    <div class="card-item ext-call-row">
      <div class="card-title" style="font-size: 15px;">${esc(tr("Sprache", "Dil"))}</div>
      <button class="chip-btn active" onclick="document.getElementById('lang-toggle-btn').click()">${esc(currentLanguage.toUpperCase())}</button>
    </div>
    <div class="card-item ext-call-row">
      <div class="card-title" style="font-size: 15px;">${esc(tr("Favoriten", "Favoriler"))}</div>
      <button class="chip-btn" onclick="switchTab('favorites')">${esc(readList(STORAGE_FAVORITES_KEY).length)}</button>
    </div>
    <div class="card-item" style="padding: 8px 16px;">
      <a class="ext-quote" href="impressum.html"><span>Impressum</span><i class="bi bi-chevron-right"></i></a>
      <a class="ext-quote" href="datenschutz.html"><span>${esc(tr("Datenschutz", "Gizlilik"))}</span><i class="bi bi-chevron-right"></i></a>
      <a class="ext-quote" href="admin.html"><span>Admin</span><i class="bi bi-chevron-right"></i></a>
    </div>`;
}

/* ---------- Search across all content ---------- */

const baseHandleGlobalSearch = handleGlobalSearch;
handleGlobalSearch = function (term) {
  baseHandleGlobalSearch(term);
  if (!term) return;
  const content = document.getElementById("main-tab-content");
  if (!content) return;
  const safeTerm = esc(term);
  const heading = content.querySelector("h2");
  if (heading) heading.textContent = `${tr("Suchergebnisse", "Arama Sonuçları")}: "${term}"`;
  const hit = (p) => [p.name, p.category, p.cuisine, p.kiezName, p.address].some((v) => String(v ?? "").toLowerCase().includes(term));
  const places = [...BUSINESSES.filter(hit).map((b) => renderPlaceCard(b, "business")), ...FOOD_SPOTS.filter(hit).map((f) => renderPlaceCard(f, "food"))];
  if (places.length) {
    content.querySelector(".card-item")?.textContent.length && [...content.children].forEach((c) => {
      if (c.tagName === "DIV" && c.textContent.includes("Sonuç bulunamadı")) c.remove();
    });
    content.insertAdjacentHTML("beforeend", `<h3 class="ext-subheading">${esc(tr("Betriebe", "İşletmeler"))} (${places.length})</h3>${places.join("")}`);
  }
  void safeTerm;
};

/* ---------- Hub additions & start ---------- */

const baseOpenHub = openHamburgerHubModal;
openHamburgerHubModal = function () {
  baseOpenHub();
  const grid = document.querySelector(".hub-menu-grid");
  if (grid) {
    grid.insertAdjacentHTML("beforeend", `
      <div class="hub-menu-tile" onclick="switchTab('more'); closeHamburgerHubModal();">
        <div class="tile-icon-box blue"><i class="bi bi-grid-fill"></i></div>
        <div class="tile-label">${esc(tr("Alle Bereiche", "Tüm Bölümler"))}</div>
        <div class="tile-desc">Gutscheine, Reporter, B2B</div>
      </div>`);
  }
};

currentLanguage = localStorage.getItem(STORAGE_LANGUAGE_KEY) || "de";

document.addEventListener("DOMContentLoaded", () => {
  const langBtn = document.getElementById("lang-toggle-btn");
  if (langBtn) langBtn.innerText = currentLanguage.toUpperCase();
  updateStaticLabels();
  refreshLive();
  loadServerStories();
  setInterval(refreshLive, LIVE_REFRESH_MS);
  setInterval(() => {
    sponsorIndex += 1;
    if (currentTab === "home" && !document.getElementById("global-search-input")?.value) renderTabContent();
  }, 30000);
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
});
