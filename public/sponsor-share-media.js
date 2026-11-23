/* My Kiez Berlin – 2026-11-23 (owner "UYGULA 12"): a sponsor sends his own pictures/videos to his customers.
   Button "📤 Teilen · Paylaş" in the sponsor panel (one, several or all uploads) and in the sponsor story viewer
   (the picture/video that is open). The phone share sheet gets the files (WhatsApp, Instagram, Telegram …);
   the text always ends with My Kiez Berlin, the web page, the app link and the sponsor's own page /s/<id>.
   Without file sharing (desktop) the text + links are copied and WhatsApp opens with the text. */
(function () {
  "use strict";
  var SITE = "https://mykiezberlin.com";
  var APK = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk";

  function full(url) { return /^https?:\/\//.test(url) ? url : SITE + (url.charAt(0) === "/" ? url : "/" + url); }

  function shareText(name, adId, captions, lang) {
    var tr = lang === "tr";
    var lines = [];
    if (name) lines.push("📣 " + name);
    (captions || []).filter(Boolean).slice(0, 5).forEach(function (c) { lines.push(c); });
    lines.push("");
    if (adId) lines.push((tr ? "👉 Tüm resim ve videolarımız: " : "👉 Alle Bilder & Videos: ") + SITE + "/s/" + encodeURIComponent(adId));
    lines.push("📍 My Kiez Berlin · mykiezberlin.com");
    lines.push("📲 App: " + APK);
    return lines.join("\n");
  }

  function asFile(url, i) {
    return fetch(full(url)).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
      if (!b) return null;
      var type = b.type || (/\.mp4/i.test(url) ? "video/mp4" : "image/jpeg");
      var ext = (type.split("/")[1] || "jpg").replace("jpeg", "jpg").replace("quicktime", "mov");
      return new File([b], "MyKiezBerlin_" + (i + 1) + "." + ext, { type: type });
    }).catch(function () { return null; });
  }

  /** items: [{url, caption}] · returns a short status text */
  var ready = null; // files loaded, but the browser wanted a new tap (big videos take longer than the tap allows)
  window.mkSponsorShare = function (name, adId, items, lang) {
    items = (items || []).filter(function (x) { return x && x.url; }).slice(0, 10);
    var key = items.map(function (x) { return x.url; }).join("|");
    if (ready && ready.key === key && navigator.share) {
      var d = ready.data; ready = null;
      return navigator.share(d).then(function () { return "ok"; }, function (e) { return e && e.name === "AbortError" ? "cancel" : "copied"; });
    }
    var text = shareText(name, adId, items.map(function (x) { return x.caption; }), lang);
    try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) { /* ignore */ }
    return Promise.all(items.map(function (x, i) { return asFile(x.url, i); })).then(function (files) {
      files = files.filter(Boolean);
      var data = { title: name || "My Kiez Berlin", text: text };
      if (files.length && navigator.canShare && navigator.canShare({ files: files })) data.files = files;
      if (navigator.share) {
        return navigator.share(data).then(function () { return "ok"; }, function (e) {
          if (e && e.name === "NotAllowedError") { ready = { key: key, data: data }; return "again"; } // tap once more
          return e && e.name === "AbortError" ? "cancel" : "copied";
        });
      }
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
      return "copied";
    });
  };
})();
