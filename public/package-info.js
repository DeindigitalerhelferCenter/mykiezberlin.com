/* My Kiez Berlin – package size preview + info window before booking (2026-11-13).
   Used on the home page (package cards) and on /werben.
   - Every package card shows a small picture of the page: how big the sponsor card will be
     (Premium = full row, Plus = half row, Basic = quarter). No text needed to see the difference.
   - A tap on "Paket wählen" first opens an info window: size, where it appears, how often,
     own pictures/videos (daily or weekly – the sponsor decides), Google Maps route, self-service panel.
     "Weiter" then does what the button did before (form on /werben, or opens /werben from home).
   Media limits must match MEDIA_QUOTA in functions/_lib/plans.js. */
(function () {
  "use strict";
  var QUOTA = { s: { day: [3, 1], week: [15, 5] }, m: { day: [5, 2], week: [25, 8] }, l: { day: [10, 3], week: [50, 15] } };

  function lang() {
    var l = (typeof currentLanguage === "string" && currentLanguage) || (typeof window.lang === "string" && window.lang) || document.documentElement.lang || "de";
    return l.indexOf("tr") === 0 ? "tr" : l.indexOf("en") === 0 ? "en" : "de";
  }
  function L(de, tr, en) { var l = lang(); return l === "tr" ? tr : l === "en" ? en : de; }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  var NAMES = { s: "Kiez Basic", m: "Kiez Plus", l: "Kiez Premium" };
  var PRICE = { s: 29, m: 49, l: 89 };

  // Small page picture: Premium full row, Plus half row, Basic quarter – own size highlighted.
  window.mkPackagePreview = function (size, big) {
    return '<div class="mkpv' + (big ? " big" : "") + '" aria-hidden="true">' +
      '<i class="l' + (size === "l" ? " on" : "") + '"></i>' +
      '<i class="m' + (size === "m" ? " on" : "") + '"></i><i class="m"></i>' +
      '<i class="s' + (size === "s" ? " on" : "") + '"></i><i class="s"></i><i class="s"></i><i class="s"></i></div>';
  };

  function info(size) {
    var q = QUOTA[size];
    var where = {
      s: [L("Kleine Karte (¼ Breite) mit Logo, Name, Adresse", "Küçük kart (¼ genişlik): logo, isim, adres", "Small card (¼ width): logo, name, address"),
        L("Ganz oben in deinem eigenen Kiez", "Kendi mahallende en üstte", "At the top of your own Kiez"),
        L("Bei jedem Seitenwechsel in der Rotation (1×)", "Her sayfa geçişinde dönüşümlü (1×)", "In the rotation on every page change (1×)")],
      m: [L("Mittlere Karte (½ Breite) mit Logo, Text, Adresse, Öffnungszeiten", "Orta kart (½ genişlik): logo, metin, adres, çalışma saatleri", "Medium card (½ width): logo, text, address, opening hours"),
        L("Berlin-weit: Sponsor-Leiste und zwischen den Einträgen", "Tüm Berlin: sponsor şeridi ve kayıtların arasında", "All of Berlin: sponsor strip and between listings"),
        L("2× so oft wie Basic", "Basic'ten 2 kat daha sık", "2× as often as Basic")],
      l: [L("Große Karte (volle Breite) mit großem Bild und allen Daten", "Büyük kart (tam genişlik): büyük resim ve tüm bilgiler", "Large card (full width) with a big picture and all data"),
        L("Startseite ganz oben + Berlin-weit + zwischen den Einträgen", "Ana sayfada en üstte + tüm Berlin + kayıtların arasında", "Top of the home page + all of Berlin + between listings"),
        L("3× so oft wie Basic", "Basic'ten 3 kat daha sık", "3× as often as Basic")],
    }[size];
    return '<div class="mkpi-sheet" role="dialog" aria-modal="true" aria-label="' + e(NAMES[size]) + '">' +
      '<button type="button" class="mkpi-x" aria-label="' + e(L("Schließen", "Kapat", "Close")) + '">✕</button>' +
      "<h3>" + e(NAMES[size]) + ' <span class="mkpi-price">' + PRICE[size] + " €" + e(L("/Monat", "/ay", "/month")) + "</span></h3>" +
      '<p class="mkpi-start">🎉 ' + e(L("Start: 3 Monate nur 19 €/Monat · monatlich kündbar", "Başlangıç: ilk 3 ay sadece 19 €/ay · her ay iptal edilebilir", "Launch: first 3 months only €19/month · cancel monthly")) + "</p>" +
      window.mkPackagePreview(size, true) +
      '<p class="mkpi-cap">' + e(L("So groß erscheint deine Karte (farbig markiert)", "Kartın bu büyüklükte görünür (renkli olan)", "This is how big your card appears (coloured)")) + "</p>" +
      "<h4>📍 " + e(L("Größe & Platz", "Boyut & yer", "Size & place")) + "</h4><ul>" + where.map(function (w) { return "<li>" + e(w) + "</li>"; }).join("") + "</ul>" +
      "<h4>📸 " + e(L("Eigene Bilder & Videos", "Kendi resim & videoların", "Own pictures & videos")) + "</h4><ul>" +
      "<li>" + e(L("Du entscheidest: täglich oder wöchentlich", "Sen seçersin: günlük veya haftalık", "You decide: daily or weekly")) + "</li>" +
      "<li>" + e(L("Täglich: bis " + q.day[0] + " Bilder + " + q.day[1] + " Videos", "Günlük: " + q.day[0] + " resim + " + q.day[1] + " videoya kadar", "Daily: up to " + q.day[0] + " pictures + " + q.day[1] + " videos")) + "</li>" +
      "<li>" + e(L("Oder wöchentlich: bis " + q.week[0] + " Bilder + " + q.week[1] + " Videos", "Veya haftalık: " + q.week[0] + " resim + " + q.week[1] + " videoya kadar", "Or weekly: up to " + q.week[0] + " pictures + " + q.week[1] + " videos")) + "</li>" +
      "<li>" + e(L("Text ohne Limit, jederzeit selbst ändern", "Metin sınırsız, istediğin zaman kendin değiştir", "Unlimited text, change it yourself any time")) + "</li></ul>" +
      "<h4>✅ " + e(L("Immer dabei", "Her pakette", "Always included")) + "</h4><ul>" +
      "<li>" + e(L("Logo, Telefon, WhatsApp, Adresse, Öffnungszeiten, Webseite", "Logo, telefon, WhatsApp, adres, çalışma saatleri, web sitesi", "Logo, phone, WhatsApp, address, opening hours, website")) + "</li>" +
      "<li>" + e(L("🗺️ Google Maps: Pin auf der Karte + „Route“-Button für Kunden", "🗺️ Google Maps: haritada pin + müşteriler için „Yol tarifi“ butonu", "🗺️ Google Maps: pin on the map + “Directions” button for customers")) + "</li>" +
      "<li>" + e(L("Eigenes Sponsor-Panel (Link per E-Mail) – Inhalte prüfen wir kurz", "Kendi sponsor panelin (e-postayla link) – içerikleri kısaca kontrol ederiz", "Own sponsor panel (link by e-mail) – we check content briefly")) + "</li>" +
      "<li>" + e(L("Monatlicher Bericht: wie oft gesehen und angeklickt", "Aylık rapor: kaç kez görüldü ve tıklandı", "Monthly report: how often seen and clicked")) + "</li></ul>" +
      '<div class="mkpi-btns"><button type="button" class="mkpi-go">' + e(L("Weiter – Paket wählen", "Devam – paketi seç", "Continue – choose package")) + ' →</button>' +
      '<button type="button" class="mkpi-cancel">' + e(L("Zurück", "Geri", "Back")) + "</button></div></div>";
  }

  function open(size, go) {
    close();
    var box = document.createElement("div");
    box.id = "mkpi";
    box.innerHTML = '<div class="mkpi-bg"></div>' + info(size);
    document.body.appendChild(box);
    box.querySelector(".mkpi-bg").onclick = close;
    box.querySelector(".mkpi-x").onclick = close;
    box.querySelector(".mkpi-cancel").onclick = close;
    box.querySelector(".mkpi-go").onclick = function () { close(); go(); };
    document.addEventListener("keydown", onKey);
    box.querySelector(".mkpi-go").focus();
  }
  function close() { var n = document.getElementById("mkpi"); if (n) n.remove(); document.removeEventListener("keydown", onKey); }
  function onKey(ev) { if (ev.key === "Escape") close(); }
  window.mkPackageInfo = open;

  // Size of a package button/card: /werben uses data-size, the home page links to /werben?size=
  function sizeOf(a) {
    var s = a.getAttribute("data-size");
    if (!s) { var m = (a.getAttribute("href") || "").match(/[?&]size=([sml])\b/); s = m && m[1]; }
    return s === "s" || s === "m" || s === "l" ? s : "";
  }

  // Info window first; "Weiter" repeats the original click (flag skips the window the second time).
  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest(".pk a.pick, a.mkb-pk");
    if (!a || a.__mkpiOk) return;
    var size = sizeOf(a);
    if (!size) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    open(size, function () { a.__mkpiOk = true; a.click(); setTimeout(function () { a.__mkpiOk = false; }, 0); });
  }, true);

  // Previews inside the package cards
  function decorate() {
    document.querySelectorAll(".pk a.pick[data-size], a.mkb-pk").forEach(function (a) {
      var card = a.classList.contains("mkb-pk") ? a : a.closest(".pk");
      var size = sizeOf(a);
      if (!card || !size || card.querySelector(".mkpv")) return;
      var anchor = card.querySelector(".size, small");
      var html = window.mkPackagePreview(size, false);
      if (anchor) anchor.insertAdjacentHTML("afterend", html); else card.insertAdjacentHTML("afterbegin", html);
    });
  }
  new MutationObserver(function () { decorate(); }).observe(document.documentElement, { childList: true, subtree: true });

  var css = document.createElement("style");
  css.textContent =
    ".mkpv{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:8px;margin:8px 0 4px;border-radius:12px;background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.08)}" +
    ".mkpv i{display:block;border-radius:5px;background:rgba(0,0,0,.12)}.mkpv .l{grid-column:1/-1;height:30px}.mkpv .m{grid-column:span 2;height:22px}.mkpv .s{height:14px}" +
    ".mkpv i.on{background:#E30613;box-shadow:0 0 0 2px #F2B705}.mkpv.big{gap:6px;padding:12px}.mkpv.big .l{height:56px}.mkpv.big .m{height:40px}.mkpv.big .s{height:24px}" +
    "#mkpi{position:fixed;inset:0;z-index:10060;display:flex;align-items:flex-end;justify-content:center}" +
    ".mkpi-bg{position:absolute;inset:0;background:rgba(0,0,0,.5)}" +
    ".mkpi-sheet{position:relative;width:100%;max-width:520px;max-height:90vh;overflow:auto;background:var(--card,var(--surface-color,#fff));color:var(--ink,var(--text-main,#0F172A));border-radius:20px 20px 0 0;padding:20px 18px 22px;box-shadow:0 -6px 30px rgba(0,0,0,.3)}" +
    "@media(min-width:640px){#mkpi{align-items:center}.mkpi-sheet{border-radius:20px}}" +
    ".mkpi-sheet h3{margin:0 40px 4px 0;font-size:21px;font-weight:800}.mkpi-price{color:#E30613;white-space:nowrap}" +
    ".mkpi-start{margin:0 0 6px;font-size:13.5px;font-weight:700}.mkpi-cap{margin:0 0 6px;font-size:12px;opacity:.7;text-align:center}" +
    ".mkpi-sheet h4{margin:14px 0 4px;font-size:15px}.mkpi-sheet ul{margin:0;padding-left:20px;font-size:14px;line-height:1.5}" +
    ".mkpi-x{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:0;background:rgba(0,0,0,.07);font-size:15px;cursor:pointer;color:inherit}" +
    ".mkpi-btns{display:flex;flex-direction:column;gap:8px;margin-top:18px}" +
    ".mkpi-go{padding:14px;border:0;border-radius:12px;background:#E30613;color:#fff;font-weight:800;font-size:15px;cursor:pointer}" +
    ".mkpi-cancel{padding:10px;border:0;background:none;color:inherit;opacity:.7;cursor:pointer;font-size:14px}" +
    "[data-theme=dark] .mkpi-sheet,html.ext-dark .mkpi-sheet{background:#1e2329;color:#e6edf3}[data-theme=dark] .mkpv,html.ext-dark .mkpv{background:rgba(255,255,255,.06)}[data-theme=dark] .mkpv i:not(.on),html.ext-dark .mkpv i:not(.on){background:rgba(255,255,255,.18)}";
  document.head.appendChild(css);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", decorate); else decorate();
})();
