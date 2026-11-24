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
      .then(function (d) { cache[id] = (d.media || []).slice(0, 100); return cache[id]; }) // 2026-11-24: was 12 (trusted sponsors have no limit)
      .catch(function () { return []; });
  }
  function fallback(id) {
    var ad = (window.mkAdRegistry || {})[id] || {};
    var seen = {};
    return [ad.image, ad.logo].filter(function (u) { if (!u || seen[u]) return false; seen[u] = 1; return true; })
      .map(function (u) { return { url: u, media_type: "image" }; });
  }

  // 2026-11-24 (owner): the full-screen view runs by itself like a carousel on every device – pictures 4 s, videos to
  // their end, Instagram posts 12 s. ⏸ stops it, ▶ starts it again; ‹ › / arrow keys / swipe go by hand (the timer
  // starts new from there). Without a stop it keeps running.
  var IMAGE_MS = 4000, IG_MS = 12000;
  function viewer(list, start) {
    var i = start, paused = false, timer = null, t0 = 0, left = 0, raf = 0;
    var box = document.createElement("div");
    box.id = "mk-reel-view";
    box.setAttribute("role", "dialog");
    function stopTimer() { if (timer) clearTimeout(timer); timer = null; cancelAnimationFrame(raf); }
    function bar(p) { var b = box.querySelector(".mk-rv-bar i"); if (b) b.style.width = Math.max(0, Math.min(100, p * 100)) + "%"; }
    function runTimer(ms) {
      stopTimer();
      if (paused || list.length < 2) return;
      left = ms; t0 = Date.now();
      var total = ms;
      timer = setTimeout(function () { go(1, true); }, ms);
      (function tick() { bar(1 - (left - (Date.now() - t0)) / total); raf = requestAnimationFrame(tick); })();
    }
    function startItem() {
      var m = list[i], v = box.querySelector("video");
      if (v) {
        v.onended = function () { if (!paused && list.length > 1) go(1, true); else { v.currentTime = 0; } };
        v.ontimeupdate = function () { if (v.duration) bar(v.currentTime / v.duration); };
        if (paused) v.pause(); else { var p = v.play(); if (p && p.catch) p.catch(function () { v.muted = true; v.play().catch(function () {}); }); }
        stopTimer();
        return;
      }
      runTimer(m.media_type === "instagram" ? IG_MS : IMAGE_MS);
    }
    function show() {
      var m = list[i];
      box.innerHTML = '<button type="button" class="mk-rv-x" aria-label="' + e(L("Schließen", "Kapat", "Close")) + '">✕</button>' +
        (list.length > 1 ? '<div class="mk-rv-bar"><i></i></div>' : "") +
        (m.media_type === "instagram" ? '<iframe class="mk-rv-ig" src="' + e(String(m.url).replace(/\/?$/, "/") + "embed") + '" title="Instagram" allowfullscreen></iframe>'
          : m.media_type === "video" ? '<video src="' + e(m.url) + '" controls autoplay playsinline></video>' : '<img src="' + e(m.url) + '" alt="' + e(m.caption || "") + '">') +
        (m.caption ? '<div class="mk-rv-cap">' + e(m.caption) + "</div>" : "") +
        (list.length > 1 ? '<button type="button" class="mk-rv-prev" aria-label="←">‹</button><button type="button" class="mk-rv-next" aria-label="→">›</button>' +
          '<button type="button" class="mk-rv-pause" aria-label="' + e(paused ? L("Abspielen", "Oynat", "Play") : L("Anhalten", "Durdur", "Pause")) + '">' + (paused ? "▶" : "⏸") + "</button>" +
          '<div class="mk-rv-n">' + (i + 1) + " / " + list.length + "</div>" : "");
      startItem();
    }
    function close() { stopTimer(); box.remove(); document.removeEventListener("keydown", key); document.removeEventListener("visibilitychange", vis); }
    function go(d) { i = (i + d + list.length) % list.length; show(); }
    function toggle() {
      paused = !paused;
      var btn = box.querySelector(".mk-rv-pause");
      if (btn) { btn.textContent = paused ? "▶" : "⏸"; btn.setAttribute("aria-label", paused ? L("Abspielen", "Oynat", "Play") : L("Anhalten", "Durdur", "Pause")); }
      var v = box.querySelector("video");
      if (v) { if (paused) v.pause(); else v.play().catch(function () {}); return; }
      if (paused) { left = left - (Date.now() - t0); stopTimer(); }
      else runTimer(Math.max(800, left || IMAGE_MS));
    }
    function vis() { if (document.hidden) { if (!paused) { left = left - (Date.now() - t0); stopTimer(); } } else if (!paused && !box.querySelector("video")) runTimer(Math.max(800, left || IMAGE_MS)); }
    function key(ev) { if (ev.key === "Escape") close(); else if (ev.key === "ArrowRight") go(1); else if (ev.key === "ArrowLeft") go(-1); else if (ev.key === " ") { ev.preventDefault(); toggle(); } }
    document.addEventListener("visibilitychange", vis);
    box.addEventListener("click", function (ev) {
      var t = ev.target;
      if (t.closest(".mk-rv-x") || t === box) close();
      else if (t.closest(".mk-rv-pause")) toggle();
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
            (m.media_type === "instagram" ? '<span class="mk-reel-ig">📷<b>Instagram</b>' + (/\/reel\//.test(m.url) ? "▶ Reel" : "Post") + "</span>"
              : m.media_type === "video" ? '<video src="' + e(m.url) + '#t=0.5" preload="metadata" muted playsinline></video><span class="mk-reel-play">▶</span>' : '<img src="' + e(m.url) + '" alt="" loading="lazy">') + "</button>";
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
    ".mk-reel-ig{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;width:100%;height:100%;border-radius:10px;background:linear-gradient(135deg,#feda75,#d62976,#4f5bd5);color:#fff;font-size:10px;line-height:1.1}.mk-reel-ig b{font-size:9.5px}" +
    ".mk-rv-ig{width:min(440px,94vw);height:min(760px,84vh);border:0;border-radius:12px;background:#fff}" +
    "#mk-reel-view{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.94);display:flex;align-items:center;justify-content:center}" +
    "#mk-reel-view img,#mk-reel-view video{max-width:100%;max-height:86vh;object-fit:contain}" +
    "#mk-reel-view button{position:absolute;border:0;background:rgba(255,255,255,.15);color:#fff;border-radius:50%;width:44px;height:44px;font-size:22px;cursor:pointer}" +
    ".mk-rv-x{top:14px;right:14px}.mk-rv-prev{left:10px;top:50%}.mk-rv-next{right:10px;top:50%}" +
    "#mk-reel-view .mk-rv-pause{top:14px;left:14px;font-size:18px}" +
    ".mk-rv-bar{position:absolute;top:6px;left:70px;right:70px;height:3px;border-radius:3px;background:rgba(255,255,255,.25);overflow:hidden}.mk-rv-bar i{display:block;height:100%;width:0;background:#fff}" +
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
