/* Story download (web), the same as the app: a photo is saved with the My Kiez Berlin logo on top right.
   Videos and images that cannot be read (other sites) are saved unchanged as before. */
(function () {
  "use strict";
  function load(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("#story-modal-overlay a[download]");
    if (!link || link.dataset.mkPlain) return;
    var href = link.getAttribute("href") || "";
    if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(href) || /video/i.test(href)) return;
    event.preventDefault();
    Promise.all([load(href), load("assets/images/mykiez_logo_watermark.png").catch(function () { return null; })]).then(function (res) {
      var photo = res[0], logo = res[1];
      var canvas = document.createElement("canvas");
      canvas.width = photo.naturalWidth;
      canvas.height = photo.naturalHeight;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(photo, 0, 0);
      if (logo) {
        var w = Math.max(120, canvas.width * 0.24), h = w * (logo.naturalHeight / logo.naturalWidth), m = Math.max(16, canvas.width * 0.03);
        ctx.globalAlpha = 0.92;
        ctx.drawImage(logo, canvas.width - w - m, m, w, h);
        ctx.globalAlpha = 1;
      }
      canvas.toBlob(function (blob) {
        if (!blob) throw new Error("blob");
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "MyKiezBerlin_Story_" + Date.now() + ".jpg";
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      }, "image/jpeg", 0.92);
    }).catch(function () {
      link.dataset.mkPlain = "1";
      link.click();
    });
  }, true);
})();
