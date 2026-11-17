/* My Kiez Berlin – video limit on the website (2026-11-17, owner).
   The website cannot make videos smaller (the app does it by itself), so a video chosen here must be
   at most 3 minutes long and at most 50 MB (server limit). Works for every file field of the page
   (story form, admin story planner, sponsor panel): a video that is too long / too big is taken out
   again and a short message explains why. Pictures are not touched. */
(function () {
  "use strict";
  var MAX_SECONDS = 180;
  var MAX_BYTES = 50 * 1024 * 1024;

  function lang() {
    var l = (document.documentElement.lang || navigator.language || "de").toLowerCase();
    return l.indexOf("tr") === 0 ? "tr" : "de";
  }
  function message(kind) {
    var tr = lang() === "tr";
    if (kind === "long") return tr
      ? "Video en fazla 3 dakika olabilir. Lütfen daha kısa bir video seç. (Uygulamadan yüklenen videolar otomatik küçültülür.)"
      : "Ein Video darf höchstens 3 Minuten lang sein. Bitte ein kürzeres Video wählen. (In der App werden Videos automatisch verkleinert.)";
    return tr
      ? "Video çok büyük (en fazla 50 MB). Lütfen daha kısa bir video seç veya uygulamadan yükle – uygulama videoyu kendisi küçültür."
      : "Das Video ist zu groß (höchstens 50 MB). Bitte ein kürzeres Video wählen oder in der App hochladen – die App macht es selbst kleiner.";
  }

  function duration(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var v = document.createElement("video");
      var done = function (s) { URL.revokeObjectURL(url); resolve(s); };
      v.preload = "metadata";
      v.onloadedmetadata = function () { done(isFinite(v.duration) ? v.duration : 0); };
      v.onerror = function () { done(0); };
      setTimeout(function () { done(0); }, 8000);
      v.src = url;
    });
  }

  /** Promise<"" | "long" | "big"> */
  window.mkCheckVideo = function (file) {
    if (!file || String(file.type).indexOf("video/") !== 0) return Promise.resolve("");
    if (file.size > MAX_BYTES) return Promise.resolve("big");
    return duration(file).then(function (s) { return s > MAX_SECONDS + 0.5 ? "long" : ""; });
  };

  // every file field of the page, also fields that are drawn later (capture phase, before the page's own handler)
  document.addEventListener("change", function (ev) {
    var input = ev.target;
    if (!input || input.tagName !== "INPUT" || input.type !== "file" || !input.files || !input.files.length) return;
    var files = Array.prototype.slice.call(input.files);
    var videos = files.filter(function (f) { return String(f.type).indexOf("video/") === 0; });
    if (!videos.length) return;
    // big files can be refused at once (no waiting)
    var big = videos.some(function (f) { return f.size > MAX_BYTES; });
    if (big) {
      ev.stopImmediatePropagation();
      alert(message("big"));
      input.value = "";
      return;
    }
    // length needs the video's metadata: hold the event, check, then hand it on
    if (input.getAttribute("data-mk-video-ok") === "1") { input.removeAttribute("data-mk-video-ok"); return; }
    ev.stopImmediatePropagation();
    Promise.all(videos.map(window.mkCheckVideo)).then(function (res) {
      var bad = res.filter(Boolean)[0];
      if (bad) { alert(message(bad)); input.value = ""; return; }
      input.setAttribute("data-mk-video-ok", "1");
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }, true);
})();
