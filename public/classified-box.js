/* 2026-11-27 (owner "UYGULA ilan 3"): "🛍️ Kiez-Kleinanzeigen · Mahalle ilanları" box on the home page.
   The 3 newest classifieds with picture, price and Kiez (ads of the chosen Kiez first), "Alle →" opens
   /community/#ilan, "Inserieren" opens the form there. With no ad yet: invitation to place the first one. */
(function () {
  "use strict";
  var ads = null;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function tr() { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0; }
  var css = document.createElement("style");
  css.textContent =
    ".mk-clf{grid-column:1/-1;width:100%;box-sizing:border-box;margin:14px 0;padding:14px;border-radius:18px;background:#fff;border:2px solid #0EA5E9;box-shadow:0 2px 10px rgba(0,0,0,.06)}" +
    ".mk-clf h3{margin:0 0 8px;font-size:16px;font-weight:900}.mk-clf .rw{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}" +
    ".mk-clf .it{text-decoration:none;color:inherit;font-size:12px;line-height:1.3}.mk-clf .it img,.mk-clf .it .ph{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:12px;background:#e0f2fe;display:flex;align-items:center;justify-content:center;font-size:30px}" +
    ".mk-clf .it b{display:block;margin-top:4px;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mk-clf .pr{color:#16a34a;font-weight:800}" +
    ".mk-clf .bt{display:flex;gap:8px;margin-top:10px}.mk-clf .bt a{flex:1;text-align:center;padding:10px;border-radius:12px;font-weight:900;font-size:13.5px;text-decoration:none}" +
    ".mk-clf .a1{background:#0EA5E9;color:#fff!important}.mk-clf .a2{background:#e0f2fe;color:#0369a1!important}" +
    "body.dark-mode .mk-clf,.dark .mk-clf{background:#161b22;color:#e6edf3}";
  document.head.appendChild(css);

  function myKiez() {
    try { return (window.activeKiezFilter || localStorage.getItem("mykiez_kiez") || "").toString().toLowerCase(); } catch (e) { return ""; }
  }
  function box() {
    var list = (ads || []).slice();
    var k = myKiez();
    if (k) list.sort(function (a, b) { return ((String(b.kiezName || "").toLowerCase() === k) - (String(a.kiezName || "").toLowerCase() === k)) || (b.createdAt - a.createdAt); });
    list = list.slice(0, 3);
    var T = tr();
    var items = list.map(function (a) {
      var pic = (a.media || []).filter(function (m) { return m.type !== "video"; })[0];
      return '<a class="it" href="/community/#ilan">' + (pic ? '<img src="' + esc(pic.url) + '" alt="" loading="lazy">' : '<span class="ph">🛍️</span>') +
        "<b>" + esc(a.title) + "</b>" + (a.price ? '<span class="pr">' + esc(a.price) + "</span> · " : "") + esc(a.kiezName || "") + "</a>";
    }).join("");
    return '<div class="mk-clf" data-mk-clf><h3>🛍️ ' + (T ? "Mahalle ilanları · Kiez-Kleinanzeigen" : "Kiez-Kleinanzeigen · Mahalle ilanları") + "</h3>" +
      (items ? '<div class="rw">' + items + "</div>" : '<p style="margin:0;font-size:13.5px">' + (T ? "Henüz ilan yok – ilk ilanı sen ver! Satmak, hediye etmek, aramak… 7 gün ücretsiz." : "Noch keine Anzeige – sei die/der Erste! Verkaufen, verschenken, suchen … 7 Tage gratis.") + "</p>") +
      '<div class="bt"><a class="a1" href="/community/#ilan">' + (T ? "Tüm ilanlar →" : "Alle Anzeigen →") + '</a><a class="a2" href="/community/#ilan">' + (T ? "➕ İlan ver (7 gün ücretsiz)" : "➕ Inserieren (7 Tage gratis)") + "</a></div></div>";
  }
  function put(container) {
    if (!container || container.querySelector("[data-mk-clf]") || ads === null) return;
    var inv = container.querySelector("[data-mk-inv]");
    if (inv) inv.insertAdjacentHTML("afterend", box());
    else { var first = container.firstElementChild; if (first) first.insertAdjacentHTML("afterend", box()); else container.insertAdjacentHTML("afterbegin", box()); }
  }
  fetch("/api/submissions").then(function (r) { return r.json(); }).then(function (d) {
    ads = (d.items || []).filter(function (i) { return i.type === "classified"; });
    var c = document.getElementById("main-tab-content");
    if (c && typeof currentTab !== "undefined" && currentTab === "home") put(c);
  }).catch(function () { ads = []; });

  if (typeof renderHomeTab === "function") {
    var baseHome = renderHomeTab;
    renderHomeTab = function (container) {
      var r = baseHome.apply(this, arguments);
      try { put(container || document.getElementById("main-tab-content")); } catch (e) {}
      return r;
    };
  }
})();
