/* My Kiez Berlin – honest sponsor statistics (2026-11-13, owner: "are these numbers real?").
   A sponsor counts as "seen" only when at least half of its card is on the screen for 1 second
   (before: every card on the page counted at once, even far below without scrolling).
   Not counted: the admin (admin token in this browser) and automated browsers (tests, bots).
   Every sponsor is counted at most once per page load. */
(function () {
  "use strict";
  var DWELL_MS = 1000;
  var sent = {};
  var queue = [];
  var timer = null;

  function noTrack() {
    try { if (navigator.webdriver) return true; } catch (e) {}
    try { if (sessionStorage.getItem("mykiez_admin_token_v1")) return true; } catch (e) {}
    try { if (localStorage.getItem("mykiez_admin_token_v1")) return true; } catch (e) {}
    return false;
  }

  function flush() {
    timer = null;
    if (!queue.length) return;
    var ids = queue.splice(0, 20);
    try {
      fetch("/api/ads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "imp", ids: ids }), keepalive: true }).catch(function () {});
    } catch (e) {}
    if (queue.length) timer = setTimeout(flush, 300);
  }

  function count(id) {
    if (!id || sent[id]) return;
    sent[id] = 1;
    queue.push(id);
    if (!timer) timer = setTimeout(flush, 400);
  }

  var observer = null;
  var waiting = typeof WeakMap === "function" ? new WeakMap() : null;
  if (typeof IntersectionObserver === "function" && waiting) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        var id = el.getAttribute("data-ad");
        if (en.isIntersecting && en.intersectionRatio >= 0.5) {
          if (!waiting.get(el)) {
            waiting.set(el, setTimeout(function () {
              waiting.delete(el);
              if (document.body.contains(el)) { count(id); observer.unobserve(el); }
            }, DWELL_MS));
          }
        } else if (waiting.get(el)) {
          clearTimeout(waiting.get(el));
          waiting.delete(el);
        }
      });
    }, { threshold: [0, 0.5, 1] });
  }

  // Watch one sponsor element (must carry data-ad="<id>").
  window.mkSeen = function (el) {
    if (!el || noTrack()) return;
    var id = el.getAttribute && el.getAttribute("data-ad");
    if (!id || sent[id]) return;
    if (observer) observer.observe(el);
    // very old browsers without IntersectionObserver: no count (better too few than invented numbers)
  };
  // Watch every sponsor inside a container (or the whole page).
  window.mkSeenIn = function (root) {
    if (noTrack()) return;
    (root || document).querySelectorAll("[data-ad]").forEach(function (n) { window.mkSeen(n); });
  };
  window.mkSponsorNoTrack = noTrack;
})();
