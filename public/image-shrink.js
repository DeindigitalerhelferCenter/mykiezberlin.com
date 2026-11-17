/* My Kiez Berlin – makes pictures smaller in the browser before they are uploaded (2026-11-17, owner).
   Sponsor pictures were uploaded unchanged (up to 1.4 MB per picture) and slowed down web and app.
   mkShrinkImage(file) -> Promise<File>: max. 1600 px on the long side, WebP (JPEG if the browser cannot write WebP),
   quality 0.82. Small pictures (< 300 KB and <= 1600 px), GIFs and videos are returned unchanged. */
(function () {
  "use strict";
  var MAX_SIDE = 1600;
  var SMALL = 300 * 1024;

  function load(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { resolve({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("image")); };
      img.src = url;
    });
  }
  function toBlob(canvas, type, q) {
    return new Promise(function (resolve) { canvas.toBlob(function (b) { resolve(b); }, type, q); });
  }

  // canvas -> smallest of WebP / JPEG that the browser can write
  function encode(canvas) {
    return toBlob(canvas, "image/webp", 0.82).then(function (webp) {
      if (webp && webp.type === "image/webp") return webp;
      return toBlob(canvas, "image/jpeg", 0.82);
    });
  }

  // 2026-11-17: true when the canvas is one flat colour (picture could not be drawn – e.g. JPEG without end marker)
  function flat(c) {
    try {
      var s = document.createElement("canvas"); s.width = 24; s.height = 24;
      var x = s.getContext("2d"); x.drawImage(c, 0, 0, 24, 24);
      var d = x.getImageData(0, 0, 24, 24).data, min = 255, max = 0;
      for (var i = 0; i < d.length; i += 4) { var v = (d[i] + d[i + 1] + d[i + 2]) / 3; if (v < min) min = v; if (v > max) max = v; }
      return max - min < 6;
    } catch (e) { return true; }
  }
  window.mkCanvasIsFlat = flat;

  window.mkShrinkCanvas = function (img) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    var k = Math.min(1, MAX_SIDE / Math.max(w, h));
    var c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * k));
    c.height = Math.max(1, Math.round(h * k));
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; // transparent PNGs get a white background in JPEG
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    if (flat(c)) return Promise.reject(new Error("empty")); // never upload a white picture
    return encode(c);
  };

  window.mkShrinkImage = function (file) {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return Promise.resolve(file);
    return load(file).then(function (r) {
      var w = r.img.naturalWidth, h = r.img.naturalHeight;
      if (file.size < SMALL && Math.max(w, h) <= MAX_SIDE) { URL.revokeObjectURL(r.url); return file; }
      var ready = r.img.decode ? r.img.decode() : Promise.resolve();
      return ready.then(function () { return window.mkShrinkCanvas(r.img); }).then(function (blob) {
        URL.revokeObjectURL(r.url);
        if (!blob || blob.size >= file.size) return file; // never bigger than before
        var ext = blob.type === "image/webp" ? "webp" : "jpg";
        return new File([blob], String(file.name || "bild").replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type });
      });
    }).catch(function () { return file; });
  };
})();
