/* My Kiez Berlin: contact sheet for sponsors (2026-11-11).
   A tap on a sponsor card no longer jumps to a website. It opens this sheet with the checked data from
   the customer register: address, opening hours, phone, WhatsApp, e-mail, Instagram and – only if it works –
   the website. Same behaviour as the Android app (SponsorInfoSheet.kt).
   Buttons inside a card (Anrufen / WhatsApp / …) keep working directly. */
(function () {
  "use strict";
  window.mkAdRegistry = window.mkAdRegistry || {};

  function lang() { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0 ? "tr" : typeof currentLanguage === "string" && currentLanguage.indexOf("en") === 0 ? "en" : "de"; }
  function L(de, tr, en) { var l = lang(); return l === "tr" ? tr : l === "en" ? en : de; }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function http(u) { return /^https?:\/\//.test(u || "") ? u : ""; }
  function digits(s) { return String(s || "").replace(/[^\d]/g, ""); }
  function telHref(s) { return "tel:" + String(s || "").replace(/[^\d+]/g, ""); }
  function txt(ad, key) { return ad[key + "_" + lang()] || ad[key + "_de"] || ""; }
  function cat(ad) { return ad.category ? ad.category[lang()] || ad.category.de || "" : ""; }
  function img(u) { return /^(https?:\/\/|\/)/.test(u || "") ? u : ""; }

  window.mkRegisterAds = function (list) {
    (list || []).forEach(function (ad) { if (ad && ad.id) window.mkAdRegistry[ad.id] = ad; });
  };

  function track(id) {
    try { fetch("/api/ads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "click", ids: [id] }), keepalive: true }).catch(function () {}); } catch (x) {}
  }

  function row(icon, label, value, href, ext) {
    var inner = '<span class="mk-si-ic">' + icon + '</span><span class="mk-si-tx"><small>' + e(label) + "</small><b>" + e(value) + "</b></span>";
    if (!href) return '<div class="mk-si-row">' + inner + "</div>";
    return '<a class="mk-si-row" href="' + e(href) + '"' + (ext ? ' target="_blank" rel="noopener sponsored"' : "") + ">" + inner + '<span class="mk-si-go">›</span></a>';
  }

  function close() {
    var n = document.getElementById("mk-si");
    if (n) n.remove();
    document.removeEventListener("keydown", onKey);
  }
  function onKey(ev) { if (ev.key === "Escape") close(); }

  window.mkSponsorInfo = function (idOrAd) {
    var ad = typeof idOrAd === "string" ? window.mkAdRegistry[idOrAd] : idOrAd;
    if (!ad) return false;
    close();
    track(ad.id);
    var wa = ad.link_wa ? "https://wa.me/" + digits(ad.link_wa) : "";
    var web = http(ad.link_web);
    var ig = http(ad.link_ig);
    var maps = ad.address && !/umgebung|ganz berlin/i.test(ad.address) ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ad.name + " " + ad.address) : "";
    var main = [];
    if (ad.link_tel) main.push('<a class="mk-si-btn' + (ad.primary !== "wa" ? " main" : "") + '" href="' + e(telHref(ad.link_tel)) + '">📞 ' + L("Anrufen", "Ara", "Call") + "</a>");
    if (wa) main.push('<a class="mk-si-btn wa' + (ad.primary === "wa" ? " main" : "") + '" href="' + e(wa) + '" target="_blank" rel="noopener sponsored">💬 ' + L("WhatsApp schreiben", "WhatsApp'tan yaz", "WhatsApp message") + "</a>");
    var rows = [];
    if (ad.address) rows.push(row("📍", L("Adresse", "Adres", "Address"), ad.address, maps, true));
    if (ad.hours) rows.push(row("🕒", L("Öffnungszeiten", "Çalışma saatleri", "Opening hours"), ad.hours));
    if (ad.contact) rows.push(row("👤", L("Ansprechpartner", "İletişim kişisi", "Contact person"), ad.contact));
    if (ad.link_tel) rows.push(row("📞", L("Telefon", "Telefon", "Phone"), ad.link_tel, telHref(ad.link_tel)));
    if (wa) rows.push(row("💬", "WhatsApp", ad.link_wa, wa, true));
    if (ad.fax) rows.push(row("📠", "Fax", ad.fax));
    if (ad.email) rows.push(row("✉️", L("E-Mail", "E-posta", "E-mail"), ad.email, "mailto:" + ad.email));
    if (ig) rows.push(row("📸", "Instagram", "@" + ig.replace(/\/+$/, "").split("/").pop(), ig, true));
    if (web) rows.push(row("🌐", L("Webseite", "Web sitesi", "Website"), web.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""), web, true));
    var coupon = ad.coupon && ad.coupon.code ? '<div class="mk-si-coupon">🎟️ <b>' + e(ad.coupon.code) + "</b> · " + e(ad.coupon[lang()] || ad.coupon.de || "") + "</div>" : "";
    var logo = img(ad.logo) || img(ad.image);
    var box = document.createElement("div");
    box.id = "mk-si";
    box.innerHTML =
      '<div class="mk-si-bg"></div><div class="mk-si-sheet" role="dialog" aria-modal="true" aria-label="' + e(ad.name) + '">' +
      '<button class="mk-si-x" type="button" aria-label="' + e(L("Schließen", "Kapat", "Close")) + '">✕</button>' +
      '<div class="mk-si-head">' + (logo ? '<img src="' + e(logo) + '" alt="">' : "") +
      '<div><span class="mk-si-label">' + e(L("Anzeige", "Reklam", "Ad")) + "</span><b>" + e(ad.name) + "</b>" + (cat(ad) ? "<small>" + e(cat(ad)) + "</small>" : "") + "</div></div>" +
      (txt(ad, "headline") ? '<p class="mk-si-hl">' + e(txt(ad, "headline")) + "</p>" : "") + coupon +
      (main.length ? '<div class="mk-si-btns">' + main.join("") + "</div>" : "") +
      '<div class="mk-si-rows">' + rows.join("") + "</div>" +
      '<a href="#" class="mk-si-report">⚠️ ' + e(L("Fehler melden (falsche Nummer, Link …)", "Hata bildir (yanlış numara, link …)", "Report a problem (wrong number, link …)")) + "</a></div>";
    document.body.appendChild(box);
    box.querySelector(".mk-si-bg").onclick = close;
    box.querySelector(".mk-si-x").onclick = close;
    box.querySelector(".mk-si-report").onclick = function (ev) {
      ev.preventDefault();
      close();
      if (typeof window.mkOpenSupport === "function") window.mkOpenSupport({ topic: "sponsor", sponsor: ad.name });
      else location.href = "mailto:support@mykiezberlin.com?subject=" + encodeURIComponent("Fehler: " + ad.name);
    };
    document.addEventListener("keydown", onKey);
    return true;
  };

  // Taps on a sponsor card open the sheet; the small buttons inside a card stay direct links.
  document.addEventListener("click", function (ev) {
    var t = ev.target;
    if (!t || !t.closest || t.closest(".mk-sp-btn") || t.closest("#mk-si")) return;
    var card = t.closest("[data-ad]");
    var id = card && card.getAttribute("data-ad");
    if (!id) {
      var strip = t.closest("a.ext-sponsor:not(.mkb-ad)");
      if (strip && typeof SPONSORS !== "undefined") {
        var href = strip.getAttribute("href");
        var s = SPONSORS.find(function (x) { return x.serverAd && typeof safeUrl === "function" && safeUrl(x.linkWeb) === href; });
        id = s && s.id;
      }
    }
    if (!id || !window.mkAdRegistry[id]) return;
    ev.preventDefault();
    ev.stopPropagation();
    window.mkSponsorInfo(id);
  }, true);

  var css = document.createElement("style");
  css.textContent =
    "#mk-si{position:fixed;inset:0;z-index:10050;display:flex;align-items:flex-end;justify-content:center}" +
    ".mk-si-bg{position:absolute;inset:0;background:rgba(0,0,0,.45)}" +
    ".mk-si-sheet{position:relative;width:100%;max-width:520px;max-height:88vh;overflow:auto;background:var(--card-bg,#fff);color:inherit;border-radius:20px 20px 0 0;padding:18px 16px 22px;box-shadow:0 -6px 30px rgba(0,0,0,.25)}" +
    "@media(min-width:640px){#mk-si{align-items:center}.mk-si-sheet{border-radius:20px}}" +
    ".mk-si-x{position:absolute;top:10px;right:10px;border:0;background:rgba(0,0,0,.06);border-radius:50%;width:34px;height:34px;font-size:15px;cursor:pointer;color:inherit}" +
    ".mk-si-head{display:flex;gap:12px;align-items:center;padding-right:40px}.mk-si-head img{width:60px;height:60px;border-radius:14px;object-fit:cover;flex:none}" +
    ".mk-si-head b{display:block;font-size:17px;line-height:1.25}.mk-si-head small{opacity:.7;font-size:12.5px}" +
    ".mk-si-label{display:inline-block;font-size:10px;font-weight:700;background:#F2B705;color:#222;border-radius:6px;padding:1px 6px;margin-bottom:3px}" +
    ".mk-si-hl{font-size:14px;margin:12px 0 0;line-height:1.4}" +
    ".mk-si-coupon{margin-top:10px;padding:7px 10px;border:1.5px dashed #F2B705;border-radius:10px;font-size:13px;background:rgba(242,183,5,.12)}" +
    ".mk-si-btns{display:flex;gap:8px;margin-top:14px}.mk-si-btn{flex:1;text-align:center;padding:12px 10px;border-radius:12px;background:rgba(0,0,0,.07);font-weight:700;font-size:14px;color:inherit;text-decoration:none}" +
    ".mk-si-btn.main{background:#E30613;color:#fff}.mk-si-btn.wa.main{background:#1FA855;color:#fff}" +
    ".mk-si-rows{margin-top:14px;border-top:1px solid rgba(0,0,0,.08)}" +
    ".mk-si-row{display:flex;align-items:center;gap:12px;padding:11px 2px;border-bottom:1px solid rgba(0,0,0,.08);color:inherit;text-decoration:none}" +
    ".mk-si-ic{width:24px;text-align:center;font-size:17px;flex:none}.mk-si-tx{flex:1;min-width:0}.mk-si-tx small{display:block;opacity:.65;font-size:11.5px}.mk-si-tx b{display:block;font-size:14px;font-weight:600;word-break:break-word}" +
    ".mk-si-go{opacity:.5;font-size:20px}" +
    ".mk-si-report{display:block;margin-top:14px;font-size:12.5px;opacity:.7;color:inherit;text-align:center}" +
    ".ext-dark .mk-si-sheet,body.dark-mode .mk-si-sheet,[data-theme=dark] .mk-si-sheet{background:#1e2329;color:#e6edf3}" +
    ".ext-dark .mk-si-row,.ext-dark .mk-si-rows,body.dark-mode .mk-si-row,body.dark-mode .mk-si-rows,[data-theme=dark] .mk-si-row{border-color:#30363d}" +
    ".ext-dark .mk-si-btn:not(.main),.ext-dark .mk-si-x,body.dark-mode .mk-si-btn:not(.main),body.dark-mode .mk-si-x{background:rgba(255,255,255,.1)}";
  document.head.appendChild(css);
})();
