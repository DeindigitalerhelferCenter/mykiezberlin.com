/* Admin only (web): share the open story to WhatsApp, Instagram, Facebook or TikTok.
   The text always carries the link, the app download link and the web name. Same text as the app (StoryShareHelper.kt). */
(function () {
  "use strict";
  var APK = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk";

  function isAdmin() { try { return localStorage.getItem("mykiez_admin_auth_v1") === "true"; } catch (e) { return false; } }
  function plain(html) { var t = document.createElement("textarea"); t.innerHTML = String(html || ""); return t.value; }

  window.mkShareText = function (story) {
    var link = story.link && !/^https:\/\/mykiezberlin\.com\/?$/.test(story.link) ? story.link : "https://mykiezberlin.com";
    return "📍 My Kiez Berlin · " + plain(story.kiez) + "\n" + plain(story.headline) + (story.subtext ? "\n" + plain(story.subtext) : "") +
      "\n\n👉 " + link + "\n📲 App: " + APK + "\n🌐 mykiezberlin.com" +
      "\n📢 WhatsApp-Kanal: https://whatsapp.com/channel/0029VbADtpj5a241JELaiq0O"; // 2026-11-21 (owner)
  };

  function toast(msg) { if (typeof showToast === "function") showToast(msg); else console.log(msg); }
  function copy(text) { try { navigator.clipboard.writeText(text); } catch (e) {} }

  async function mediaFile(story) {
    var url = story.isVideo ? story.videoUri : story.image;
    if (!url || /hero_berlin/.test(url)) return null;
    try {
      var res = await fetch(url);
      if (!res.ok) return null;
      var blob = await res.blob();
      var ext = story.isVideo ? "mp4" : (blob.type.split("/")[1] || "jpg");
      return new File([blob], "MyKiezBerlin_Story." + ext, { type: blob.type || (story.isVideo ? "video/mp4" : "image/jpeg") });
    } catch (e) { return null; }
  }

  window.mkAdminShare = async function (target) {
    var story = typeof getStories === "function" ? getStories().filter(function (s) { return s.status === "approved"; })[activeStoryIndex] : null;
    if (!story) return;
    var text = mkShareText(story);
    copy(text);
    if (target === "facebook" && !navigator.canShare) {
      window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent("https://mykiezberlin.com") + "&quote=" + encodeURIComponent(text), "_blank", "noopener");
      return;
    }
    if (target === "whatsapp" && !navigator.canShare) {
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
      return;
    }
    var file = await mediaFile(story);
    var data = { title: "My Kiez Berlin", text: text };
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
    try {
      if (navigator.share) {
        await navigator.share(data);
        if (target === "instagram" || target === "tiktok" || target === "facebook") toast("Text + Link kopiert – dort einfügen / Metin ve link kopyalandı – orada yapıştır");
        return;
      }
    } catch (e) { if (e && e.name === "AbortError") return; }
    // Desktop without the share sheet: WhatsApp / Facebook via link, Instagram / TikTok need the phone
    if (target === "whatsapp") window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
    else if (target === "facebook") window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent("https://mykiezberlin.com"), "_blank", "noopener");
    else toast("Instagram / TikTok: bitte am Handy teilen. Text + Link sind kopiert. / Lütfen telefondan paylaş, metin kopyalandı.");
  };

  function addBar() {
    if (!isAdmin()) return;
    var overlay = document.getElementById("story-modal-overlay");
    if (!overlay || overlay.querySelector(".mk-admin-share")) return;
    var bar = document.createElement("div");
    bar.className = "mk-admin-share";
    bar.style.cssText = "position:absolute;left:8px;right:8px;top:64px;z-index:30;display:flex;gap:6px;justify-content:center;flex-wrap:wrap";
    var btn = function (t, label, bg) { return '<button onclick="event.stopPropagation();mkAdminShare(\'' + t + '\')" style="border:0;border-radius:18px;padding:7px 11px;font-weight:700;font-size:12px;color:#fff;background:' + bg + '">' + label + "</button>"; };
    bar.innerHTML = btn("whatsapp", "WhatsApp", "#25D366") + btn("instagram", "Instagram", "#C13584") + btn("facebook", "Facebook", "#1877F2") + btn("tiktok", "TikTok", "#111");
    overlay.appendChild(bar);
  }

  if (typeof renderStorySlide === "function") {
    var base = renderStorySlide;
    renderStorySlide = function () {
      var r = base.apply(this, arguments);
      try { var old = document.querySelector("#story-modal-overlay .mk-admin-share"); if (old) old.remove(); addBar(); } catch (e) {}
      return r;
    };
  }

  // 2026-11-23 (owner "UYGULA 7"): after sharing by hand the admin confirms "✓ Paylaştım" -> the server remembers it
  // (social_items), so the Social-Planer / TikTok / WhatsApp package never offers this story again for that channel.
  // Instagram / Facebook by hand = the automatic Facebook/Instagram posting skips this story too.
  function adminToken() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function askShared(target, id) {
    var old = document.getElementById("mk-shared-ask");
    if (old) old.remove();
    var names = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };
    var box = document.createElement("div");
    box.id = "mk-shared-ask";
    box.style.cssText = "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:100001;background:#161b22;border:1px solid #30363d;border-radius:14px;padding:10px 12px;color:#fff;font:600 13px system-ui,sans-serif;display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:94vw;box-shadow:0 8px 30px rgba(0,0,0,.5)";
    var btn = "border:0;border-radius:10px;padding:7px 11px;font-weight:700;cursor:pointer;color:#fff";
    box.innerHTML = "<span>" + names[target] + ": paylaştın mı? · geteilt?</span>" +
      '<button type="button" data-y style="' + btn + ';background:#238636">✓ Paylaştım</button>' +
      '<button type="button" data-n style="' + btn + ';background:#30363d">✕ Hayır</button>';
    document.body.appendChild(box);
    var t = setTimeout(function () { box.remove(); }, 60000);
    box.querySelector("[data-n]").onclick = function () { clearTimeout(t); box.remove(); };
    box.querySelector("[data-y]").onclick = function () {
      clearTimeout(t);
      box.textContent = "…";
      fetch("/api/social-planer", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": adminToken() }, body: JSON.stringify({ action: "manualShared", target: target, id: id }) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (j) { box.textContent = j && j.ok ? "✓ Kaydedildi – " + names[target] + " için bir daha önerilmez" : "Kaydedilemedi: " + ((j && j.error) || "?"); setTimeout(function () { box.remove(); }, 3500); })
        .catch(function () { box.textContent = "Ağ hatası"; setTimeout(function () { box.remove(); }, 3500); });
    };
  }
  if (typeof window.mkAdminShare === "function") {
    var shareBase = window.mkAdminShare;
    window.mkAdminShare = async function (target) {
      var story = null;
      try { story = typeof getStories === "function" ? getStories().filter(function (s) { return s.status === "approved"; })[activeStoryIndex] : null; } catch (e) { story = null; }
      var r = await shareBase.apply(this, arguments);
      if (story && story.id && isAdmin()) askShared(target, String(story.id));
      return r;
    };
  }
})();
