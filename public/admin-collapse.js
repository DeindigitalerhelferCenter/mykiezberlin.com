/* My Kiez Berlin – admin: every big window opens / closes with one click (2026-11-17, owner).
   Long windows (Sponsor-Panel, Sponsoren, Pakete, Monatsziel pro Sponsor, planned stories, Sponsor-Anzeigen …)
   took a lot of room. Every heading (h2/h3) in the admin page and every bold table title inside the statistics
   becomes a switch: ▾ open / ▸ closed. The choice is remembered in this browser. "Hepsini kapat / aç" on top.
   Nothing is removed – closed parts are only hidden. Works for parts that are drawn later (MutationObserver). */
(function () {
  "use strict";
  var KEY = "mk_admin_fold_v1";
  var SKIP = ["admin-sponsor-media"]; // has its own open/close button
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { state = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  // stable name of a window: heading text without numbers in brackets, e.g. "Sponsor-Anzeigen (28)" -> "Sponsor-Anzeigen"
  function nameOf(h) {
    return String(h.getAttribute("data-fold-name") || h.textContent || "").replace(/[▾▸]/g, "").replace(/\(\s*\d+\s*\)/g, "").replace(/\d+/g, "#").replace(/\s+/g, " ").trim().slice(0, 80);
  }
  function level(h) { return h.tagName === "H2" ? 2 : h.tagName === "H3" ? 3 : 4; }
  function isHead(n) { return n && n.nodeType === 1 && n.hasAttribute("data-fold"); }

  // the parts that belong to a heading: following siblings up to the next heading of the same or a higher level
  function partsOf(h) {
    var out = [], n = h.nextElementSibling, lv = level(h);
    if (h.tagName === "B") return n && n.tagName === "TABLE" ? [n] : [];
    while (n) {
      if (isHead(n) && level(n) <= lv) break;
      if (/^H[23]$/.test(n.tagName) && level(n) <= lv) break;
      out.push(n);
      n = n.nextElementSibling;
    }
    return out;
  }

  function apply(h) {
    var closed = state[h.getAttribute("data-fold")] === 1;
    var arrow = h.querySelector(".mk-fold-arrow");
    if (arrow) arrow.textContent = closed ? "▸ " : "▾ ";
    partsOf(h).forEach(function (n) {
      if (closed) {
        if (!n.hasAttribute("data-fold-hidden")) { n.setAttribute("data-fold-hidden", n.style.display || ""); n.style.display = "none"; }
      } else if (n.hasAttribute("data-fold-hidden")) {
        n.style.display = n.getAttribute("data-fold-hidden");
        n.removeAttribute("data-fold-hidden");
      }
    });
  }

  function prepare(h) {
    if (h.hasAttribute("data-fold")) { apply(h); return; }
    if (h.closest(".modal, .modal-content, [role=dialog], #planner-text-modal")) return;
    for (var i = 0; i < SKIP.length; i++) if (h.closest("#" + SKIP[i])) return;
    if (!partsOf(h).length) return;
    var name = nameOf(h);
    if (!name) return;
    h.setAttribute("data-fold", name);
    h.style.cursor = "pointer";
    h.style.userSelect = "none";
    h.title = "Aç / kapat · öffnen / schließen";
    var a = document.createElement("span");
    a.className = "mk-fold-arrow";
    a.style.cssText = "color:#8b949e;font-weight:800";
    h.insertBefore(a, h.firstChild);
    h.addEventListener("click", function (ev) {
      if (ev.target.closest("button, a, input, select, textarea, label")) return; // buttons inside a heading keep working
      state[name] = state[name] === 1 ? 0 : 1;
      save();
      scan();
    });
    apply(h);
  }

  function toolbar(view) {
    if (document.getElementById("mk-fold-bar")) return;
    var bar = document.createElement("div");
    bar.id = "mk-fold-bar";
    bar.style.cssText = "display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin:0 0 10px";
    var btn = "background:#21262d;border:1px solid #30363d;color:#e6edf3;border-radius:10px;padding:6px 12px;font-weight:700;font-size:12.5px;cursor:pointer";
    bar.innerHTML = '<button type="button" data-all="1" style="' + btn + '">▸ Hepsini kapat · Alle zu</button><button type="button" data-all="0" style="' + btn + '">▾ Hepsini aç · Alle auf</button>';
    bar.querySelectorAll("button").forEach(function (b) {
      b.onclick = function () {
        var v = Number(b.getAttribute("data-all"));
        view.querySelectorAll("[data-fold]").forEach(function (h) { state[h.getAttribute("data-fold")] = v; });
        save();
        scan();
      };
    });
    view.insertBefore(bar, view.firstChild);
  }

  var busy = false;
  function scan() {
    var view = document.getElementById("admin-main-view");
    if (!view || busy) return;
    busy = true;
    try {
      if (view.querySelector("h2, h3")) toolbar(view);
      view.querySelectorAll("h2, h3").forEach(prepare);
      // bold table titles inside cards (statistics: Sponsoren, Pakete, Monatsziel pro Sponsor)
      view.querySelectorAll("b").forEach(function (b) {
        var n = b.nextElementSibling;
        if (n && n.tagName === "TABLE" && !b.closest("table")) prepare(b);
      });
    } finally {
      busy = false;
    }
  }

  var timer = null;
  function later() { clearTimeout(timer); timer = setTimeout(scan, 120); }
  function start() {
    var view = document.getElementById("admin-main-view");
    if (!view) return;
    new MutationObserver(function (list) {
      // ignore changes we make ourselves (display of hidden parts, arrows)
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === "childList" && !(m.target.classList && m.target.classList.contains("mk-fold-arrow"))) { later(); return; }
      }
    }).observe(view, { childList: true, subtree: true });
    scan();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
