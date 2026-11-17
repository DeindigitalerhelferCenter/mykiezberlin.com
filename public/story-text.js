/* My Kiez Berlin – text on top of a story picture or video (2026-11-17, owner).
   Overlay = { t: text, x, y: centre of the text (0..1 of the picture), s: font size (part of the picture width),
   c: colour "#rrggbb", b: "box" (dark box behind the text) | "none" }.
   - Admin (story planner): pictures get the text burned into the picture before upload (mkBurnStoryText),
     videos send the overlay as data and every viewer draws it on top (mkStoryTextLayer).
   - Same rules as the app (StoryTextOverlay in KiezStoriesComponent.kt / AdminStoryPlanner.kt). */
(function () {
  "use strict";
  var FONT = "800 {px}px system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

  function lines(t) { return String(t || "").split("\n").map(function (l) { return l.trim(); }).filter(function (l, i, a) { return l || (i > 0 && i < a.length - 1); }); }

  // Wraps long lines so that no line is wider than maxW (canvas measure).
  function wrap(ctx, text, maxW) {
    var out = [];
    lines(text).forEach(function (line) {
      var words = line.split(/\s+/), cur = "";
      words.forEach(function (w) {
        var test = cur ? cur + " " + w : w;
        if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = w; } else cur = test;
      });
      out.push(cur);
    });
    return out;
  }

  // Draws the overlay onto a canvas context of size w×h.
  function draw(ctx, o, w, h) {
    if (!o || !o.t) return;
    var px = Math.max(10, Math.round((o.s || 0.07) * w));
    ctx.font = FONT.replace("{px}", px);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var rows = wrap(ctx, o.t, w * 0.9);
    var lh = px * 1.25;
    var cx = (o.x == null ? 0.5 : o.x) * w, cy = (o.y == null ? 0.5 : o.y) * h;
    // 2026-11-17: the text block always stays inside the picture (x = 0.7 with long lines cut words off)
    var maxRow = 0;
    rows.forEach(function (r) { maxRow = Math.max(maxRow, ctx.measureText(r).width); });
    var hw = maxRow / 2 + (o.b !== "none" ? px * 0.45 : 0), hh = (rows.length * lh) / 2 + (o.b !== "none" ? px * 0.27 : 0);
    cx = Math.min(Math.max(cx, Math.min(hw, w / 2)), Math.max(w - hw, w / 2));
    cy = Math.min(Math.max(cy, Math.min(hh, h / 2)), Math.max(h - hh, h / 2));
    var top = cy - (rows.length * lh) / 2;
    if (o.b !== "none") {
      var bw = 0;
      rows.forEach(function (r) { bw = Math.max(bw, ctx.measureText(r).width); });
      var pad = px * 0.45;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      var x0 = cx - bw / 2 - pad, y0 = top - pad * 0.6, bwT = bw + pad * 2, bh = rows.length * lh + pad * 1.2, r = px * 0.35;
      ctx.beginPath();
      ctx.moveTo(x0 + r, y0); ctx.lineTo(x0 + bwT - r, y0); ctx.quadraticCurveTo(x0 + bwT, y0, x0 + bwT, y0 + r);
      ctx.lineTo(x0 + bwT, y0 + bh - r); ctx.quadraticCurveTo(x0 + bwT, y0 + bh, x0 + bwT - r, y0 + bh);
      ctx.lineTo(x0 + r, y0 + bh); ctx.quadraticCurveTo(x0, y0 + bh, x0, y0 + bh - r);
      ctx.lineTo(x0, y0 + r); ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
      ctx.fill();
    } else {
      ctx.shadowColor = "rgba(0,0,0,0.75)";
      ctx.shadowBlur = px * 0.25;
    }
    ctx.fillStyle = o.c || "#ffffff";
    rows.forEach(function (r, i) { ctx.fillText(r, cx, top + lh * i + lh / 2); });
    ctx.shadowBlur = 0;
  }
  window.mkDrawStoryText = draw;

  // Picture file + overlay -> new JPEG file with the text inside (max. 1920 px, like the planner).
  window.mkBurnStoryText = function (file, o) {
    return new Promise(function (resolve, reject) {
      if (!file || !o || !o.t || String(file.type).indexOf("image/") !== 0) { resolve(file); return; }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, 1920 / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        var ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, c.width, c.height);
        draw(ctx, o, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? resolve(new File([b], "story.jpg", { type: "image/jpeg" })) : reject(new Error("text")); }, "image/jpeg", 0.9);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("image")); };
      img.src = url;
    });
  };

  // HTML layer on top of a <video>: positioned exactly over the visible video picture (object-fit: contain).
  window.mkStoryTextLayer = function (video, o) {
    if (!video || !o || !o.t) return null;
    var host = video.parentNode;
    if (!host) return null;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    var layer = document.createElement("canvas");
    layer.className = "mk-story-text";
    layer.style.cssText = "position:absolute;pointer-events:none;z-index:2";
    host.appendChild(layer);
    function place() {
      var vw = video.videoWidth, vh = video.videoHeight;
      var bw = video.clientWidth, bh = video.clientHeight;
      if (!vw || !vh || !bw || !bh) return;
      var k = Math.min(bw / vw, bh / vh), w = vw * k, h = vh * k;
      layer.style.left = video.offsetLeft + (bw - w) / 2 + "px";
      layer.style.top = video.offsetTop + (bh - h) / 2 + "px";
      layer.style.width = w + "px";
      layer.style.height = h + "px";
      var dpr = window.devicePixelRatio || 1;
      layer.width = Math.round(w * dpr);
      layer.height = Math.round(h * dpr);
      var ctx = layer.getContext("2d");
      ctx.clearRect(0, 0, layer.width, layer.height);
      draw(ctx, o, layer.width, layer.height);
    }
    video.addEventListener("loadedmetadata", place);
    window.addEventListener("resize", place);
    if (video.readyState >= 1) place();
    return layer;
  };
})();
