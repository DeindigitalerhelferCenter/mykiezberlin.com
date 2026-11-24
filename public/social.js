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
    // 2026-11-19 (owner): TikTok open; YouTube opens tonight – "" shows a grey "bald / yakında" button
    tiktok: "https://www.tiktok.com/@mykiezberlin",
    youtube: "",
    // 2026-11-19 (owner): Telegram channel + WhatsApp channel – the buttons appear as soon as a link is filled in
    telegram: "https://t.me/mykiezberlin",
    waChannel: "https://whatsapp.com/channel/0029VbADtpj5a241JELaiq0O", // 2026-11-21 (owner): channel opened
    // 2026-11-21 (owner): WhatsApp Kiez groups (join by link, only admins add people / change settings)
    waGroups: [
      ["Neukölln", "https://chat.whatsapp.com/EiCUYfwfQYr9eve4WT5STZ"],
      ["Kreuzberg", "https://chat.whatsapp.com/JDUKCyyyyY6HsxclTEhdDP"],
      ["Wedding", "https://chat.whatsapp.com/G0yav64xcdyFd5rLztmsiV"],
      ["Moabit", "https://chat.whatsapp.com/Be6LDHBHC6K5YqM8acT3Cs"],
      ["Spandau", "https://chat.whatsapp.com/IO6E8If42yWKPgoPsPdV8z"],
      ["Ganz Berlin", "https://chat.whatsapp.com/GCPuN7MEzEVLjutfKIYRqb"],
    ],
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
      '<a class="mk-s-btn mk-s-fb" href="' + S.facebook + '" target="_blank" rel="noopener"><i class="bi bi-facebook"></i> Facebook</a>' +
      '<a class="mk-s-btn mk-s-tt" href="' + S.tiktok + '" target="_blank" rel="noopener"><i class="bi bi-tiktok"></i> TikTok</a>' +
      (S.youtube ? '<a class="mk-s-btn mk-s-yt" href="' + S.youtube + '" target="_blank" rel="noopener"><i class="bi bi-youtube"></i> YouTube</a>'
        : '<span class="mk-s-btn mk-s-yt mk-s-soon" title="YouTube – bald · yakında"><i class="bi bi-youtube"></i> YouTube · ' + (lang() === "tr" ? "yakında" : "bald") + "</span>") +
      (S.telegram ? '<a class="mk-s-btn mk-s-tg" href="' + S.telegram + '" target="_blank" rel="noopener"><i class="bi bi-telegram"></i> Telegram</a>' : "") +
      (S.waChannel ? '<a class="mk-s-btn mk-s-wac" href="' + S.waChannel + '" target="_blank" rel="noopener"><i class="bi bi-megaphone-fill"></i> ' + (lang() === "tr" ? "WhatsApp Kanalı" : "WhatsApp-Kanal") + "</a>" : "") +
      "</div>";
  }

  // ---- 2026-11-19 (owner): round social buttons at the top (next to the story circles, on the PC also in the header),
  // thicker buttons, every button turns 360° once and then opens. The box at the end of the page stays.
  var css2 = document.createElement("style");
  css2.textContent =
    ".mk-social a.mk-s-btn,.mk-social span.mk-s-btn{padding:14px 14px!important;font-size:15px!important;border:2px solid rgba(255,255,255,.55);box-shadow:0 4px 12px rgba(0,0,0,.14);letter-spacing:.2px}" +
    ".mk-social .mk-s-btn i{font-size:19px}" +
    ".mk-s-tt{background:linear-gradient(135deg,#010101 55%,#25F4EE 120%);box-shadow:-2px 0 0 #25F4EE inset,2px 0 0 #FE2C55 inset!important}" +
    ".mk-s-yt{background:#FF0000}.mk-s-soon{background:#9CA3AF!important;cursor:default;opacity:.8}" +
    ".mk-social span.mk-s-btn{flex:1;min-width:120px;display:flex;align-items:center;justify-content:center;gap:8px;border-radius:14px;color:#fff;font-weight:800}" +
    ".mk-sr{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding:2px}" +
    ".mk-sr::-webkit-scrollbar{display:none}" +
    ".mk-sr-b{flex:none;width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:#fff!important;font-size:17px;text-decoration:none;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.22);cursor:pointer;padding:0}" +
    ".mk-sr-b.wa{background:#25D366}.mk-sr-b.ig{background:radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285AEB 90%)}" +
    ".mk-sr-b.fb{background:#1877F2}.mk-sr-b.tt{background:#010101}.mk-sr-b.yt{background:#FF0000}.mk-sr-b.yt.soon{opacity:.45;cursor:default}" +
    ".mk-sr-b.tg{background:#229ED9}.mk-sr-b.wac{background:#128C7E}.mk-s-tg{background:#229ED9}.mk-s-wac{background:#128C7E}" +
    ".mk-sr-b.inf{background:#0F766E;font-weight:900;font-family:Georgia,serif;font-style:italic}" +
    ".mk-spin{animation:mkSpin .45s cubic-bezier(.4,0,.2,1)}@keyframes mkSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}" +
    "@media (prefers-reduced-motion:reduce){.mk-spin{animation:none}}" +
    ".stories-header .mk-sr{margin:0 8px;flex:1;min-width:0;justify-content:center}" +
    /* phone: the round buttons get their own line under "Kiez Stories", so none is cut off */
    "@media(max-width:700px){.stories-header{flex-wrap:wrap}.stories-header .mk-sr{order:5;flex:1 0 100%;margin:8px 0 2px;justify-content:flex-start}}" +
    ".top-bar-right .mk-sr{margin-right:4px}.top-bar-right .mk-sr-b{width:34px;height:34px;font-size:16px}" +
    "@media(max-width:1099px){.top-bar-right .mk-sr{display:none}}" +
    ".mk-sr-pop{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}" +
    ".mk-sr-pop .mk-social{max-width:640px;max-height:88vh;overflow:auto;margin:0;position:relative}" +
    ".mk-sr-pop .mk-sr-x{position:absolute;top:8px;right:10px;border:0;background:none;font-size:22px;cursor:pointer;color:inherit}";
  document.head.appendChild(css2);

  // ---- 2026-11-24 (owner): header + footer buttons look exactly the same, real brand colours + logos.
  // kiez-search.js uses the class names .mk-sr / .mk-sr-b too (search results) and squeezed the round buttons
  // (phone: 3 columns, pills) – everything below is bound to [data-mk-sr] so the search keeps its own look.
  var css3 = document.createElement("style");
  css3.textContent =
    "[data-mk-sr].mk-sr{display:flex!important;flex-wrap:nowrap!important;align-items:center;gap:8px;overflow-x:auto;width:auto}" +
    ".stories-header [data-mk-sr].mk-sr{flex:1;min-width:0}" +
    "@media(max-width:700px){.stories-header [data-mk-sr].mk-sr{flex:1 0 100%;width:100%}}" +
    "[data-mk-sr] .mk-sr-b{flex:none!important;width:36px!important;height:36px!important;padding:0!important;border-radius:50%!important;font-size:17px!important;line-height:1!important;" +
    "display:inline-flex!important;align-items:center;justify-content:center;color:#fff!important;font-weight:400;white-space:normal}" +
    ".top-bar-right [data-mk-sr] .mk-sr-b{width:34px!important;height:34px!important;font-size:16px!important}" +
    "[data-mk-sr] .mk-sr-b.inf{font-weight:900!important}" +
    // brand colours (same in the round row and in the box at the end of the page)
    "[data-mk-sr] .mk-sr-b.wa,.mk-social .mk-s-wa{background:#25D366!important}" +
    "[data-mk-sr] .mk-sr-b.ig,.mk-social .mk-s-ig{background:radial-gradient(circle at 30% 107%,#fdf497 0%,#fdf497 5%,#fd5949 45%,#d6249f 60%,#285AEB 90%)!important}" +
    "[data-mk-sr] .mk-sr-b.fb,.mk-social .mk-s-fb{background:#0866FF!important}" +
    "[data-mk-sr] .mk-sr-b.tt,.mk-social .mk-s-tt{background:#000!important;box-shadow:0 2px 6px rgba(0,0,0,.22)!important}" +
    "[data-mk-sr] .mk-sr-b.tt i,.mk-social .mk-s-tt i{color:#fff;text-shadow:-1.5px -1.5px 0 #25F4EE,1.5px 1.5px 0 #FE2C55}" +
    // YouTube: not open yet -> red like the real one, but no link (owner: "tıklanmasa da olur")
    "[data-mk-sr] .mk-sr-b.yt,.mk-social .mk-s-yt,.mk-social .mk-s-yt.mk-s-soon{background:#FF0000!important;opacity:1!important}" +
    "[data-mk-sr] .mk-sr-b.tg,.mk-social .mk-s-tg{background:#26A5E4!important}" +
    "[data-mk-sr] .mk-sr-b.wac,.mk-social .mk-s-wac{background:#128C7E!important}";
  document.head.appendChild(css3);

  function roundRow() {
    var tr = lang() === "tr";
    var b = function (cls, href, icon, label) {
      return '<a class="mk-sr-b ' + cls + '" href="' + href + '" target="_blank" rel="noopener" title="' + label + '" aria-label="' + label + '"><i class="bi ' + icon + '"></i></a>';
    };
    return '<div class="mk-sr" data-mk-sr>' +
      b("wa", S.whatsapp, "bi-whatsapp", "WhatsApp") +
      b("ig", S.instagram, "bi-instagram", "Instagram") +
      b("fb", S.facebook, "bi-facebook", "Facebook") +
      b("tt", S.tiktok, "bi-tiktok", "TikTok") +
      (S.youtube ? b("yt", S.youtube, "bi-youtube", "YouTube")
        : '<span class="mk-sr-b yt soon" title="YouTube – ' + (tr ? "yakında" : "bald") + '" aria-label="YouTube – ' + (tr ? "yakında" : "bald") + '"><i class="bi bi-youtube"></i></span>') +
      (S.telegram ? b("tg", S.telegram, "bi-telegram", "Telegram") : "") +
      (S.waChannel ? b("wac", S.waChannel, "bi-megaphone-fill", tr ? "WhatsApp Kanalı" : "WhatsApp-Kanal") : "") +
      '<button type="button" class="mk-sr-b inf" data-mk-sr-info title="' + (tr ? "Bilgi – Paylaş" : "Info – Mitmachen") + '" aria-label="Info">i</button>' +
      "</div>";
  }
  function placeRoundRows() {
    var sh = document.querySelector(".stories-header");
    if (sh && !sh.querySelector("[data-mk-sr]")) {
      var title = sh.querySelector(".stories-title");
      if (title) title.insertAdjacentHTML("afterend", roundRow()); else sh.insertAdjacentHTML("afterbegin", roundRow());
    }
    var tb = document.querySelector(".top-bar-right");
    if (tb && !tb.querySelector("[data-mk-sr]")) tb.insertAdjacentHTML("afterbegin", roundRow());
  }
  window.mkPlaceSocialRow = placeRoundRows;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", placeRoundRows); else placeRoundRows();
  setTimeout(placeRoundRows, 1500);

  // ⓘ opens the "Mitmachen · Paylaş" text as a window
  document.addEventListener("click", function (ev) {
    var info = ev.target.closest && ev.target.closest("[data-mk-sr-info]");
    if (!info) return;
    ev.preventDefault();
    info.classList.remove("mk-spin"); void info.offsetWidth; info.classList.add("mk-spin");
    setTimeout(function () {
      var pop = document.createElement("div");
      pop.className = "mk-sr-pop";
      pop.innerHTML = window.mkSocialBox().replace("data-mk-social", "data-mk-social-pop");
      pop.firstChild.insertAdjacentHTML("afterbegin", '<button type="button" class="mk-sr-x" aria-label="Schließen">✕</button>');
      pop.addEventListener("click", function (e) { if (e.target === pop || (e.target.closest && e.target.closest(".mk-sr-x"))) pop.remove(); });
      document.body.appendChild(pop);
    }, 450);
  }, true);

  // 360° turn, then open. The new tab is opened at once (still inside the click, so no popup blocker)
  // and gets its address after the turn.
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a.mk-sr-b, .mk-social a.mk-s-btn");
    if (!a || ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
    var href = a.getAttribute("href");
    if (!href) return;
    ev.preventDefault();
    a.classList.remove("mk-spin"); void a.offsetWidth; a.classList.add("mk-spin");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var w = null;
    try { w = window.open("", "_blank"); if (w) w.opener = null; } catch (e) { w = null; }
    setTimeout(function () {
      if (w && !w.closed) { try { w.location.href = href; return; } catch (e) {} }
      location.href = href; // inside the app WebView / popup blocked: same window
    }, reduce ? 0 : 460);
  }, true);
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
