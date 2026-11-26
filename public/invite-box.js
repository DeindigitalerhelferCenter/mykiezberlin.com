/* 2026-11-26 (owner "UYGULA"): permanent "Einladen & Teilen · Davet et" box on the home page and in the profile tab.
   Always shown (cannot be closed): the invite cards (WhatsApp groups, channel, app, partner) as small pictures –
   one tap opens the share page /davet/ with picture, text and link for every card. */
(function () {
  "use strict";
  var cards = null;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var css = document.createElement("style");
  css.textContent =
    ".mk-inv{grid-column:1/-1;width:100%;box-sizing:border-box;margin:14px 0;padding:14px;border-radius:18px;background:linear-gradient(135deg,#0d1117,#1b2b22);color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.18)}" +
    ".mk-inv h3{margin:0;font-size:16px;font-weight:900}.mk-inv p{margin:4px 0 10px;font-size:13px;color:#c9d1d9;line-height:1.4}" +
    ".mk-inv .rw{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;scroll-snap-type:x mandatory}" +
    ".mk-inv .rw a{flex:none;width:120px;scroll-snap-align:start;color:#fff;text-decoration:none;font-size:11.5px;font-weight:700;line-height:1.25}" +
    ".mk-inv .rw img{width:120px;height:120px;border-radius:12px;object-fit:cover;display:block;margin-bottom:4px;background:#000}" +
    ".mk-inv .go{display:block;margin-top:8px;text-align:center;padding:11px;border-radius:12px;background:#25D366;color:#05290f!important;font-weight:900;text-decoration:none;font-size:14.5px}";
  document.head.appendChild(css);

  function box() {
    var list = (cards || []).map(function (c) {
      return '<a href="/davet/#' + esc(c.key) + '"><img src="' + esc(c.post) + '" alt="" loading="lazy">' + esc(c.title_de) + "</a>";
    }).join("");
    return '<div class="mk-inv" data-mk-inv><h3>📲 Einladen & Teilen · Davet et</h3>' +
      "<p>WhatsApp-Gruppen, Kanal & App – mit Bild an Freunde schicken · WhatsApp grupları, kanal ve uygulama – resimli olarak arkadaşlarına gönder</p>" +
      '<div class="rw">' + list + "</div>" +
      '<a class="go" href="/davet/">👥 Freunde einladen · Arkadaşlarını davet et →</a></div>';
  }
  function put(container, top) {
    if (!container || container.querySelector("[data-mk-inv]")) return;
    if (top) {
      var first = container.firstElementChild;
      if (first) first.insertAdjacentHTML("afterend", box()); else container.insertAdjacentHTML("afterbegin", box());
    } else container.insertAdjacentHTML("beforeend", box());
  }
  function refill() {
    document.querySelectorAll("[data-mk-inv]").forEach(function (el) { el.outerHTML = box(); });
  }
  fetch("/api/davet").then(function (r) { return r.json(); }).then(function (d) { cards = d.cards || []; refill(); }).catch(function () {});

  if (typeof renderHomeTab === "function") {
    var baseHome = renderHomeTab;
    renderHomeTab = function (container) {
      var r = baseHome.apply(this, arguments);
      try { put(container || document.getElementById("main-tab-content"), true); } catch (e) {}
      return r;
    };
  }
  if (typeof renderProfileTab === "function") {
    var baseProfile = renderProfileTab;
    renderProfileTab = function (container) {
      var r = baseProfile.apply(this, arguments);
      try { put(container || document.getElementById("main-tab-content"), false); } catch (e) {}
      return r;
    };
  }
})();
