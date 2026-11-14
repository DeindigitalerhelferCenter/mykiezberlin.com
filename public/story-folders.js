/* My Kiez Berlin – 2026-11-14 (owner), same functions in the Android app (v1.34):
   1. Story folders: chips above the stories (Kiez & Berlin, Eilmeldungen, Angebote, Türkei …). A tap shows only that
      folder; 🔔 follows a folder (stored in this browser) – new stories in followed folders get a red dot and,
      if allowed, a browser notification. The story form gets "📁 Ordner" (empty = the server sorts automatically).
   2. Info windows: an ⓘ next to the headings opens what you can do there, if it is free, what you may upload/write.
      Texts come from /help.json (shared with the app). First visit: short tour (4 steps), again via "❓ Hilfe".
   3. Every WhatsApp button is WhatsApp green.
   4. Headline slider: darker picture, bigger headline.
   5. Story viewer: long texts (admin) keep their line breaks and scroll. */
(function () {
  "use strict";
  var FOLLOW_KEY = "mk_follow_cats";
  var SEEN_KEY = "mk_follow_seen";
  var TOUR_KEY = "mk_tour_done_v1";
  var activeCat = "";
  var CATS = [
    ["berlin", "🏘️", "Kiez & Berlin", "Mahalleler & Berlin", "Kiez & Berlin"], ["info", "ℹ️", "Info", "Info", "Info"], ["eil", "🚨", "Eilmeldungen", "Acil / Son Dakika", "Breaking news"],
    ["verkehr", "🚇", "Verkehr & BVG", "Trafik & BVG", "Traffic & BVG"], ["deutschland", "🇩🇪", "Deutschland", "Almanya", "Germany"],
    ["welt", "🌍", "Europa & Welt", "Avrupa & Dünya", "Europe & World"], ["tuerkei", "🇹🇷", "Türkei", "Türkiye", "Turkey"],
    ["angebote", "🏷️", "Angebote & Rabatte", "İndirimler & Fırsatlar", "Deals"], ["sponsoren", "🤝", "Sponsoren", "Sponsorlar", "Sponsors"],
    ["neue", "🆕", "Neu", "Yeni", "New"], ["events", "🎉", "Events", "Etkinlik", "Events"], ["sport", "⚽", "Sport", "Spor", "Sport"],
    ["essen", "🍽️", "Essen & Trinken", "Yeme & İçme", "Food & drink"], ["wohnen", "🏠", "Wohnen", "Emlak & Kiralık", "Housing"],
    ["jobs", "💼", "Jobs", "İş İlanları", "Jobs"], ["aemter", "🏛️", "Ämter & Info", "Resmî İşler & Bilgi", "Offices & info"],
    ["fundsachen", "🔎", "Verloren & Gefunden", "Kayıp & Bulundu", "Lost & found"],
  ];

  function lang() { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0 ? "tr" : typeof currentLanguage === "string" && currentLanguage.indexOf("en") === 0 ? "en" : "de"; }
  function L(de, tr, en) { var l = lang(); return l === "tr" ? tr : l === "en" ? (en || de) : de; }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function readJson(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (x) { return d; } }
  function writeJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (x) {} }
  function catLabel(c) { return lang() === "tr" ? c[3] : lang() === "en" ? c[4] : c[2]; }
  function storyCats(s) { return Array.isArray(s.cats) && s.cats.length ? s.cats : ["berlin"]; }
  function approved() { return typeof getStories === "function" ? getStories().filter(function (s) { return s.status === "approved"; }) : []; }

  // ---------- 1. folders ----------
  function followed() { return readJson(FOLLOW_KEY, []); }
  function unseen(cat) {
    var seen = readJson(SEEN_KEY, {})[cat] || 0;
    return approved().filter(function (s) { return storyCats(s).indexOf(cat) >= 0 && (s.approvedAt || 0) > seen; }).length;
  }
  function markSeen(cat) { var m = readJson(SEEN_KEY, {}); m[cat] = Date.now(); writeJson(SEEN_KEY, m); }

  function renderCatRow() {
    var box = document.getElementById("stories-scroll-container");
    if (!box) return;
    var row = document.getElementById("mk-cat-row");
    if (!row) {
      row = document.createElement("div");
      row.id = "mk-cat-row";
      row.className = "mk-cat-row";
      box.parentNode.insertBefore(row, box);
    }
    var list = approved();
    var count = function (k) { return list.filter(function (s) { return storyCats(s).indexOf(k) >= 0; }).length; };
    var fol = followed();
    var chips = '<button type="button" class="mk-cat' + (activeCat ? "" : " on") + '" onclick="mkStoryCat(\'\')">' + e(L("Alle", "Tümü", "All")) + " (" + list.length + ")</button>";
    CATS.forEach(function (c) {
      var n = count(c[0]);
      var isF = fol.indexOf(c[0]) >= 0;
      if (!n && !isF && activeCat !== c[0]) return; // empty folders stay hidden (all are in the story form)
      var dot = isF && unseen(c[0]) ? '<i class="mk-cat-dot"></i>' : "";
      chips += '<button type="button" class="mk-cat' + (activeCat === c[0] ? " on" : "") + '" onclick="mkStoryCat(\'' + c[0] + '\')">' + c[1] + " " + e(catLabel(c)) + (n ? " (" + n + ")" : "") + (isF ? " 🔔" : "") + dot + "</button>";
    });
    chips += '<button type="button" class="mk-cat mk-cat-more" onclick="mkStoryCatAll()" title="' + e(L("Alle Ordner", "Tüm klasörler", "All folders")) + '">📁 ' + e(L("Ordner", "Klasörler", "Folders")) + "</button>";
    row.innerHTML = chips;
  }

  function hookStoriesBar() {
    if (typeof renderStoriesBar !== "function" || renderStoriesBar.__mkCats) return;
    var base = renderStoriesBar;
    renderStoriesBar = function () {
      base.apply(this, arguments);
      renderCatRow();
      if (!activeCat) return;
      // only the stories of the chosen folder (the index stays the one of the full list, so the viewer works as before)
      var container = document.getElementById("stories-scroll-container");
      var all = approved();
      var items = container ? container.querySelectorAll(".story-item") : [];
      for (var i = 1; i < items.length; i++) { // item 0 = "+"
        var s = all[i - 1];
        if (s && storyCats(s).indexOf(activeCat) < 0) items[i].style.display = "none";
      }
      var c = CATS.find(function (x) { return x[0] === activeCat; });
      var isF = followed().indexOf(activeCat) >= 0;
      container.insertAdjacentHTML("beforeend", '<div class="story-item mk-cat-follow" onclick="mkFollowCat(\'' + activeCat + '\')"><div class="story-avatar-ring add-new" style="font-size:24px">' + (isF ? "🔕" : "🔔") + '</div><span class="story-label">' + e(isF ? L("Entfolgen", "Takibi bırak", "Unfollow") : L("Folgen", "Takip et", "Follow")) + "</span></div>");
      if (c) markSeen(activeCat);
    };
    renderStoriesBar.__mkCats = true;
  }
  window.mkStoryCat = function (k) { activeCat = k; if (typeof renderStoriesBar === "function") renderStoriesBar(); };
  window.mkFollowCat = function (k) {
    var f = followed();
    var i = f.indexOf(k);
    if (i >= 0) f.splice(i, 1); else f.push(k);
    writeJson(FOLLOW_KEY, f);
    markSeen(k);
    if (i < 0) {
      if (typeof showToast === "function") showToast(L("Du folgst jetzt diesem Ordner 🔔", "Bu klasörü takip ediyorsun 🔔", "You now follow this folder 🔔"));
      try { if (window.Notification && Notification.permission === "default") Notification.requestPermission(); } catch (x) {}
    }
    if (typeof renderStoriesBar === "function") renderStoriesBar();
  };
  window.mkStoryCatAll = function () {
    var fol = followed();
    var body = CATS.map(function (c) {
      var isF = fol.indexOf(c[0]) >= 0;
      return '<div class="mk-cat-line"><button type="button" onclick="mkCloseHelp();mkStoryCat(\'' + c[0] + '\')">' + c[1] + " " + e(catLabel(c)) + '</button><button type="button" class="mk-cat-bell" onclick="mkFollowCat(\'' + c[0] + '\');mkStoryCatAll()">' + (isF ? "🔔 " + e(L("Folge ich", "Takipte", "Following")) : "🔕 " + e(L("Folgen", "Takip et", "Follow"))) + "</button></div>";
    }).join("");
    openSheet("📁 " + L("Story-Ordner", "Hikâye Klasörleri", "Story folders"), body + '<p class="mk-help-note">' + e(L("🔔 = du bekommst eine Nachricht bei neuen Stories in diesem Ordner.", "🔔 = bu klasörde yeni hikâye olunca bildirim alırsın.", "🔔 = you are notified about new stories in this folder.")) + "</p>");
  };

  // browser notification for followed folders (only while the page is open; the app notifies in the background)
  function notifyFollowed() {
    var fol = followed();
    if (!fol.length || !window.Notification || Notification.permission !== "granted") return;
    var last = readJson("mk_follow_notified", 0);
    var fresh = approved().filter(function (s) { return (s.approvedAt || 0) > last && storyCats(s).some(function (k) { return fol.indexOf(k) >= 0; }); });
    if (!fresh.length) return;
    writeJson("mk_follow_notified", Date.now());
    if (!last) return; // first run: only remember the time
    try { new Notification("My Kiez Berlin", { body: (fresh.length > 1 ? fresh.length + " × " : "") + String(fresh[0].headline || "").replace(/&[a-z#0-9]+;/gi, " "), icon: "/assets/images/mykiez_logo.png" }); } catch (x) {}
  }

  // story form: folder field
  function hookForm() {
    if (typeof openCreateStoryModal !== "function" || openCreateStoryModal.__mkCats) return;
    var base = openCreateStoryModal;
    openCreateStoryModal = function () {
      var r = base.apply(this, arguments);
      var kind = document.getElementById("new-story-kind");
      var group = kind && kind.closest(".form-group");
      if (group && !document.getElementById("new-story-category")) {
        var opts = '<option value="">🤖 ' + e(L("Automatisch (KI sortiert)", "Otomatik (KI ayırır)", "Automatic (AI sorts)")) + "</option>" +
          CATS.map(function (c) { return '<option value="' + c[0] + '"' + (activeCat === c[0] ? " selected" : "") + ">" + c[1] + " " + e(catLabel(c)) + "</option>"; }).join("");
        group.insertAdjacentHTML("beforebegin", '<div class="form-group"><label class="form-label">📁 ' + e(L("Ordner", "Klasör", "Folder")) + ' <button type="button" class="mk-i" onclick="mkHelp(\'folders\')">ⓘ</button></label><select id="new-story-category" class="form-control">' + opts + "</select></div>");
      }
      // 2026-11-14 (owner): logged-in admin may write long texts
      var admin = false;
      try { admin = !!sessionStorage.getItem("mykiez_admin_token_v1"); } catch (x) {}
      if (admin) {
        var h = document.getElementById("new-story-headline"), t = document.getElementById("new-story-subtext");
        if (h) h.maxLength = 300;
        if (t) { t.maxLength = 10000; t.rows = 10; t.placeholder = "Admin: bis 10.000 Zeichen, Absätze bleiben erhalten"; }
      }
      return r;
    };
    openCreateStoryModal.__mkCats = true;
  }

  // ---------- 2. info windows + tour ----------
  var help = null, helpLoading = null;
  function loadHelp() {
    if (help) return Promise.resolve(help);
    if (!helpLoading) helpLoading = fetch("/help.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { help = d; return d; }).catch(function () { return null; });
    return helpLoading;
  }
  function tx(o) { return o ? (o[lang()] || o.de || "") : ""; }
  function openSheet(title, html) {
    window.mkCloseHelp();
    var box = document.createElement("div");
    box.id = "mk-help";
    box.innerHTML = '<div class="mk-help-bg" onclick="mkCloseHelp()"></div><div class="mk-help-sheet" role="dialog" aria-modal="true"><button type="button" class="mk-help-x" onclick="mkCloseHelp()" aria-label="' + e(L("Schließen", "Kapat", "Close")) + '">✕</button><h3>' + e(title) + "</h3>" + html + "</div>";
    document.body.appendChild(box);
  }
  window.mkCloseHelp = function () { var n = document.getElementById("mk-help"); if (n) n.remove(); };
  window.mkHelp = function (topic) {
    loadHelp().then(function (d) {
      var t = d && d.topics && d.topics[topic];
      if (!t) return;
      var row = function (icon, label, o) { var v = tx(o); return v ? '<div class="mk-help-row"><b>' + icon + " " + e(label) + "</b><p>" + e(v) + "</p></div>" : ""; };
      openSheet((t.icon || "ⓘ") + " " + tx(t.title),
        row("❓", L("Was ist das?", "Bu nedir?", "What is it?"), t.what) +
        row("💶", L("Kostenlos?", "Ücretsiz mi?", "Free?"), t.free) +
        row("📤", L("Was kann ich hochladen?", "Neler yükleyebilirim?", "What can I upload?"), t.upload) +
        row("✍️", L("Was kann ich schreiben / teilen?", "Neler yazabilir / paylaşabilirim?", "What can I write / share?"), t.write) +
        row("ℹ️", L("Gut zu wissen", "Bilmekte fayda var", "Good to know"), t.note) +
        '<button type="button" class="mk-help-tour" onclick="mkTour(0)">🧭 ' + e(L("Kurze Einführung", "Kısa tanıtım", "Short tour")) + "</button>");
    });
  };
  window.mkTour = function (i) {
    loadHelp().then(function (d) {
      var steps = (d && d.tour) || [];
      if (i >= steps.length) { window.mkCloseHelp(); try { localStorage.setItem(TOUR_KEY, "1"); } catch (x) {} return; }
      var s = steps[i];
      var dots = steps.map(function (_, k) { return '<i class="' + (k === i ? "on" : "") + '"></i>'; }).join("");
      openSheet((s.icon || "") + " My Kiez Berlin", '<p class="mk-tour-text">' + e(tx(s)) + '</p><div class="mk-tour-dots">' + dots + '</div><div class="mk-tour-btns"><button type="button" onclick="try{localStorage.setItem(\'' + TOUR_KEY + '\',\'1\')}catch(x){};mkCloseHelp()">' + e(L("Überspringen", "Geç", "Skip")) + '</button><button type="button" class="main" onclick="mkTour(' + (i + 1) + ')">' + e(i + 1 < steps.length ? L("Weiter", "İleri", "Next") : L("Los geht's", "Başlayalım", "Let's go")) + " →</button></div>");
    });
  };

  var TAB_TOPIC = { bulletin: "live", sport: "sport", deals: "deals", reporter: "reporter", sponsors: "sponsors", tuerkei: "tuerkei", quiz: "quiz",
    emergency: "notruf", jobs: "jobs", events: "events", food: "food", tips: "tips", kieze: "kieze", telefonbuch: "telefonbuch" };
  function iBtn(topic) { return '<button type="button" class="mk-i" onclick="event.stopPropagation();mkHelp(\'' + topic + '\')" aria-label="Info">ⓘ</button>'; }
  function addInfoButtons() {
    var st = document.querySelector(".stories-title");
    if (st && !st.querySelector(".mk-i")) st.insertAdjacentHTML("beforeend", " " + iBtn("stories"));
    var content = document.getElementById("main-tab-content");
    if (!content || typeof currentTab !== "string") return;
    var topic = TAB_TOPIC[currentTab];
    if (topic) {
      var h = content.querySelector("h2, .ext-heading, h3");
      if (h && !h.querySelector(".mk-i")) h.insertAdjacentHTML("beforeend", " " + iBtn(topic));
    }
    if (currentTab === "home") {
      var m = content.querySelector(".ext-manset");
      if (m && !m.parentNode.querySelector(".mk-i-manset")) m.insertAdjacentHTML("beforebegin", '<div class="mk-i-manset">📰 ' + e(L("Berliner Schlagzeilen", "Berlin Manşetleri", "Berlin headlines")) + " " + iBtn("news") + "</div>");
      content.querySelectorAll(".mk-deck-head b").forEach(function (b) {
        if (b.querySelector(".mk-i")) return;
        var t = b.textContent;
        var k = /Polizei|Polis/.test(t) ? "live" : /Sport|Spor/.test(t) ? "sport" : /Notruf|Acil/.test(t) ? "notruf" : /Reporter|muhabir/i.test(t) ? "reporter" : /Kiez passt|mahalle uyuyor/.test(t) ? "quiz" : /Kleinanzeigen|ilanlar/.test(t) ? "community" : /Telefonbuch|telefon/i.test(t) ? "telefonbuch" : /Guide|Tipps|rehberi/.test(t) ? "tips" : /Events|Etkinlik/.test(t) ? "events" : /Jobs|İş/.test(t) ? "jobs" : "";
        if (k) b.insertAdjacentHTML("beforeend", " " + iBtn(k));
      });
      var all = content.querySelector(".mk-deck-all");
      if (all && !all.querySelector(".mk-i")) all.insertAdjacentHTML("beforeend", iBtn("sponsors"));
    }
  }
  function hookTabs() {
    if (typeof renderTabContent !== "function" || renderTabContent.__mkHelp) return;
    var base = renderTabContent;
    renderTabContent = function () { var r = base.apply(this, arguments); try { addInfoButtons(); } catch (x) {} return r; };
    renderTabContent.__mkHelp = true;
  }
  // "❓ Hilfe" button in the header
  function addHelpButton() {
    if (document.getElementById("mk-help-btn")) return;
    var bell = document.getElementById("bell-toggle-btn");
    if (!bell) return;
    var b = document.createElement("button");
    b.id = "mk-help-btn";
    b.className = "btn-icon-circle";
    b.type = "button";
    b.title = "Hilfe / Yardım";
    b.setAttribute("aria-label", "Hilfe / Yardım");
    b.textContent = "❓";
    b.onclick = function () { window.mkTour(0); };
    bell.parentNode.insertBefore(b, bell);
  }

  // ---------- styles (3. WhatsApp green, 4. headlines, 5. long story texts) ----------
  var css = document.createElement("style");
  css.textContent =
    ".mk-cat-row{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 8px;scrollbar-width:none}.mk-cat-row::-webkit-scrollbar{display:none}" +
    ".mk-cat{flex:none;position:relative;border:1px solid rgba(0,0,0,.12);background:var(--card-bg,#fff);color:inherit;border-radius:999px;padding:6px 11px;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap}" +
    ".mk-cat.on{background:#E30613;border-color:#E30613;color:#fff}.mk-cat-dot{position:absolute;top:2px;right:4px;width:8px;height:8px;border-radius:50%;background:#E30613;border:1.5px solid #fff}" +
    ".mk-cat-line{display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(0,0,0,.07)}.mk-cat-line button{border:0;background:none;font:inherit;color:inherit;cursor:pointer;text-align:left}" +
    ".mk-cat-line button:first-child{flex:1;font-weight:700;padding:6px 0}.mk-cat-bell{background:rgba(0,0,0,.06)!important;border-radius:999px!important;padding:6px 10px!important;font-size:12.5px!important;font-weight:700}" +
    ".mk-i{border:0;background:rgba(26,115,232,.12);color:#1A73E8;border-radius:50%;width:22px;height:22px;font-size:13px;line-height:22px;padding:0;cursor:pointer;vertical-align:middle;font-weight:800;margin-left:4px}" +
    ".mk-i-manset{font-weight:800;font-size:14px;margin:6px 0 6px;display:flex;align-items:center;gap:2px;grid-column:1/-1}" +
    "#mk-help{position:fixed;inset:0;z-index:10060;display:flex;align-items:flex-end;justify-content:center}.mk-help-bg{position:absolute;inset:0;background:rgba(0,0,0,.45)}" +
    ".mk-help-sheet{position:relative;width:100%;max-width:520px;max-height:86vh;overflow:auto;background:var(--card-bg,#fff);color:inherit;border-radius:20px 20px 0 0;padding:18px 18px 24px;box-shadow:0 -6px 30px rgba(0,0,0,.25)}" +
    "@media(min-width:640px){#mk-help{align-items:center}.mk-help-sheet{border-radius:20px}}" +
    ".mk-help-sheet h3{margin:0 40px 10px 0;font-size:18px}.mk-help-x{position:absolute;top:10px;right:10px;border:0;background:rgba(0,0,0,.06);border-radius:50%;width:34px;height:34px;cursor:pointer;color:inherit}" +
    ".mk-help-row{padding:8px 0;border-bottom:1px solid rgba(0,0,0,.07)}.mk-help-row b{font-size:13px}.mk-help-row p{margin:3px 0 0;font-size:14px;line-height:1.45}" +
    ".mk-help-note{font-size:12.5px;opacity:.75;margin-top:10px}.mk-help-tour{margin-top:12px;border:0;background:rgba(0,0,0,.06);border-radius:10px;padding:9px 12px;font-weight:700;cursor:pointer;color:inherit}" +
    ".mk-tour-text{font-size:16px;line-height:1.5;margin:4px 0 14px}.mk-tour-dots{display:flex;gap:6px;justify-content:center;margin-bottom:14px}.mk-tour-dots i{width:8px;height:8px;border-radius:50%;background:rgba(0,0,0,.2)}.mk-tour-dots i.on{background:#E30613}" +
    ".mk-tour-btns{display:flex;gap:8px}.mk-tour-btns button{flex:1;border:0;border-radius:12px;padding:12px;font-weight:800;cursor:pointer;background:rgba(0,0,0,.07);color:inherit}.mk-tour-btns .main{background:#E30613;color:#fff}" +
    "body.dark-mode .mk-help-sheet,.ext-dark .mk-help-sheet,[data-theme=dark] .mk-help-sheet{background:#1e2329;color:#e6edf3}" +
    /* 3. WhatsApp buttons green everywhere (not the plain info rows in the contact sheet) */
    "a[href*='wa.me/']:not(.mk-si-row):not(.story-text-card a),a[href*='api.whatsapp.com']:not(.mk-si-row){background:#25D366!important;border-color:#25D366!important;color:#fff!important}" +
    "a[href*='wa.me/']:not(.mk-si-row) i{color:#fff!important}" +
    /* 4. headline slider: darker picture, bigger headline */
    ".ext-manset{height:220px}.ext-manset img{filter:brightness(.55) saturate(1.05)}" +
    ".ext-manset div{top:0;display:flex;flex-direction:column;justify-content:flex-end;padding:16px;background:linear-gradient(rgba(0,0,0,.05),rgba(0,0,0,.75))}" +
    ".ext-manset span{font-size:12px;font-weight:700;opacity:.95}.ext-manset strong{font-size:20px;line-height:1.25;font-weight:900;text-shadow:0 1px 4px rgba(0,0,0,.6)}" +
    /* 5. long story texts */
    ".story-text-card{max-height:46vh;overflow-y:auto}.story-text-card>div:nth-child(2){white-space:pre-line}";
  document.head.appendChild(css);

  function init() {
    hookStoriesBar(); hookForm(); hookTabs(); addHelpButton();
    if (typeof renderStoriesBar === "function") renderStoriesBar();
    try { addInfoButtons(); } catch (x) {}
  }
  init();
  window.addEventListener("load", function () {
    init();
    setTimeout(notifyFollowed, 4000);
    var done = false;
    try { done = localStorage.getItem(TOUR_KEY) === "1"; } catch (x) { done = true; }
    if (!done && !/[?&](sponsor|tab)=/.test(location.search)) setTimeout(function () { window.mkTour(0); }, 1500);
  });
  setInterval(function () { try { addInfoButtons(); } catch (x) {} }, 2500);
})();
