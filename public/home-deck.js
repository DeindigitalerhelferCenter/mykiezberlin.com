/* My Kiez Berlin – home page that changes on every visit (2026-11-13, owner).
   Before: the home page showed every sponsor one under the other (20 sponsors ≈ 8.500 px on a phone).
   Now:
   - The quick buttons stay (navigation). Everything else comes from a pool of boxes; every time the home page
     opens, 5 boxes are chosen at random, and never exactly the same set as the last time.
   - Between the boxes there are 3 sponsor places. Only Kiez Premium and Kiez Plus are shown there; place 1 prefers
     Premium. Who comes next is decided by the monthly goal of the package (server weight, see functions/api/ads.js):
     Basic 1.000, Plus 3.000, Premium 8.000 really seen views per month.
   - Kiez Basic sponsors appear in their own Kiez, on page changes and on the page "Alle Sponsoren".
   - At the end: "Alle Sponsoren (N) →" opens a page with every sponsor, filter by Kiez and category. */
(function () {
  "use strict";
  if (typeof renderHomeTab !== "function") return;
  var LAST_KEY = "mk_home_deck_last";
  var BOXES = 5;
  var SPONSOR_PLACES = 3;

  function L(de, tr) { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0 ? tr : de; }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function teaser(icon, color, title, text, button, action, extra) {
    return '<div class="mk-deck-box" style="--deck:' + color + '">' +
      '<div class="mk-deck-head"><span class="mk-deck-icon">' + icon + "</span><b>" + e(title) + "</b></div>" +
      (text ? '<p class="mk-deck-text">' + e(text) + "</p>" : "") + (extra || "") +
      '<button type="button" class="mk-deck-btn" onclick="' + action + '">' + e(button) + " →</button></div>";
  }
  function liveList(key, max) {
    var list = (typeof liveData === "object" && liveData && liveData[key]) || [];
    return list.slice(0, max);
  }

  // ---- the pool: every box returns HTML ("" = not available right now, then another one is taken)
  var POOL = {
    manset: function () { return typeof mansetHtml === "function" ? mansetHtml() : ""; },
    kieze: function () { return typeof kiezScroller === "function" ? kiezScroller() : ""; },
    live: function () {
      var a = ((typeof liveData === "object" && liveData && liveData.alerts) || []).filter(function (x) { return !x.ongoing; }).slice(0, 3);
      var rows = a.map(function (x) { return '<li><span style="color:' + e(x.color || "#E30613") + ';font-weight:800">' + e(x.tag || "") + "</span> " + e(x.title) + "</li>"; }).join("");
      return teaser("🚨", "#D32F2F", L("Polizei · Feuerwehr · BVG – live", "Polis · İtfaiye · BVG – canlı"), rows ? "" : L("Aktuelle Meldungen aus Berlin.", "Berlin'den güncel bildirimler."),
        L("Alle Meldungen", "Tüm bildirimler"), "switchTab('bulletin')", rows ? '<ul class="mk-deck-list">' + rows + "</ul>" : "");
    },
    sport: function () {
      var rows = liveList("sport", 2).map(function (n) { return "<li>" + e(n.title) + "</li>"; }).join("");
      return teaser("⚽", "#2EA043", L("Sport in Berlin", "Berlin'de spor"), rows ? "" : L("Hertha, Union, Alba, Eisbären – News & Spiele.", "Hertha, Union, Alba, Eisbären – haberler ve maçlar."),
        L("Zum Sport", "Spora git"), "switchTab('sport')", rows ? '<ul class="mk-deck-list">' + rows + "</ul>" : "");
    },
    emergency: function () {
      return teaser("📞", "#E30613", L("Notruf & wichtige Nummern", "Acil ve önemli numaralar"), "",
        L("Alle Nummern", "Tüm numaralar"), "switchTab('emergency')",
        '<div class="mk-deck-calls"><a href="tel:110">🚓 110 ' + L("Polizei", "Polis") + '</a><a href="tel:112">🚒 112 ' + L("Feuerwehr", "İtfaiye") + '</a><a href="tel:116117">🩺 116 117</a></div>');
    },
    reporter: function () {
      return teaser("📣", "#F2B705", L("Werde Kiez-Reporter", "Mahalle muhabiri ol"), L("Was passiert in deinem Kiez? Schreib es – die Nachbarn lesen mit.", "Mahallende ne oluyor? Yaz – komşuların okusun."),
        L("Zum Kiez-Reporter", "Muhabir bölümüne"), "switchTab('reporter')");
    },
    quiz: function () {
      return teaser("🎯", "#7B61FF", L("Welcher Kiez passt zu dir?", "Sana hangi Kiez uyuyor?"), L("10 kurze Fragen – dein Berliner Lieblingskiez.", "10 kısa soru – Berlin'deki favori mahallen."),
        L("Quiz starten", "Teste başla"), "location.href='/quiz/'");
    },
    community: function () {
      return teaser("🆓", "#0EA5E9", L("Kostenlose Kleinanzeigen", "Ücretsiz ilanlar"), L("3 Tage gratis inserieren – Nachbarn finden, verkaufen, verschenken.", "3 gün ücretsiz ilan ver – komşu bul, sat, hediye et."),
        L("Zur Community", "Topluluğa git"), "location.href='/community/'");
    },
    // 2026-11-14: Berlin phone book (own tab "telefonbuch" from kiez-plus.js)
    phonebook: function () {
      if (typeof EXTRA_TABS !== "object" || !EXTRA_TABS || !EXTRA_TABS.telefonbuch) return "";
      return teaser("📒", "#0F766E", L("Berliner Telefonbuch & Branchen", "Berlin telefon & iş rehberi"), L("Nummern von Firmen, Ärzten, Handwerkern – in Das Örtliche, Gelbe Seiten, 11880 suchen.", "Firma, doktor, usta numaraları – Das Örtliche, Gelbe Seiten, 11880'de ara."),
        L("Nummer suchen", "Numara ara"), "switchTab('telefonbuch')");
    },
    guide: function () {
      return teaser("🧭", "#0F766E", L("Kiez-Guide & Berlin-Tipps", "Mahalle rehberi & Berlin önerileri"), L("Ausflüge, Orte und Tipps für jeden Kiez.", "Her mahalle için gezi, yer ve öneriler."),
        L("Tipps ansehen", "Önerilere bak"), "switchTab('tips')");
    },
    events: function () {
      return teaser("📅", "#C026D3", L("Events in Berlin", "Berlin'de etkinlikler"), L("Was ist los diese Woche?", "Bu hafta neler var?"), L("Zu den Events", "Etkinliklere git"), "switchTab('events')");
    },
    jobs: function () {
      return teaser("💼", "#475569", L("Kiez-Jobs", "Mahalle iş ilanları"), L("Jobs in deiner Nähe.", "Yakınındaki işler."), L("Jobs ansehen", "İlanlara bak"), "switchTab('jobs')");
    },
    share: function () {
      return teaser("📲", "#16A34A", L("Teile My Kiez mit Freunden", "My Kiez'i arkadaşlarınla paylaş"), L("Je mehr Nachbarn mitmachen, desto lebendiger dein Kiez.", "Ne kadar çok komşu katılırsa mahallen o kadar canlı olur."),
        L("Jetzt teilen", "Şimdi paylaş"), "typeof shareApkLink==='function'&&shareApkLink()");
    },
  };
  var KEYS = Object.keys(POOL);

  function readLast() { try { return JSON.parse(localStorage.getItem(LAST_KEY) || "[]"); } catch (x) { return []; } }
  function writeLast(v) { try { localStorage.setItem(LAST_KEY, JSON.stringify(v)); } catch (x) {} }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // 5 boxes: boxes from last time come last in the draw, so the home page looks different every time
  function pickBoxes() {
    var last = readLast();
    var fresh = shuffle(KEYS.filter(function (k) { return last.indexOf(k) < 0; }));
    var old = shuffle(KEYS.filter(function (k) { return last.indexOf(k) >= 0; }));
    var out = [];
    fresh.concat(old).some(function (k) {
      var html = "";
      try { html = POOL[k](); } catch (x) { html = ""; }
      if (html) out.push({ key: k, html: html });
      return out.length >= BOXES;
    });
    writeLast(out.map(function (b) { return b.key; }));
    return out;
  }

  // sponsor places: weighted draw without repeats (weight from the server = monthly goal + catch-up)
  function pickSponsors() {
    var ads = (window.mkAllAds || []).filter(function (a) { return a.size === "large" || a.size === "banner" || a.size === "medium"; });
    var out = [];
    var pool = ads.slice();
    for (var n = 0; n < SPONSOR_PLACES && pool.length; n++) {
      var cand = pool;
      if (n === 0) { var prem = pool.filter(function (a) { return a.size === "large" || a.size === "banner"; }); if (prem.length) cand = prem; }
      var total = cand.reduce(function (s, a) { return s + Math.max(1, a.weight || 1); }, 0);
      var r = Math.random() * total, pick = cand[0];
      for (var i = 0; i < cand.length; i++) { r -= Math.max(1, cand[i].weight || 1); if (r <= 0) { pick = cand[i]; break; } }
      out.push(pick);
      pool = pool.filter(function (a) { return a !== pick; });
    }
    return out;
  }

  function sponsorHtml(ad) {
    if (!ad || typeof window.mkSponsorCardHtml !== "function") return "";
    // 2026-11-14 (owner): Premium = full width on the PC (was half width and looked smaller than Plus)
    var prem = ad.size === "large" || ad.size === "banner";
    return '<div class="mk-deck-sponsor' + (prem ? " mk-deck-sponsor-l" : "") + '">' + window.mkSponsorCardHtml(ad, ad.size) + "</div>";
  }

  function allSponsorsButton() {
    var n = (window.mkAllAds || []).length;
    if (!n) return "";
    return '<div class="mk-deck-all"><button type="button" class="btn-primary" onclick="switchTab(\'sponsors\')">🤝 ' + e(L("Alle Sponsoren", "Tüm sponsorlar")) + " (" + n + ") →</button>" +
      '<a class="chip-btn" href="/werben">' + e(L("Selbst werben", "Reklam ver")) + "</a></div>";
  }

  renderHomeTab = function (container) {
    var boxes = pickBoxes();
    var sponsors = pickSponsors();
    var parts = [typeof quickButtons === "function" ? quickButtons() : ""];
    boxes.forEach(function (b, i) {
      parts.push(b.html);
      if (i % 2 === 0 && sponsors[i / 2]) parts.push(sponsorHtml(sponsors[i / 2])); // after box 1, 3, 5
    });
    parts.push(allSponsorsButton());
    container.innerHTML = parts.join("");
    if (typeof window.mkRegisterAds === "function" && window.mkAllAds) window.mkRegisterAds(window.mkAllAds);
    setTimeout(function () { if (window.mkSeenIn) window.mkSeenIn(container); }, 300);
  };

  // ---- page "Alle Sponsoren": every sponsor (Premium → Plus → Basic), filter by Kiez and category
  var filterKiez = "all", filterCat = "all";
  function catOf(a) { return a.category ? (L(a.category.de, a.category.tr || a.category.de) || "") : ""; }
  function renderSponsorsPage(container) {
    var ads = (window.mkAllAds || []).slice();
    var order = { large: 0, banner: 0, medium: 1, small: 2 };
    ads.sort(function (a, b) { return (order[a.size] || 1) - (order[b.size] || 1) || String(a.name).localeCompare(String(b.name)); });
    var kieze = [], cats = [];
    ads.forEach(function (a) {
      String(a.kieze || "").split(",").map(function (k) { return k.trim(); }).filter(Boolean).forEach(function (k) { if (kieze.indexOf(k) < 0) kieze.push(k); });
      var c = catOf(a).split("·")[0].trim(); if (c && cats.indexOf(c) < 0) cats.push(c);
    });
    var shown = ads.filter(function (a) {
      return (filterKiez === "all" || String(a.kieze || "").indexOf(filterKiez) >= 0) && (filterCat === "all" || catOf(a).indexOf(filterCat) === 0);
    });
    var chip = function (kind, v, label, on) { return '<button type="button" class="chip-btn' + (on ? " active" : "") + '" onclick="mkSponsorFilter(\'' + kind + "'," + JSON.stringify(v).replace(/"/g, "&quot;") + ')">' + e(label) + "</button>"; };
    container.innerHTML = '<h2 class="ext-heading">🤝 ' + e(L("Sponsoren & Partner", "Sponsorlar & Partnerler")) + " (" + ads.length + ")</h2>" +
      '<div class="mk-deck-chips">' + chip("kiez", "all", L("Alle Kieze", "Tüm Kiezler"), filterKiez === "all") + kieze.sort().map(function (k) { return chip("kiez", k, k, filterKiez === k); }).join("") + "</div>" +
      '<div class="mk-deck-chips">' + chip("cat", "all", L("Alle Branchen", "Tüm sektörler"), filterCat === "all") + cats.sort().map(function (c) { return chip("cat", c, c, filterCat === c); }).join("") + "</div>" +
      (shown.length ? '<div class="mk-sz-grid">' + shown.map(function (a) { return window.mkSponsorCardHtml(a, a.size); }).join("") + "</div>" : '<p style="color:#888">' + e(L("Keine Sponsoren für diese Auswahl.", "Bu seçim için sponsor yok.")) + "</p>") +
      '<a class="btn-primary ext-cta" style="margin-top:16px" href="/werben">' + e(L("Dein Betrieb hier? Jetzt werben", "İşletmen burada mı olsun? Reklam ver")) + " →</a>";
    if (typeof window.mkRegisterAds === "function") window.mkRegisterAds(ads);
    setTimeout(function () { if (window.mkSeenIn) window.mkSeenIn(container); }, 300);
  }
  window.mkSponsorFilter = function (kind, v) {
    if (kind === "kiez") filterKiez = v; else filterCat = v;
    var c = document.getElementById("main-tab-content");
    if (c) renderSponsorsPage(c);
  };
  if (typeof EXTRA_TABS === "object" && EXTRA_TABS) EXTRA_TABS.sponsors = renderSponsorsPage;

  var css = document.createElement("style");
  css.textContent =
    ".mk-deck-box{margin:14px 0;padding:14px 16px;border-radius:16px;background:var(--card-bg,#fff);border:1px solid rgba(0,0,0,.08);border-left:5px solid var(--deck);box-shadow:0 2px 10px rgba(0,0,0,.05)}" +
    ".mk-deck-head{display:flex;align-items:center;gap:10px;font-size:16px}.mk-deck-icon{font-size:24px}" +
    ".mk-deck-text{margin:8px 0 0;font-size:13.5px;opacity:.85}" +
    ".mk-deck-list{margin:8px 0 0;padding-left:18px;font-size:13px;display:grid;gap:4px}" +
    ".mk-deck-calls{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.mk-deck-calls a{flex:1;min-width:90px;text-align:center;padding:9px 6px;border-radius:10px;background:rgba(227,6,19,.1);color:#B00010;font-weight:800;text-decoration:none;font-size:13px}" +
    ".mk-deck-btn{margin-top:10px;border:0;border-radius:10px;padding:9px 14px;font-weight:800;background:var(--deck);color:#fff;cursor:pointer}" +
    ".mk-deck-sponsor{margin:14px 0}" +
    ".mk-deck-all{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:18px 0 8px}.mk-deck-all .btn-primary{flex:1;min-width:200px}" +
    ".mk-deck-chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:6px}.mk-deck-chips .chip-btn{flex:none}" +
    /* 2026-11-14 (owner): on the PC the boxes are no longer stretched to the height of the sponsor card next to them
       (big empty windows); Premium takes the full width and is the biggest card */
    "@media(min-width:768px){.main-content>.mk-deck-box,.main-content>.mk-deck-sponsor{align-self:start;margin:0}" +
    ".main-content>.mk-deck-sponsor-l,.main-content>.mk-deck-all{grid-column:1/-1}" +
    ".mk-deck-sponsor-l .mk-sp.mk-sz-l{min-height:300px}.mk-deck-sponsor-l .mk-sz-l .mk-sz-pic{flex:0 0 min(55%,700px)}}";
  document.head.appendChild(css);
})();
