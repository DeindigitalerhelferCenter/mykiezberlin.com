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
      "\n\n👉 " + link + "\n📲 App: " + APK + "\n🌐 mykiezberlin.com";
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
    bar.style.cssText = "position:absolute;left:8px;right:8px;bottom:84px;z-index:30;display:flex;gap:6px;justify-content:center;flex-wrap:wrap";
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
})();
