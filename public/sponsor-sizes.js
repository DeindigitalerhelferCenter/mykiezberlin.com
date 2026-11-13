/* My Kiez Berlin – sponsor sizes by package + Google Maps (2026-11-13).
   The booked package is visible from the size of the card alone (like the Kiez-Check example):
     Kiez Premium (l) = large card, full width, big picture + all data
     Kiez Plus    (m) = medium card, half width, logo + all data
     Kiez Basic   (s) = small card, quarter width, logo + name + address
   Every card with a real address gets "Route" (Google Maps directions); the contact sheet
   (sponsor-info.js) additionally shows the map with a pin.
   Nothing old is removed: app-werbung.js / sponsor-rotation.js call these helpers when they exist. */
(function () {
  "use strict";

  function lang() { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0 ? "tr" : typeof currentLanguage === "string" && currentLanguage.indexOf("en") === 0 ? "en" : "de"; }
  function L(de, tr, en) { var l = lang(); return l === "tr" ? tr : l === "en" ? en : de; }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function txt(ad, key) { return ad[key + "_" + lang()] || ad[key + "_de"] || ""; }
  function cat(ad) { return ad.category ? ad.category[lang()] || ad.category.de || "" : ""; }
  var BLOCKED = /(jet-?gas\.de|sexyflirt\.|lovemeto\.)/i; // hijacked / adult domains, never open them
  function http(u) { return /^https?:\/\//.test(u || "") && !BLOCKED.test(u) ? u : ""; }
  function img(u) { return /^(https?:\/\/|\/)/.test(u || "") && !BLOCKED.test(u) ? u : ""; }
  function digits(s) { return String(s || "").replace(/[^\d]/g, ""); }

  // ---------- Google Maps ----------
  // Only a real street address gets a pin / route ("Berlin und Umgebung" is a service area, not a place).
  function hasPlace(ad) { return !!(ad && ad.address && /\d/.test(ad.address) && !/umgebung|ganz berlin/i.test(ad.address)); }
  function query(ad) { return ad.address ? ad.name + ", " + ad.address : ad.name; }
  window.mkMaps = {
    has: hasPlace,
    search: function (ad) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query(ad)); },
    route: function (ad) { return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(query(ad)); },
    // Embedded map with a pin, no API key needed
    embed: function (ad) { return "https://maps.google.com/maps?q=" + encodeURIComponent(query(ad)) + "&z=16&output=embed"; },
  };

  // ---------- buttons ----------
  function click(ad) { return " onclick=\"typeof mkSponsorClick==='function'&&mkSponsorClick('" + e(ad.id) + "')\""; }
  function buttons(ad, size) {
    var b = [];
    var short = false; // 2026-11-13: Basic also shows the button texts (user example)
    if (ad.link_tel) b.push('<a class="mk-sp-btn" href="tel:' + e(String(ad.link_tel).replace(/[^\d+]/g, "")) + '"' + click(ad) + ">📞" + (short ? "" : " " + L("Anrufen", "Ara", "Call")) + "</a>");
    if (ad.link_wa) b.push('<a class="mk-sp-btn" href="https://wa.me/' + e(digits(ad.link_wa)) + '" target="_blank" rel="noopener sponsored"' + click(ad) + ">💬" + (short ? "" : " WhatsApp") + "</a>");
    var web = http(ad.link_web) || http(ad.link_ig);
    if (web && !short) b.push('<a class="mk-sp-btn" href="' + e(web) + '" target="_blank" rel="noopener sponsored"' + click(ad) + ">🌐 " + e(http(ad.link_web) ? L("Webseite", "Web sitesi", "Website") : "Instagram") + "</a>");
    if (hasPlace(ad)) b.push('<a class="mk-sp-btn mk-sz-route" href="' + e(window.mkMaps.route(ad)) + '" target="_blank" rel="noopener"' + click(ad) + ">🗺️ " + L("Route", "Yol tarifi", "Directions") + "</a>");
    return b.length ? '<div class="mk-sz-btns">' + b.join("") + "</div>" : "";
  }
  function meta(ad, withHours) {
    var m = "";
    if (ad.address) m += '<span class="mk-sz-meta">📍 ' + e(ad.address) + "</span>";
    if (withHours && ad.hours) m += '<span class="mk-sz-meta">🕒 ' + e(ad.hours) + "</span>";
    return m;
  }
  function coupon(ad) {
    return ad.coupon && ad.coupon.code ? '<div class="mk-sz-coupon">🎟️ <b>' + e(ad.coupon.code) + "</b> · " + e(ad.coupon[lang()] || ad.coupon.de || "") + "</div>" : "";
  }
  var LABEL = function () { return '<span class="mk-sz-label">' + L("Anzeige", "Reklam", "Ad") + "</span>"; };

  // ---------- card by size ----------
  // 2026-11-13 (user): every package shows a picture – Basic small (like a story tile), Plus medium,
  // Premium big – a small package badge bottom right and a glowing frame: Basic blue, Plus green, Premium red.
  var TIER = { large: ["l", "Premium"], banner: ["l", "Premium"], medium: ["m", "Plus"], small: ["s", "Basic"] };
  window.mkShowTierBadge = true; // set false to hide the "Basic / Plus / Premium" badge later
  window.mkSponsorCardHtml = function (ad, size) {
    size = size || ad.size || "medium";
    var tier = TIER[size] || TIER.medium;
    var picUrl = img(ad.image) || img(ad.logo);
    var logo2 = img(ad.logo) || img(ad.image);
    var head2 = '<div class="mk-sz-head">' + (logo2 ? '<img class="mk-sz-logo" src="' + e(logo2) + '" alt="" loading="lazy">' : "") +
      '<div class="mk-sz-name"><b>' + e(ad.name) + "</b>" + (cat(ad) ? "<small>" + e(cat(ad)) + "</small>" : "") + "</div></div>";
    var badge = window.mkShowTierBadge ? '<span class="mk-sz-tier mk-sz-tier-' + tier[0] + '">' + tier[1] + "</span>" : "";
    var hl = txt(ad, "headline") ? '<p class="mk-sz-hl">' + e(txt(ad, "headline")) + "</p>" : "";
    var picHtml = picUrl ? '<div class="mk-sz-pic"><img src="' + e(picUrl) + '" alt="' + e(ad.name) + '" loading="lazy"></div>' : "";
    return '<div class="mk-sp mk-sz mk-sz-' + tier[0] + ' mk-glow mk-glow-' + tier[0] + '" data-ad="' + e(ad.id) + '">' + LABEL() + picHtml +
      '<div class="mk-sz-body">' + head2 + hl + meta(ad, true) + (tier[0] === "s" ? "" : coupon(ad)) + buttons(ad, size) + "</div>" + badge + "</div>";
  };
  window.mkSponsorCardHtmlOld = function (ad, size) {
    size = size || ad.size || "medium";
    var logo = img(ad.logo) || img(ad.image);
    var head = '<div class="mk-sz-head">' + (logo ? '<img class="mk-sz-logo" src="' + e(logo) + '" alt="" loading="lazy">' : "") +
      '<div class="mk-sz-name"><b>' + e(ad.name) + "</b>" + (cat(ad) ? "<small>" + e(cat(ad)) + "</small>" : "") + "</div></div>";
    if (size === "large" || size === "banner") {
      var pic = img(ad.image);
      return '<div class="mk-sp mk-sz mk-sz-l" data-ad="' + e(ad.id) + '">' + LABEL() +
        (pic ? '<div class="mk-sz-pic"><img src="' + e(pic) + '" alt="' + e(ad.name) + '" loading="lazy"></div>' : "") +
        '<div class="mk-sz-body">' + head + (txt(ad, "headline") ? '<p class="mk-sz-hl">' + e(txt(ad, "headline")) + "</p>" : "") +
        meta(ad, true) + coupon(ad) + buttons(ad, "large") + "</div></div>";
    }
    if (size === "small") {
      return '<div class="mk-sp mk-sz mk-sz-s" data-ad="' + e(ad.id) + '">' + LABEL() + head + meta(ad, false) + buttons(ad, "small") + "</div>";
    }
    return '<div class="mk-sp mk-sz mk-sz-m" data-ad="' + e(ad.id) + '">' + LABEL() + head +
      (txt(ad, "headline") ? '<p class="mk-sz-hl">' + e(txt(ad, "headline")) + "</p>" : "") +
      meta(ad, true) + coupon(ad) + buttons(ad, "medium") + "</div>";
  };

  // ---------- home: all sponsors, sorted Premium → Plus → Basic ----------
  var allAds = [];
  var tracked = {};
  var ORDER = { large: 0, banner: 0, medium: 1, small: 2 };
  function rank(ad) { return ad.size in ORDER ? ORDER[ad.size] : 1; }
  function trackImp(ids) {
    ids = ids.filter(function (id) { return !tracked[id]; });
    if (!ids.length) return;
    ids.forEach(function (id) { tracked[id] = 1; });
    try { fetch("/api/ads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "imp", ids: ids.slice(0, 20) }), keepalive: true }).catch(function () {}); } catch (x) {}
  }
  window.mkSponsorGridHtml = function () {
    if (!allAds.length) return "";
    var list = allAds.slice().sort(function (a, b) { return rank(a) - rank(b) || String(a.name).localeCompare(String(b.name)); });
    // 2026-11-13: counted only when really seen on screen (sponsor-seen.js), no longer on render
    setTimeout(function () { if (window.mkSeenIn) window.mkSeenIn(); else trackImp(list.map(function (a) { return a.id; })); }, 300);
    return '<div class="mk-sz-grid">' + list.map(function (a) { return window.mkSponsorCardHtml(a, a.size); }).join("") + "</div>";
  };

  function hookHome() {
    if (typeof homeAdsSectionHtml !== "function" || homeAdsSectionHtml.__mkSizes) return;
    var base = homeAdsSectionHtml;
    // Same section as before; only the sponsor cards come from the size grid when sponsors exist.
    homeAdsSectionHtml = function () {
      var html = base.apply(this, arguments);
      var grid = window.mkSponsorGridHtml();
      if (!grid) return html;
      var start = html.indexOf("</div>") + 6;                          // end of the "Sponsoren & Partner" heading row
      var end = html.indexOf('<h3 class="ext-subheading" style="margin-top: 16px;">');   // packages heading
      return start > 5 && end > start ? html.slice(0, start) + grid + html.slice(end) : html;
    };
    homeAdsSectionHtml.__mkSizes = true;
  }

  function load() {
    fetch("/api/ads?place=page").then(function (r) { return r.ok ? r.json() : { ads: [] }; }).then(function (d) {
      allAds = d.ads || [];
      window.mkAllAds = allAds; // 2026-11-13: home-deck.js picks the home sponsors from this list
      if (typeof window.mkRegisterAds === "function") window.mkRegisterAds(allAds);
      hookHome();
      if (typeof currentTab === "string" && currentTab === "home" && typeof renderTabContent === "function") renderTabContent();
    }).catch(function () {});
  }

  // ---------- contact sheet: route button + map with pin ----------
  function hookSheet() {
    if (typeof window.mkSponsorInfo !== "function" || window.mkSponsorInfo.__mkMaps) return;
    var base = window.mkSponsorInfo;
    window.mkSponsorInfo = function (idOrAd) {
      var ok = base.apply(this, arguments);
      var ad = typeof idOrAd === "string" ? (window.mkAdRegistry || {})[idOrAd] : idOrAd;
      var sheet = document.querySelector("#mk-si .mk-si-sheet");
      if (!ok || !ad || !sheet || !hasPlace(ad)) return ok;
      var btns = sheet.querySelector(".mk-si-btns");
      var route = '<a class="mk-si-btn route" href="' + e(window.mkMaps.route(ad)) + '" target="_blank" rel="noopener">🗺️ ' + L("Route", "Yol tarifi", "Directions") + "</a>";
      if (btns) btns.insertAdjacentHTML("beforeend", route);
      else sheet.querySelector(".mk-si-rows").insertAdjacentHTML("beforebegin", '<div class="mk-si-btns">' + route + "</div>");
      sheet.querySelector(".mk-si-rows").insertAdjacentHTML("beforebegin",
        '<div class="mk-si-map"><iframe title="' + e(L("Karte", "Harita", "Map")) + '" src="' + e(window.mkMaps.embed(ad)) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
        '<a href="' + e(window.mkMaps.search(ad)) + '" target="_blank" rel="noopener">' + e(L("In Google Maps öffnen", "Google Maps'te aç", "Open in Google Maps")) + " ↗</a></div>");
      return ok;
    };
    window.mkSponsorInfo.__mkMaps = true;
  }

  // Long text and own pictures/videos from the sponsor panel, shown in the contact sheet
  function hookGallery() {
    if (typeof window.mkSponsorInfo !== "function" || window.mkSponsorInfo.__mkGallery) return;
    var base = window.mkSponsorInfo;
    window.mkSponsorInfo = function (idOrAd) {
      var ok = base.apply(this, arguments);
      var ad = typeof idOrAd === "string" ? (window.mkAdRegistry || {})[idOrAd] : idOrAd;
      var sheet = document.querySelector("#mk-si .mk-si-sheet");
      if (!ok || !ad || !sheet) return ok;
      var rows = sheet.querySelector(".mk-si-rows");
      if (ad.description && rows) rows.insertAdjacentHTML("beforebegin", '<p class="mk-si-desc"></p>');
      if (ad.description) sheet.querySelector(".mk-si-desc").textContent = ad.description;
      fetch("/api/sponsor-media?ad=" + encodeURIComponent(ad.id)).then(function (r) { return r.ok ? r.json() : { media: [] }; }).then(function (d) {
        var list = (d.media || []).slice(0, 12);
        if (!list.length || !document.body.contains(sheet)) return;
        var html = '<div class="mk-si-gal">' + list.map(function (m) {
          if (m.media_type === "instagram") return '<iframe src="' + e(String(m.url).replace(/\/?$/, "/") + "embed") + '" title="Instagram" loading="lazy" style="width:100%;min-height:420px;border:0;border-radius:12px;background:#fff"></iframe>';
          return m.media_type === "video"
            ? '<video src="' + e(m.url) + '" controls preload="metadata" playsinline></video>'
            : '<a href="' + e(m.url) + '" target="_blank" rel="noopener"><img src="' + e(m.url) + '" alt="' + e(m.caption || ad.name) + '" loading="lazy"></a>';
        }).join("") + "</div>";
        var anchor = sheet.querySelector(".mk-si-map") || sheet.querySelector(".mk-si-rows");
        if (anchor) anchor.insertAdjacentHTML("beforebegin", html);
      }).catch(function () {});
      return ok;
    };
    window.mkSponsorInfo.__mkGallery = true;
  }

  var css = document.createElement("style");
  css.textContent =
    ".mk-sz-grid{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:6px 0 4px}" +
    ".mk-sz-grid .mk-sp{margin:0}" +
    ".mk-sz-grid .mk-sz-l{grid-column:1/-1}.mk-sz-grid .mk-sz-m{grid-column:span 2}.mk-sz-grid .mk-sz-s{grid-column:span 1}" +
    "@media(max-width:900px){.mk-sz-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mk-sz-grid .mk-sz-m{grid-column:1/-1}}" +
    "@media(max-width:560px){.mk-sz-grid{grid-template-columns:minmax(0,1fr)}.mk-sz-grid .mk-sz-s{grid-column:1/-1}}" +
    ".mk-sp.mk-sz{display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:16px}" +
    ".mk-sz-label{position:absolute;top:8px;right:8px;font-size:10px;font-weight:700;background:#F2B705;color:#222;border-radius:6px;padding:1px 6px;z-index:1}" +
    ".mk-sz-head{display:flex;gap:12px;align-items:center;padding-right:56px}.mk-sz-name{min-width:0}.mk-sz-name b{display:block;line-height:1.25}.mk-sz-name small{display:block;opacity:.7;font-size:12px}" +
    ".mk-sz-logo{flex:none;object-fit:cover;background:#fff;border:1px solid rgba(0,0,0,.08)}" +
    /* 2026-11-14 (owner): logos were cut (cover) – now the whole logo is visible */
    ".mk-sp .mk-sz-logo{object-fit:contain!important;padding:3px;box-sizing:border-box}" +
    ".mk-sz-hl{margin:0;font-size:13.5px;line-height:1.45}" +
    ".mk-sz-meta{display:block;font-size:12.5px;opacity:.8;line-height:1.35}" +
    ".mk-sz-coupon{padding:6px 10px;border:1.5px dashed #F2B705;border-radius:10px;font-size:12.5px;background:rgba(242,183,5,.12)}" +
    ".mk-sz-btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto;padding-top:4px}" +
    ".mk-sz-btns .mk-sp-btn{flex:1 1 auto;min-width:0;text-align:center;padding:9px 10px;border-radius:10px;background:rgba(0,0,0,.06);font-weight:700;font-size:12.5px;color:inherit;text-decoration:none;white-space:nowrap}" +
    ".mk-sz-btns .mk-sz-route{background:#1A73E8;color:#fff}" +
    /* Premium: big picture left, all data right (picture on top on phones) */
    ".mk-sp.mk-sz-l{flex-direction:row;padding:0;gap:0;min-height:230px;border:2px solid #F2B705}" +
    ".mk-sz-pic{flex:0 0 min(46%,560px);background:#111;display:flex;align-items:center}.mk-sz-pic img{display:block;width:100%;height:auto;object-fit:cover;aspect-ratio:1200/630}" +
    ".mk-sz-l .mk-sz-body{flex:1;display:flex;flex-direction:column;gap:8px;padding:16px 18px;min-width:0}" +
    ".mk-sz-l .mk-sz-logo{width:56px;height:56px;border-radius:14px}.mk-sz-l .mk-sz-name b{font-size:19px}.mk-sz-l .mk-sz-hl{font-size:14.5px}" +
    "@media(max-width:700px){.mk-sp.mk-sz-l{flex-direction:column}.mk-sz-pic{flex:none}}" +
    /* Plus: medium */
    ".mk-sz-m{min-height:190px}.mk-sz-m .mk-sz-logo{width:64px;height:64px;border-radius:14px}.mk-sz-m .mk-sz-name b{font-size:16px}" +
    /* Basic: small */
    ".mk-sp.mk-sz-s{padding:10px 12px;gap:6px}.mk-sz-s .mk-sz-logo{width:40px;height:40px;border-radius:10px}.mk-sz-s .mk-sz-name b{font-size:14px}.mk-sz-s .mk-sz-head{padding-right:48px}" +
    ".mk-sz-s .mk-sz-meta{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mk-sz-s .mk-sp-btn{padding:7px 8px}" +
    /* 2026-11-13: picture in every package + badge + glowing frame (Basic blue, Plus green, Premium red) */
    ".mk-sp.mk-sz{position:relative;padding:0;gap:0;overflow:hidden;border:2px solid transparent}" +
    ".mk-sz .mk-sz-body{flex:1;display:flex;flex-direction:column;gap:7px;padding:14px 16px 34px;min-width:0}" +
    ".mk-sz .mk-sz-pic{background:#111;overflow:hidden}.mk-sz .mk-sz-pic img{display:block;width:100%;height:100%;object-fit:cover}" +
    ".mk-sz-tier{position:absolute;right:10px;bottom:8px;font-size:10.5px;font-weight:800;letter-spacing:.3px;color:#fff;border-radius:999px;padding:2px 9px;z-index:1}" +
    ".mk-sz-tier-s{background:#1A73E8}.mk-sz-tier-m{background:#2EA043}.mk-sz-tier-l{background:#E30613}" +
    ".mk-glow-s{border-color:#1A73E8;animation:mkGlowS 2.6s ease-in-out infinite}" +
    ".mk-glow-m{border-color:#2EA043;animation:mkGlowM 2.6s ease-in-out infinite}" +
    ".mk-sp.mk-sz-l.mk-glow-l{border-color:#E30613;animation:mkGlowL 2.6s ease-in-out infinite}" +
    "@keyframes mkGlowS{0%,100%{box-shadow:0 0 0 0 rgba(26,115,232,0),0 2px 10px rgba(0,0,0,.06)}50%{box-shadow:0 0 0 3px rgba(26,115,232,.35),0 0 22px rgba(26,115,232,.55)}}" +
    "@keyframes mkGlowM{0%,100%{box-shadow:0 0 0 0 rgba(46,160,67,0),0 2px 10px rgba(0,0,0,.06)}50%{box-shadow:0 0 0 3px rgba(46,160,67,.35),0 0 22px rgba(46,160,67,.55)}}" +
    "@keyframes mkGlowL{0%,100%{box-shadow:0 0 0 0 rgba(227,6,19,0),0 2px 10px rgba(0,0,0,.06)}50%{box-shadow:0 0 0 3px rgba(227,6,19,.35),0 0 26px rgba(227,6,19,.6)}}" +
    "@media(prefers-reduced-motion:reduce){.mk-glow{animation:none!important}}" +
    /* Premium: big picture */
    ".mk-sp.mk-sz-l{flex-direction:row;min-height:260px}.mk-sz-l .mk-sz-pic{flex:0 0 min(50%,640px)}.mk-sz-l .mk-sz-pic img{aspect-ratio:1200/630}" +
    ".mk-sz-l .mk-sz-pic{display:flex;align-items:center;justify-content:center}.mk-sz-l .mk-sz-pic img{height:auto!important;object-fit:contain!important}" +
    "@media(min-width:701px) and (max-width:1100px){.mk-sp.mk-sz-l{flex-direction:column}.mk-sz-l .mk-sz-pic{flex:none}}" +
    "@media(max-width:700px){.mk-sp.mk-sz-l{flex-direction:column}.mk-sz-l .mk-sz-pic{flex:none}}" +
    /* Plus: medium picture on top */
    ".mk-sp.mk-sz-m{flex-direction:column}.mk-sz-m .mk-sz-pic{flex:none}.mk-sz-m .mk-sz-pic img{aspect-ratio:1200/630}.mk-sz-m .mk-sz-logo{width:52px;height:52px;border-radius:12px}" +
    /* Basic: small square picture left, like a story tile */
    ".mk-sp.mk-sz-s{flex-direction:row;align-items:stretch}.mk-sz-s .mk-sz-pic{flex:0 0 150px;margin:12px 0 0 12px;border-radius:10px;align-self:flex-start}.mk-sz-s .mk-sz-pic img{aspect-ratio:1200/630}"
    + "@media(max-width:400px){.mk-sz-s .mk-sz-pic{flex-basis:110px}}" +
    ".mk-sz-s .mk-sz-body{padding:12px 12px 32px}.mk-sz-s .mk-sz-logo{display:none}.mk-sz-s .mk-sz-head{padding-right:52px}" +
    ".mk-sz-s .mk-sz-hl{font-size:12.5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
    ".mk-sz-s .mk-sz-meta{white-space:normal}.mk-sz-s .mk-sz-btns .mk-sp-btn{font-size:11.5px;padding:7px 8px}" +
    ".mk-sz-grid .mk-sz-s{grid-column:span 2}.mk-sz-grid{align-items:start}" +
    "@media(max-width:900px){.mk-sz-grid .mk-sz-s{grid-column:1/-1}}" +
    /* contact sheet: map + route */
    ".mk-si-btn.route{background:#1A73E8;color:#fff}" +
    ".mk-si-desc{font-size:14px;line-height:1.5;margin:12px 0 0;white-space:pre-line}" +
    ".mk-si-gal{display:flex;gap:8px;overflow-x:auto;margin-top:14px;scroll-snap-type:x mandatory}.mk-si-gal img,.mk-si-gal video{width:150px;height:150px;object-fit:cover;border-radius:12px;flex:none;scroll-snap-align:start;background:#000}" +
    ".mk-si-map{margin-top:14px}.mk-si-map iframe{display:block;width:100%;height:200px;border:0;border-radius:14px;background:#e5e3df}" +
    ".mk-si-map a{display:block;margin-top:6px;font-size:12.5px;text-align:right;color:inherit;opacity:.75}" +
    ".ext-dark .mk-sz-btns .mk-sp-btn:not(.mk-sz-route),body.dark-mode .mk-sz-btns .mk-sp-btn:not(.mk-sz-route){background:rgba(255,255,255,.1)}";
  document.head.appendChild(css);

  function start() { hookHome(); hookSheet(); hookGallery(); load(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  setInterval(load, 10 * 60000);
})();
