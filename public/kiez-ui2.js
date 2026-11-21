/* My Kiez Berlin – 2026-11-22 (owner), same in the app (KiezUi2 in KiezBoost.kt):
   - bottom bar: "Betriebe / İşletmeler" -> "Startseite / Ana sayfa"
   - the "Live-Ticker" button in the header goes away (the bottom bar and the home page still have the Live-Ticker)
   - clock + weather under the stories go away (the page "Sport & Kurse" keeps them)
   Admin sees it at once; everybody else when the admin switches "ui2" on in the admin panel (/api/flags). */
(function () {
  "use strict";
  function lsGet(k) { try { return localStorage.getItem(k) || ""; } catch (x) { return ""; } }
  function lang() { var l = typeof currentLanguage === "string" ? currentLanguage : "de"; return l.indexOf("tr") === 0 ? "tr" : l.indexOf("en") === 0 ? "en" : "de"; }

  var css = document.createElement("style");
  css.textContent = "html.mk-ui2 .ext-live-pill{display:none!important}html.mk-ui2 #mk-clock{display:none!important}";
  document.head.appendChild(css);

  function label() {
    if (!document.documentElement.classList.contains("mk-ui2")) return;
    var span = document.querySelector('.nav-item[data-tab="home"] span');
    var want = { de: "Startseite", tr: "Ana sayfa", en: "Home" }[lang()];
    if (span && span.innerText !== want) span.innerText = want;
  }
  function on() {
    document.documentElement.classList.add("mk-ui2");
    if (typeof updateStaticLabels === "function" && !updateStaticLabels.__mkUi2) {
      var base = updateStaticLabels;
      updateStaticLabels = function () { base.apply(this, arguments); label(); };
      updateStaticLabels.__mkUi2 = true;
    }
    label();
  }
  window.mkUi2Label = label;

  if (lsGet("mykiez_admin_auth_v1") === "true") on();
  else fetch("/api/flags").then(function (r) { return r.ok ? r.json() : {}; }).then(function (f) { if (f && f.ui2) on(); }).catch(function () {});
  document.addEventListener("DOMContentLoaded", function () { setTimeout(label, 0); });
  document.addEventListener("click", function (ev) { if (ev.target.closest && ev.target.closest("#lang-toggle-btn")) setTimeout(label, 50); });
})();
