/**
 * My Kiez Berlin - remaining APK functions for the web.
 * Loaded after app-extended.js. EXTRA_TABS entries are replaced here because
 * app-extended.js stores direct function references.
 */

const STORAGE_DARK_KEY = "mykiez_dark_v1";
const STORAGE_NOTIFY_KEY = "mykiez_notifications_v1";
const STORAGE_LOCATION_KEY = "mykiez_location_v1";
const LANGUAGES = ["de", "tr", "en"];
const SHARED_REFRESH_MS = 60000;
const LANGUAGE_FLAGS = { de: "🇩🇪", tr: "🇹🇷", en: "🇬🇧" };
const LEAFLET_BASE = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/";
const BERLIN_CENTER = [52.52, 13.405];
const STORY_KINDS = ["news", "traffic", "event", "warn", "info", "politics"];

const EN_TEXT = {
  "Betriebe": "Businesses", "Mehr": "More", "Gutscheine": "Coupons", "Sport & Kurse": "Sport & Rates",
  "Alle Bereiche": "All sections", "Kieze": "Neighbourhoods", "Gastronomie": "Food & Drink", "Events": "Events",
  "Kiez-Jobs": "Local jobs", "Berlin-Tipps": "Berlin tips", "Wissen": "Knowledge", "Notruf": "Emergency",
  "Favoriten": "Favourites", "B2B & Werbung": "B2B & Advertising", "Profil": "Profile", "Karte": "Map",
  "Aktuelle Schlagzeilen": "Latest headlines", "Details ansehen →": "View details →", "Anrufen": "Call",
  "Route": "Directions", "Einwohner": "Population", "Miete": "Rent", "Parks": "Parks", "Beliebte Orte": "Popular places",
  "Polizei": "Police", "Dringend": "Urgent", "Weitere Hilfe": "More help", "Sport, Wetter & Kurse": "Sport, weather & rates",
  "Kurse": "Rates", "Aktualisiert": "Updated", "Code anzeigen": "Show code", "Code kopiert!": "Code copied!",
  "Noch keine Favoriten.": "No favourites yet.", "Gratis": "Free", "Titel": "Title", "Einreichen": "Submit",
  "Was ist in deinem Kiez los?": "What's happening in your neighbourhood?", "Beiträge erscheinen nach Prüfung.": "Posts appear after review.",
  "Noch keine Beiträge.": "No posts yet.", "Sprache": "Language", "Profil & Einstellungen": "Profile & settings",
  "Datenschutz": "Privacy", "Beliebt": "Popular", "Zusatzoptionen": "Add-ons", "Anfrage per WhatsApp": "Enquire via WhatsApp",
  "Suchergebnisse": "Search results", "Wird geladen…": "Loading…", "Live-Daten werden geladen…": "Loading live data…",
  "Live-Daten sind gerade nicht erreichbar.": "Live data is unavailable right now.",
  "Karte, Liste oder Kacheln": "Map, list or cards", "Alle Kieze": "All neighbourhoods", "Betrieb eintragen": "Add business",
  "Event einreichen": "Submit event", "Job einreichen": "Submit job", "Senden": "Send", "Name": "Name", "Kategorie": "Category",
  "Adresse": "Address", "Telefon": "Phone", "Webseite": "Website", "Öffnungszeiten": "Opening hours", "Beschreibung": "Description",
  "Datum": "Date", "Uhrzeit": "Time", "Preis": "Price", "Firma": "Company", "Art": "Type", "Gehalt": "Salary",
  "Danke! Wird vor der Veröffentlichung geprüft.": "Thanks! It will be reviewed before publishing.",
  "Senden ist gerade nicht möglich.": "Sending is not possible right now.", "Bitte Pflichtfelder ausfüllen.": "Please fill in the required fields.",
  "Abgelaufen": "Expired", "Einlösen": "Redeem", "Monatlich": "Monthly", "Jährlich": "Yearly", "Paket wählen": "Choose package",
  "Dunkelmodus": "Dark mode", "Benachrichtigungen": "Notifications", "Standort": "Location", "Kommentare": "Comments",
  "Kommentar schreiben": "Write a comment", "Story-Art": "Story type", "Laufzeit": "Duration", "Anderer Kiez": "Other neighbourhood",
  "Speichern": "Save", "Offizielle Netzpläne": "Official network maps", "Im Ticker suchen": "Search the ticker",
  "Kiez-Quiz starten": "Start Kiez quiz", "Welcher Kiez passt zu dir?": "Which neighbourhood suits you?", "Berliner Vereine": "Berlin clubs",
  "Ansicht": "View", "Frühstück & Café": "Breakfast & Café", "Essen": "Food", "Hier ist noch kein Betrieb eingetragen.": "No business listed here yet.", "Betrieb kostenlos eintragen": "List your business for free", "Betriebe in Berlin": "Businesses in Berlin", "Alle Betriebe": "All businesses", "Werbung für deinen Betrieb": "Advertise your business", "Wirtschaft & Börse": "Business & markets", "Wetter": "Weather", "Gefühlt": "Feels like", "Punkte": "points", "Letztes Spiel": "Last match", "Nächstes Spiel": "Next match", "Spieltag": "Matchday", "Sportnachrichten": "Sports news", "Aktuell gibt es keine gültigen Gutscheine.": "No valid coupons right now.", "Kacheln": "Cards", "Liste": "List", "Alle": "All", "Deine Story veröffentlichen": "Publish your story",
};

I18N.en = {
  ...I18N.de,
  shareStory: "+ Your story", yourStory: "Your story", navHome: "Home", navKieze: "Neighbourhoods", navEvents: "Events",
  navEmergency: "Emergency", searchPlaceholder: "Search neighbourhood, shop, event or street...", all: "All",
  officialSource: "Official source", shareAlertBtn: "Share (APK)", dismissBtn: "Close", lastUpdate: "Live updated",
  bulletinTitle: "🚨 Berlin live ticker", bulletinSubtitle: "Real-time reports from S-Bahn Berlin, BVG, fire brigade and police.",
  nextQuestion: "Next question", seeResults: "See results", restart: "Play again", congrats: "Congratulations! 🎉",
  shareFriend: "Share with friends", shareFriendSub: "Direct APK download link", copyBtn: "Copy", downloadBtn: "Download",
};

function nextLanguage(language) {
  return LANGUAGES[(LANGUAGES.indexOf(language) + 1) % LANGUAGES.length];
}

function localized(item, base) {
  const suffix = { tr: "Tr", en: "En" }[currentLanguage] || "De";
  return item[base + suffix] || item[base + "De"] || "";
}

function setting(key) {
  return localStorage.getItem(key) === "1";
}

function chips(options, active, handler) {
  return `<div class="category-chips-scroll ext-chips">${options.map(([value, label]) => `<button class="chip-btn ${value === active ? "active" : ""}" onclick="${handler}(${jsArg(value)})">${esc(label)}</button>`).join("")}</div>`;
}

function uniqueOptions(values) {
  return [["all", tr("Alle", "Tümü")], ...[...new Set(values.filter(Boolean))].map((v) => [v, v])];
}

const filters = { kiez: "all", cuisine: "all", event: "all", knowledge: "all", tips: "all", favorites: "all", emergency: "all", ticker: "" };
let businessViewMode = "card";
let billingYearly = false;
let userLocation = null;
let lastSubmissions = "";

function setFilter(name, value) {
  filters[name] = value;
  renderTabContent();
}

/* ---------- Shared entries from D1 ---------- */

async function loadSubmissions() {
  try {
    const res = await fetch("/api/submissions");
    if (!res.ok) return;
    const text = await res.text();
    if (text === lastSubmissions) return;
    lastSubmissions = text;
    const { items } = JSON.parse(text);
    [BUSINESSES, EVENTS_FULL, JOBS].forEach((list) => {
      const kept = list.filter((entry) => !entry.fromServer);
      list.length = 0;
      list.push(...kept);
    });
    items.forEach((raw) => {
      const i = { ...raw, fromServer: true };
      if (i.type === "business") {
        BUSINESSES.push({ ...i, imageUrl: "assets/images/hero_berlin.jpg", rating: 0, reviewsCount: 0, distance: "" });
      } else if (i.type === "event") {
        EVENTS_FULL.push({ ...i, dayLabel: i.dateText, dateNum: "", monthLabel: "", imageUrl: "" });
      } else if (i.type === "job") {
        JOBS.push(i);
      }
    });
    refreshViewIfIdle();
  } catch (e) {}
}

// Never redraw while someone is typing or reading a detail window.
function refreshViewIfIdle() {
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  const modalOpen = document.getElementById("ext-detail-modal") || document.getElementById("create-story-modal");
  if (!typing && !modalOpen) renderTabContent();
}

async function refreshSharedContent() {
  if (document.hidden) return;
  await Promise.all([loadServerStories(), loadSubmissions(), currentTab === "reporter" ? loadReporter() : null]);
}

async function sendSubmission(type, data) {
  try {
    const res = await fetch("/api/submissions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type, ...data }) });
    if (res.status === 201) {
      closeDetailModal();
      showToast(tr("Danke! Wird vor der Veröffentlichung geprüft.", "Teşekkürler! Yayından önce incelenecek."));
      return;
    }
    showToast(tr("Senden ist gerade nicht möglich.", "Şu anda gönderilemiyor."));
  } catch (e) {
    showToast(tr("Senden ist gerade nicht möglich.", "Şu anda gönderilemiyor."));
  }
}

function openFormModal(title, type, fields, required) {
  const inputs = fields.map(([key, label, multi]) => multi
    ? `<div class="form-group"><label class="form-label">${esc(label)}</label><textarea id="sub-${key}" class="form-control" rows="3"></textarea></div>`
    : `<div class="form-group"><label class="form-label">${esc(label)}</label><input id="sub-${key}" class="form-control"></div>`).join("");
  openDetailModal(`<h3 class="modal-title">${esc(title)}</h3>${inputs}<button class="btn-primary" onclick="submitForm(${jsArg(type)}, ${jsArg(fields.map((f) => f[0]).join(","))}, ${jsArg(required)})">${esc(tr("Senden", "Gönder"))}</button>`);
}

function submitForm(type, keys, required) {
  const data = {};
  keys.split(",").forEach((k) => {
    data[k] = document.getElementById("sub-" + k).value.trim();
  });
  if (!data[required]) {
    showToast(tr("Bitte Pflichtfelder ausfüllen.", "Lütfen zorunlu alanları doldurun."));
    return;
  }
  sendSubmission(type, data);
}

function openBusinessForm() {
  openFormModal(tr("Betrieb eintragen", "İşletme ekle"), "business", [
    ["name", tr("Name", "Ad")], ["category", tr("Kategorie", "Kategori")], ["kiezName", "Kiez"], ["address", tr("Adresse", "Adres")],
    ["phone", tr("Telefon", "Telefon")], ["whatsapp", "WhatsApp"], ["website", tr("Webseite", "Web sitesi")],
    ["openingHours", tr("Öffnungszeiten", "Çalışma saatleri")], ["description", tr("Beschreibung", "Açıklama"), true],
  ], "name");
}

function openEventForm() {
  openFormModal(tr("Event einreichen", "Etkinlik gönder"), "event", [
    ["title", tr("Titel", "Başlık")], ["dateText", tr("Datum", "Tarih")], ["time", tr("Uhrzeit", "Saat")], ["kiezName", "Kiez"],
    ["price", tr("Preis", "Fiyat")], ["category", tr("Kategorie", "Kategori")], ["officialUrl", tr("Webseite", "Web sitesi")],
    ["description", tr("Beschreibung", "Açıklama"), true],
  ], "title");
}

function openJobForm() {
  openFormModal(tr("Job einreichen", "İş ilanı gönder"), "job", [
    ["title", tr("Titel", "Başlık")], ["company", tr("Firma", "Firma")], ["kiez", "Kiez"], ["jobType", tr("Art", "Tür")],
    ["salary", tr("Gehalt", "Maaş")], ["contactPhone", tr("Telefon", "Telefon")], ["contactEmail", "E-Mail"],
    ["description", tr("Beschreibung", "Açıklama"), true],
  ], "title");
}

/* ---------- Home and businesses ---------- */

let slideIndex = 0;

function mansetHtml() {
  const items = (liveData?.news || []).filter((n) => n.image);
  if (!items.length) return "";
  const n = items[slideIndex % items.length];
  return `
    <a class="ext-manset" href="${safeUrl(n.link)}" target="_blank" rel="noopener">
      <img src="${safeUrl(n.image)}" alt="" loading="lazy">
      <div><span>${esc(n.source)} · ${esc(timeAgo(n.publishedAt))}</span><strong>${esc(n.title)}</strong></div>
    </a>`;
}

function quickButtons() {
  const items = [
    ["food", "bi-egg-fried", tr("Gastronomie", "Yeme & İçme")], ["events", "bi-calendar-event-fill", tr("Events", "Etkinlikler")],
    ["jobs", "bi-briefcase-fill", tr("Kiez-Jobs", "İş İlanları")], ["emergency", "bi-telephone-fill", tr("Notruf", "Acil")],
    ["map", "bi-map-fill", tr("Karte", "Harita")], ["quiz", "bi-trophy-fill", "Quiz"],
  ];
  return `<div class="ext-quick">${items.map(([tab, icon, label]) => `<button onclick="switchTab('${tab}')"><i class="bi ${icon}"></i><span>${esc(label)}</span></button>`).join("")}</div>`;
}

function kiezScroller() {
  return `
    <h3 class="ext-subheading">${esc(tr("Kieze", "Kiezler"))}</h3>
    <div class="ext-kiez-scroll">${KIEZE_FULL.map((k) => `
      <button onclick="openKiezDetail(${jsArg(k.id)})"><img src="${safeUrl(k.imageUrl)}" alt="" loading="lazy"><span>${esc(k.name)}</span></button>`).join("")}
    </div>`;
}

// Businesses have no coordinates in the app data, so they sit near their Kiez centre.
function placeCoords(place) {
  if (place.lat && place.lng) return { lat: place.lat, lng: place.lng };
  const kiez = KIEZE_FULL.find((k) => k.name === place.kiezName) || { lat: BERLIN_CENTER[0], lng: BERLIN_CENTER[1] };
  const seed = [...String(place.id)].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return { lat: kiez.lat + ((seed % 7) - 3) * 0.0012, lng: kiez.lng + ((seed % 11) - 5) * 0.0012 };
}

function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  const y = (b.lat - a.lat) * rad;
  return Math.sqrt(x * x + y * y) * 6371;
}

function visibleBusinesses() {
  const list = BUSINESSES.filter((b) =>
    (activeBusinessCategory === "all" || businessCategory(b) === activeBusinessCategory) &&
    (filters.kiez === "all" || b.kiezName === filters.kiez));
  if (userLocation) list.sort((a, b) => distanceKm(userLocation, placeCoords(a)) - distanceKm(userLocation, placeCoords(b)));
  return list;
}

function setBusinessView(mode) {
  businessViewMode = mode;
  renderTabContent();
}

function renderCompactBusiness(b) {
  return `
    <div class="card-item ext-call-row" onclick="openPlaceDetail(${jsArg(b.id)})" style="cursor: pointer;">
      <div>
        <div class="card-title" style="font-size: 15px;">${esc(b.name)}</div>
        <div class="card-subtitle">📍 ${esc(b.kiezName)} · ${esc(b.category)}</div>
      </div>
      <i class="bi bi-chevron-right"></i>
    </div>`;
}

function renderHomeTab(container) {
  const list = visibleBusinesses();
  const views = [["card", "bi-grid-fill", tr("Kacheln", "Kart")], ["list", "bi-list-ul", tr("Liste", "Liste")], ["map", "bi-map-fill", tr("Karte", "Harita")]];
  let content = list.map((b) => renderPlaceCard(b, "business")).join("");
  if (businessViewMode === "list") content = list.map(renderCompactBusiness).join("");
  if (businessViewMode === "map") content = `<div id="ext-map" class="ext-map"></div>`;

  container.innerHTML = `
    ${mansetHtml()}
    ${renderSponsorCard()}
    ${quickButtons()}
    ${kiezScroller()}
    <div class="ext-row" style="margin-top: 16px; align-items: center;">
      <h3 class="ext-subheading" style="margin: 0;">${esc(tr("Betriebe", "İşletmeler"))} (${list.length})</h3>
      <button class="chip-btn active" onclick="openBusinessForm()"><i class="bi bi-plus-lg"></i> ${esc(tr("Betrieb eintragen", "İşletme ekle"))}</button>
    </div>
    ${chips([["all", tr("Alle", "Tümü")], ...[...new Set(BUSINESSES.map(businessCategory))].map((c) => [c, c])], activeBusinessCategory, "setBusinessCategory")}
    ${chips([["all", tr("Alle Kieze", "Tüm Kiezler")], ...[...new Set(BUSINESSES.map((b) => b.kiezName))].map((k) => [k, k])], filters.kiez, "setKiezFilter")}
    <div class="ext-views">${views.map(([mode, icon, label]) => `<button class="${businessViewMode === mode ? "on" : ""}" onclick="setBusinessView('${mode}')"><i class="bi ${icon}"></i> ${esc(label)}</button>`).join("")}</div>
    ${content}`;
  if (businessViewMode === "map") showMap(list);
}

function setKiezFilter(value) {
  setFilter("kiez", value);
}

/* ---------- Map ---------- */

function loadLeaflet() {
  if (window.L) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = LEAFLET_BASE + "leaflet.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = LEAFLET_BASE + "leaflet.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function showMap(places) {
  try {
    await loadLeaflet();
  } catch (e) {
    const box = document.getElementById("ext-map");
    if (box) box.textContent = tr("Live-Daten sind gerade nicht erreichbar.", "Canlı veriler şu an alınamıyor.");
    return;
  }
  const box = document.getElementById("ext-map");
  if (!box) return;
  const map = L.map(box).setView(BERLIN_CENTER, 11);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
  places.forEach((p) => {
    const { lat, lng } = placeCoords(p);
    L.circleMarker([lat, lng], { radius: 8, color: "#E30613", fillOpacity: 0.85 })
      .addTo(map)
      .bindTooltip(esc(p.name))
      .on("click", () => (p.category ? openPlaceDetail(p.id) : openKiezDetail(p.id)));
  });
}

function renderMapTab(container) {
  const cards = [
    ["S+U-Bahn Netz", "https://www.bvg.de/dam/jcr:b2bf0dfc-8db5-48fa-bb64-cba0ec99fa28/S+U-Bahn-Netz.pdf"],
    ["S-Bahn Liniennetz", "https://sbahn.berlin/liniennetz/"],
    ["BVG Liniennetz", "https://www.bvg.de/de/verbindungen/liniennetz"],
    ["BVG Störungen", "https://www.bvg.de/de/verbindungen/stoerungsmeldungen"],
    ["VBB Liniennetze", "https://www.vbb.de/fahrinfo/liniennetze/"],
  ];
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Karte", "Harita"))}</h2>
    <div id="ext-map" class="ext-map"></div>
    <h3 class="ext-subheading">${esc(tr("Offizielle Netzpläne", "Resmi Hat Haritaları"))}</h3>
    ${cards.map(([name, url]) => `<a class="ext-news" href="${safeUrl(url)}" target="_blank" rel="noopener"><div class="ext-news-title">${esc(name)} ↗</div></a>`).join("")}`;
  showMap(KIEZE_FULL);
}

/* ---------- Filtered lists ---------- */

const baseFoodTab = EXTRA_TABS.food;
EXTRA_TABS.food = function (container) {
  const cuisines = uniqueOptions(FOOD_SPOTS.map((f) => String(f.cuisine).split("·")[0].trim()));
  const list = FOOD_SPOTS.filter((f) => filters.cuisine === "all" || String(f.cuisine).startsWith(filters.cuisine));
  container.innerHTML = `<h2 class="ext-heading">${esc(tr("Gastronomie", "Yeme & İçme"))}</h2>
    ${chips(cuisines, filters.cuisine, "setCuisineFilter")}${list.map((f) => renderPlaceCard(f, "food")).join("")}`;
};
void baseFoodTab;

function setCuisineFilter(value) {
  setFilter("cuisine", value);
}

const baseEventsTab = renderEventsTab;
renderEventsTab = function (container) {
  const all = EVENTS_FULL.slice();
  const options = [["all", tr("Alle", "Tümü")], ["free", tr("Gratis", "Ücretsiz")], ...[...new Set(all.map((e) => e.category).filter(Boolean))].map((c) => [c, c])];
  EVENTS_FULL.length = 0;
  EVENTS_FULL.push(...all.filter((e) => filters.event === "all" || (filters.event === "free" ? e.isFree : e.category === filters.event)));
  baseEventsTab(container);
  EVENTS_FULL.length = 0;
  EVENTS_FULL.push(...all);
  container.querySelector(".ext-heading").insertAdjacentHTML("afterend", `
    <button class="chip-btn active" style="margin-bottom: 10px;" onclick="openEventForm()"><i class="bi bi-plus-lg"></i> ${esc(tr("Event einreichen", "Etkinlik gönder"))}</button>
    ${chips(options, filters.event, "setEventFilter")}`);
};

function setEventFilter(value) {
  setFilter("event", value);
}

const baseJobsTab = renderJobsTab;
renderJobsTab = function (container) {
  baseJobsTab(container);
  container.querySelector(".ext-heading").insertAdjacentHTML("afterend", `<button class="chip-btn active" style="margin-bottom: 10px;" onclick="openJobForm()"><i class="bi bi-plus-lg"></i> ${esc(tr("Job einreichen", "İş ilanı gönder"))}</button>`);
};

EXTRA_TABS.knowledge = function (container) {
  const shown = ARTICLES.filter((a) => filters.knowledge === "all" || a.category === filters.knowledge);
  const all = ARTICLES.slice();
  ARTICLES.length = 0;
  ARTICLES.push(...shown);
  renderKnowledgeTab(container);
  ARTICLES.length = 0;
  ARTICLES.push(...all);
  container.querySelector(".ext-heading").insertAdjacentHTML("afterend", chips(uniqueOptions(all.map((a) => a.category)), filters.knowledge, "setKnowledgeFilter"));
};

function setKnowledgeFilter(value) {
  setFilter("knowledge", value);
}

EXTRA_TABS.tips = function (container) {
  const all = BERLIN_TIPS.slice();
  const shown = all.filter((t) => filters.tips === "all" || (t.categories || []).includes(filters.tips));
  BERLIN_TIPS.length = 0;
  BERLIN_TIPS.push(...shown);
  renderTipsTab(container);
  BERLIN_TIPS.length = 0;
  BERLIN_TIPS.push(...all);
  container.querySelector(".ext-heading").insertAdjacentHTML("afterend", chips(uniqueOptions(all.flatMap((t) => t.categories || [])), filters.tips, "setTipsFilter"));
  container.querySelectorAll(".card-desc").forEach((el, i) => {
    if (shown[i]) el.textContent = localized(shown[i], "desc");
  });
};

function setTipsFilter(value) {
  setFilter("tips", value);
}

const baseEmergencyTab = renderEmergencyTab;
renderEmergencyTab = function (container) {
  const all = EMERGENCY_CONTACTS.slice();
  EMERGENCY_CONTACTS.length = 0;
  EMERGENCY_CONTACTS.push(...all.filter((c) => filters.emergency === "all" || c.category === filters.emergency));
  baseEmergencyTab(container);
  EMERGENCY_CONTACTS.length = 0;
  EMERGENCY_CONTACTS.push(...all);
  const heading = [...container.querySelectorAll(".ext-subheading")].pop();
  if (heading) heading.insertAdjacentHTML("afterend", chips(uniqueOptions(all.map((c) => c.category)), filters.emergency, "setEmergencyFilter"));
};

function setEmergencyFilter(value) {
  setFilter("emergency", value);
}

/* ---------- Favorites ---------- */

EXTRA_TABS.favorites = function (container) {
  const ids = readList(STORAGE_FAVORITES_KEY);
  const groups = {
    business: BUSINESSES.filter((b) => ids.includes(b.id)).map((b) => renderPlaceCard(b, "business")),
    food: FOOD_SPOTS.filter((f) => ids.includes(f.id)).map((f) => renderPlaceCard(f, "food")),
    kiez: KIEZE_FULL.filter((k) => ids.includes(k.id)).map((k) => `<div class="card-item ext-call-row"><div class="card-title" onclick="openKiezDetail(${jsArg(k.id)})">${esc(k.name)}</div><button class="ext-heart on" onclick="toggleFavorite(${jsArg(k.id)})"><i class="bi bi-heart-fill"></i></button></div>`),
    event: EVENTS_FULL.filter((e) => ids.includes(e.id)).map((e) => `<div class="card-item ext-call-row"><div class="card-title">${esc(e.title)}</div><button class="ext-heart on" onclick="toggleFavorite(${jsArg(e.id)})"><i class="bi bi-heart-fill"></i></button></div>`),
  };
  const options = [["all", tr("Alle", "Tümü")], ["business", tr("Betriebe", "İşletmeler")], ["food", tr("Gastronomie", "Yeme & İçme")], ["kiez", tr("Kieze", "Kiezler")], ["event", tr("Events", "Etkinlikler")]];
  const cards = filters.favorites === "all" ? Object.values(groups).flat() : groups[filters.favorites];
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Favoriten", "Favoriler"))}</h2>
    ${chips(options, filters.favorites, "setFavoritesFilter")}
    ${cards.length ? cards.join("") : `<div class="card-item" style="padding: 20px; text-align: center; color: var(--text-muted);">${esc(tr("Noch keine Favoriten.", "Henüz favori yok."))}</div>`}`;
};

function setFavoritesFilter(value) {
  setFilter("favorites", value);
}

function placeRow(place) {
  return `<button class="ext-place" onclick="openPlaceDetail(${jsArg(place.id)})"><strong>${esc(place.name)}</strong><span>${esc(place.category || place.cuisine || "")}</span></button>`;
}

function kiezPlacesHtml(kiez) {
  const businesses = BUSINESSES.filter((b) => b.kiezName === kiez.name);
  const food = FOOD_SPOTS.filter((f) => f.kiezName === kiez.name);
  const breakfast = [...food, ...businesses].filter((p) => /früh|brunch|café|cafe|bäckerei|kaffee/i.test(`${p.cuisine || ""} ${p.category || ""} ${p.name}`));
  const eating = food.filter((f) => !breakfast.includes(f));
  const others = businesses.filter((b) => !breakfast.includes(b));
  const section = (title, list) => (list.length ? `<h4 class="ext-subheading">${esc(title)}</h4>${list.map(placeRow).join("")}` : "");
  const empty = !businesses.length && !food.length;
  return `
    ${section(tr("Frühstück & Café", "Kahvaltı & Kafe"), breakfast)}
    ${section(tr("Essen", "Yemek"), eating)}
    ${section(tr("Betriebe", "İşletmeler"), others)}
    ${empty ? `<p class="ext-note">${esc(tr("Hier ist noch kein Betrieb eingetragen.", "Burada henüz işletme yok."))}</p>` : ""}
    <button class="chip-btn active" style="margin-top: 10px;" onclick="openBusinessForm()"><i class="bi bi-plus-lg"></i> ${esc(tr("Betrieb kostenlos eintragen", "İşletmeni ücretsiz ekle"))}</button>
    <div style="margin-top: 12px;">${renderSponsorCard()}</div>`;
}

function kiezSourcesHtml(k) {
  const photos = (k.impressionImages || []).map((url) => `<img src="${safeUrl(url)}" alt="" loading="lazy">`).join("");
  const credits = (k.photoCredits || []).map((c) => `<a href="${safeUrl(c.page)}" target="_blank" rel="noopener">${esc(c.artist || c.title)}</a> (${esc(c.license)})`).join(" · ");
  const links = [];
  if (k.sources?.population) links.push(`<a href="${safeUrl(k.sources.population)}" target="_blank" rel="noopener">${esc(tr("Einwohner", "Nüfus"))}: Amt für Statistik, ${esc(k.populationDate)}</a>`);
  if (k.sources?.buergeramt) links.push(`<a href="${safeUrl(k.sources.buergeramt)}" target="_blank" rel="noopener">service.berlin.de</a>`);
  if (k.sources?.polizei) links.push(`<a href="${safeUrl(k.sources.polizei)}" target="_blank" rel="noopener">Polizei Berlin</a>`);
  return `
    ${photos ? `<div class="ext-gallery">${photos}</div>` : ""}
    ${credits ? `<p class="ext-note">📷 ${credits} · Wikimedia Commons</p>` : ""}
    ${links.length ? `<p class="ext-note">${tr("Quellen", "Kaynaklar")}: ${links.join(" · ")}</p>` : ""}`;
}

const baseOpenKiezDetail = openKiezDetail;
openKiezDetail = function (id) {
  baseOpenKiezDetail(id);
  const kiez = KIEZE_FULL.find((k) => k.id === id);
  if (kiez) {
    const phone = kiez.policePhone ? `<a class="chip-btn" href="tel:${esc(String(kiez.policePhone).replace(/\s+/g, ""))}"><i class="bi bi-telephone-fill"></i> ${esc(tr("Polizei", "Polis"))}</a>` : "";
    document.querySelector("#ext-detail-modal .ext-actions")?.insertAdjacentHTML("beforeend", phone);
    document.querySelector("#ext-detail-modal .ext-actions")?.insertAdjacentHTML("afterend", kiezPlacesHtml(kiez) + kiezSourcesHtml(kiez));
  }
  document.querySelector("#ext-detail-modal .ext-actions")?.insertAdjacentHTML("beforeend", `<button class="ext-heart ${isFavorite(id) ? "on" : ""}" onclick="toggleFavorite(${jsArg(id)}); openKiezDetail(${jsArg(id)});"><i class="bi bi-heart-fill"></i></button>`);
};

/* ---------- Deals ---------- */

function isExpired(validText) {
  const m = String(validText).match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return Boolean(m) && new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 23, 59).getTime() < Date.now();
}

function redeemDeal(id, code) {
  const deal = [...DEALS, ...COUPONS].find((d) => d.id === id) || {};
  const list = readList(STORAGE_REDEEMED_KEY);
  if (!list.includes(id)) localStorage.setItem(STORAGE_REDEEMED_KEY, JSON.stringify([...list, id]));
  copyToClipboard(code);
  openDetailModal(`
    <h3 class="modal-title">${esc(deal.title)}</h3>
    <div class="card-subtitle">${esc(deal.businessName)} · ${esc(deal.validUntil)}${isExpired(deal.validUntil) ? ` · ${esc(tr("Abgelaufen", "Süresi doldu"))}` : ""}</div>
    ${deal.description ? `<p class="card-desc">${esc(deal.description)}</p>` : ""}
    <div class="ext-code">${esc(code)}</div>
    <p class="ext-note">${esc(tr("Code kopiert!", "Kod kopyalandı!"))}</p>
    ${contactButtons({ address: deal.address, name: deal.businessName, whatsapp: deal.whatsapp })}`);
  renderTabContent();
}

/* ---------- Ticker search ---------- */

const baseBulletin = renderBulletinTab;
renderBulletinTab = function (container) {
  baseBulletin(container);
  const chipsRow = container.querySelector(".category-chips-scroll");
  chipsRow?.insertAdjacentHTML("afterend", `<div class="search-input-box" style="margin-bottom: 12px;"><i class="bi bi-search"></i><input id="ticker-search" value="${esc(filters.ticker)}" placeholder="${esc(tr("Im Ticker suchen", "Ticker'da ara"))}" oninput="filterTicker(this.value)"></div>`);
  filterTicker(filters.ticker);
};

function filterTicker(term) {
  filters.ticker = term;
  const needle = term.toLowerCase();
  document.querySelectorAll(".bulletin-card").forEach((card) => {
    card.style.display = card.textContent.toLowerCase().includes(needle) ? "" : "none";
  });
}

/* ---------- Sport ---------- */

const SPORT_CLUBS = [
  ["Hertha BSC", "https://www.herthabsc.com/"], ["1. FC Union Berlin", "https://www.fc-union-berlin.de/"], ["ALBA Berlin", "https://www.albaberlin.de/"],
  ["Eisbären Berlin", "https://www.eisbaeren.de/"], ["Füchse Berlin", "https://www.fuechse.berlin/"], ["BR Volleys", "https://www.br-volleys.de/"],
];

let sportData = null;
let sportFailed = false;
let activeLeague = "bl1";

async function loadSport() {
  try {
    const res = await fetch("/api/sport");
    if (!res.ok) throw new Error(String(res.status));
    sportData = await res.json();
    sportFailed = false;
  } catch (e) {
    sportFailed = true;
  }
  if (currentTab === "sport") refreshViewIfIdle();
}

function setLeague(league) {
  activeLeague = league;
  renderTabContent();
}

function formatDateTime(ms) {
  return ms ? new Date(ms).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "–";
}

function quoteHtml(q) {
  const number = new Intl.NumberFormat("de-DE", { maximumFractionDigits: q.value < 10 ? 4 : 2 });
  const change = q.changePercent === null || q.changePercent === undefined ? "" : `<small class="${q.changePercent < 0 ? "ext-down" : "ext-up"}">${q.changePercent > 0 ? "+" : ""}${esc(q.changePercent.toFixed(2))} %</small>`;
  return `<div class="ext-quote"><span>${esc(q.name)}<br><small>${esc(q.source || "")} · ${esc(formatDateTime(q.updatedAt))}</small></span><strong>${esc(number.format(q.value))} ${esc(q.currency || "")}<br>${change}</strong></div>`;
}

function weatherHtml(w) {
  const day = (d) => `<div><span>${esc(new Date(d.date).toLocaleDateString("de-DE", { weekday: "short" }))}</span>${weatherIcon(d.code)}<small>${esc(Math.round(d.max))}° / ${esc(Math.round(d.min))}°</small><small>💧 ${esc(d.rainChance ?? "–")} %</small></div>`;
  return `
    <div class="card-item" style="padding: 16px;">
      <div class="card-title">${weatherIcon(w.code)} Berlin ${esc(Math.round(w.temperature))} °C</div>
      <div class="card-subtitle">${esc(tr("Gefühlt", "Hissedilen"))} ${esc(Math.round(w.feelsLike))} °C · 💨 ${esc(Math.round(w.wind))} km/h · 💧 ${esc(w.humidity)} %</div>
      <div class="ext-weather ext-weather-week">${w.days.map(day).join("")}</div>
      <p class="ext-note">Open-Meteo · ${esc(String(w.observedAt || "").replace("T", " "))}</p>
    </div>`;
}

function sportHtml() {
  if (!sportData) return `<div class="card-item" style="padding: 16px; color: var(--text-muted);">${esc(sportFailed ? tr("Live-Daten sind gerade nicht erreichbar.", "Canlı veriler şu an alınamıyor.") : tr("Wird geladen…", "Yükleniyor…"))}</div>`;
  const league = sportData.leagues.find((l) => l.id === activeLeague) || sportData.leagues[0];
  const berlin = (sportData.berlin || []).map((c) => `
    <div class="card-item" style="padding: 12px;">
      <div class="ext-row"><div class="card-title" style="font-size: 15px;">${esc(c.team)}</div><span class="card-tag">${esc(c.position)}. · ${esc(c.points)} ${esc(tr("Punkte", "Puan"))}</span></div>
      <div class="card-subtitle">${esc(c.league)}</div>
      ${c.lastMatch ? `<div class="card-subtitle">${esc(tr("Letztes Spiel", "Son maç"))}: ${esc(c.lastMatch)}</div>` : ""}
      ${c.nextMatch ? `<div class="card-subtitle">${esc(tr("Nächstes Spiel", "Sıradaki maç"))}: ${esc(c.nextMatch)}</div>` : ""}
    </div>`).join("");
  const rows = (league?.table || []).map((t) => `<tr class="${t.berlin ? "ext-berlin" : ""}"><td>${esc(t.position)}</td><td>${esc(t.short || t.team)}</td><td>${esc(t.played)}</td><td>${esc(t.goalDiff)}</td><td><strong>${esc(t.points)}</strong></td></tr>`).join("");
  const matches = (league?.matches || []).map((m) => `<div class="ext-quote"><span>${esc(m.home)} – ${esc(m.away)}<br><small>${esc(formatDateTime(m.kickoff))}</small></span><strong>${m.finished ? `${esc(m.homeGoals)}:${esc(m.awayGoals)}` : "–"}</strong></div>`).join("");
  return `
    ${berlin}
    ${chips(sportData.leagues.map((l) => [l.id, l.name]), activeLeague, "setLeague")}
    <div class="card-item" style="padding: 8px;"><table class="ext-table"><thead><tr><th>#</th><th>Team</th><th>Sp</th><th>+/-</th><th>Pkt</th></tr></thead><tbody>${rows}</tbody></table></div>
    <h3 class="ext-subheading">${esc(tr("Spieltag", "Maç günü"))}</h3>
    <div class="card-item" style="padding: 8px 16px;">${matches}</div>
    <p class="ext-note">${esc(league?.source || "OpenLigaDB")} · ${esc(formatDateTime(sportData.updatedAt))}</p>`;
}

EXTRA_TABS.sport = function (container) {
  if (!sportData && !sportFailed) loadSport();
  const data = liveData;
  const unavailable = `<div class="card-item" style="padding: 16px; color: var(--text-muted);">${esc(tr("Live-Daten sind gerade nicht erreichbar.", "Canlı veriler şu an alınamıyor."))}</div>`;
  const clock = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  container.innerHTML = `
    <div class="ext-row" style="margin-bottom: 8px;"><h2 class="ext-heading" style="margin: 0;">${esc(tr("Sport, Wetter & Kurse", "Spor, Hava & Kurlar"))}</h2><button class="chip-btn" onclick="refreshLive(true); loadSport();"><i class="bi bi-arrow-clockwise"></i></button></div>
    <span class="card-tag">🕒 ${esc(clock)} Berlin</span>
    <h3 class="ext-subheading">${esc(tr("Wetter", "Hava"))}</h3>
    ${data?.weather ? weatherHtml(data.weather) : unavailable}
    <h3 class="ext-subheading">${esc(tr("Kurse", "Kurlar"))}</h3>
    ${data?.quotes?.length ? `<div class="card-item" style="padding: 8px 16px;">${data.quotes.map(quoteHtml).join("")}</div>` : unavailable}
    <h3 class="ext-subheading">Sport</h3>
    ${sportHtml()}
    ${data?.sport?.length ? `<h3 class="ext-subheading">${esc(tr("Sportnachrichten", "Spor Haberleri"))}</h3>${data.sport.map(renderNewsItem).join("")}` : ""}
    ${data?.business?.length ? `<h3 class="ext-subheading">${esc(tr("Wirtschaft & Börse", "Ekonomi & Borsa"))}</h3>${data.business.map(renderNewsItem).join("")}` : ""}
    ${data?.news?.length ? `<h3 class="ext-subheading">${esc(tr("Aktuelle Schlagzeilen", "Güncel Manşetler"))}</h3>${data.news.slice(0, 10).map(renderNewsItem).join("")}` : ""}
    <h3 class="ext-subheading">${esc(tr("Berliner Vereine", "Berlin Kulüpleri"))}</h3>
    <div class="ext-clubs">${SPORT_CLUBS.map(([name, url]) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener">${esc(name)} ↗</a>`).join("")}</div>`;
};

/* ---------- Reporter comments ---------- */

const baseReporterTab = EXTRA_TABS.reporter;
EXTRA_TABS.reporter = function (container) {
  baseReporterTab(container);
  const cards = container.querySelectorAll(".card-item");
  (reporterPosts || []).forEach((post, i) => {
    const card = cards[i + 1];
    if (!card) return;
    const comments = (post.comments || []).map((c) => `<div class="ext-comment"><strong>${esc(c.author)}</strong> ${esc(c.text)}</div>`).join("");
    // One comment per person and post (same rule as the app and the server).
    const form = hasCommented(post.id)
      ? `<div class="ext-row" style="font-size:12px;font-weight:700;color:var(--berlin-green,#1F9D55)">✔ ${esc(tr("Dein Kommentar ist eingegangen.", "Yorumun alındı."))}</div>`
      : `<div class="ext-row"><input id="cmt-${esc(post.id)}" class="form-control" maxlength="500" placeholder="${esc(tr("Kommentar schreiben", "Yorum yaz"))}">
        <button class="chip-btn active" onclick="sendComment(${jsArg(post.id)})"><i class="bi bi-send-fill"></i></button></div>`;
    card.insertAdjacentHTML("beforeend", `
      <div class="ext-comments">${comments}
        ${form}
      </div>`);
  });
};

async function sendComment(postId) {
  const input = document.getElementById("cmt-" + postId);
  const text = input?.value.trim();
  if (!text) return;
  const res = await fetch("/api/reporter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ comment: { postId, text } }) }).catch(() => null);
  if (res?.status === 409) {
    markCommented(postId);
    showToast(tr("Du hast hier schon kommentiert.", "Bu habere zaten yorum yazdın."));
  } else {
    showToast(res?.status === 201 ? tr("Danke! Wird vor der Veröffentlichung geprüft.", "Teşekkürler! Yayından önce incelenecek.") : tr("Senden ist gerade nicht möglich.", "Şu anda gönderilemiyor."));
  }
  if (res?.status === 201) {
    input.value = "";
    markCommented(postId);
  }
  if (res?.status === 201 || res?.status === 409) {
    const row = input?.closest(".ext-row");
    if (row) row.outerHTML = `<div class="ext-row" style="font-size:12px;font-weight:700;color:var(--berlin-green,#1F9D55)">✔ ${esc(tr("Dein Kommentar ist eingegangen.", "Yorumun alındı."))}</div>`;
  }
}

function hasCommented(postId) {
  try { return JSON.parse(localStorage.getItem("mk_commented") || "[]").includes(postId); } catch (e) { return false; }
}

function markCommented(postId) {
  try {
    const list = JSON.parse(localStorage.getItem("mk_commented") || "[]");
    if (!list.includes(postId)) list.push(postId);
    localStorage.setItem("mk_commented", JSON.stringify(list.slice(-300)));
  } catch (e) {}
}

/* ---------- B2B ---------- */

const basePortalTab = EXTRA_TABS.portal;
EXTRA_TABS.portal = function (container) {
  basePortalTab(container);
  const usp = [
    ["Gezielte lokale Reichweite", "Direkt in Ihrem Stadtteil"], ["Passende Kunden aus Ihrem Kiez", "Anwohner und Kiez-Besucher"],
    ["Mehr Sichtbarkeit & mehr Umsatz", "Durch Top-Platzierungen"], ["Einfache Online-Buchung", "In wenigen Minuten online"],
  ];
  const steps = [
    ["Paket wählen", "Wählen Sie das passende Werbepaket für Ihr Unternehmen."], ["Daten eintragen", "Laden Sie Bilder hoch und ergänzen Sie Ihre Daten."],
    ["Prüfung & Freigabe", "Wir prüfen Ihren Eintrag und schalten ihn online."], ["Sichtbar werden", "Ihr Unternehmen erreicht gezielt Menschen im Kiez."],
  ];
  container.querySelector(".ext-heading").insertAdjacentHTML("afterend", `
    <div class="card-item" style="padding: 14px;">${usp.map(([t, s]) => `<div class="ext-quote"><span><strong>${esc(t)}</strong><br><small>${esc(s)}</small></span><i class="bi bi-check-circle-fill"></i></div>`).join("")}</div>
    <div class="ext-views">
      <button class="${billingYearly ? "" : "on"}" onclick="setBilling(false)">${esc(tr("Monatlich", "Aylık"))}</button>
      <button class="${billingYearly ? "on" : ""}" onclick="setBilling(true)">${esc(tr("Jährlich", "Yıllık"))}</button>
    </div>`);
  const packageCards = [...container.querySelectorAll(".card-item")].slice(1, 1 + PRICING_PACKAGES.length);
  packageCards.forEach((card, i) => {
    const p = PRICING_PACKAGES[i];
    card.querySelector(".card-subtitle").textContent = billingYearly ? p.priceYearlyMonthly : p.priceMonthly;
    card.insertAdjacentHTML("beforeend", `<button class="btn-primary" style="margin-top: 10px;" onclick="openBooking(${jsArg(p.name)})">${esc(tr("Paket wählen", "Paketi seç"))}</button>`);
  });
  container.insertAdjacentHTML("beforeend", `
    <h3 class="ext-subheading">So funktioniert's</h3>
    ${steps.map(([t, s], i) => `<div class="card-item" style="padding: 12px;"><strong>${i + 1}. ${esc(t)}</strong><div class="card-desc">${esc(s)}</div></div>`).join("")}`);
};

function setBilling(yearly) {
  billingYearly = yearly;
  renderTabContent();
}

function openBooking(packageName) {
  openDetailModal(`
    <h3 class="modal-title">${esc(packageName)}</h3>
    <div class="form-group"><label class="form-label">${esc(tr("Firma", "Firma"))}</label><input id="bk-company" class="form-control"></div>
    <div class="form-group"><label class="form-label">E-Mail</label><input id="bk-email" type="email" class="form-control"></div>
    <div class="form-group"><label class="form-label">Kiez</label><input id="bk-kiez" class="form-control"></div>
    <button class="btn-primary" onclick="sendBooking(${jsArg(packageName)})">${esc(tr("Senden", "Gönder"))}</button>
    <p class="ext-note"><a href="/agb">AGB</a> · <a href="/datenschutz">${esc(tr("Datenschutz", "Gizlilik"))}</a></p>`);
}

function sendBooking(packageName) {
  const email = document.getElementById("bk-email").value.trim();
  if (!email) {
    showToast(tr("Bitte Pflichtfelder ausfüllen.", "Lütfen zorunlu alanları doldurun."));
    return;
  }
  sendSubmission("booking", {
    packageName,
    billing: billingYearly ? "yearly" : "monthly",
    companyName: document.getElementById("bk-company").value.trim(),
    email,
    kiez: document.getElementById("bk-kiez").value.trim(),
  });
}

/* ---------- Profile ---------- */

function applyDarkMode() {
  document.documentElement.classList.toggle("ext-dark", setting(STORAGE_DARK_KEY));
}

function toggleSetting(key) {
  localStorage.setItem(key, setting(key) ? "0" : "1");
  applyDarkMode();
  renderTabContent();
}

async function toggleNotifications() {
  if (!setting(STORAGE_NOTIFY_KEY) && "Notification" in window) {
    const answer = await Notification.requestPermission();
    if (answer !== "granted") {
      showToast(tr("Benachrichtigungen", "Bildirimler") + ": ✕");
      return;
    }
  }
  toggleSetting(STORAGE_NOTIFY_KEY);
}

function toggleLocation() {
  if (setting(STORAGE_LOCATION_KEY)) {
    userLocation = null;
    toggleSetting(STORAGE_LOCATION_KEY);
    return;
  }
  navigator.geolocation?.getCurrentPosition((pos) => {
    userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    toggleSetting(STORAGE_LOCATION_KEY);
  }, () => showToast(tr("Standort", "Konum") + ": ✕"));
}

function settingRow(label, key, handler) {
  return `<div class="card-item ext-call-row"><div class="card-title" style="font-size: 15px;">${esc(label)}</div><button class="ext-switch ${setting(key) ? "on" : ""}" onclick="${handler}" aria-label="${esc(label)}"><span></span></button></div>`;
}

const baseProfileTab = EXTRA_TABS.profile;
EXTRA_TABS.profile = function (container) {
  baseProfileTab(container);
  container.querySelector(".ext-heading").insertAdjacentHTML("afterend", `
    ${settingRow(tr("Dunkelmodus", "Karanlık mod"), STORAGE_DARK_KEY, `toggleSetting('${STORAGE_DARK_KEY}')`)}
    ${settingRow(tr("Benachrichtigungen", "Bildirimler"), STORAGE_NOTIFY_KEY, "toggleNotifications()")}
    ${settingRow(tr("Standort", "Konum"), STORAGE_LOCATION_KEY, "toggleLocation()")}`);
  const links = [...container.querySelectorAll(".ext-quote")].pop();
  links?.insertAdjacentHTML("beforebegin", `<a class="ext-quote" href="/agb"><span>AGB</span><i class="bi bi-chevron-right"></i></a><a class="ext-quote" href="/story-regeln"><span>Story-Regeln</span><i class="bi bi-chevron-right"></i></a><a class="ext-quote" href="mailto:info@mykiezberlin.com"><span>✉️ ${esc(tr("Kontakt & Werbung", "İletişim & reklam"))}: info@mykiezberlin.com</span><i class="bi bi-chevron-right"></i></a>`);
  // Small grey lock at the very bottom (2026-11-11): the only way to the admin login, no text.
  container.insertAdjacentHTML("beforeend", `<div style="text-align:center;margin:26px 0 8px"><a href="admin.html" aria-label="🔒" style="color:#9aa0a6;opacity:.45;font-size:13px;text-decoration:none"><i class="bi bi-lock-fill"></i></a></div>`);
};

// Night/day switch in the ☰ menu (2026-11-11), same setting as in the profile.
function mkToggleDarkFromMenu() {
  toggleSetting(STORAGE_DARK_KEY);
}

/* ---------- Notifications for new alerts ---------- */

let lastAlertTitle = "";

const baseApplyLiveAlerts = applyLiveAlerts;
applyLiveAlerts = function () {
  baseApplyLiveAlerts();
  const top = liveData?.alerts?.[0];
  if (!top) return;
  if (lastAlertTitle && top.title !== lastAlertTitle && setting(STORAGE_NOTIFY_KEY) && window.Notification?.permission === "granted") {
    new Notification(top.tag, { body: top.title, icon: "assets/images/mykiez_logo.png" });
  }
  lastAlertTitle = top.title;
};

/* ---------- Stories: types, watermark, text stories, saving ---------- */

function openCreateStoryModal() {
  const kiezOptions = KIEZE_FULL.map((k) => `<option value="${esc(k.name)}">${esc(k.name)}</option>`).join("");
  const kinds = { news: "News", traffic: tr("Verkehr", "Trafik"), event: "Event", warn: tr("Warnung", "Uyarı"), info: "Info", politics: tr("Politik", "Politika") };
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "create-story-modal";
  modal.innerHTML = `
    <div class="modal-card ext-detail">
      <div class="modal-header">
        <h3 class="modal-title">${esc(tr("Deine Story veröffentlichen", "Hikâye paylaş"))}</h3>
        <button class="btn-icon-circle" onclick="document.getElementById('create-story-modal').remove()"><i class="bi bi-x-lg"></i></button>
      </div>
      <div class="form-group"><label class="form-label">${esc(tr("Titel", "Başlık"))}</label><input id="new-story-headline" class="form-control" maxlength="120"></div>
      <div class="form-group"><label class="form-label">${esc(tr("Beschreibung", "Açıklama"))}</label><textarea id="new-story-subtext" class="form-control" rows="3" maxlength="500"></textarea></div>
      <div class="form-group"><label class="form-label">${esc(tr("Story-Art", "Hikâye türü"))}</label><select id="new-story-kind" class="form-control">${STORY_KINDS.map((k) => `<option value="${k}">${esc(kinds[k])}</option>`).join("")}</select></div>
      <div class="form-group"><label class="form-label">Kiez</label><select id="new-story-kiez" class="form-control">${kiezOptions}<option value="Ganz Berlin">Ganz Berlin</option></select></div>
      <div class="form-group"><label class="form-label">${esc(tr("Laufzeit", "Süre"))}</label><select id="new-story-duration" class="form-control"><option value="24">24 h</option><option value="48">48 h</option></select></div>
      <div class="form-group"><label class="form-label">Foto / Video</label><input type="file" id="new-story-file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" class="form-control"></div>
      <button class="btn-primary" onclick="submitUserStory()">${esc(tr("Einreichen", "Gönder"))}</button>
      <p class="ext-note"><a href="/story-regeln">Story-Regeln</a> · ${esc(tr("Beiträge erscheinen nach Prüfung.", "Gönderiler onaydan sonra yayınlanır."))}</p>
    </div>`;
  document.body.appendChild(modal);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function canvasToFile(canvas, name) {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(new File([blob], name, { type: "image/jpeg" })), "image/jpeg", 0.88));
}

// The story viewer (web and app) shows the logo top right, so uploads stay unstamped;
// otherwise the logo would appear twice. Set to true to burn the logo into uploads again.
const STAMP_UPLOADS = false;

// A text-only story becomes a generated image.
async function prepareStoryFile(file, headline, subtext) {
  if (file && !file.type.startsWith("image/")) return file;
  const logo = await loadImage("assets/images/mykiez_logo_watermark.png").catch(() => null);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (file) {
    const url = URL.createObjectURL(file);
    const photo = await loadImage(url).catch(() => null);
    URL.revokeObjectURL(url);
    if (!photo) return file;
    const scale = Math.min(1, 1600 / Math.max(photo.width, photo.height));
    canvas.width = Math.round(photo.width * scale);
    canvas.height = Math.round(photo.height * scale);
    ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
  } else {
    canvas.width = 1080;
    canvas.height = 1350;
    ctx.fillStyle = "#E30613";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    drawWrapped(ctx, headline, 540, 520, 900, 76, "800 64px sans-serif");
    drawWrapped(ctx, subtext, 540, 900, 900, 52, "400 40px sans-serif");
  }
  if (logo && STAMP_UPLOADS) {
    const size = canvas.width * 0.24;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(logo, canvas.width - size - 24, 24, size, size);
    ctx.globalAlpha = 1;
  }
  return canvasToFile(canvas, "story.jpg");
}

function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, font) {
  ctx.font = font;
  let line = "";
  let top = y;
  String(text).split(/\s+/).forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, top);
      top += lineHeight;
      line = word;
    } else {
      line = next;
    }
  });
  if (line) ctx.fillText(line, x, top);
}

const baseRenderStorySlide = renderStorySlide;
renderStorySlide = function () {
  baseRenderStorySlide();
  const story = getStories().filter((s) => s.status === "approved")[activeStoryIndex];
  const header = document.querySelector("#story-modal-overlay .story-header-overlay");
  if (!story || !header) return;
  const url = story.isVideo ? story.videoUri : story.image;
  if (url) header.insertAdjacentHTML("beforeend", `<a class="btn-icon-circle" style="background: rgba(0,0,0,0.5); color: #FFF;" href="${safeUrl(url)}" download aria-label="${esc(tr("Speichern", "Kaydet"))}"><i class="bi bi-download"></i></a>`);
};

/* ---------- Quiz link and navigation ---------- */

const baseQuizTab = renderQuizTab;
renderQuizTab = function (container) {
  baseQuizTab(container);
  container.insertAdjacentHTML("afterbegin", `<a class="btn-primary ext-cta" href="/quiz/" style="margin: 0 0 12px;">🎯 ${esc(tr("Welcher Kiez passt zu dir?", "Sana hangi Kiez uyuyor?"))}</a>`);
};

EXTRA_TABS.map = renderMapTab;

EXTRA_TABS.directory = function (container) {
  const groups = [...new Set(BUSINESSES.map(businessCategory))];
  container.innerHTML = `
    <h2 class="ext-heading">${esc(tr("Betriebe in Berlin", "Berlin İşletmeleri"))}</h2>
    <button class="chip-btn active" style="margin-bottom: 10px;" onclick="openBusinessForm()"><i class="bi bi-plus-lg"></i> ${esc(tr("Betrieb kostenlos eintragen", "İşletmeni ücretsiz ekle"))}</button>
    ${groups.map((group, index) => {
      sponsorIndex += index ? 1 : 0;
      return `
      <h3 class="ext-subheading">${esc(group)}</h3>
      ${BUSINESSES.filter((b) => businessCategory(b) === group).map(renderCompactBusiness).join("")}
      ${index % 2 === 0 ? renderSponsorCard() : ""}`;
    }).join("")}
    <a class="btn-primary ext-cta" onclick="switchTab('portal')">${esc(tr("Werbung für deinen Betrieb", "İşletmen için reklam"))}</a>`;
};

const baseMoreTab = EXTRA_TABS.more;
EXTRA_TABS.more = function (container) {
  baseMoreTab(container);
  container.querySelector(".ext-grid").insertAdjacentHTML("beforeend", `
    <button class="ext-tile" onclick="switchTab('directory')"><i class="bi bi-shop-window"></i><span>${esc(tr("Alle Betriebe", "Tüm İşletmeler"))}</span></button>
    <button class="ext-tile" onclick="switchTab('map')"><i class="bi bi-map-fill"></i><span>${esc(tr("Karte", "Harita"))}</span></button>
    <a class="ext-tile" href="/quiz/" style="text-decoration: none;"><i class="bi bi-bullseye"></i><span>${esc(tr("Kiez-Quiz starten", "Kiez testi"))}</span></a>
    <a class="ext-tile" href="/community/?lang=${currentLanguage === "tr" ? "tr" : "de"}" style="text-decoration: none;"><i class="bi bi-people-fill"></i><span>${esc(tr("Community & Kleinanzeigen", "Topluluk & İlanlar"))}</span></a>`);
};

const baseLabels = updateStaticLabels;
updateStaticLabels = function () {
  baseLabels();
  const button = document.getElementById("lang-toggle-btn");
  if (button) button.innerText = LANGUAGE_FLAGS[currentLanguage];
};

applyDarkMode();

document.addEventListener("DOMContentLoaded", () => {
  updateStaticLabels();
  loadSubmissions();
  setInterval(refreshSharedContent, SHARED_REFRESH_MS);
  if (setting(STORAGE_LOCATION_KEY)) {
    navigator.geolocation?.getCurrentPosition((pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      renderTabContent();
    });
  }
  setInterval(() => {
    slideIndex += 1;
    if (currentTab === "home") {
      const slide = document.querySelector(".ext-manset");
      if (slide) slide.outerHTML = mansetHtml();
    }
  }, 6000);
});
