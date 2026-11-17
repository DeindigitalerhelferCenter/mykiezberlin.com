/* My Kiez Berlin – own social media + "Mitmachen" box (2026-11-17, owner).
   Facebook, Instagram, WhatsApp (MyKiezBerlin-info). The WhatsApp button glows green (pulses) to catch the eye.
   Shown: end of the home page, profile tab, menu (☰). Static copies are in impressum.html and werben.html. */
(function () {
  "use strict";
  var WA_NUMBER = "4917640556109";
  var WA_TEXT = "Hallo My Kiez Berlin! · Merhaba My Kiez Berlin!";
  var S = window.MK_SOCIAL = {
    facebook: "https://www.facebook.com/my.kiez.berlin/",
    instagram: "https://www.instagram.com/mykiezberlin",
    whatsapp: "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(WA_TEXT),
    phone: "+49 176 40556109",
    mail: "info@mykiezberlin.com",
  };

  var css = document.createElement("style");
  css.textContent =
    ".mk-social{grid-column:1/-1;width:100%;box-sizing:border-box;margin:18px 0;padding:16px;border-radius:18px;background:#fff;border:1px solid #e5e7eb;box-shadow:0 2px 10px rgba(0,0,0,.05)}" +
    ".mk-social h3{margin:0 0 4px;font-size:16px;font-weight:900;letter-spacing:.3px}" +
    ".mk-social p{margin:6px 0;font-size:13.5px;line-height:1.5;color:#374151}" +
    ".mk-social .mk-s-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}" +
    ".mk-social a.mk-s-btn{flex:1;min-width:120px;display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 12px;border-radius:14px;color:#fff;font-weight:800;font-size:14px;text-decoration:none}" +
    ".mk-s-fb{background:#1877F2}.mk-s-ig{background:linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)}" +
    ".mk-s-wa{background:#25D366;animation:mkWaGlow 1.4s ease-in-out infinite}" +
    "@keyframes mkWaGlow{0%,100%{box-shadow:0 0 0 0 rgba(37,211,102,.75);filter:brightness(1)}50%{box-shadow:0 0 0 10px rgba(37,211,102,0),0 0 22px 4px rgba(37,211,102,.85);filter:brightness(1.18)}}" +
    "@media (prefers-reduced-motion:reduce){.mk-s-wa{animation:none}}" +
    ".mk-social .mk-s-contact{margin-top:10px;font-size:13.5px;font-weight:700}.mk-social .mk-s-contact a{color:#0f766e;text-decoration:none;background:none!important;padding:0}" +
    "body.dark-mode .mk-social,[data-theme=dark] .mk-social{background:#161b22;border-color:#30363d}body.dark-mode .mk-social p,[data-theme=dark] .mk-social p{color:#c9d1d9}";
  document.head.appendChild(css);

  function lang() { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0 ? "tr" : "de"; }
  function buttons() {
    return '<div class="mk-s-row">' +
      '<a class="mk-s-btn mk-s-wa" href="' + S.whatsapp + '" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> WhatsApp</a>' +
      '<a class="mk-s-btn mk-s-ig" href="' + S.instagram + '" target="_blank" rel="noopener"><i class="bi bi-instagram"></i> Instagram</a>' +
      '<a class="mk-s-btn mk-s-fb" href="' + S.facebook + '" target="_blank" rel="noopener"><i class="bi bi-facebook"></i> Facebook</a></div>';
  }
  // Full box: "Mitmachen · Paylaş" (DE + TR) + follow buttons + contact
  window.mkSocialBox = function () {
    return '<div class="mk-social" data-mk-social>' +
      "<h3>📣 MITMACHEN · PAYLAŞ</h3>" +
      '<p style="font-weight:800;margin-top:2px">BERLIN &amp; DEUTSCHLAND</p>' +
      "<p>Teilt mit uns die Nachrichten aus Berlin und Deutschland, tägliche besondere Ereignisse und alles, was uns alle betrifft – über <b>MyKiezBerlin-info</b>. Eure Nachrichten erscheinen schnellstmöglich auf unseren Seiten: klar, schnell und mehrsprachig.</p>" +
      "<p>Berlin ve Almanya’daki haberleri, günlük ilginç olayları, hepimizi ilgilendiren haberleri bizlerle <b>MyKiezBerlin-info</b> ile paylaşabilirsiniz. Haberleriniz en kısa zamanda sayfalarımızda – net, hızlı ve çok dilli.</p>" +
      buttons() +
      '<div class="mk-s-contact">KONTAKT · İLETİŞİM<br>📱 WhatsApp: <a href="' + S.whatsapp + '" target="_blank" rel="noopener">' + S.phone + "</a><br>✉️ <a href=\"mailto:" + S.mail + '">' + S.mail + "</a></div></div>";
  };
  // Small row: "Folge uns · Bizi takip et"
  window.mkSocialRow = function () {
    return '<div class="mk-social" data-mk-social><h3>' + (lang() === "tr" ? "📲 Bizi takip et" : "📲 Folge uns") + "</h3>" + buttons() + "</div>";
  };

  function addTo(container, html) {
    if (!container || container.querySelector("[data-mk-social]")) return;
    container.insertAdjacentHTML("beforeend", html);
  }

  // home page (end) and profile tab
  if (typeof renderHomeTab === "function") {
    var baseHome = renderHomeTab;
    renderHomeTab = function (container) {
      var r = baseHome.apply(this, arguments);
      try { addTo(container || document.getElementById("main-tab-content"), window.mkSocialBox()); } catch (e) {}
      return r;
    };
  }
  if (typeof renderProfileTab === "function") {
    var baseProfile = renderProfileTab;
    renderProfileTab = function (container) {
      var r = baseProfile.apply(this, arguments);
      try { addTo(container || document.getElementById("main-tab-content"), window.mkSocialBox()); } catch (e) {}
      return r;
    };
  }
  // menu (☰): added whenever a menu / hub panel is opened
  document.addEventListener("click", function (ev) {
    if (!ev.target.closest || !ev.target.closest("#hamburger-btn")) return;
    setTimeout(function () {
      var panels = document.querySelectorAll(".modal-overlay, .hub-modal, .hamburger-modal, #hamburger-modal, .side-menu, [id*='hub'], [id*='menu']");
      for (var i = 0; i < panels.length; i++) {
        var p = panels[i];
        if (p.offsetParent === null || p.id === "hamburger-btn") continue;
        var body = p.querySelector(".modal-content, .modal-body") || p;
        addTo(body, window.mkSocialRow());
        break;
      }
    }, 150);
  }, true);
})();
