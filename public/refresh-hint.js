/* 2026-11-27 (owner "UYGULA yenileme 5"): the page was in the background for more than 5 minutes ->
   small bar "🔄 Neue Inhalte · Yeni içerik – aktualisieren / yenile" (tap = reload). Phones also have pull-to-refresh. */
(function () {
  "use strict";
  var hiddenAt = 0;
  function tr() { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0; }
  function show() {
    if (document.getElementById("mk-refresh-hint")) return;
    var b = document.createElement("button");
    b.id = "mk-refresh-hint"; b.type = "button";
    b.textContent = tr() ? "🔄 Yeni içerik olabilir – yenile" : "🔄 Neue Inhalte – aktualisieren";
    b.style.cssText = "position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:99999;border:0;border-radius:999px;padding:10px 18px;background:#d62828;color:#fff;font-weight:900;font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.3);cursor:pointer";
    b.onclick = function () { location.reload(); };
    document.body.appendChild(b);
    setTimeout(function () { if (b.parentNode) b.remove(); }, 30000);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 5 * 60000) show();
    hiddenAt = 0;
  });
})();
