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
    "body.dark-mode .mk-clf,.dark .mk-clf{background:#161b22;color:#e6edf3}" +
    /* 2026-11-27 (owner): smaller, dark-green like the invite box, slowly running strip, logo when no picture */
    ".mk-clf2{grid-column:1/-1;width:100%;box-sizing:border-box;margin:12px 0;padding:10px 0;border-radius:16px;background:linear-gradient(135deg,#0d1117,#1b2b22);color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.18);overflow:hidden}" +
    ".mk-clf2 .hd{display:flex;align-items:center;gap:8px;padding:0 12px 8px}.mk-clf2 .hd img{width:30px;height:30px;border-radius:8px;background:#fff;padding:2px;box-sizing:border-box}" +
    ".mk-clf2 .hd b{font-size:14px;font-weight:900;line-height:1.15}.mk-clf2 .hd small{display:block;font-weight:700;color:#7ee2a8;font-size:11px}" +
    ".mk-clf2 .hd a{margin-left:auto;white-space:nowrap;font-size:12px;font-weight:900;color:#05290f!important;background:#25D366;border-radius:999px;padding:6px 10px;text-decoration:none}" +
    ".mk-clf2 .vp{overflow:hidden;width:100%;-webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}" +
    ".mk-clf2 .tk{display:flex;gap:8px;width:max-content;animation:mkClfRun var(--dur,40s) linear infinite;padding:0 6px}" +
    ".mk-clf2 .vp:hover .tk,.mk-clf2 .vp:active .tk{animation-play-state:paused}" +
    "@keyframes mkClfRun{from{transform:translateX(0)}to{transform:translateX(-50%)}}" +
    ".mk-clf2 .it{flex:0 0 auto;width:92px;cursor:pointer;color:#fff;font-size:11px;line-height:1.25;text-align:left;background:none;border:0;padding:0;font-family:inherit}" +
    ".mk-clf2 .it .pc{width:92px;height:92px;border-radius:12px;object-fit:cover;display:block;background:#0d1117}" +
    ".mk-clf2 .it .lg{width:92px;height:92px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:linear-gradient(160deg,#1b2b22,#0d1117);border:1px solid #2ea04366;box-sizing:border-box}" +
    ".mk-clf2 .it .lg img{width:44px;height:44px;border-radius:10px;background:#fff;padding:2px;box-sizing:border-box}.mk-clf2 .it .lg span{font-size:9.5px;font-weight:900;color:#7ee2a8}" +
    ".mk-clf2 .it b{display:block;margin-top:4px;font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mk-clf2 .it i{font-style:normal;color:#7ee2a8;font-weight:800}" +
    ".mk-clf2 .em{padding:0 12px;font-size:12.5px;color:#c9d1d9}" +
    ".mk-clfm{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.6);display:flex;align-items:flex-end;justify-content:center}" +
    ".mk-clfm .bx{background:#0d1117;color:#e6edf3;width:100%;max-width:520px;max-height:88vh;overflow:auto;border-radius:18px 18px 0 0;padding:14px 16px 18px;box-sizing:border-box;border-top:3px solid #25D366}" +
    ".mk-clfm .ims{display:flex;gap:8px;overflow-x:auto;margin:8px 0}.mk-clfm .ims img{height:220px;max-width:85%;border-radius:12px;object-fit:cover}" +
    ".mk-clfm h3{margin:4px 0;font-size:18px}.mk-clfm .mt{color:#7ee2a8;font-weight:800;font-size:13px}.mk-clfm p{white-space:pre-wrap;font-size:14px;line-height:1.45}" +
    ".mk-clfm .ct{background:#1b2b22;border-radius:12px;padding:10px;font-size:14px;margin:8px 0}.mk-clfm .row{display:flex;gap:8px;margin-top:10px}" +
    ".mk-clfm .row a,.mk-clfm .row button{flex:1;text-align:center;padding:11px;border-radius:12px;font-weight:900;font-size:13.5px;text-decoration:none;border:0;cursor:pointer;font-family:inherit}" +
    ".mk-clfm .a1{background:#25D366;color:#05290f!important}.mk-clfm .a2{background:#21262d;color:#e6edf3}";
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
  // 2026-11-27 (owner): small dark-green box, all classifieds in a slowly, endlessly running strip (pauses under the
  // finger / mouse), picture or the My Kiez "Kleinanzeigen" logo, a tap opens the ad right here (no long list to read).
  var LOGO = "/assets/images/mykiez_logo.png";
  function sorted() {
    var list = (ads || []).slice(), k = myKiez();
    list.sort(function (a, b) { return (k ? ((String(b.kiezName || "").toLowerCase() === k) - (String(a.kiezName || "").toLowerCase() === k)) : 0) || (b.createdAt - a.createdAt); });
    return list;
  }
  function picOf(a) { var m = (a.media || []).filter(function (x) { return x.type !== "video"; })[0]; return m ? m.url : ""; }
  function tile(a, i) {
    var pic = picOf(a);
    return '<button type="button" class="it" data-i="' + i + '">' +
      (pic ? '<img class="pc" src="' + esc(pic) + '" alt="" loading="lazy">' : '<span class="lg"><img src="' + LOGO + '" alt=""><span>Kleinanzeigen</span></span>') +
      "<b>" + esc(a.title) + "</b>" + (a.price ? "<i>" + esc(a.price) + "</i> · " : "") + esc(a.kiezName || "") + "</button>";
  }
  function box2() {
    var T = tr(), list = sorted();
    var head = '<div class="hd"><img src="' + LOGO + '" alt=""><b>' + (T ? "Mahalle ilanları" : "Kiez-Kleinanzeigen") + "<small>My Kiez Berlin · " + (T ? "Kiez-Kleinanzeigen" : "Mahalle ilanları") + "</small></b>" +
      '<a href="/community/#ilan">' + (T ? "➕ İlan ver" : "➕ Inserieren") + "</a></div>";
    if (!list.length) return '<div class="mk-clf2" data-mk-clf>' + head + '<div class="em">' + (T ? "Henüz ilan yok – ilk ilanı sen ver! 7 gün ücretsiz." : "Noch keine Anzeige – sei die/der Erste! 7 Tage gratis.") + "</div></div>";
    // enough tiles to fill the strip, then the same row twice for an endless loop
    var row = [];
    for (var n = 0; row.length < Math.max(8, list.length); n++) row.push(n % list.length);
    var one = row.map(function (i) { return tile(list[i], i); }).join("");
    var dur = Math.max(25, row.length * 5);
    return '<div class="mk-clf2" data-mk-clf>' + head + '<div class="vp"><div class="tk" style="--dur:' + dur + 's">' + one + one + "</div></div></div>";
  }
  function detail(a) {
    var T = tr();
    var pics = (a.media || []).filter(function (x) { return x.type !== "video" && /^\/media\//.test(String(x.url || "")); });
    var w = document.createElement("div");
    w.className = "mk-clfm";
    w.innerHTML = '<div class="bx">' + (pics.length ? '<div class="ims">' + pics.map(function (m) { return '<img src="' + esc(m.url) + '" alt="">'; }).join("") + "</div>" : "") +
      "<h3>" + esc(a.title) + '</h3><div class="mt">' + esc([a.price, a.kiezName, a.category].filter(Boolean).join(" · ")) + "</div>" +
      "<p>" + esc(a.description || "") + "</p>" + (a.contact ? '<div class="ct">📞 ' + (T ? "İletişim" : "Kontakt") + ": " + esc(a.contact) + "</div>" : "") +
      '<div class="row"><a class="a1" href="/community/#ilan-' + esc(a.id) + '">' + (T ? "Tüm ilanlar →" : "Alle Anzeigen →") + '</a><button type="button" class="a2" data-x>' + (T ? "Kapat" : "Schließen") + "</button></div></div>";
    w.onclick = function (e) { if (e.target === w || e.target.hasAttribute("data-x")) w.remove(); };
    document.body.appendChild(w);
  }
  function wire(container) {
    var b = container && container.querySelector(".mk-clf2");
    if (!b || b.dataset.w) return;
    b.dataset.w = "1";
    var list = sorted();
    b.addEventListener("click", function (e) {
      var it = e.target.closest(".it");
      if (it && list[Number(it.dataset.i)]) detail(list[Number(it.dataset.i)]);
    });
  }
  function put(container) {
    if (!container || container.querySelector("[data-mk-clf]") || ads === null) return;
    var inv = container.querySelector("[data-mk-inv]");
    // 2026-11-27: box2() (running strip) instead of box() (3 big tiles, kept)
    if (inv) inv.insertAdjacentHTML("afterend", box2());
    else { var first = container.firstElementChild; if (first) first.insertAdjacentHTML("afterend", box2()); else container.insertAdjacentHTML("afterbegin", box2()); }
    wire(container);
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
