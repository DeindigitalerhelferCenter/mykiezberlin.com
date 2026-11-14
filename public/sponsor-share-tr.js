/* My Kiez Berlin – 2026-11-14 (owner):
   1. "Teilen" for every sponsor: button in the contact sheet and a small share icon on every sponsor card.
      The shared link is https://mykiezberlin.com/s/<id> (preview with banner, see functions/s/[id].js).
      Whoever opens it lands directly on that sponsor (?sponsor=<id> opens the contact sheet).
   2. Page "Türkiye Sponsorları" (tab "tuerkei"): every sponsor with region "tr" (Yusuf Car Rental, PackPress,
      Aqua Marinn, Dr. Adnan Gürcan). The sponsors stay in all other lists as well.
   3. Home page: live clock + Berlin weather at the top.
   Same functions in the Android app (v1.33). */
(function () {
  "use strict";
  var SITE = "https://mykiezberlin.com";

  function lang() { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0 ? "tr" : typeof currentLanguage === "string" && currentLanguage.indexOf("en") === 0 ? "en" : "de"; }
  function L(de, tr, en) { var l = lang(); return l === "tr" ? tr : l === "en" ? (en || de) : de; }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function adById(id) { return (window.mkAdRegistry && window.mkAdRegistry[id]) || (window.mkAllAds || []).find(function (a) { return a.id === id; }) || null; }
  function toast(msg) { if (typeof showToast === "function") showToast(msg); }

  // ---------- 1. share ----------
  window.mkShareSponsor = function (id) {
    var ad = adById(id);
    var url = SITE + "/s/" + encodeURIComponent(id);
    var name = ad ? ad.name : "My Kiez Berlin";
    var hl = ad ? (ad["headline_" + lang()] || ad.headline_de || "") : "";
    var text = name + (hl ? " – " + hl : "");
    if (navigator.share) {
      navigator.share({ title: name, text: text, url: url }).catch(function () {});
      return;
    }
    // PC without share menu: WhatsApp Web + copy link
    try { if (navigator.clipboard) navigator.clipboard.writeText(url); } catch (x) {}
    window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url), "_blank", "noopener");
    toast(L("Link kopiert", "Link kopyalandı", "Link copied"));
  };

  var SHARE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18 16.1c-.8 0-1.5.3-2 .8l-7.1-4.1c.1-.3.1-.5.1-.8s0-.5-.1-.8L16 7.1c.5.5 1.2.8 2 .8 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .3 0 .5.1.8L8 9.8C7.5 9.3 6.8 9 6 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.3 2-.8l7.1 4.2c-.1.2-.1.5-.1.7 0 1.6 1.3 2.9 2.9 2.9s2.9-1.3 2.9-2.9-1.2-3-2.8-3z"/></svg>';

  // share icon on every sponsor card (class mk-sp-btn = the card tap does not open the sheet)
  function hookCards() {
    if (typeof window.mkSponsorCardHtml !== "function" || window.mkSponsorCardHtml.__mkShare) return;
    var base = window.mkSponsorCardHtml;
    window.mkSponsorCardHtml = function (ad, size) {
      var html = base.apply(this, arguments);
      if (!ad || !ad.id) return html;
      var btn = '<button type="button" class="mk-sp-btn mk-share-ic" aria-label="' + e(L("Teilen", "Paylaş", "Share")) + '" title="' + e(L("Teilen", "Paylaş", "Share")) +
        '" onclick="event.stopPropagation();mkShareSponsor(\'' + e(ad.id) + '\')">' + SHARE_SVG + "</button>";
      var i = html.indexOf(">");
      return i > 0 ? html.slice(0, i + 1) + btn + html.slice(i + 1) : html;
    };
    window.mkSponsorCardHtml.__mkShare = true;
  }

  // share button in the contact sheet
  function hookSheet() {
    if (typeof window.mkSponsorInfo !== "function" || window.mkSponsorInfo.__mkShare) return;
    var base = window.mkSponsorInfo;
    window.mkSponsorInfo = function (idOrAd) {
      var ok = base.apply(this, arguments);
      var ad = typeof idOrAd === "string" ? adById(idOrAd) : idOrAd;
      var box = document.getElementById("mk-si");
      if (ok && ad && box && !box.querySelector(".mk-si-share")) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "mk-si-btn mk-si-share";
        b.innerHTML = SHARE_SVG + " " + e(L("Teilen", "Paylaş", "Share"));
        b.onclick = function () { window.mkShareSponsor(ad.id); };
        var row = box.querySelector(".mk-si-btns");
        if (!row) {
          row = document.createElement("div");
          row.className = "mk-si-btns";
          var hl = box.querySelector(".mk-si-rows");
          hl.parentNode.insertBefore(row, hl);
        }
        row.appendChild(b);
      }
      return ok;
    };
    window.mkSponsorInfo.__mkShare = true;
  }

  // ?sponsor=<id> (from the share link) opens that sponsor directly
  function openFromUrl() {
    var id = "";
    try { id = new URLSearchParams(location.search).get("sponsor") || ""; } catch (x) { id = ""; }
    id = id.toLowerCase().replace(/[^a-z0-9-]/g, "");
    // ?tab=tuerkei opens the page "Türkiye Sponsorları" directly (link for sharing)
    var tab = "";
    try { tab = new URLSearchParams(location.search).get("tab") || ""; } catch (x) { tab = ""; }
    if (tab === "tuerkei" && typeof switchTab === "function") setTimeout(function () { switchTab("tuerkei"); }, 0);
    if (!id) return;
    var tries = 0;
    (function wait() {
      hookSheet();
      if (adById(id) && typeof window.mkSponsorInfo === "function") {
        window.mkSponsorInfo(adById(id));
        try { history.replaceState(null, "", location.pathname + location.hash); } catch (x) {}
        return;
      }
      if (++tries === 20) {
        // not in the rotation list (e.g. Kiez Basic): load the full list once
        fetch("/api/ads?place=list").then(function (r) { return r.ok ? r.json() : { ads: [] }; }).then(function (d) {
          if (typeof window.mkRegisterAds === "function") window.mkRegisterAds(d.ads || []);
        }).catch(function () {});
      }
      if (tries < 60) setTimeout(wait, 250);
    })();
  }

  // ---------- 2. Türkiye Sponsorları ----------
  function trAds() { return (window.mkAllAds || []).filter(function (a) { return a.region === "tr"; }); }
  function renderTurkeyPage(container) {
    hookCards();
    var ads = trAds();
    if (!ads.length && !window.mkAllAds) {
      // sponsor list not loaded yet: try again shortly while this page is open
      setTimeout(function () {
        var c = document.getElementById("main-tab-content");
        if (c && typeof currentTab === "string" && currentTab === "tuerkei") renderTurkeyPage(c);
      }, 400);
    }
    container.innerHTML = '<div class="mk-tr-page"><h2 class="ext-heading">🇹🇷 ' + e(L("Sponsoren aus der Türkei", "Türkiye Sponsorları", "Sponsors from Turkey")) + (ads.length ? " (" + ads.length + ")" : "") + "</h2>" +
      '<p style="margin:-4px 0 12px;opacity:.75;font-size:14px">' + e(L("Partner von My Kiez Berlin in der Türkei – Urlaub, Auto, Ästhetik und Verpackung.", "My Kiez Berlin'in Türkiye'deki partnerleri – tatil, araç, estetik ve ambalaj.", "My Kiez Berlin partners in Turkey.")) + "</p>" +
      (ads.length ? '<div class="mk-sz-grid">' + ads.map(function (a) { return window.mkSponsorCardHtml(a, "medium"); }).join("") + "</div>"
        : '<p style="color:#888">' + e(L("Wird geladen…", "Yükleniyor…", "Loading…")) + "</p>") +
      '<button type="button" class="btn-primary ext-cta" style="margin-top:16px" onclick="switchTab(\'sponsors\')">🤝 ' + e(L("Alle Sponsoren", "Tüm sponsorlar", "All sponsors")) + " →</button></div>";
    if (typeof window.mkRegisterAds === "function") window.mkRegisterAds(ads);
    setTimeout(function () { if (window.mkSeenIn) window.mkSeenIn(container); }, 300);
  }
  if (typeof EXTRA_TABS === "object" && EXTRA_TABS) EXTRA_TABS.tuerkei = renderTurkeyPage;

  function turkeyButton() {
    var n = trAds().length;
    if (!n) return "";
    return '<button type="button" class="mk-tr-btn" onclick="switchTab(\'tuerkei\')"><span>🇹🇷</span><b>' + e(L("Sponsoren aus der Türkei", "Türkiye Sponsorları", "Sponsors from Turkey")) + "</b><small>" + n + " →</small></button>";
  }

  // ---------- 3. clock + weather on the home page ----------
  var WX = [[0, "☀️"], [3, "⛅"], [48, "🌫️"], [67, "🌧️"], [77, "🌨️"], [82, "🌦️"], [99, "⛈️"]];
  function wxIcon(code) { return (WX.find(function (x) { return code <= x[0]; }) || [0, "🌡️"])[1]; }
  var weather = null, wxLoading = false;
  function loadWeather() {
    if (typeof liveData === "object" && liveData && liveData.weather) { weather = liveData.weather; return; }
    if (wxLoading) return;
    wxLoading = true;
    fetch("/api/live").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.weather) { weather = d.weather; paintClock(); }
    }).catch(function () {}).then(function () { wxLoading = false; });
  }
  function paintClock() {
    var box = document.getElementById("mk-clock");
    if (!box) return;
    var now = new Date();
    var loc = lang() === "tr" ? "tr-TR" : lang() === "en" ? "en-GB" : "de-DE";
    var time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });
    var date = now.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Berlin" });
    if (!weather && typeof liveData === "object" && liveData && liveData.weather) weather = liveData.weather;
    var wx = weather ? '<div class="mk-clock-wx" onclick="switchTab(\'sport\')" role="button" tabindex="0"><span class="mk-clock-ic">' + wxIcon(Number(weather.code)) + "</span><b>" + e(Math.round(Number(weather.temperature))) + "°C</b><small>Berlin</small></div>" : '<div class="mk-clock-wx"><small>Berlin</small></div>';
    box.innerHTML = '<div class="mk-clock-t"><b>' + e(time) + "</b><small>" + e(date) + "</small></div>" + wx;
  }
  setInterval(paintClock, 15000);

  function hookHome() {
    if (typeof renderHomeTab !== "function" || renderHomeTab.__mkClock) return;
    var base = renderHomeTab;
    renderHomeTab = function (container) {
      hookCards();
      base.apply(this, arguments);
      if (!container) return;
      loadWeather();
      container.insertAdjacentHTML("afterbegin", '<div id="mk-clock" class="mk-clock"></div>');
      paintClock();
      var all = container.querySelector(".mk-deck-all");
      var trb = turkeyButton();
      if (trb) {
        if (all) all.insertAdjacentHTML("afterend", trb);
        else container.insertAdjacentHTML("beforeend", trb);
      }
    };
    renderHomeTab.__mkClock = true;
  }

  var css = document.createElement("style");
  css.textContent =
    ".mk-sp{position:relative}" +
    ".mk-sp .mk-share-ic{position:absolute;top:8px;left:8px;right:auto;z-index:3;width:34px!important;height:34px!important;min-width:0!important;max-width:34px;flex:none!important;border-radius:50%!important;border:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.95)!important;color:#0F172A!important;box-shadow:0 1px 6px rgba(0,0,0,.3);cursor:pointer;padding:0!important;margin:0!important}" +
    ".mk-tr-page{grid-column:1/-1}" +
    ".mk-si-btn.mk-si-share{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;cursor:pointer;font:inherit;font-weight:700}" +
    ".mk-clock{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:4px 0 12px;padding:12px 16px;border-radius:16px;background:linear-gradient(135deg,#0F172A,#1E3A8A);color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.12)}" +
    ".mk-clock-t b{display:block;font-size:30px;line-height:1.05;font-variant-numeric:tabular-nums;letter-spacing:.5px}.mk-clock-t small{opacity:.8;font-size:13px}" +
    ".mk-clock-wx{display:flex;align-items:center;gap:6px;cursor:pointer;text-align:right}.mk-clock-ic{font-size:30px}.mk-clock-wx b{font-size:22px}.mk-clock-wx small{opacity:.8;font-size:12px;align-self:flex-end;margin-bottom:3px}" +
    ".mk-tr-btn{grid-column:1/-1;display:flex;align-items:center;gap:10px;width:100%;margin:8px 0 14px;padding:12px 16px;border-radius:14px;border:0;cursor:pointer;background:#E30A17;color:#fff;font:inherit;text-align:left}" +
    ".mk-tr-btn span{font-size:24px}.mk-tr-btn b{flex:1;font-size:15px}.mk-tr-btn small{font-weight:800;font-size:14px}";
  document.head.appendChild(css);

  hookCards();
  hookSheet();
  hookHome();
  openFromUrl();
  // other scripts may set their functions later
  setTimeout(function () { hookCards(); hookSheet(); hookHome(); }, 0);
  window.addEventListener("load", function () { hookCards(); hookSheet(); hookHome(); });
})();
