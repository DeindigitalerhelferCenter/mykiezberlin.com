/*
 * 2026-11-14 (owner): sponsors upload their own pictures/videos every day/week (sponsor panel), but many users never
 * saw them. Every sponsor card (.mk-sp[data-ad]) now shows them like the story tiles on top – tap = full screen,
 * swipe/arrows for the next one. Without own uploads the sponsor's picture + logo are shown (no empty place).
 */
(function () {
  "use strict";
  var cache = {}; // ad id -> list | promise
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function L(de, tr, en) { var l = typeof currentLanguage === "string" ? currentLanguage : "de"; return l.indexOf("tr") === 0 ? tr : l.indexOf("en") === 0 ? (en || de) : de; }
  function load(id) {
    if (cache[id]) return Promise.resolve(cache[id]);
    return fetch("/api/sponsor-media?ad=" + encodeURIComponent(id)).then(function (r) { return r.ok ? r.json() : { media: [] }; })
      .then(function (d) { cache[id] = (d.media || []).slice(0, 12); return cache[id]; })
      .catch(function () { return []; });
  }
  function fallback(id) {
    var ad = (window.mkAdRegistry || {})[id] || {};
    var seen = {};
    return [ad.image, ad.logo].filter(function (u) { if (!u || seen[u]) return false; seen[u] = 1; return true; })
      .map(function (u) { return { url: u, media_type: "image" }; });
  }

  function viewer(list, start) {
    var i = start;
    var box = document.createElement("div");
    box.id = "mk-reel-view";
    box.setAttribute("role", "dialog");
    function show() {
      var m = list[i];
      box.innerHTML = '<button type="button" class="mk-rv-x" aria-label="' + e(L("Schließen", "Kapat", "Close")) + '">✕</button>' +
        (m.media_type === "video" ? '<video src="' + e(m.url) + '" controls autoplay playsinline></video>' : '<img src="' + e(m.url) + '" alt="' + e(m.caption || "") + '">') +
        (m.caption ? '<div class="mk-rv-cap">' + e(m.caption) + "</div>" : "") +
        (list.length > 1 ? '<button type="button" class="mk-rv-prev" aria-label="←">‹</button><button type="button" class="mk-rv-next" aria-label="→">›</button><div class="mk-rv-n">' + (i + 1) + " / " + list.length + "</div>" : "");
    }
    function close() { box.remove(); document.removeEventListener("keydown", key); }
    function go(d) { i = (i + d + list.length) % list.length; show(); }
    function key(ev) { if (ev.key === "Escape") close(); else if (ev.key === "ArrowRight") go(1); else if (ev.key === "ArrowLeft") go(-1); }
    box.addEventListener("click", function (ev) {
      var t = ev.target;
      if (t.closest(".mk-rv-x") || t === box) close();
      else if (t.closest(".mk-rv-prev")) go(-1);
      else if (t.closest(".mk-rv-next")) go(1);
    });
    var x0 = null;
    box.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (ev) { if (x0 == null) return; var dx = ev.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); x0 = null; });
    document.addEventListener("keydown", key);
    show();
    document.body.appendChild(box);
  }

  function fill(card) {
    var id = card.getAttribute("data-ad");
    if (!id || card.hasAttribute("data-mk-reel")) return;
    card.setAttribute("data-mk-reel", "1");
    var body = card.querySelector(".mk-sz-body") || card;
    load(id).then(function (own) {
      var list = own.length ? own : fallback(id);
      if (!list.length || !document.body.contains(card) || card.querySelector(".mk-reel")) return;
      var html = '<div class="mk-reel"><div class="mk-reel-t">📸 ' + e(own.length ? L("Fotos & Videos", "Fotoğraf & videolar", "Photos & videos") + " (" + own.length + ")" : L("Fotos", "Fotoğraflar", "Photos")) + "</div>" +
        '<div class="mk-reel-row">' + list.map(function (m, n) {
          return '<button type="button" class="mk-reel-tile" data-n="' + n + '" aria-label="' + e(L("Bild öffnen", "Resmi aç", "Open")) + '">' +
            (m.media_type === "video" ? '<video src="' + e(m.url) + '#t=0.5" preload="metadata" muted playsinline></video><span class="mk-reel-play">▶</span>' : '<img src="' + e(m.url) + '" alt="" loading="lazy">') + "</button>";
        }).join("") + "</div></div>";
      var anchor = body.querySelector(".mk-sz-btns");
      if (anchor) anchor.insertAdjacentHTML("beforebegin", html); else body.insertAdjacentHTML("beforeend", html);
      lists[id] = list;
    });
  }
  // one listener for all tiles (capture phase: runs before the card's own "open sponsor sheet" click)
  var lists = {};
  document.addEventListener("click", function (ev) {
    var tile = ev.target && ev.target.closest && ev.target.closest(".mk-reel-tile");
    if (!tile) return;
    var card = tile.closest("[data-ad]");
    var list = card && lists[card.getAttribute("data-ad")];
    if (!list) return;
    ev.preventDefault();
    ev.stopPropagation();
    viewer(list, +tile.getAttribute("data-n"));
  }, true);
  function scan(root) { (root || document).querySelectorAll(".mk-sp[data-ad]").forEach(fill); }

  var css = document.createElement("style");
  css.textContent =
    ".mk-reel{display:grid;gap:5px;margin-top:2px}.mk-reel-t{font-size:12px;font-weight:700;opacity:.75}" +
    ".mk-reel-row{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.mk-reel-row::-webkit-scrollbar{display:none}" +
    ".mk-reel-tile{flex:none;position:relative;width:62px;height:90px;padding:2px;border:0;border-radius:12px;cursor:pointer;background:linear-gradient(135deg,#F2B705,#E30613,#8B5CF6)}" +
    ".mk-reel-tile img,.mk-reel-tile video{display:block;width:100%;height:100%;object-fit:cover;border-radius:10px;background:#111}" +
    ".mk-reel-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#fff;font-size:14px;background:rgba(0,0,0,.5);border-radius:50%;width:26px;height:26px;line-height:26px;text-align:center}" +
    ".mk-sz-s .mk-reel-tile{width:52px;height:76px}" +
    "#mk-reel-view{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.94);display:flex;align-items:center;justify-content:center}" +
    "#mk-reel-view img,#mk-reel-view video{max-width:100%;max-height:86vh;object-fit:contain}" +
    "#mk-reel-view button{position:absolute;border:0;background:rgba(255,255,255,.15);color:#fff;border-radius:50%;width:44px;height:44px;font-size:22px;cursor:pointer}" +
    ".mk-rv-x{top:14px;right:14px}.mk-rv-prev{left:10px;top:50%}.mk-rv-next{right:10px;top:50%}" +
    ".mk-rv-cap{position:absolute;bottom:42px;left:16px;right:16px;color:#fff;text-align:center;font-size:14px}.mk-rv-n{position:absolute;bottom:14px;color:#fff;font-size:12px;opacity:.8}";
  document.head.appendChild(css);

  var queued = false;
  new MutationObserver(function () {
    if (queued) return;
    queued = true;
    setTimeout(function () { queued = false; scan(); }, 150);
  }).observe(document.body, { childList: true, subtree: true });
  scan();
})();
