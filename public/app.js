/**
 * My Kiez Berlin - Main Application Script
 * Implements stories playback, navigation, quiz with confetti, language toggle, and persistence
 */

// Storage Keys
const STORAGE_STORIES_KEY = "mykiez_stories_v1";
const STORAGE_ADMIN_AUTH_KEY = "mykiez_admin_auth_v1";
const STORAGE_CUSTOM_KIEZE_KEY = "mykiez_custom_kieze_v1";

// State
let currentTab = "home";
let currentLanguage = "tr"; // "tr" | "de"
let activeCategory = "all";
let activeBulletinFilter = "all";
let activeStoryIndex = 0;
let storyTimer = null;
let storyProgress = 0;
let isStoryPaused = false;

// Alert Ticker State (1:1 with BerlinNotificationManager)
let currentAlertIndex = 0;
let alertDismissed = false;
let alertAutoCycleTimer = null;

// Quiz State
let quizIndex = 0;
let quizScore = 0;
let quizSelectedOption = null;
let quizChecked = false;
let quizFinished = false;

// Initialize Stories from LocalStorage or Defaults
function getStories() {
  const saved = localStorage.getItem(STORAGE_STORIES_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch(e) {}
  }
  return DEFAULT_STORIES;
}

function saveStories(storiesList) {
  localStorage.setItem(STORAGE_STORIES_KEY, JSON.stringify(storiesList));
}

// Translations Dictionary (Matching Android Strings & Localization)
const I18N = {
  tr: {
    appTitle: "My Kiez Berlin",
    shareStory: "+ Durum Paylaş",
    yourStory: "Paylaş",
    navHome: "Ana Sayfa",
    navKieze: "Kiezler",
    navBulletin: "Canlı Ticker",
    navEvents: "Etkinlikler",
    navJobs: "İşler",
    navEmergency: "Acil",
    navQuiz: "Yarışma",
    searchPlaceholder: "Kiez, dükkan, etkinlik veya sokak ara...",
    all: "Tümü",
    congrats: "Tebrikler! 🎉",
    restart: "Yeniden Başlat",
    nextQuestion: "Sonraki Soru",
    seeResults: "Sonuçları Gör",
    adminTitle: "Yönetici Paneli",
    logoutConfirm: "Çıkış yapmak istiyor musunuz?",
    shareFriend: "Arkadaşıma Paylaş",
    shareFriendSub: "My Kiez Berlin uygulamasını tavsiye et",
    apkDownloadBtn: "APK İndir",
    apkDownloadTitle: "İndirme Linki (APK):",
    copyBtn: "Kopyala",
    downloadBtn: "İndir",
    copiedToast: "APK indirme linki kopyalandı!",
    officialSource: "Resmi Kaynak",
    liveTickerBadge: "CANLI BİLDİRİM & TİCKER",
    shareAlertBtn: "Paylaş (APK)",
    dismissBtn: "Kapat",
    bulletinTitle: "🚨 Berlin Canlı Hatırlatma & Ticker Bülteni",
    bulletinSubtitle: "S-Bahn Berlin, BVG, İtfaiye (Feuerwehr), Polis ve resmi kurumlardan anlık teyitli olaylar.",
    triggerTestAlert: "🔔 Yeni Canlı Bildirim Gönder (Test)",
    lastUpdate: "Canlı Güncellendi",
    shareMessage: "Berlin'in canlı bülteni, mahalle rehberi ve etkinlikleri için My Kiez Berlin uygulamasını hemen indir:\nhttps://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk"
  },
  de: {
    appTitle: "My Kiez Berlin",
    shareStory: "+ Deine Story",
    yourStory: "Deine Story",
    navHome: "Startseite",
    navKieze: "Kieze",
    navBulletin: "Live-Ticker",
    navEvents: "Events",
    navJobs: "Jobs",
    navEmergency: "Notruf",
    navQuiz: "Quiz",
    searchPlaceholder: "Kiez, Geschäft, Event oder Straße suchen...",
    all: "Alle",
    congrats: "Glückwunsch! 🎉",
    restart: "Erneut spielen",
    nextQuestion: "Nächste Frage",
    seeResults: "Ergebnis ansehen",
    adminTitle: "Admin-Bereich",
    logoutConfirm: "Möchten Sie sich wirklich abmelden?",
    shareFriend: "App mit Freunden teilen",
    shareFriendSub: "Direkter APK-Download-Link zum Weiterleiten",
    apkDownloadBtn: "APK herunterladen",
    apkDownloadTitle: "Download-Link (APK):",
    copyBtn: "Kopieren",
    downloadBtn: "Download",
    copiedToast: "APK-Download-Link in Zwischenablage kopiert!",
    officialSource: "Offizielle Quelle",
    liveTickerBadge: "LIVE-TICKER & MELDUNG",
    shareAlertBtn: "Teilen (APK)",
    dismissBtn: "Schließen",
    bulletinTitle: "🚨 Berlin Live-Ticker & Ticker-Bulletin",
    bulletinSubtitle: "Echtzeit-Meldungen von S-Bahn Berlin, BVG, Feuerwehr, Polizei und Senatsstellen.",
    triggerTestAlert: "🔔 Live-Meldung auslösen (Test)",
    lastUpdate: "Live aktualisiert",
    shareMessage: "Lade jetzt die My Kiez Berlin App für Live-Ticker, Nachbarschafts-Guide und Events herunter:\nhttps://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk"
  }
};

// Render Functions & Lifecycle
document.addEventListener("DOMContentLoaded", () => {
  renderStoriesBar();
  renderAlertTicker();
  renderTabContent();
  setupEventListeners();
  startAlertAutoCycle();
});

function setupEventListeners() {
  // Navigation tabs
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = item.getAttribute("data-tab");
      switchTab(tab);
    });
  });

  // Hamburger Menu Hub Button
  const hamburgerBtn = document.getElementById("hamburger-btn");
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", () => {
      openHamburgerHubModal();
    });
  }

  // Bell icon button (triggers next alert or toggles ticker)
  const bellBtn = document.getElementById("bell-toggle-btn");
  if (bellBtn) {
    bellBtn.addEventListener("click", () => {
      cycleNextAlert(true);
      showToast(currentLanguage === "tr" ? "Yeni Berlin bildirimi gösteriliyor!" : "Neue Berlin-Meldung wird angezeigt!");
    });
  }

  // Language selector
  const langBtn = document.getElementById("lang-toggle-btn");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      currentLanguage = (currentLanguage === "tr") ? "de" : "tr";
      langBtn.innerText = currentLanguage.toUpperCase();
      renderStoriesBar();
      renderAlertTicker();
      renderTabContent();
      updateStaticLabels();
    });
  }

  // Global search input
  const searchInput = document.getElementById("global-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      handleGlobalSearch(e.target.value.toLowerCase().trim());
    });
  }
}

function updateStaticLabels() {
  const t = I18N[currentLanguage];
  const searchInput = document.getElementById("global-search-input");
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;
  const apkText = document.querySelector(".apk-btn-text");
  if (apkText) apkText.innerText = currentLanguage === "tr" ? "APK İndir" : "APK Download";

  // Update nav labels
  const navMap = {
    home: t.navHome,
    kieze: t.navKieze,
    bulletin: t.navBulletin,
    events: t.navEvents,
    jobs: t.navJobs,
    emergency: t.navEmergency,
    quiz: t.navQuiz
  };
  document.querySelectorAll(".nav-item").forEach(item => {
    const tab = item.getAttribute("data-tab");
    const span = item.querySelector("span");
    if (span && navMap[tab]) {
      span.innerText = navMap[tab];
    }
  });
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll(".nav-item").forEach(item => {
    if (item.getAttribute("data-tab") === tab) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
  renderTabContent();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Toast Notification Helper
function showToast(message) {
  let toast = document.getElementById("kiez-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "kiez-toast";
    toast.className = "kiez-toast";
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

// Real-Time Alert Ticker (S-Bahn, BVG, Feuerwehr, Polizei)
function renderAlertTicker() {
  const container = document.getElementById("live-alert-ticker-container");
  if (!container) return;

  if (alertDismissed) {
    container.innerHTML = "";
    return;
  }

  const alertItem = BERLIN_LIVE_ALERTS[currentAlertIndex % BERLIN_LIVE_ALERTS.length];
  const t = I18N[currentLanguage];
  const title = currentLanguage === "tr" ? alertItem.titleTr : alertItem.titleDe;
  const body = currentLanguage === "tr" ? alertItem.bodyTr : alertItem.bodyDe;

  container.innerHTML = `
    <div class="live-alert-banner" style="border-left: 5px solid ${alertItem.color};">
      <div class="alert-top-row">
        <div class="alert-badge-group">
          <span class="alert-tag-pill" style="background-color: ${alertItem.bgLight}; color: ${alertItem.color};">
            <span class="live-pulse-dot" style="background-color: ${alertItem.color};"></span>
            ${alertItem.tag}
          </span>
          <span class="alert-timestamp">⏰ ${alertItem.timestamp}</span>
        </div>
        <button class="alert-dismiss-btn" onclick="dismissAlertBanner()" title="${t.dismissBtn}">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="alert-title-text">${title}</div>
      <div class="alert-body-text">${body}</div>

      <div class="alert-actions-row">
        <a href="${alertItem.officialUrl}" target="_blank" class="alert-action-btn primary" title="Offizielle Seite aufrufen">
          <i class="bi bi-box-arrow-up-right"></i> ${t.officialSource}
        </a>
        <button class="alert-action-btn secondary" onclick="switchTab('bulletin')">
          <i class="bi bi-broadcast"></i> ${t.navBulletin}
        </button>
        <button class="alert-action-btn share" onclick="shareAlert(${alertItem.id})">
          <i class="bi bi-share-fill"></i> ${t.shareAlertBtn}
        </button>
      </div>
    </div>
  `;
}

function dismissAlertBanner() {
  alertDismissed = true;
  const container = document.getElementById("live-alert-ticker-container");
  if (container) container.innerHTML = "";
}

function cycleNextAlert(forceOpen = false) {
  currentAlertIndex = (currentAlertIndex + 1) % BERLIN_LIVE_ALERTS.length;
  if (forceOpen) alertDismissed = false;
  renderAlertTicker();
}

function startAlertAutoCycle() {
  clearInterval(alertAutoCycleTimer);
  alertAutoCycleTimer = setInterval(() => {
    if (!alertDismissed) {
      currentAlertIndex = (currentAlertIndex + 1) % BERLIN_LIVE_ALERTS.length;
      renderAlertTicker();
    }
  }, 14000);
}

// Share APK and Share Alert Functions
function shareApkLink() {
  const t = I18N[currentLanguage];
  const shareText = t.shareMessage;

  if (navigator.share) {
    navigator.share({
      title: "My Kiez Berlin App",
      text: shareText,
      url: APK_DOWNLOAD_URL
    }).catch(() => {});
  } else {
    copyToClipboard(APK_DOWNLOAD_URL);
    showToast(t.copiedToast);
  }
}

function copyApkLink() {
  const t = I18N[currentLanguage];
  copyToClipboard(APK_DOWNLOAD_URL);
  showToast(t.copiedToast);
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {}
    textArea.remove();
  }
}

function shareAlert(alertId) {
  const alertItem = BERLIN_LIVE_ALERTS.find(a => a.id === alertId) || BERLIN_LIVE_ALERTS[0];
  const title = currentLanguage === "tr" ? alertItem.titleTr : alertItem.titleDe;
  const body = currentLanguage === "tr" ? alertItem.bodyTr : alertItem.bodyDe;
  const text = `🚨 [${alertItem.tag}] ${title}\n${body}\n\nResmi Kaynak: ${alertItem.officialUrl}\n\nMy Kiez Berlin uygulamasını indir:\n${APK_DOWNLOAD_URL}`;

  if (navigator.share) {
    navigator.share({
      title: title,
      text: text,
      url: APK_DOWNLOAD_URL
    }).catch(() => {});
  } else {
    copyToClipboard(text);
    showToast(currentLanguage === "tr" ? "Bildirim & APK indirme linki kopyalandı!" : "Meldung & Download-Link kopiert!");
  }
}

// Hamburger Hub Modal (1:1 with Android HamburgerHubModal)
function openHamburgerHubModal() {
  let modal = document.getElementById("hamburger-hub-modal-overlay");
  if (modal) modal.remove();

  const t = I18N[currentLanguage];

  modal = document.createElement("div");
  modal.id = "hamburger-hub-modal-overlay";
  modal.className = "hub-modal-overlay";

  modal.innerHTML = `
    <div class="hub-modal-card">
      <div class="hub-modal-header">
        <div class="hub-brand-group">
          <img src="assets/images/mykiez_logo.png" alt="My Kiez Berlin Logo" class="hub-logo-img">
          <div>
            <div class="hub-title-text">My Kiez Berlin</div>
            <div class="hub-subtitle-text">${currentLanguage === "tr" ? "Mahalle Rehberi & Canlı Ticker" : "Dein digitaler Kiez-Guide"}</div>
          </div>
        </div>
        <button class="hub-close-btn" onclick="closeHamburgerHubModal()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="hub-body-content">
        <!-- 1. ARKADAŞIMA PAYLAŞ BUTONU (APK İndirme Linki) -->
        <div class="hub-share-btn-box" onclick="shareApkLink()">
          <div class="hub-share-icon-ring">
            <i class="bi bi-share-fill"></i>
          </div>
          <div class="hub-share-text-group">
            <div class="hub-share-title">${t.shareFriend}</div>
            <div class="hub-share-subtitle">${t.shareFriendSub}</div>
          </div>
        </div>

        <!-- 2. DOĞRUDAN BUTONUN ALTINDA GÖRÜNEN İNDİRME LİNKİ KUTUSU -->
        <div class="hub-download-link-box">
          <div class="download-box-header">
            <span class="download-label-text">
              <i class="bi bi-download"></i> ${t.apkDownloadTitle}
            </span>
            <div class="download-action-chips">
              <button class="copy-pill-btn" onclick="copyApkLink()">
                <i class="bi bi-clipboard-check"></i> ${t.copyBtn}
              </button>
              <a href="${APK_DOWNLOAD_URL}" download class="download-pill-btn">
                <i class="bi bi-arrow-down-circle-fill"></i> ${t.downloadBtn}
              </a>
            </div>
          </div>
          <div class="download-url-code" onclick="copyApkLink()" title="${t.copyBtn}">
            <code>${APK_DOWNLOAD_URL}</code>
          </div>
        </div>

        <!-- 3. HUB MENU GRID (Navigasyon & Modüller) -->
        <div class="hub-menu-grid">
          <div class="hub-menu-tile" onclick="switchTab('bulletin'); closeHamburgerHubModal();">
            <div class="tile-icon-box red"><i class="bi bi-broadcast-pin"></i></div>
            <div class="tile-label">Canlı Ticker</div>
            <div class="tile-desc">S-Bahn, BVG, Notruf</div>
          </div>

          <div class="hub-menu-tile" onclick="switchTab('kieze'); closeHamburgerHubModal();">
            <div class="tile-icon-box blue"><i class="bi bi-compass-fill"></i></div>
            <div class="tile-label">24+ Kiezler</div>
            <div class="tile-desc">Mitte, Kreuzberg & mehr</div>
          </div>

          <div class="hub-menu-tile" onclick="switchTab('events'); closeHamburgerHubModal();">
            <div class="tile-icon-box yellow"><i class="bi bi-calendar-event-fill"></i></div>
            <div class="tile-label">Etkinlikler</div>
            <div class="tile-desc">Festival & Flohmärkte</div>
          </div>

          <div class="hub-menu-tile" onclick="switchTab('jobs'); closeHamburgerHubModal();">
            <div class="tile-icon-box green"><i class="bi bi-briefcase-fill"></i></div>
            <div class="tile-label">Kiez Jobs</div>
            <div class="tile-desc">Gastro & Lokale Jobs</div>
          </div>

          <div class="hub-menu-tile" onclick="switchTab('emergency'); closeHamburgerHubModal();">
            <div class="tile-icon-box red"><i class="bi bi-telephone-fill"></i></div>
            <div class="tile-label">Notruf & Acil</div>
            <div class="tile-desc">110, 112, 116117</div>
          </div>

          <div class="hub-menu-tile" onclick="switchTab('quiz'); closeHamburgerHubModal();">
            <div class="tile-icon-box purple"><i class="bi bi-trophy-fill"></i></div>
            <div class="tile-label">Berlin Quiz</div>
            <div class="tile-desc">1-5 Smiley & Confetti</div>
          </div>
        </div>

        <!-- 4. Alt Ayarlar ve Admin Linki -->
        <div class="hub-footer-actions">
          <a href="admin.html" class="hub-footer-link">
            <i class="bi bi-shield-lock-fill"></i> Yönetici Girişi (Admin)
          </a>
          <button class="hub-footer-link" onclick="toggleLanguageFromHub()">
            <i class="bi bi-translate"></i> Dil Değiştir: <strong>${currentLanguage.toUpperCase()}</strong>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function closeHamburgerHubModal() {
  const modal = document.getElementById("hamburger-hub-modal-overlay");
  if (modal) modal.remove();
}

function toggleLanguageFromHub() {
  currentLanguage = (currentLanguage === "tr") ? "de" : "tr";
  const langBtn = document.getElementById("lang-toggle-btn");
  if (langBtn) langBtn.innerText = currentLanguage.toUpperCase();
  renderStoriesBar();
  renderAlertTicker();
  renderTabContent();
  updateStaticLabels();
  openHamburgerHubModal(); // Refresh modal content
}

// Render Stories Bar
function renderStoriesBar() {
  const container = document.getElementById("stories-scroll-container");
  if (!container) return;
  
  const stories = getStories().filter(s => s.status === "approved");
  const t = I18N[currentLanguage];

  let html = `
    <div class="story-item" onclick="openCreateStoryModal()">
      <div class="story-avatar-ring add-new">
        <i class="bi bi-plus-lg"></i>
      </div>
      <span class="story-label">${t.yourStory}</span>
    </div>
  `;

  stories.forEach((story, idx) => {
    html += `
      <div class="story-item" onclick="openStoryViewer(${idx})">
        <div class="story-avatar-ring">
          <img src="${story.image || 'assets/images/mykiez_logo.png'}" class="story-avatar-img" alt="${story.headline}">
        </div>
        <span class="story-label">${story.kiez}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Render Tab Content
function renderTabContent() {
  const content = document.getElementById("main-tab-content");
  if (!content) return;

  const t = I18N[currentLanguage];

  if (currentTab === "home") {
    renderHomeTab(content);
  } else if (currentTab === "kieze") {
    renderKiezeTab(content);
  } else if (currentTab === "bulletin") {
    renderBulletinTab(content);
  } else if (currentTab === "events") {
    renderEventsTab(content);
  } else if (currentTab === "emergency") {
    renderEmergencyTab(content);
  } else if (currentTab === "quiz") {
    renderQuizTab(content);
  } else if (currentTab === "jobs") {
    renderJobsTab(content);
  }
}

// Bulletin Tab (1:1 with BerlinLiveBulletinScreen.kt)
function renderBulletinTab(container) {
  const t = I18N[currentLanguage];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let filterAlerts = BERLIN_LIVE_ALERTS;
  if (activeBulletinFilter !== "all") {
    filterAlerts = BERLIN_LIVE_ALERTS.filter(a => a.tag.toLowerCase().includes(activeBulletinFilter.toLowerCase()));
  }

  let html = `
    <div class="bulletin-header-box">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h2 style="font-size: 19px; font-weight: 900; color: var(--berlin-red); margin-bottom: 4px;">
            ${t.bulletinTitle}
          </h2>
          <p style="font-size: 12px; color: var(--text-muted); margin: 0;">${t.bulletinSubtitle}</p>
        </div>
        <button class="chip-btn active" onclick="cycleNextAlert(true); renderBulletinTab(document.getElementById('main-tab-content'));" title="Yenile">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; font-size: 11px; color: var(--text-muted);">
        <span><span class="live-pulse-dot" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #16A34A; margin-right: 4px;"></span>${t.lastUpdate}: <strong>${nowTime}</strong></span>
        <button class="test-trigger-btn" onclick="cycleNextAlert(true); showToast(currentLanguage === 'tr' ? 'Canlı test uyarısı tetiklendi!' : 'Live-Test-Meldung ausgelöst!');">
          ${t.triggerTestAlert}
        </button>
      </div>
    </div>

    <!-- Filter chips -->
    <div class="category-chips-scroll" style="margin: 0 -16px 14px -16px;">
      <button class="chip-btn ${activeBulletinFilter === 'all' ? 'active' : ''}" onclick="setBulletinFilter('all')">${t.all}</button>
      <button class="chip-btn ${activeBulletinFilter === 's-bahn' ? 'active' : ''}" onclick="setBulletinFilter('s-bahn')">S-Bahn</button>
      <button class="chip-btn ${activeBulletinFilter === 'bvg' ? 'active' : ''}" onclick="setBulletinFilter('bvg')">BVG</button>
      <button class="chip-btn ${activeBulletinFilter === 'feuerwehr' ? 'active' : ''}" onclick="setBulletinFilter('feuerwehr')">Feuerwehr</button>
      <button class="chip-btn ${activeBulletinFilter === 'polizei' ? 'active' : ''}" onclick="setBulletinFilter('polizei')">Polizei</button>
      <button class="chip-btn ${activeBulletinFilter === 'bürgeramt' ? 'active' : ''}" onclick="setBulletinFilter('bürgeramt')">Bürgeramt</button>
    </div>

    <div class="bulletin-cards-list">
  `;

  filterAlerts.forEach(item => {
    const title = currentLanguage === "tr" ? item.titleTr : item.titleDe;
    const body = currentLanguage === "tr" ? item.bodyTr : item.bodyDe;

    html += `
      <div class="card-item bulletin-card" style="border-left: 5px solid ${item.color};">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="alert-tag-pill" style="background-color: ${item.bgLight}; color: ${item.color};">
              <span class="live-pulse-dot" style="background-color: ${item.color};"></span>
              ${item.tag}
            </span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">⏰ ${item.timestamp}</span>
          </div>

          <div class="card-title" style="font-size: 16px; margin-bottom: 6px;">${title}</div>
          <div class="card-desc" style="font-size: 13px; line-height: 1.45; color: var(--text-main); margin-bottom: 14px;">${body}</div>

          <div class="card-footer" style="padding-top: 10px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <a href="${item.officialUrl}" target="_blank" class="chip-btn active" style="text-decoration: none; font-size: 11.5px;">
              <i class="bi bi-box-arrow-up-right"></i> ${t.officialSource}
            </a>
            <button class="chip-btn" onclick="shareAlert(${item.id})" style="font-size: 11.5px; color: var(--berlin-blue); font-weight: 700;">
              <i class="bi bi-share-fill"></i> ${t.shareAlertBtn}
            </button>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function setBulletinFilter(filter) {
  activeBulletinFilter = filter;
  renderBulletinTab(document.getElementById("main-tab-content"));
}

function handleGlobalSearch(term) {
  if (!term) {
    renderTabContent();
    return;
  }
  const content = document.getElementById("main-tab-content");
  if (!content) return;

  const matchedKieze = BERLIN_KIEZE.filter(k => k.name.toLowerCase().includes(term) || k.subtitle.toLowerCase().includes(term));
  const matchedEvents = BERLIN_EVENTS.filter(e => e.title.toLowerCase().includes(term) || e.kiezName.toLowerCase().includes(term) || e.description.toLowerCase().includes(term));
  const matchedAlerts = BERLIN_LIVE_ALERTS.filter(a => a.tag.toLowerCase().includes(term) || a.titleDe.toLowerCase().includes(term) || a.titleTr.toLowerCase().includes(term) || a.bodyDe.toLowerCase().includes(term) || a.bodyTr.toLowerCase().includes(term));

  let html = `<h2 style="font-size: 17px; font-weight: 800; margin-bottom: 12px;">Arama Sonuçları: "${term}"</h2>`;

  if (!matchedKieze.length && !matchedEvents.length && !matchedAlerts.length) {
    html += `<div class="card-item" style="padding: 24px; text-align: center; color: var(--text-muted);">Sonuç bulunamadı. Lütfen başka bir kelime deneyin.</div>`;
  } else {
    if (matchedAlerts.length) {
      html += `<h3 style="font-size: 14px; color: var(--berlin-red); font-weight: 800; margin: 12px 0 6px;">Canlı Bildirimler (${matchedAlerts.length})</h3>`;
      matchedAlerts.forEach(a => {
        html += `
          <div class="card-item" style="padding: 12px; margin-bottom: 8px;">
            <div style="font-weight: 800;">${a.tag}: ${currentLanguage === "tr" ? a.titleTr : a.titleDe}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${currentLanguage === "tr" ? a.bodyTr : a.bodyDe}</div>
          </div>
        `;
      });
    }

    if (matchedKieze.length) {
      html += `<h3 style="font-size: 14px; color: var(--berlin-blue); font-weight: 800; margin: 12px 0 6px;">Kiezler (${matchedKieze.length})</h3>`;
      matchedKieze.forEach(k => {
        html += `
          <div class="card-item" style="padding: 12px; margin-bottom: 8px;">
            <div style="font-weight: 800;">${k.name}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${k.subtitle}</div>
          </div>
        `;
      });
    }
  }

  content.innerHTML = html;
}

// Home Tab
function renderHomeTab(container) {
  const t = I18N[currentLanguage];
  let html = `
    <div class="category-chips-scroll" style="margin: -12px -16px 14px -16px;">
      <button class="chip-btn ${activeCategory === 'all' ? 'active' : ''}" onclick="setCategory('all')">${t.all}</button>
      <button class="chip-btn ${activeCategory === 'gastro' ? 'active' : ''}" onclick="setCategory('gastro')">Gastronomie</button>
      <button class="chip-btn ${activeCategory === 'shopping' ? 'active' : ''}" onclick="setCategory('shopping')">Shopping</button>
      <button class="chip-btn ${activeCategory === 'culture' ? 'active' : ''}" onclick="setCategory('culture')">Kultur</button>
      <button class="chip-btn ${activeCategory === 'services' ? 'active' : ''}" onclick="setCategory('services')">Dienstleistungen</button>
    </div>
  `;

  // Sample businesses
  const businesses = [
    { name: "Mustafa's Gemüse Kebab", category: "Gastro", kiez: "Kreuzberg", rating: "4.7 ★★★★★ (3.8k)", img: "assets/images/food_mustafas.jpg", desc: "Der berühmteste Gemüse-Döner Berlins am Mehringdamm mit frittiertem Gemüse und Feta." },
    { name: "Café Anna Blume", category: "Gastro", kiez: "Prenzlauer Berg", rating: "4.8 ★★★★★ (2.1k)", img: "assets/images/food_annablume.jpg", desc: "Legendäre dreistöckige Frühstücksetagere mit echten Blumen im Kollwitzkiez." },
    { name: "Burgermeister Schlesisches Tor", category: "Gastro", kiez: "Kreuzberg", rating: "4.6 ★★★★★ (4.5k)", img: "assets/images/food_burgermeister.jpg", desc: "Kult-Burger in einer ehemaligen historischen Jugendstil-Gasanstalt unter den U-Bahn-Gleisen." },
    { name: "Curry 36", category: "Gastro", kiez: "Kreuzberg", rating: "4.5 ★★★★★ (5.2k)", img: "assets/images/food_curry36.jpg", desc: "Berlins Kult-Currywurst mit oder ohne Darm, direkt am Mehringdamm." }
  ];

  businesses.forEach(b => {
    html += `
      <div class="card-item">
        <img src="${b.img}" class="card-cover" alt="${b.name}">
        <div class="card-body">
          <div class="card-title">${b.name}</div>
          <div class="card-subtitle">📍 ${b.kiez} · ${b.rating}</div>
          <div class="card-desc">${b.desc}</div>
          <div class="card-footer">
            <span class="card-tag">${b.category}</span>
            <span style="color: var(--berlin-red); font-weight: 700; cursor: pointer;">Details ansehen →</span>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Kieze Tab (All Berlin Kieze & Districts)
function renderKiezeTab(container) {
  let html = `
    <h2 style="font-size: 18px; font-weight: 900; margin-bottom: 12px;">Berliner Kieze & Bezirke</h2>
  `;

  BERLIN_KIEZE.forEach(k => {
    html += `
      <div class="card-item">
        <img src="${k.image}" class="card-cover" alt="${k.name}">
        <div class="card-body">
          <div class="card-title">${k.name}</div>
          <div class="card-subtitle">📍 ${k.subtitle}</div>
          <div class="card-desc">Einwohner: ${k.population} · Flair: <strong>${k.vibe}</strong></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Events Tab (Direct Berlin.de Links & Cleaned Dates)
function renderEventsTab(container) {
  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h2 style="font-size: 18px; font-weight: 900;">Berlin Events & Festivaller</h2>
      <a href="https://www.berlin.de/events/volksfeste/" target="_blank" style="font-size: 11px; font-weight: 700; color: var(--berlin-red); text-decoration: none;">Offizielle Quelle: berlin.de ↗</a>
    </div>
  `;

  BERLIN_EVENTS.forEach(ev => {
    html += `
      <div class="card-item">
        <img src="${ev.image}" class="card-cover" alt="${ev.title}">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="card-title">${ev.title}</div>
            <span class="card-tag" style="background: var(--berlin-yellow-light); color: #B45309;">${ev.dayLabel} ${ev.dateNum}</span>
          </div>
          <div class="card-subtitle">📍 ${ev.kiezName} · ⏰ ${ev.time} · 💶 ${ev.price}</div>
          <div class="card-desc">${ev.description}</div>
          <div class="card-footer">
            <span class="card-tag">${ev.category}</span>
            <a href="${ev.link}" target="_blank" style="color: var(--berlin-red); font-weight: 700; text-decoration: none;">Berlin.de Resmi Sayfası →</a>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Emergency Tab (Polizei, BVG, Notruf)
function renderEmergencyTab(container) {
  let html = `
    <div style="background: var(--berlin-red-light); padding: 14px; border-radius: var(--radius-md); margin-bottom: 14px; border: 1px solid rgba(227,6,19,0.2);">
      <h3 style="color: var(--berlin-red-dark); font-size: 15px; font-weight: 800; margin-bottom: 4px;">🚨 Notfall- & Behördenportal Berlin</h3>
      <p style="font-size: 12px; color: var(--text-main); margin: 0;">Alle offiziellen Berliner Notrufnummern, BVG-Verkehrsleitstellen und die offizielle Internetwache der Polizei Berlin.</p>
    </div>
  `;

  EMERGENCY_DATA.forEach(em => {
    html += `
      <div class="card-item" style="padding: 14px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--berlin-red-light); color: var(--berlin-red); display: flex; align-items: center; justify-content: center; font-size: 20px;">
            <i class="bi ${em.icon}"></i>
          </div>
          <div>
            <div style="font-weight: 800; font-size: 15px; color: var(--text-main);">${em.name}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${em.desc}</div>
          </div>
        </div>
        ${em.link ? `
          <a href="${em.link}" target="_blank" class="chip-btn active" style="text-decoration: none; font-size: 11px;">Webseite ↗</a>
        ` : `
          <a href="tel:${em.number.replace(/\s+/g, '')}" class="chip-btn active" style="text-decoration: none; font-size: 13px; font-weight: 800;">📞 ${em.number}</a>
        `}
      </div>
    `;
  });

  container.innerHTML = html;
}

// Jobs Tab
function renderJobsTab(container) {
  let html = `
    <h2 style="font-size: 18px; font-weight: 900; margin-bottom: 12px;">Berlin Kiez Jobs</h2>
    <div class="card-item" style="padding: 16px;">
      <div class="card-title">Barista & Servicekraft (m/w/d)</div>
      <div class="card-subtitle">📍 Café am Engelbecken, Kreuzberg · Vollzeit/Teilzeit</div>
      <div class="card-desc">Suche motivierte Unterstützung für unser Kiez-Café am Wasser. Attraktives Gehalt + Trinkgeld.</div>
      <div class="card-footer">
        <span class="card-tag">Gastro</span>
        <a href="https://wa.me/4915126509586" target="_blank" style="color: var(--berlin-green); font-weight: 800; text-decoration: none;">💬 WhatsApp Bewerbung</a>
      </div>
    </div>
    <div class="card-item" style="padding: 16px;">
      <div class="card-title">Friseur / Barber (m/w/d)</div>
      <div class="card-subtitle">📍 Kiez Friseur Oranienstraße, Kreuzberg · Vollzeit</div>
      <div class="card-desc">Traditioneller Herren- und Damensalon sucht Verstärkung. Festanstellung mit übertariflicher Bezahlung.</div>
      <div class="card-footer">
        <span class="card-tag">Beauty</span>
        <a href="https://wa.me/4915126509586" target="_blank" style="color: var(--berlin-green); font-weight: 800; text-decoration: none;">💬 WhatsApp Bewerbung</a>
      </div>
    </div>
  `;
  container.innerHTML = html;
}

// Quiz Tab (With 1-5 Smileys & Confetti Effect)
function renderQuizTab(container) {
  const t = I18N[currentLanguage];
  const q = QUIZ_QUESTIONS[quizIndex];

  if (quizFinished) {
    const smileys = ["🧐", "😐", "🙂", "😃", "🤩"];
    let smileyIcons = "";
    for (let i = 1; i <= 5; i++) {
      const active = i <= quizScore;
      smileyIcons += `
        <span style="font-size: 32px; filter: ${active ? 'none' : 'grayscale(100%) opacity(30%)'}; transition: transform 0.2s;">
          ${smileys[i-1]}
        </span>
      `;
    }

    let feedback = quizScore === 5 ? "Perfekt! 5/5 Tam bir Berlin Uzmanısın!" :
                   quizScore >= 3 ? `${quizScore}/5 Harika! Berlin'i çok iyi biliyorsun!` :
                   `${quizScore}/5 Berlin hakkında öğrenecek daha çok kiez var!`;

    container.innerHTML = `
      <div class="card-item" style="padding: 24px; text-align: center;">
        <div style="font-size: 52px; margin-bottom: 10px;">🏆</div>
        <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 8px;">${t.congrats}</h2>
        <div style="display: flex; justify-content: center; gap: 8px; margin: 16px 0;">
          ${smileyIcons}
        </div>
        <div style="font-size: 16px; font-weight: 800; color: var(--berlin-red); margin-bottom: 12px;">${feedback}</div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">Berlin bilginiz test edildi. Toplam skorunuz: <strong>${quizScore} / ${QUIZ_QUESTIONS.length}</strong></p>
        <button class="btn-primary" onclick="restartQuiz()">${t.restart}</button>
      </div>
    `;
    triggerConfetti();
    return;
  }

  let optionsHtml = "";
  q.options.forEach((opt, idx) => {
    let btnStyle = "background: var(--surface-color); border: 1.5px solid var(--border-color); color: var(--text-main);";
    if (quizChecked) {
      if (idx === q.correctIndex) {
        btnStyle = "background: var(--berlin-green-light); border: 1.5px solid var(--berlin-green); color: var(--berlin-green); font-weight: 800;";
      } else if (idx === quizSelectedOption) {
        btnStyle = "background: var(--berlin-red-light); border: 1.5px solid var(--berlin-red); color: var(--berlin-red); font-weight: 800;";
      }
    } else if (idx === quizSelectedOption) {
      btnStyle = "background: var(--berlin-red-light); border: 1.5px solid var(--berlin-red); color: var(--berlin-red-dark); font-weight: 800;";
    }

    optionsHtml += `
      <button class="form-control" style="${btnStyle}; text-align: left; padding: 14px; margin-bottom: 10px; border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s;" onclick="selectQuizOption(${idx})">
        ${opt}
      </button>
    `;
  });

  container.innerHTML = `
    <div class="card-item" style="overflow: hidden;">
      <div style="position: relative;">
        <img src="${q.image}" class="card-cover" style="height: 200px;" alt="${q.question}">
        <span class="card-tag" style="position: absolute; top: 12px; left: 12px; background: var(--berlin-red); color: #FFF;">
          FRAGE ${quizIndex + 1} / ${QUIZ_QUESTIONS.length}
        </span>
      </div>
      <div class="card-body">
        <h3 style="font-size: 17px; font-weight: 800; line-height: 1.4; margin-bottom: 16px;">${q.question}</h3>
        <div>${optionsHtml}</div>
        ${quizChecked ? `
          <div style="background: var(--berlin-green-light); color: #14532D; padding: 12px; border-radius: var(--radius-sm); font-size: 13px; margin: 12px 0;">
            ${q.explanation}
          </div>
          <button class="btn-primary" onclick="nextQuizQuestion()">${quizIndex + 1 < QUIZ_QUESTIONS.length ? t.nextQuestion : t.seeResults}</button>
        ` : ''}
      </div>
    </div>
  `;
}

function selectQuizOption(index) {
  if (quizChecked) return;
  quizSelectedOption = index;
  quizChecked = true;
  if (index === QUIZ_QUESTIONS[quizIndex].correctIndex) {
    quizScore++;
  }
  renderQuizTab(document.getElementById("main-tab-content"));
}

function nextQuizQuestion() {
  if (quizIndex + 1 < QUIZ_QUESTIONS.length) {
    quizIndex++;
    quizSelectedOption = null;
    quizChecked = false;
  } else {
    quizFinished = true;
  }
  renderQuizTab(document.getElementById("main-tab-content"));
}

function restartQuiz() {
  quizIndex = 0;
  quizScore = 0;
  quizSelectedOption = null;
  quizChecked = false;
  quizFinished = false;
  renderQuizTab(document.getElementById("main-tab-content"));
}

// Confetti Effect
function triggerConfetti() {
  const canvas = document.createElement("canvas");
  canvas.id = "confetti-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "200";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 8 + 4,
    color: ['#E30613', '#FFCC00', '#1F9D55', '#0284C7', '#8B5CF6'][Math.floor(Math.random() * 5)],
    speed: Math.random() * 5 + 3,
    spin: Math.random() * 0.2 - 0.1
  }));

  let frames = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.y += p.speed;
      p.x += Math.sin(p.y * 0.05) * 2;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    frames++;
    if (frames < 200) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  animate();
}

// Story Viewer Auto-Advance & Controls
function openStoryViewer(index) {
  const stories = getStories().filter(s => s.status === "approved");
  if (!stories.length) return;
  
  activeStoryIndex = index;
  storyProgress = 0;
  
  const modal = document.createElement("div");
  modal.className = "story-modal";
  modal.id = "story-modal-overlay";
  
  document.body.appendChild(modal);
  renderStorySlide();
  startStoryTimer();
}

function renderStorySlide() {
  const modal = document.getElementById("story-modal-overlay");
  if (!modal) return;
  const stories = getStories().filter(s => s.status === "approved");
  const s = stories[activeStoryIndex];

  modal.innerHTML = `
    <div class="story-viewer-box">
      <div class="story-progress-bar">
        <div class="story-progress-fill" id="story-progress-bar-fill"></div>
      </div>
      
      <div class="story-header-overlay">
        <div class="story-header-author">
          <img src="${s.image || 'assets/images/mykiez_logo.png'}" alt="${s.author}">
          <div>
            <div style="font-weight: 800; font-size: 13.5px;">${s.author}</div>
            <div style="font-size: 11px; opacity: 0.85;">📍 ${s.kiez} · ${activeStoryIndex + 1}/${stories.length}</div>
          </div>
        </div>
        <button class="btn-icon-circle" style="background: rgba(0,0,0,0.5); color: #FFF;" onclick="closeStoryViewer()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="story-watermark-logo">
        <img src="assets/images/mykiez_logo.png" alt="My Kiez Berlin">
      </div>

      <div class="story-content-view">
        <div class="story-nav-tap story-nav-prev" onclick="prevStory()"></div>
        <div class="story-nav-tap story-nav-next" onclick="nextStory()"></div>
        ${s.isVideo ? `
          <video src="${s.videoUri || ''}" autoplay playsinline loop style="width: 100%; height: 100%; object-fit: contain;"></video>
        ` : `
          <img src="${s.image}" alt="${s.headline}">
        `}
      </div>

      <div class="story-text-card">
        <div style="font-weight: 900; font-size: 16px; margin-bottom: 6px;">${s.headline}</div>
        <div style="font-size: 13px; line-height: 1.4; color: #E2E8F0;">${s.subtext}</div>
        ${s.link ? `
          <a href="${s.link}" target="_blank" style="display: inline-block; margin-top: 10px; color: var(--berlin-yellow); font-weight: 800; font-size: 12px; text-decoration: none;">Mehr erfahren ↗</a>
        ` : ''}
      </div>
    </div>
  `;
}

function startStoryTimer() {
  clearInterval(storyTimer);
  storyProgress = 0;
  const durationMs = 7000;
  const interval = 50;
  const step = (interval / durationMs) * 100;

  storyTimer = setInterval(() => {
    if (isStoryPaused) return;
    storyProgress += step;
    const bar = document.getElementById("story-progress-bar-fill");
    if (bar) bar.style.width = `${storyProgress}%`;

    if (storyProgress >= 100) {
      nextStory();
    }
  }, interval);
}

function nextStory() {
  const stories = getStories().filter(s => s.status === "approved");
  if (activeStoryIndex < stories.length - 1) {
    activeStoryIndex++;
    renderStorySlide();
    startStoryTimer();
  } else {
    closeStoryViewer();
  }
}

function prevStory() {
  if (activeStoryIndex > 0) {
    activeStoryIndex--;
    renderStorySlide();
    startStoryTimer();
  }
}

function closeStoryViewer() {
  clearInterval(storyTimer);
  const modal = document.getElementById("story-modal-overlay");
  if (modal) modal.remove();
}

// User Story Submission Modal (+ Durum Paylaş)
function openCreateStoryModal() {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "create-story-modal";
  
  let kiezOptions = BERLIN_KIEZE.map(k => `<option value="${k.name}">${k.name}</option>`).join("");
  
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">Durum / Hikâye Paylaş</h3>
        <button class="btn-icon-circle" onclick="document.getElementById('create-story-modal').remove()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">Fotoğraf veya video ekle, başlık yaz. Yönetici onayından sonra ana sayfada yayınlanır.</p>
      
      <div class="form-group">
        <label class="form-label">Başlık</label>
        <input type="text" id="new-story-headline" class="form-control" placeholder="Örn: Yeni Kiez İndirimi veya Olay">
      </div>

      <div class="form-group">
        <label class="form-label">Açıklama</label>
        <textarea id="new-story-subtext" class="form-control" rows="3" placeholder="Detaylar..."></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">Mahalle</label>
        <select id="new-story-kiez" class="form-control">
          ${kiezOptions}
          <option value="Tegel">Tegel</option>
          <option value="Spandau">Spandau</option>
          <option value="Ganz Berlin">Ganz Berlin</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Görsel / Fotoğraf Yükle</label>
        <input type="file" id="new-story-file" accept="image/*,video/*" class="form-control">
      </div>

      <button class="btn-primary" onclick="submitUserStory()">Paylaş & Yayınla 🎉</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function submitUserStory() {
  const headline = document.getElementById("new-story-headline").value.trim();
  const subtext = document.getElementById("new-story-subtext").value.trim();
  const kiez = document.getElementById("new-story-kiez").value;
  const fileInput = document.getElementById("new-story-file");

  if (!headline) {
    alert("Lütfen bir başlık girin!");
    return;
  }

  const newStory = {
    id: `story_custom_${Date.now()}`,
    author: "Kullanıcı",
    kiez: kiez,
    headline: headline,
    subtext: subtext,
    image: "assets/images/hero_berlin.jpg",
    isVideo: false,
    durationHours: 24,
    status: "approved", // Directly available on web!
    link: "https://mykiezberlin.com"
  };

  const stories = getStories();
  stories.unshift(newStory);
  saveStories(stories);

  alert("Hikayeniz başarıyla yayınlandı! 🎉");
  document.getElementById("create-story-modal").remove();
  renderStoriesBar();
}
