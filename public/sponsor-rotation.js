/* My Kiez Berlin: sponsor rotation on every page change – same rules as the app.
   The package (plan) from /api/ads decides size and frequency:
   Groß = large card (3×), Mittel / Gründungspartner = medium banner (2×), Klein = small strip (1×, top of its own Kiez).
   Inside long lists a Groß/Mittel sponsor appears after every 6th entry. Coupons of sponsors appear under "Gutscheine". */
(function () {
  "use strict";
  var pageAds = [];
  var listAds = [];
  var sequence = [];
  var current = null;
  var lastTab = null;
  var listIndex = 0;
  var seen = {};
  var POS_KEY = "mk_sponsor_pos";

  function lang() { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0 ? "tr" : typeof currentLanguage === "string" && currentLanguage.indexOf("en") === 0 ? "en" : "de"; }
  function L(de, tr, en) { var l = lang(); return l === "tr" ? tr : l === "en" ? en : de; }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function txt(ad, key) { return ad[key + "_" + lang()] || ad[key + "_de"] || ""; }
  function cat(ad) { return ad.category ? ad.category[lang()] || ad.category.de || "" : ""; }
  var BLOCKED = /(jet-?gas\.de|sexyflirt\.|lovemeto\.)/i; // hijacked / adult domains, never open them
  function url(u) { return /^(https?:\/\/|tel:|\/)/.test(u || "") && !BLOCKED.test(u) ? u : ""; }
  function wa(ad) { return ad.link_wa ? "https://wa.me/" + ad.link_wa.replace(/[^\d]/g, "") : ""; }
  function tel(ad) { return ad.link_tel ? "tel:" + ad.link_tel.replace(/[^\d+]/g, "") : ""; }
  function main(ad) { return url(ad.link_web) || url(ad.link_ig) || wa(ad) || tel(ad) || "/werben"; }

  function track(kind, id) {
    if (kind === "imp") { if (seen[id]) return; seen[id] = 1; }
    try { fetch("/api/ads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: kind, ids: [id] }), keepalive: true }).catch(function () {}); } catch (x) {}
  }
  window.mkSponsorClick = function (id) { track("click", id); };

  // Smooth weighted round robin: Groß appears 3×, Mittel 2×, Klein 1× per round, well mixed.
  function buildSequence(ads) {
    var state = ads.map(function (a) { return { ad: a, w: Math.max(1, a.weight || 1), cur: 0 }; });
    var total = state.reduce(function (n, s) { return n + s.w; }, 0);
    var out = [];
    for (var i = 0; i < total; i++) {
      var best = null;
      state.forEach(function (s) { s.cur += s.w; if (!best || s.cur > best.cur) best = s; });
      best.cur -= total;
      out.push(best.ad);
    }
    return out;
  }

  function nextAd() {
    if (!sequence.length) return null;
    var pos = 0;
    try { pos = parseInt(sessionStorage.getItem(POS_KEY) || "", 10); } catch (x) {}
    if (isNaN(pos)) pos = Math.floor(Math.random() * sequence.length);
    pos = (pos + 1) % sequence.length;
    try { sessionStorage.setItem(POS_KEY, String(pos)); } catch (x) {}
    return sequence[pos];
  }

  function buttons(ad) {
    var b = [];
    if (ad.link_tel) b.push('<a class="mk-sp-btn" href="' + e(tel(ad)) + '" onclick="mkSponsorClick(\'' + e(ad.id) + '\')">📞 ' + L("Anrufen", "Ara", "Call") + "</a>");
    if (ad.link_wa) b.push('<a class="mk-sp-btn" href="' + e(wa(ad)) + '" target="_blank" rel="noopener sponsored" onclick="mkSponsorClick(\'' + e(ad.id) + '\')">💬 WhatsApp</a>');
    if (ad.link_web || ad.link_ig) b.push('<a class="mk-sp-btn main" href="' + e(url(ad.link_web) || url(ad.link_ig)) + '" target="_blank" rel="noopener sponsored" onclick="mkSponsorClick(\'' + e(ad.id) + '\')">' + e(txt(ad, "cta") || L("Ansehen", "Gör", "View")) + " →</a>");
    return b.join("");
  }
  function coupon(ad) {
    if (!ad.coupon || !ad.coupon.code) return "";
    return '<div class="mk-sp-coupon">🎟️ <b>' + e(ad.coupon.code) + "</b> · " + e(ad.coupon[lang()] || ad.coupon.de || "") + "</div>";
  }
  var LABEL = function () { return '<span class="mk-sp-label">' + L("Anzeige", "Reklam", "Ad") + "</span>"; };

  function html(ad, forced) {
    var size = forced || ad.size;
    if (size === "large") {
      return '<div class="mk-sp mk-sp-large" data-ad="' + e(ad.id) + '">' + LABEL() +
        (ad.image ? '<a href="' + e(main(ad)) + '" target="_blank" rel="noopener sponsored" onclick="mkSponsorClick(\'' + e(ad.id) + '\')"><img src="' + e(ad.image) + '" alt="' + e(ad.name) + '" loading="lazy"></a>' : "") +
        '<div class="mk-sp-body"><b>' + e(ad.name) + "</b><div>" + e(txt(ad, "headline")) + "</div>" + (ad.address ? '<small>📍 ' + e(ad.address) + (ad.hours ? " · 🕒 " + e(ad.hours) : "") + "</small>" : "") + coupon(ad) + '<div class="mk-sp-btns">' + buttons(ad) + "</div></div></div>";
    }
    var logo = ad.logo || ad.image;
    if (size === "small") {
      return '<a class="mk-sp mk-sp-small" data-ad="' + e(ad.id) + '" href="' + e(main(ad)) + '" target="_blank" rel="noopener sponsored" onclick="mkSponsorClick(\'' + e(ad.id) + '\')">' +
        (logo ? '<img src="' + e(logo) + '" alt="" loading="lazy">' : "") + '<span class="mk-sp-t"><b>' + e(ad.name) + "</b><small>" + e(cat(ad) || txt(ad, "headline")) + '</small></span><span class="mk-sp-label">' + L("Anzeige", "Reklam", "Ad") + "</span><span>→</span></a>";
    }
    return '<div class="mk-sp mk-sp-medium" data-ad="' + e(ad.id) + '">' + LABEL() +
      '<div class="mk-sp-row">' + (logo ? '<img src="' + e(logo) + '" alt="" loading="lazy">' : "") +
      '<div class="mk-sp-t"><b>' + e(ad.name) + "</b>" + (cat(ad) ? "<small>" + e(cat(ad)) + "</small>" : "") + "<div>" + e(txt(ad, "headline")) + "</div></div></div>" + coupon(ad) + '<div class="mk-sp-btns">' + buttons(ad) + "</div></div>";
  }

  function kiezMatch(ad, kiez) {
    if (!ad.kieze || !kiez || kiez === "all") return false;
    var a = ad.kieze.toLowerCase(), b = String(kiez).toLowerCase();
    return a.indexOf(b) >= 0 || b.indexOf(a) >= 0;
  }

  function decorate() {
    var content = document.getElementById("main-tab-content");
    if (!content || !sequence.length) return;
    var tab = typeof currentTab === "string" ? currentTab : "";
    if (tab !== lastTab) { current = nextAd(); lastTab = tab; listIndex = 0; }
    content.querySelectorAll(".mk-sp-slot").forEach(function (n) { n.remove(); });
    // Home already shows the Groß sponsors and the strip; every other page gets the rotating slot.
    if (tab !== "home" && current) {
      var top = document.createElement("div");
      top.className = "mk-sp-slot";
      var kiez = typeof filters === "object" && filters ? filters.kiez : "all";
      var local = pageAds.filter(function (a) { return a.size === "small" && kiezMatch(a, kiez); });
      top.innerHTML = local.map(function (a) { return html(a, "small"); }).join("") + html(current);
      content.insertBefore(top, content.firstChild);
      track("imp", current.id);
      local.forEach(function (a) { track("imp", a.id); });
    }
    // Inside long lists: a Groß/Mittel sponsor after every 6th card
    if (listAds.length) {
      var cards = Array.prototype.filter.call(content.children, function (n) { return n.classList && n.classList.contains("card-item") && !n.classList.contains("mkb-ad"); });
      for (var i = 5; i < cards.length - 1; i += 6) {
        var ad = listAds[(listIndex + Math.floor(i / 6)) % listAds.length];
        var slot = document.createElement("div");
        slot.className = "mk-sp-slot";
        slot.innerHTML = html(ad, "medium");
        cards[i].insertAdjacentElement("afterend", slot);
        track("imp", ad.id);
      }
    }
    // Coupons of sponsors on the "Gutscheine" page
    if (tab === "deals") {
      var withCoupon = pageAds.filter(function (a) { return a.coupon && a.coupon.code; });
      if (withCoupon.length) {
        var box = document.createElement("div");
        box.className = "mk-sp-slot";
        box.innerHTML = '<h3 class="ext-subheading">🎟️ ' + L("Gutscheine unserer Partner", "Partnerlerimizin kuponları", "Coupons from our partners") + "</h3>" + withCoupon.map(function (a) { return html(a, "medium"); }).join("");
        var heading = content.querySelector(".ext-heading");
        if (heading) heading.insertAdjacentElement("afterend", box); else content.appendChild(box);
      }
    }
  }

  function hook() {
    if (typeof renderTabContent !== "function" || renderTabContent.__mkSponsor) return;
    var base = renderTabContent;
    renderTabContent = function () {
      var r = base.apply(this, arguments);
      try { decorate(); } catch (x) {}
      return r;
    };
    renderTabContent.__mkSponsor = true;
  }

  function load() {
    Promise.all([
      fetch("/api/ads?place=page").then(function (r) { return r.ok ? r.json() : { ads: [] }; }),
      fetch("/api/ads?place=list").then(function (r) { return r.ok ? r.json() : { ads: [] }; }),
    ]).then(function (res) {
      pageAds = res[0].ads || [];
      listAds = res[1].ads || [];
      window.mkAdRegistry = window.mkAdRegistry || {};
      pageAds.concat(listAds).forEach(function (a) { window.mkAdRegistry[a.id] = a; }); // contact sheet (sponsor-info.js)
      sequence = buildSequence(pageAds);
      hook();
      decorate();
    }).catch(function () {});
  }

  var css = document.createElement("style");
  css.textContent =
    ".mk-sp{position:relative;display:block;margin:10px 0;border-radius:16px;background:var(--card-bg,#fff);border:1px solid rgba(0,0,0,.08);box-shadow:0 2px 10px rgba(0,0,0,.06);overflow:hidden;color:inherit;text-decoration:none}" +
    ".mk-sp-label{position:absolute;top:8px;right:8px;font-size:10px;font-weight:700;background:#F2B705;color:#222;border-radius:6px;padding:1px 6px}" +
    ".mk-sp-large img{display:block;width:100%;aspect-ratio:1200/630;object-fit:cover}" +
    ".mk-sp-body{padding:10px 12px 12px}.mk-sp-body b{font-size:16px}.mk-sp-body div{font-size:13px;margin-top:2px}.mk-sp-body small{display:block;opacity:.7;margin-top:4px}" +
    ".mk-sp-row{display:flex;gap:10px;padding:12px 12px 4px}.mk-sp-row img{width:58px;height:58px;border-radius:12px;object-fit:cover;flex:none}" +
    ".mk-sp-t{display:flex;flex-direction:column;min-width:0;flex:1}.mk-sp-t b{font-size:14.5px;padding-right:56px}.mk-sp-t small{opacity:.7;font-size:11.5px}.mk-sp-t div{font-size:12.5px;margin-top:2px}" +
    ".mk-sp-btns{display:flex;flex-wrap:wrap;gap:6px;padding:6px 12px 12px}.mk-sp-body .mk-sp-btns{padding:8px 0 0}" +
    ".mk-sp-btn{flex:1;min-width:88px;text-align:center;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.06);font-weight:700;font-size:12.5px;color:inherit;text-decoration:none}.mk-sp-btn.main{background:#E30613;color:#fff}" +
    ".mk-sp-coupon{margin:6px 12px 0;padding:6px 10px;border:1.5px dashed #F2B705;border-radius:10px;font-size:12.5px;background:rgba(242,183,5,.12)}.mk-sp-body .mk-sp-coupon{margin:6px 0 0}" +
    ".mk-sp-small{display:flex;align-items:center;gap:10px;padding:8px 10px;border-left:4px solid #F2B705;background:rgba(242,183,5,.10)}.mk-sp-small img{width:36px;height:36px;border-radius:8px;object-fit:cover}.mk-sp-small .mk-sp-label{position:static}.mk-sp-small .mk-sp-t b{padding-right:0}" +
    ".ext-dark .mk-sp,body.dark-mode .mk-sp,[data-theme=dark] .mk-sp{background:#1e2329;border-color:#30363d}";
  document.head.appendChild(css);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load); else load();
  setInterval(load, 10 * 60000);
})();
