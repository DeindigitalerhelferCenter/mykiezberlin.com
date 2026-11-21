/* 2026-11-21 (owner): WhatsApp growth – the same as the app (KiezStoriesComponent "Teilen", SocialBox WA_CHANNEL).
   1. Story viewer: green "WhatsApp" button for everybody – sends the story text + link + WhatsApp channel
      (phone: share sheet with the picture when possible, else wa.me).
   2. Social box: "Kiez-Gruppen" row with the 6 WhatsApp groups (links from social.js MK_SOCIAL.waGroups).
   3. One small card "📢 WhatsApp-Kanal" on the home page, closable (remembered in this browser).
   Nothing is sent by itself – the user always chooses the chat in WhatsApp. */
(function () {
  "use strict";
  var CHANNEL = "https://whatsapp.com/channel/0029VbADtpj5a241JELaiq0O";
  var APK = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk";
  function tr() { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0; }
  function plain(html) { var t = document.createElement("textarea"); t.innerHTML = String(html || ""); return t.value; }
  function channel() { return (window.MK_SOCIAL && window.MK_SOCIAL.waChannel) || CHANNEL; }

  function storyText(s) {
    var link = s.link && !/^https:\/\/mykiezberlin\.com\/?$/.test(s.link) ? s.link : "https://mykiezberlin.com";
    return "📍 My Kiez Berlin · " + plain(s.kiez) + "\n" + plain(s.headline) + (s.subtext ? "\n" + plain(s.subtext) : "") +
      "\n\n👉 " + link +
      "\n📢 " + (tr() ? "WhatsApp Kanalımız" : "WhatsApp-Kanal") + ": " + channel() +
      "\n📲 " + (tr() ? "Uygulama" : "App") + ": " + APK;
  }

  async function mediaFile(s) {
    var url = s.isVideo ? s.videoUri : s.image;
    if (!url || /hero_berlin|mykiez_logo/.test(url)) return null;
    try {
      var res = await fetch(url);
      if (!res.ok) return null;
      var blob = await res.blob();
      if (blob.size > 15 * 1024 * 1024) return null;
      var ext = s.isVideo ? "mp4" : ((blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg"));
      return new File([blob], "MyKiezBerlin_Story." + ext, { type: blob.type || (s.isVideo ? "video/mp4" : "image/jpeg") });
    } catch (e) { return null; }
  }

  window.mkWaShareStory = async function () {
    try {
      var stories = getStories().filter(function (x) { return x.status === "approved"; });
      var s = stories[activeStoryIndex];
      if (!s) return;
      var text = storyText(s);
      var mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (mobile && navigator.share) {
        var file = await mediaFile(s);
        var data = { text: text };
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
        try { await navigator.share(data); return; } catch (e) { if (e && e.name === "AbortError") return; }
      }
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
    } catch (e) {}
  };

  // 1. story viewer button (everybody)
  if (typeof renderStorySlide === "function") {
    var base = renderStorySlide;
    renderStorySlide = function () {
      var r = base.apply(this, arguments);
      try {
        var header = document.querySelector("#story-modal-overlay .story-header-overlay");
        if (header && !header.querySelector(".mk-wa-share")) {
          var close = header.querySelector("button.btn-icon-circle");
          var html = '<button type="button" class="btn-icon-circle mk-wa-share" onclick="event.stopPropagation();mkWaShareStory()" ' +
            'style="background:#25D366;color:#fff" title="' + (tr() ? "WhatsApp'ta paylaş" : "Auf WhatsApp teilen") + '" aria-label="WhatsApp"><i class="bi bi-whatsapp"></i></button>';
          if (close) close.insertAdjacentHTML("beforebegin", html); else header.insertAdjacentHTML("beforeend", html);
        }
      } catch (e) {}
      return r;
    };
  }

  // 2. Kiez groups inside the social box
  function groupsHtml() {
    var g = (window.MK_SOCIAL && window.MK_SOCIAL.waGroups) || [];
    if (!g.length) return "";
    return '<div class="mk-wa-groups"><b>' + (tr() ? "💬 WhatsApp semt grupları – katıl:" : "💬 WhatsApp-Kiezgruppen – mach mit:") + "</b><div>" +
      g.map(function (x) { return '<a href="' + x[1] + '" target="_blank" rel="noopener">' + x[0] + "</a>"; }).join("") + "</div></div>";
  }
  var css = document.createElement("style");
  css.textContent =
    ".mk-wa-groups{margin-top:12px;font-size:13.5px}.mk-wa-groups div{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}" +
    ".mk-wa-groups a{padding:7px 11px;border-radius:999px;background:#E7F8EE;color:#075E54!important;font-weight:800;text-decoration:none;border:1px solid #25D366}" +
    "body.dark-mode .mk-wa-groups a,[data-theme=dark] .mk-wa-groups a{background:#0b2e1f;color:#7ee2a8!important}" +
    ".mk-wa-card{grid-column:1/-1;display:flex;align-items:center;gap:12px;margin:12px 0;padding:12px 14px;border-radius:16px;background:linear-gradient(135deg,#128C7E,#25D366);color:#fff;box-shadow:0 4px 14px rgba(18,140,126,.35)}" +
    ".mk-wa-card i.bi{font-size:28px}.mk-wa-card .t{flex:1;min-width:0;font-size:13.5px;line-height:1.35}.mk-wa-card b{display:block;font-size:15px}" +
    ".mk-wa-card a{flex:none;padding:9px 13px;border-radius:999px;background:#fff;color:#075E54!important;font-weight:900;text-decoration:none;font-size:13.5px}" +
    ".mk-wa-card button{flex:none;border:0;background:none;color:#fff;font-size:18px;cursor:pointer;padding:4px}";
  document.head.appendChild(css);
  ["mkSocialBox", "mkSocialRow"].forEach(function (name) {
    var f = window[name];
    if (typeof f !== "function") return;
    window[name] = function () {
      var h = f.apply(this, arguments);
      var i = h.lastIndexOf("</div>");
      return i > 0 ? h.slice(0, i) + groupsHtml() + h.slice(i) : h;
    };
  });

  // 3. channel card on the home page (closable)
  function closed() { try { return localStorage.getItem("mk_wa_card_closed") === "1"; } catch (e) { return false; } }
  function card() {
    return '<div class="mk-wa-card" data-mk-wa-card><i class="bi bi-whatsapp"></i><div class="t"><b>' +
      (tr() ? "Berlin haberleri WhatsApp'ta" : "Berlin-News auf WhatsApp") + "</b>" +
      (tr() ? "Kanalımızı takip et – ücretsiz, numaran görünmez." : "Folge unserem Kanal – kostenlos, deine Nummer bleibt privat.") +
      '</div><a href="' + channel() + '" target="_blank" rel="noopener">' + (tr() ? "Takip et" : "Folgen") + "</a>" +
      '<button type="button" aria-label="Schließen" data-mk-wa-x>✕</button></div>';
  }
  if (typeof renderHomeTab === "function") {
    var baseHome = renderHomeTab;
    renderHomeTab = function (container) {
      var r = baseHome.apply(this, arguments);
      try {
        var c = container || document.getElementById("main-tab-content");
        if (c && !closed() && !c.querySelector("[data-mk-wa-card]")) {
          var first = c.firstElementChild;
          if (first) first.insertAdjacentHTML("afterend", card()); else c.insertAdjacentHTML("afterbegin", card());
        }
      } catch (e) {}
      return r;
    };
  }
  document.addEventListener("click", function (ev) {
    var x = ev.target.closest && ev.target.closest("[data-mk-wa-x]");
    if (!x) return;
    try { localStorage.setItem("mk_wa_card_closed", "1"); } catch (e) {}
    var c = x.closest("[data-mk-wa-card]");
    if (c) c.remove();
  });
})();
