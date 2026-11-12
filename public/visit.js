/* My Kiez Berlin – anonymous visitor counter (2026-11-13). One call per page load, no cookies.
   Pages opened inside the Android app (WebView) count as "app-web". See functions/api/visit.js. */
(function () {
  try {
    var ua = navigator.userAgent || "";
    var src = /MyKiezBerlin|; wv\)/.test(ua) ? "app-web" : "web";
    if (/bot|crawl|spider|headless|lighthouse/i.test(ua)) return;
    fetch("/api/visit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ src: src }), keepalive: true }).catch(function () {});
  } catch (e) {}
})();
