/* My Kiez Berlin – 2026-11-21 (owner), same functions in the Android app (v1.46):
   1. Trusted accounts: a person with a story key (e.g. "Kiez26", link ?storykey=…) shares like the admin –
      no daily limit, up to 10 pictures/videos per story, online at once (the AI check stays).      [always on]
   2. "Alle Sponsoren" + "Türkiye Sponsorları": two big buttons side by side, glowing, 360° spin on tap.
   3. Story bar: ONE circle per sponsor with all its pictures/videos of the last 24 hours (/api/sponsor-stories).
   4. Sponsor uploads with a price in the text appear under "Exklusive Kiez-Vorteile" too.
   5. Offers get a glowing "🏷️ N Angebote" chip above the stories and a banner on the home page.
   6. "B2B" -> "Ihr Betrieb in ganz Berlin sichtbar?" on top + bottom of every page, header pill renamed,
      popup at the end of the page every 2nd time.
   Owner (2026-11-21): first only for the admin to test -> points 2–6 only when the admin is logged in on this device
   (or ?mkbeta=1 was opened once). Set RELEASE = true to show them to everybody. */
(function () {
  "use strict";
  var RELEASE = true; // 2026-11-22 (owner): now for everybody
  var KEY_STORE = "mk_story_key";
  var BETA_STORE = "mk_beta_2026_11_21";
  var BOTTOM_STORE = "mk_b2b_bottom_n";

  function lsGet(k) { try { return localStorage.getItem(k) || ""; } catch (x) { return ""; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (x) {} }
  function lang() { var l = typeof currentLanguage === "string" ? currentLanguage : "de"; return l.indexOf("tr") === 0 ? "tr" : l.indexOf("en") === 0 ? "en" : "de"; }
  function L(de, tr, en) { var l = lang(); return l === "tr" ? tr : l === "en" ? (en || de) : de; }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function toast(t) { if (typeof showToast === "function") showToast(t); }

  var params = new URLSearchParams(location.search);
  if (params.get("mkbeta") === "1") lsSet(BETA_STORE, "1");
  if (params.get("mkbeta") === "0") lsSet(BETA_STORE, "");
  var ON = RELEASE || lsGet("mykiez_admin_auth_v1") === "true" || lsGet(BETA_STORE) === "1";

  /* ---------------- 1. story key (trusted person) ---------------- */
  var newKey = params.get("storykey");
  if (newKey && /^[a-f0-9]{32,64}$/.test(newKey)) {
    lsSet(KEY_STORE, newKey);
    params.delete("storykey");
    try { history.replaceState(null, "", location.pathname + (params.toString() ? "?" + params : "") + location.hash); } catch (x) {}
    setTimeout(function () { toast(L("🔑 Vertrauens-Konto aktiv: Stories ohne Limit, bis 10 Bilder/Videos.", "🔑 Güvenilir hesap aktif: sınırsız hikâye, 10 resim/videoya kadar.")); }, 1500);
  }
  function storyKey() { var k = lsGet(KEY_STORE); return /^[a-f0-9]{32,64}$/.test(k) ? k : ""; }
  window.mkStoryKey = storyKey;

  var baseFetch = window.fetch;
  window.fetch = function (input, init) {
    try {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var key = storyKey();
      if (key && /\/api\/stories(\?|$)/.test(url)) {
        init = init || {};
        var h = new Headers(init.headers || {});
        h.set("x-story-key", key);
        init.headers = h;
        if (String(init.method || "").toUpperCase() === "POST" && init.body instanceof FormData && init.body.get("file")) {
          var inp = document.getElementById("new-story-file");
          var files = inp && inp.files ? Array.prototype.slice.call(inp.files, 1, 10) : [];
          files.forEach(function (f) { init.body.append("file", f); });
        }
      }
    } catch (x) {}
    return baseFetch.call(this, input, init);
  };
  // file field: several files + a hint for the trusted person
  document.addEventListener("click", function () { setTimeout(prepareKeyForm, 50); }, true);
  function prepareKeyForm() {
    if (!storyKey()) return;
    var inp = document.getElementById("new-story-file");
    if (!inp || inp.__mkKey) return;
    inp.__mkKey = true;
    inp.multiple = true;
    inp.insertAdjacentHTML("afterend", '<div class="mk-key-hint">🔑 ' + e(L("Vertrauens-Konto: ohne Tageslimit, bis 10 Bilder/Videos in einer Story, sofort online.", "Güvenilir hesap: günlük sınır yok, bir hikâyede 10 resim/videoya kadar, hemen yayında.")) + "</div>");
  }

  if (!ON) return; // ----- everything below: admin test first (owner) -----
  document.documentElement.classList.add("mk-boost");

  /* ---------------- data: sponsor stories + offers ---------------- */
  var data = { sponsors: [], deals: [] };
  function load() {
    baseFetch.call(window, "/api/sponsor-stories", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d) return;
        data = { sponsors: d.sponsors || [], deals: d.deals || [] };
        if (typeof renderStoriesBar === "function") renderStoriesBar();
        decorate();
      })
      .catch(function () {});
  }

  /* ---------------- 3. story bar: one circle per sponsor ---------------- */
  var cat = "";
  if (typeof window.mkStoryCat === "function") {
    var baseCat = window.mkStoryCat;
    window.mkStoryCat = function (k) { cat = k || ""; return baseCat.apply(this, arguments); };
  }
  function storyBarExtras() {
    var box = document.getElementById("stories-scroll-container");
    if (!box) return;
    box.querySelectorAll(".mk-sps-item").forEach(function (n) { n.remove(); });
    if (data.sponsors.length && (cat === "" || cat === "sponsoren")) {
      var html = data.sponsors.map(function (s, i) {
        var pic = s.logo || s.image || (s.media.find(function (m) { return m.type === "image"; }) || {}).url || "assets/images/mykiez_logo.png";
        var ni = s.media.filter(function (m) { return m.type === "image"; }).length, nv = s.media.length - ni;
        return '<div class="mk-sps-item" role="button" tabindex="0" onclick="mkSponsorStory(' + i + ')" title="' + e(s.name) + '">' +
          '<div class="story-avatar-ring mk-sps-ring"><img src="' + e(pic) + '" class="story-avatar-img" alt="" loading="lazy"><b class="mk-sps-n">' + s.media.length + "</b></div>" +
          '<span class="story-label">' + e(s.name) + "</span><small class=\"mk-sps-cnt\">" + (ni ? ni + "📷" : "") + (nv ? " " + nv + "🎬" : "") + "</small></div>";
      }).join("");
      var first = box.querySelector(".story-item");
      if (first) first.insertAdjacentHTML("afterend", html); else box.insertAdjacentHTML("afterbegin", html);
    }
    // story-folders.js may paint the folder row after us -> add our chips a moment later
    setTimeout(catChips, 0);
  }
  function catChips() {
    // folder row: "Sponsoren" chip also when only sponsor circles exist + glowing offers chip
    var row = document.getElementById("mk-cat-row");
    if (row) {
      if (data.sponsors.length && !row.querySelector("[data-mk-spcat]") && !/mkStoryCat\('sponsoren'\)/.test(row.innerHTML)) {
        var all = row.querySelector(".mk-cat");
        if (all) all.insertAdjacentHTML("afterend", '<button type="button" class="mk-cat" data-mk-spcat="1" onclick="mkStoryCat(\'sponsoren\')">🤝 ' + e(L("Sponsoren", "Sponsorlar", "Sponsors")) + " (" + data.sponsors.length + ")</button>");
      }
      if (!row.querySelector(".mk-deal-chip")) row.insertAdjacentHTML("afterbegin", '<button type="button" class="mk-cat mk-deal-chip" onclick="switchTab(\'deals\')">🏷️ ' + dealLabel() + "</button>");
    }
  }
  function dealCount() { return (typeof window.mkStoryDealsCountBase === "function" ? window.mkStoryDealsCountBase() : 0) + data.deals.length; }
  function dealLabel() { var n = dealCount(); return n ? n + " " + e(L("Angebote", "İndirim", "Deals")) : e(L("Angebote", "İndirimler", "Deals")); }
  if (typeof window.mkStoryDealsCount === "function") {
    window.mkStoryDealsCountBase = window.mkStoryDealsCount;
    window.mkStoryDealsCount = function () { return dealCount(); };
  }
  function hookBar() {
    if (typeof renderStoriesBar !== "function" || renderStoriesBar.__mkBoost) return;
    var base = renderStoriesBar;
    renderStoriesBar = function () { base.apply(this, arguments); storyBarExtras(); };
    renderStoriesBar.__mkBoost = true;
  }

  /* sponsor story viewer (pictures 6 s, videos to their end, tap right/left, swipe to next sponsor) */
  var V = null;
  window.mkSponsorStory = function (si, mi) { openViewer(si, mi || 0); };
  function openViewer(si, mi) {
    closeViewer();
    var s = data.sponsors[si];
    if (!s) return;
    V = { si: si, mi: mi, timer: 0 };
    var box = document.createElement("div");
    box.id = "mk-sps-viewer";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    document.body.appendChild(box);
    document.addEventListener("keydown", onKey);
    show();
  }
  function closeViewer() {
    if (V && V.timer) clearTimeout(V.timer);
    var b = document.getElementById("mk-sps-viewer");
    if (b) b.remove();
    document.removeEventListener("keydown", onKey);
    V = null;
  }
  function onKey(ev) { if (ev.key === "Escape") closeViewer(); else if (ev.key === "ArrowRight") step(1); else if (ev.key === "ArrowLeft") step(-1); }
  function step(d) {
    if (!V) return;
    var s = data.sponsors[V.si];
    var mi = V.mi + d;
    if (mi >= s.media.length) { if (V.si + 1 < data.sponsors.length) { V.si++; V.mi = 0; show(); } else closeViewer(); return; }
    if (mi < 0) { if (V.si > 0) { V.si--; V.mi = data.sponsors[V.si].media.length - 1; show(); } return; }
    V.mi = mi;
    show();
  }
  function ago(t) { var m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? m + " min" : Math.round(m / 60) + " h"; }
  function show() {
    var box = document.getElementById("mk-sps-viewer");
    if (!box || !V) return;
    if (V.timer) clearTimeout(V.timer);
    var s = data.sponsors[V.si], m = s.media[V.mi];
    var bars = s.media.map(function (x, i) { return '<i class="' + (i < V.mi ? "done" : i === V.mi ? "now" : "") + '"><b></b></i>'; }).join("");
    box.innerHTML =
      '<div class="mk-sps-card">' +
      '<div class="mk-sps-bars">' + bars + "</div>" +
      '<div class="mk-sps-head"><img src="' + e(s.logo || s.image || "assets/images/mykiez_logo.png") + '" alt=""><div><b>' + e(s.name) + "</b><small>🤝 " + e(L("Sponsor", "Sponsor")) + " · " + ago(m.created_at) + "</small></div>" +
      '<button type="button" class="mk-sps-x" aria-label="' + e(L("Schließen", "Kapat", "Close")) + '">✕</button></div>' +
      '<div class="mk-sps-media">' + (m.type === "video" ? '<video src="' + e(m.url) + '" autoplay playsinline controls></video>' : '<img src="' + e(m.url) + '" alt="">') +
      '<button type="button" class="mk-sps-prev" aria-label="zurück"></button><button type="button" class="mk-sps-next" aria-label="weiter"></button></div>' +
      (m.caption ? '<p class="mk-sps-cap">' + e(m.caption) + "</p>" : "") +
      '<button type="button" class="mk-sps-more">🤝 ' + e(L("Zum Sponsor", "Sponsora git", "Open sponsor")) + " →</button></div>";
    box.querySelector(".mk-sps-x").onclick = closeViewer;
    box.querySelector(".mk-sps-prev").onclick = function () { step(-1); };
    box.querySelector(".mk-sps-next").onclick = function () { step(1); };
    box.querySelector(".mk-sps-more").onclick = function () { var id = s.id; closeViewer(); if (typeof window.mkSponsorInfo === "function") window.mkSponsorInfo(id); else if (typeof switchTab === "function") switchTab("sponsors"); };
    box.onclick = function (ev) { if (ev.target === box) closeViewer(); };
    var now = box.querySelector(".mk-sps-bars .now b");
    var vid = box.querySelector("video");
    if (vid) {
      vid.onended = function () { step(1); };
      vid.ontimeupdate = function () { if (now && vid.duration) now.style.width = (100 * vid.currentTime / vid.duration) + "%"; };
      V.timer = setTimeout(function () { step(1); }, 60000);
    } else {
      if (now) { now.style.transition = "width 6s linear"; requestAnimationFrame(function () { now.style.width = "100%"; }); }
      V.timer = setTimeout(function () { step(1); }, 6000);
    }
    // swipe
    var x0 = null;
    box.ontouchstart = function (ev) { x0 = ev.touches[0].clientX; };
    box.ontouchend = function (ev) {
      if (x0 == null) return;
      var dx = ev.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 60 && V) { if (dx < 0 && V.si + 1 < data.sponsors.length) { V.si++; V.mi = 0; show(); } else if (dx > 0 && V.si > 0) { V.si--; V.mi = 0; show(); } }
    };
  }

  /* ---------------- page decorations (every render) ---------------- */
  function werbenCta(cls) {
    return '<div class="' + cls + '"><div class="mk-b2b-txt"><b>📣 ' + e(L("Ihr Betrieb in ganz Berlin sichtbar?", "İşletmeniz tüm Berlin'de görünsün mü?", "Your business visible all over Berlin?")) + "</b><small>" +
      e(L("Werden Sie Kiez-Partner – ab 29 €/Monat, Web + App.", "Kiez partnerimiz olun – aylık 29 €'dan başlayan fiyatlarla, web + uygulama.", "Become a Kiez partner – from 29 €/month, web + app.")) + "</small></div>" +
      '<div class="mk-b2b-btns"><a class="mk-glow-btn mk-b2b-go" href="/werben#pakete">🚀 ' + e(L("Jetzt werben", "Hemen reklam ver", "Advertise now")) + "</a>" +
      '<a class="mk-glow-btn mk-b2b-work" href="/werben#f">🤝 ' + e(L("Mit uns arbeiten?", "Bizimle çalışmak ister misiniz?", "Work with us?")) + "</a>" +
      '<a class="mk-b2b-login" href="/sponsor">🔑 ' + e(L("Sponsor-Login", "Sponsor girişi", "Sponsor login")) + "</a></div></div>";
  }
  function dualButtons() {
    var nAll = (window.mkAllAds || []).length;
    var nTr = (window.mkAllAds || []).filter(function (a) { return a.region === "tr"; }).length;
    return '<div class="mk-dual">' +
      '<button type="button" class="mk-dual-btn mk-dual-all" data-go="sponsors"><span class="mk-dual-ic">🤝</span><b>' + e(L("Alle Sponsoren", "Tüm sponsorlar", "All sponsors")) + "</b>" + (nAll ? "<small>" + nAll + " →</small>" : "<small>→</small>") + "</button>" +
      '<button type="button" class="mk-dual-btn mk-dual-tr" data-go="tuerkei"><span class="mk-dual-ic">🇹🇷</span><b>' + e(L("Sponsoren aus der Türkei", "Türkiye Sponsorları", "Sponsors from Turkey")) + "</b>" + (nTr ? "<small>" + nTr + " →</small>" : "<small>→</small>") + "</button></div>";
  }
  function dealsBanner() {
    var n = dealCount();
    return '<button type="button" class="mk-deal-banner" onclick="switchTab(\'deals\')"><span>🏷️</span><div><b>' +
      e(n ? L(n + " aktuelle Angebote im Kiez", "Mahallede " + n + " güncel indirim", n + " current deals") : L("Aktuelle Angebote im Kiez", "Mahalledeki güncel indirimler", "Current deals")) + "</b><small>" +
      e(L("Rabatte unserer Sponsoren & Nachbarn – jetzt ansehen", "Sponsorlarımızın ve komşularımızın indirimleri – hemen bak", "Discounts from sponsors & neighbours")) + "</small></div><i>→</i></button>";
  }
  function sponsorDealsHtml() {
    if (!data.deals.length) return "";
    return '<div class="mk-plus-deals mk-sp-deals">' + data.deals.map(function (d) {
      var si = -1, mi = 0;
      data.sponsors.forEach(function (s, i) { s.media.forEach(function (m, j) { if (m.url === d.url) { si = i; mi = j; } }); });
      var img = d.type === "image" ? '<img src="' + e(d.url) + '" alt="" loading="lazy">' : '<div class="mk-plus-deal-noimg">🎬</div>';
      return '<button type="button" class="card-item mk-plus-deal" onclick="mkSponsorStory(' + si + "," + mi + ')">' + img +
        '<div class="mk-plus-deal-body"><b>' + e(d.what) + '</b><div class="mk-plus-price"><span>' + e(d.price) + "</span>" + (d.old ? "<s>" + e(d.old) + "</s>" : "") + "</div>" +
        "<small>🤝 " + e(d.name) + " · " + e(L("bis", "bitiş")) + " " + new Date(d.ends).toLocaleString(undefined, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + "</small></div></button>";
    }).join("") + "</div>";
  }

  var busy = false;
  function decorate() {
    if (busy) return;
    busy = true;
    try {
      var main = document.getElementById("main-tab-content");
      var tab = typeof currentTab === "string" ? currentTab : "";
      if (main) {
        if (!main.querySelector(".mk-b2b-top")) main.insertAdjacentHTML("afterbegin", werbenCta("mk-b2b-top"));
        var foot = main.querySelector(".mk-b2b-foot");
        if (!foot) main.insertAdjacentHTML("beforeend", werbenCta("mk-b2b-foot"));
        else if (foot !== main.lastElementChild) main.appendChild(foot);
        if (tab === "home" && bf && bf.active && !main.querySelector(".mk-bf-strip")) {
          var t0 = main.querySelector(".mk-b2b-top");
          if (t0) t0.insertAdjacentHTML("afterend", bfStrip());
        }
        if (tab === "home") {
          var all = main.querySelector(".mk-deck-all");
          if (!main.querySelector(".mk-dual") && (all || main.querySelector(".mk-tr-btn"))) {
            if (all) all.insertAdjacentHTML("beforebegin", dualButtons()); else main.querySelector(".mk-tr-btn").insertAdjacentHTML("beforebegin", dualButtons());
          }
          if (!main.querySelector(".mk-deal-banner")) {
            var top = main.querySelector(".mk-b2b-top");
            var clock = main.querySelector("#mk-clock");
            (clock || top).insertAdjacentHTML("afterend", dealsBanner());
          }
        }
        if (tab === "deals" && !main.querySelector(".mk-sp-deals") && data.deals.length) {
          var head = main.querySelector(".mk-plus-dealhead");
          var empty = head && head.nextElementSibling && head.nextElementSibling.classList.contains("ext-note") ? head.nextElementSibling : null;
          if (empty) empty.style.display = "none";
          if (head) head.insertAdjacentHTML("afterend", sponsorDealsHtml());
        }
      }
      var pill = document.querySelector(".ext-b2b-pill");
      if (pill && !pill.__mk) {
        pill.__mk = true;
        pill.title = L("Ihr Betrieb in ganz Berlin sichtbar? Jetzt werben", "İşletmeniz tüm Berlin'de görünsün mü? Reklam verin");
        pill.onclick = function () { location.href = "/werben"; };
        pill.classList.add("mk-pill-glow");
      }
      if (pill) { var sp = pill.querySelector("span"); var want = L("Werben?", "Reklam ver", "Advertise"); if (sp && sp.textContent !== want) sp.textContent = want; }
    } finally {
      busy = false;
    }
  }

  // tap on the big buttons: spin 360°, then open
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest(".mk-dual-btn");
    if (!b) return;
    b.classList.remove("mk-spin360"); void b.offsetWidth; b.classList.add("mk-spin360");
    var go = b.getAttribute("data-go");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(function () { if (typeof switchTab === "function") switchTab(go); }, reduce ? 0 : 650);
  });

  /* ---------------- 6. popup at the end of the page, every 2nd time ---------------- */
  var armed = true, lastPop = 0;
  window.addEventListener("scroll", function () {
    var bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40;
    if (!bottom) { if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 300) armed = true; return; }
    if (!armed || document.documentElement.scrollHeight < window.innerHeight * 1.5) return;
    armed = false;
    var n = (Number(lsGet(BOTTOM_STORE)) || 0) + 1;
    lsSet(BOTTOM_STORE, String(n));
    if (n % 2 === 0 && Date.now() - lastPop > 60000 && !document.getElementById("mk-sps-viewer")) { lastPop = Date.now(); popup(); }
  }, { passive: true });
  function popup() {
    if (document.getElementById("mk-b2b-pop")) return;
    var box = document.createElement("div");
    box.id = "mk-b2b-pop";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.innerHTML = '<div class="mk-b2b-pop-card"><button type="button" class="mk-b2b-pop-x" aria-label="' + e(L("Schließen", "Kapat", "Close")) + '">✕</button><div class="mk-b2b-pop-ic">📣</div>' + werbenCta("mk-b2b-pop-body") + "</div>";
    document.body.appendChild(box);
    var close = function () { box.remove(); };
    box.querySelector(".mk-b2b-pop-x").onclick = close;
    box.onclick = function (ev) { if (ev.target === box) close(); };
  }

  /* ---------------- 7. Black Friday (2026-11-22, owner): window once a day + black strip on the home page ---------------- */
  var bf = null;
  function bfText() {
    var taken = bf.taken, left = bf.left, total = bf.total;
    return {
      h: L("🖤 BLACK FRIDAY: 3 Monate GRATIS werben", "🖤 BLACK FRIDAY: 3 ay ÜCRETSİZ reklam", "🖤 BLACK FRIDAY: 3 months FREE advertising"),
      t: L(taken + " von " + total + " Plätzen sind schon weg – nur noch " + left + " frei! Sichere dir jetzt deinen Platz: 3 Monate gratis, danach ab 29 €/Monat.",
        total + " yerden " + taken + " tanesi doldu – sadece " + left + " yer kaldı! Acele et, yerini şimdi ayırt: 3 ay ücretsiz, sonra aylık 29 €'dan başlayan fiyatlar.",
        taken + " of " + total + " places are gone – only " + left + " left! Claim yours now: 3 months free, then from 29 €/month."),
      k: L("MONATLICH KÜNDBAR · bis 30.11.", "HER AY İPTAL EDİLEBİLİR · 30.11.'e kadar", "CANCEL MONTHLY · until 30 Nov"),
      b: L("Jetzt Gratis-Platz sichern", "Ücretsiz yerini hemen ayırt", "Claim your free place"),
    };
  }
  function bfStrip() {
    if (!bf || !bf.active) return "";
    var x = bfText();
    return '<a class="mk-bf-strip" href="/werben?bf=1#f"><b>' + e(x.h) + "</b><span>" + e(L("Nur noch " + bf.left + " Plätze", "Sadece " + bf.left + " yer kaldı", "Only " + bf.left + " left")) + " →</span></a>";
  }
  function bfPopup() {
    if (!bf || !bf.active || document.getElementById("mk-bf-pop") || document.getElementById("mk-sps-viewer")) return;
    var x = bfText();
    var box = document.createElement("div");
    box.id = "mk-bf-pop";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.innerHTML = '<div class="mk-bf-card"><button type="button" class="mk-b2b-pop-x" aria-label="' + e(L("Schließen", "Kapat", "Close")) + '">✕</button>' +
      "<h3>" + e(x.h) + '</h3><div class="mk-bf-bar"><i style="width:' + Math.round(100 * bf.taken / bf.total) + '%"></i></div><p>' + e(x.t) + '</p><span class="mk-bf-k">' + e(x.k) + "</span>" +
      '<a class="mk-bf-go" href="/werben?bf=1#f">' + e(x.b) + " →</a></div>";
    document.body.appendChild(box);
    var close = function () { box.remove(); };
    box.querySelector(".mk-b2b-pop-x").onclick = close;
    box.onclick = function (ev) { if (ev.target === box) close(); };
  }
  function bfLoad() {
    baseFetch.call(window, "/api/blackfriday", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      bf = j;
      decorate();
      if (!bf || !bf.active) return;
      var day = new Date().toISOString().slice(0, 10);
      if (lsGet("mk_bf_pop_day") === day) return;
      setTimeout(function () { lsSet("mk_bf_pop_day", day); bfPopup(); }, 15000);
    }).catch(function () {});
  }
  window.mkBlackFriday = function () { if (bf) bfPopup(); };

  /* 2026-11-22 (owner): own classified older than 3 days -> hint to extend (the window with 5 €/10 € opens on /community) */
  function myAdHint() {
    var ads = [];
    try { ads = JSON.parse(localStorage.getItem("mykiez_my_classifieds_v1") || "[]"); } catch (x) { ads = []; }
    var old = ads.filter(function (a) { return Date.now() - a.created > 3 * 86400000; });
    if (!old.length || lsGet("mk_cl_hint_day") === new Date().toISOString().slice(0, 10)) return;
    lsSet("mk_cl_hint_day", new Date().toISOString().slice(0, 10));
    var box = document.createElement("div");
    box.id = "mk-b2b-pop";
    box.setAttribute("role", "dialog");
    box.innerHTML = '<div class="mk-b2b-pop-card"><button type="button" class="mk-b2b-pop-x" aria-label="' + e(L("Schließen", "Kapat", "Close")) + '">✕</button><div class="mk-b2b-pop-ic">📢</div>' +
      '<div class="mk-b2b-pop-body"><div class="mk-b2b-txt"><b>' + e(L("Deine Kleinanzeige ist abgelaufen", "İlanının süresi doldu", "Your classified has expired")) + "</b><small>" + e(L("Verlängern: 1 Woche 5 € oder 1 Monat 10 €.", "Uzat: 1 hafta 5 € veya 1 ay 10 €.", "Extend: 1 week 5 € or 1 month 10 €.")) + '</small></div>' +
      '<div class="mk-b2b-btns"><a class="mk-glow-btn mk-b2b-go" href="/community/?lang=' + (lang() === "tr" ? "tr" : "de") + '#ilan">' + e(L("Jetzt verlängern", "Hemen uzat", "Extend now")) + "</a></div></div></div>";
    document.body.appendChild(box);
    box.querySelector(".mk-b2b-pop-x").onclick = function () { box.remove(); };
  }

  /* ---------------- start ---------------- */
  var css = document.createElement("style");
  css.textContent =
    "@keyframes mkGlow{0%,100%{box-shadow:0 0 0 0 rgba(255,193,7,.0),0 4px 14px rgba(0,0,0,.18)}50%{box-shadow:0 0 18px 4px rgba(255,193,7,.75),0 4px 14px rgba(0,0,0,.18)}}" +
    "@keyframes mkGlowRed{0%,100%{box-shadow:0 0 0 0 rgba(227,10,23,0)}50%{box-shadow:0 0 16px 4px rgba(227,10,23,.7)}}" +
    "@keyframes mkSpin360{from{transform:rotate(0) scale(1)}50%{transform:rotate(180deg) scale(.92)}to{transform:rotate(360deg) scale(1)}}" +
    ".mk-spin360{animation:mkSpin360 .65s cubic-bezier(.4,0,.2,1)!important}" +
    // 2. big buttons side by side (old thin buttons hidden only while this is on)
    "html.mk-boost .mk-deck-all>.btn-primary,html.mk-boost .mk-tr-btn{display:none!important}" +
    ".mk-dual{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:14px 0}" +
    ".mk-dual-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:150px;padding:18px 12px;border:0;border-radius:22px;cursor:pointer;font:inherit;color:#fff;text-align:center;animation:mkGlow 2.2s ease-in-out infinite}" +
    ".mk-dual-btn b{font-size:18px;line-height:1.2}.mk-dual-btn small{font-size:15px;font-weight:700;opacity:.95}.mk-dual-ic{font-size:44px;line-height:1}" +
    ".mk-dual-all{background:linear-gradient(135deg,#1E3A8A,#2563EB)}.mk-dual-tr{background:linear-gradient(135deg,#B00012,#E30A17);animation-name:mkGlowRed}" +
    "@media(max-width:420px){.mk-dual{gap:10px}.mk-dual-btn{min-height:130px}.mk-dual-btn b{font-size:15px}.mk-dual-ic{font-size:36px}}" +
    // 3. sponsor circles
    ".mk-sps-item{display:flex;flex-direction:column;align-items:center;cursor:pointer;flex-shrink:0;width:72px;position:relative}" +
    ".mk-sps-ring{background:conic-gradient(#FFC107,#FF5722,#E30A17,#FFC107)!important;padding:3px;position:relative}" +
    ".mk-sps-n{position:absolute;right:-2px;bottom:-2px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#E30A17;color:#fff;font-size:11px;line-height:20px;text-align:center;border:2px solid #fff}" +
    ".mk-sps-item .story-label{max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mk-sps-cnt{font-size:10px;opacity:.75}" +
    "#mk-sps-viewer{position:fixed;inset:0;z-index:10050;background:#000;display:flex;align-items:center;justify-content:center;padding:12px}" +
    ".mk-sps-card{position:relative;width:100%;max-width:440px;max-height:100%;display:flex;flex-direction:column;gap:8px;color:#fff}" +
    ".mk-sps-bars{display:flex;gap:4px}.mk-sps-bars i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.3);overflow:hidden}.mk-sps-bars i b{display:block;height:100%;width:0;background:#fff}.mk-sps-bars i.done b{width:100%}" +
    ".mk-sps-head{display:flex;align-items:center;gap:10px}.mk-sps-head img{width:38px;height:38px;border-radius:50%;object-fit:cover;background:#fff}.mk-sps-head div{flex:1;min-width:0}.mk-sps-head b{display:block}.mk-sps-head small{opacity:.8}" +
    ".mk-sps-x{background:none;border:0;color:#fff;font-size:24px;cursor:pointer;padding:4px 8px}" +
    ".mk-sps-media{position:relative;border-radius:14px;overflow:hidden;background:#000;display:flex;align-items:center;justify-content:center;min-height:240px}" +
    ".mk-sps-media img,.mk-sps-media video{width:100%;max-height:70vh;object-fit:contain;display:block}" +
    ".mk-sps-prev,.mk-sps-next{position:absolute;top:0;bottom:56px;width:35%;background:none;border:0;cursor:pointer}.mk-sps-prev{left:0}.mk-sps-next{right:0}" +
    ".mk-sps-cap{margin:0;font-size:15px;line-height:1.4;white-space:pre-line}" +
    ".mk-sps-more{align-self:stretch;padding:12px;border:0;border-radius:12px;background:#FFC107;color:#0F172A;font:inherit;font-weight:800;cursor:pointer}" +
    // 5. offers chip + banner
    ".mk-deal-chip{background:#E30A17!important;color:#fff!important;border-color:#E30A17!important;font-weight:800;animation:mkGlowRed 1.8s ease-in-out infinite}" +
    ".mk-deal-banner{grid-column:1/-1;display:flex;align-items:center;gap:12px;width:100%;margin:0 0 14px;padding:14px 16px;border:0;border-radius:16px;cursor:pointer;font:inherit;text-align:left;color:#0F172A;background:linear-gradient(135deg,#FFE082,#FFC107);animation:mkGlow 2s ease-in-out infinite}" +
    ".mk-deal-banner>span{font-size:30px}.mk-deal-banner div{flex:1}.mk-deal-banner b{display:block;font-size:17px}.mk-deal-banner small{opacity:.85}.mk-deal-banner i{font-style:normal;font-size:22px;font-weight:800}" +
    // 6. werben boxes
    ".mk-b2b-top,.mk-b2b-foot,.mk-b2b-pop-body{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:12px 14px;border-radius:16px;background:linear-gradient(135deg,#0F172A,#1E3A8A);color:#fff}" +
    ".mk-b2b-top{margin:0 0 12px}.mk-b2b-foot{margin:18px 0 6px}" +
    ".mk-b2b-txt{flex:1 1 220px;min-width:0}.mk-b2b-txt b{display:block;font-size:15px}.mk-b2b-txt small{opacity:.85;font-size:12px}" +
    ".mk-b2b-btns{display:flex;flex-wrap:wrap;gap:8px;align-items:center}" +
    ".mk-glow-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 14px;border-radius:999px;font-weight:800;font-size:13px;text-decoration:none;animation:mkGlow 2.2s ease-in-out infinite}" +
    ".mk-b2b-go{background:#FFC107;color:#0F172A}.mk-b2b-work{background:#fff;color:#1E3A8A}.mk-b2b-login{color:#fff;font-size:12px;opacity:.85;text-decoration:underline}" +
    ".mk-pill-glow{animation:mkGlow 2.2s ease-in-out infinite}" +
    "#mk-b2b-pop{position:fixed;inset:0;z-index:10040;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".mk-b2b-pop-card{position:relative;width:100%;max-width:420px;border-radius:20px;background:linear-gradient(135deg,#0F172A,#1E3A8A);padding:18px 6px 10px;text-align:center;animation:mkGlow 2.2s ease-in-out infinite}" +
    ".mk-b2b-pop-ic{font-size:44px}.mk-b2b-pop-body{flex-direction:column;text-align:center;background:none}.mk-b2b-pop-body .mk-b2b-btns{justify-content:center}.mk-b2b-pop-body .mk-b2b-txt{flex:none}" +
    ".mk-b2b-pop-x{position:absolute;top:6px;right:8px;background:none;border:0;color:#fff;font-size:22px;cursor:pointer}" +
    ".mk-key-hint{margin:6px 0;padding:8px 10px;border-radius:10px;background:#E8F5E9;color:#1B5E20;font-size:12px;font-weight:600}" +
    ".mk-bf-strip{grid-column:1/-1;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:6px;margin:0 0 12px;padding:12px 16px;border-radius:16px;background:linear-gradient(135deg,#000,#2b2100);color:#FFC107!important;text-decoration:none;animation:mkGlow 2.2s ease-in-out infinite}.mk-bf-strip b{font-size:15px}.mk-bf-strip span{font-weight:800;color:#fff}" +
    "#mk-bf-pop{position:fixed;inset:0;z-index:10045;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".mk-bf-card{position:relative;width:100%;max-width:420px;border-radius:20px;background:linear-gradient(135deg,#000,#1f1f1f 60%,#3a2c00);color:#fff;padding:22px 18px;text-align:center;animation:mkGlow 2.2s ease-in-out infinite}" +
    ".mk-bf-card h3{margin:0 0 10px;color:#FFC107;font-size:21px}.mk-bf-card p{margin:8px 0;font-size:14px;line-height:1.45}" +
    ".mk-bf-bar{height:10px;border-radius:5px;background:#333;overflow:hidden}.mk-bf-bar i{display:block;height:100%;background:linear-gradient(90deg,#FFC107,#ff5722)}" +
    ".mk-bf-k{display:inline-block;margin:4px 0 12px;padding:5px 12px;border-radius:999px;background:#FFC107;color:#000;font-weight:900;font-size:13px}" +
    ".mk-bf-go{display:block;padding:12px;border-radius:999px;background:#FFC107;color:#000!important;font-weight:900;text-decoration:none}" +
    "@media (prefers-reduced-motion:reduce){.mk-bf-strip,.mk-bf-card{animation:none}}" +
    "@media (prefers-reduced-motion:reduce){.mk-dual-btn,.mk-glow-btn,.mk-deal-chip,.mk-deal-banner,.mk-pill-glow,.mk-b2b-pop-card{animation:none}.mk-spin360{animation:none!important}}";
  document.head.appendChild(css);

  function start() {
    hookBar();
    var main = document.getElementById("main-tab-content");
    if (main && window.MutationObserver) {
      var queued = false;
      new MutationObserver(function () {
        if (busy || queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; decorate(); });
      }).observe(main, { childList: true });
    }
    decorate();
    load();
    setInterval(load, 5 * 60000);
    bfLoad();
    setTimeout(myAdHint, 8000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 0); });
  else setTimeout(start, 0);
})();
