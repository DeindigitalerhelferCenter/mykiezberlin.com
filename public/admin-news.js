/* Admin – news stories (2026-11-22, owner), see functions/_lib/news-auto.js:
   every 2 hours (06–22 Berlin) a list: urgent news on top (not counted) + 5 topics with own DE/TR text by the AI.
   The admin ticks topics, can change the text, picks a background (one of 6 templates, rotating, or an own picture)
   and publishes with one button. Switch "Automatisch": every new list publishes urgent + the first 3 by itself. */
(function () {
  "use strict";
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:12px;padding:14px;margin-bottom:16px;color:#c9d1d9;font-size:13px";
  var BTN = "background:#21262d;border:1px solid #30363d;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit;font-size:12.5px";
  var INP = "width:100%;box-sizing:border-box;padding:6px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#fff;font:inherit;font-size:12.5px";
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function api(method, body, isForm) {
    var h = { "x-admin-token": token() };
    if (!isForm) h["content-type"] = "application/json";
    return fetch("/api/news-stories", { method: method, headers: h, body: body ? (isForm ? body : JSON.stringify(body)) : undefined, cache: "no-store" })
      .then(function (r) { return r.json().catch(function () { return {}; }); });
  }
  var tpl = 0; // 0 = rotating

  // 2026-11-21 (owner): big preview window (real colours, readable text) – backgrounds and finished pictures
  function lightbox(src, title, onPick) {
    var old = document.getElementById("admin-news-lb");
    if (old) old.remove();
    var lb = document.createElement("div");
    lb.id = "admin-news-lb";
    lb.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:12px";
    lb.innerHTML = '<div style="color:#fff;font-weight:800;font-size:14px;text-align:center">' + e(title || "") + "</div>" +
      '<div id="admin-news-lb-img" style="color:#8b949e">…</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">' +
      (onPick ? '<button type="button" id="admin-news-lb-pick" style="' + BTN + ';background:#2ea043">✓ Bu arka planı seç</button>' : "") +
      '<button type="button" id="admin-news-lb-close" style="' + BTN + '">✕ Kapat</button></div>';
    document.body.appendChild(lb);
    var box = document.getElementById("admin-news-lb-img");
    var img = new Image();
    img.alt = "";
    img.style.cssText = "max-width:min(94vw,560px);max-height:80vh;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.6)";
    img.onload = function () { box.textContent = ""; box.appendChild(img); };
    img.onerror = function () { box.textContent = "Ön izleme yüklenemedi."; };
    if (typeof src === "string") img.src = src;
    else src.then(function (u) { if (u) img.src = u; else box.textContent = "Ön izleme çizilemedi."; });
    var close = function () { lb.remove(); };
    lb.onclick = function (ev) { if (ev.target === lb) close(); };
    document.getElementById("admin-news-lb-close").onclick = close;
    if (onPick) document.getElementById("admin-news-lb-pick").onclick = function () { close(); onPick(); };
  }

  function previewUrl(slot, id) {
    var fd = new FormData();
    fd.append("action", "preview"); fd.append("slot", slot); fd.append("id", id);
    fd.append("lang", (document.getElementById("admin-news-lang") || {}).value || "tr-de");
    fd.append("template", String(tpl));
    var file = document.getElementById("admin-news-bg");
    if (file && file.files[0]) fd.append("background", file.files[0]);
    return fetch("/api/news-stories", { method: "POST", headers: { "x-admin-token": token() }, body: fd, cache: "no-store" })
      .then(function (r) { return r.ok && /image/.test(r.headers.get("content-type") || "") ? r.blob() : null; })
      .then(function (b) { return b ? URL.createObjectURL(b) : null; })
      .catch(function () { return null; });
  }

  function slotLabel(s) { var p = s.split("-"); return p[2] + "." + p[1] + ". " + p[3] + ":00"; }

  function render() {
    var view = document.getElementById("admin-main-view");
    if (!view || !token()) return;
    var b = document.getElementById("admin-news");
    if (!b) { b = document.createElement("div"); b.id = "admin-news"; b.style.cssText = CARD; view.insertBefore(b, view.firstChild); }
    b.innerHTML = '<b style="font-size:15px;color:#fff">📰 Haber story\'leri · Nachrichten-Stories</b> <span style="color:#8b949e">(06–22, 2 saatte bir)</span><div id="admin-news-body">…</div>';
    api("GET").then(function (j) {
      var body = document.getElementById("admin-news-body");
      if (!body) return;
      if (!j || !j.slots) { body.textContent = "Yüklenemedi."; return; }
      var tplHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:8px 0">Arka plan: ' +
        '<button type="button" data-tpl="0" style="' + BTN + (tpl === 0 ? ";border-color:#2ea043" : "") + '">🔄 Sırayla</button>';
      for (var i = 1; i <= (j.templates || 6); i++) tplHtml += '<img data-tpl="' + i + '" src="/assets/news/tpl-' + i + '-s.webp" alt="" style="width:34px;height:60px;border-radius:6px;cursor:pointer;object-fit:cover;border:2px solid ' + (tpl === i ? "#2ea043" : "transparent") + '">';
      tplHtml += '<label style="' + BTN + '">📷 Kendi resmim<input type="file" id="admin-news-bg" accept="image/jpeg,image/png" style="display:none"></label><span id="admin-news-bgname" style="color:#8b949e"></span></div>';
      var head = '<label style="display:flex;gap:8px;align-items:center;margin:8px 0;font-weight:700"><input type="checkbox" id="admin-news-auto"' + (j.auto ? " checked" : "") + "> 🤖 Otomatik · Automatisch (her listede acil + ilk 3 konu, 20 dk arayla, şablon resim)</label>" +
        tplHtml +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">Dil: <select id="admin-news-lang" style="' + BTN + '"><option value="tr-de" selected>Türkçe + Deutsch</option><option value="tr-en">Türkçe + English</option><option value="de">Deutsch + Türkçe</option><option value="tr">Sadece Türkçe</option></select>' +
        ' Aralık: <select id="admin-news-gap" style="' + BTN + '"><option value="0">hemen</option><option value="15">15 dk</option><option value="30" selected>30 dk</option><option value="60">60 dk</option></select>' +
        ' <button type="button" id="admin-news-refresh" style="' + BTN + '">🔎 Şimdi analiz et (yeni liste)</button></div>' +
        '<div style="color:#8b949e;margin-bottom:6px">Resme tıkla = büyük ön izleme · Kaynaklar: tagesschau, rbb24, Polizei Berlin, Tagesspiegel, Berliner Zeitung, Morgenpost, taz, Berliner Kurier</div>';
      if (!j.slots.length) { body.innerHTML = head + '<p style="color:#8b949e">Şu an liste yok (06:00–22:00 arası oluşur).</p>'; bind(j); return; }
      // 2026-11-21: texts are written step by step – look again in 20 s while something is open
      var pending = j.slots.some(function (s) { return !s.items.length || s.items.some(function (x) { return x.written === false; }); });
      clearTimeout(render.t);
      if (pending) render.t = setTimeout(function () { if (document.getElementById("admin-news") && !document.querySelector("#admin-news .news-f:focus")) render(); }, 20000);
      body.innerHTML = head + j.slots.map(function (s, si) {
        return '<details' + (si === 0 ? " open" : "") + ' style="margin:6px 0"><summary style="cursor:pointer;font-weight:800;color:#fff">🕑 ' + slotLabel(s.slot) + " · " + (s.items.length ? s.items.length + " konu" : "⏳ analiz ediliyor…") + (s.auto_done ? " · 🤖 otomatik paylaşıldı" : "") + "</summary>" +
          s.items.map(function (it) {
            return '<div style="border:1px solid ' + (it.urgent ? "#f85149" : "#30363d") + ';border-radius:10px;padding:8px;margin:6px 0" data-slot="' + e(s.slot) + '" data-id="' + e(it.id) + '">' +
              '<label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" class="news-pick">' +
              '<span style="flex:1">' + (it.urgent ? '<b style="color:#f85149">🚨 ACİL · EIL</b> ' : "") + (it.published ? '<b style="color:#3fb950">✓ paylaşıldı' + ((it.shares || []).length > 1 ? " (" + it.shares.length + "×)" : "") + "</b> " : "") + (it.written === false ? '<b style="color:#d29922">⏳ metin yazılıyor…</b> ' : "") + (it.renderError ? '<b style="color:#d29922">⚠ resim çizilemedi, eski yöntem kullanıldı</b> ' : "") +
              '<small style="color:#8b949e">' + e(it.source) + ' · <a href="' + e(it.url) + '" target="_blank" rel="noopener" style="color:#58a6ff">kaynak ↗</a></small><br><small style="color:#8b949e">Orijinal: ' + e(it.orig) + "</small></span></label>" +
              '<input class="news-f" data-f="title_de" style="' + INP + ';margin-top:6px;font-weight:700" value="' + e(it.title_de) + '" placeholder="Titel (DE)">' +
              '<textarea class="news-f" data-f="text_de" rows="3" style="' + INP + ';margin-top:4px" placeholder="Text (DE)">' + e(it.text_de) + "</textarea>" +
              '<input class="news-f" data-f="title_tr" style="' + INP + ';margin-top:4px;font-weight:700" value="' + e(it.title_tr) + '" placeholder="Başlık (TR)">' +
              '<textarea class="news-f" data-f="text_tr" rows="3" style="' + INP + ';margin-top:4px" placeholder="Metin (TR)">' + e(it.text_tr) + "</textarea>" +
              '<input class="news-f" data-f="title_en" style="' + INP + ';margin-top:4px;font-weight:700" value="' + e(it.title_en) + '" placeholder="Title (EN)">' +
              '<textarea class="news-f" data-f="text_en" rows="3" style="' + INP + ';margin-top:4px" placeholder="Text (EN)">' + e(it.text_en) + "</textarea>" +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" class="news-prev" style="' + BTN + '">👁 Ön izleme (büyük)</button>' +
              (it.published ? '<button type="button" class="news-again" style="' + BTN + ';background:#1f6feb">🔁 Tekrar paylaş</button><span class="news-again-out" style="color:#8b949e"></span>' : "") + "</div></div>";
          }).join("") +
          '<button type="button" class="news-publish" data-slot="' + e(s.slot) + '" style="' + BTN + ';background:#2ea043;margin-top:6px">📤 Seçilenleri paylaş (paylaşılanlar tekrar)</button> <span class="news-out"></span></details>';
      }).join("");
      bind(j);
    });
  }

  function bind(j) {
    var auto = document.getElementById("admin-news-auto");
    if (auto) auto.onchange = function () {
      fetch("/api/flags", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify({ name: "newsAuto", on: auto.checked }) });
    };
    document.querySelectorAll("#admin-news [data-tpl]").forEach(function (x) {
      var n = Number(x.getAttribute("data-tpl"));
      x.onclick = function () {
        if (!n) { tpl = 0; render(); return; }
        // 2026-11-21: click = big preview of the background, then choose it
        lightbox("/assets/news/tpl-" + n + ".webp", "Arka plan " + n + " · metinsiz", function () { tpl = n; render(); });
      };
    });
    document.querySelectorAll("#admin-news .news-prev").forEach(function (b) {
      b.onclick = function () {
        var box = b.closest("[data-id]");
        lightbox(previewUrl(box.getAttribute("data-slot"), box.getAttribute("data-id")), "Ön izleme · metinli (" + (tpl ? "arka plan " + tpl : "sıradaki renk") + ")");
      };
    });
    document.querySelectorAll("#admin-news .news-again").forEach(function (b) {
      b.onclick = function () {
        var box = b.closest("[data-id]");
        var out = box.querySelector(".news-again-out");
        b.disabled = true;
        var fd = new FormData();
        fd.append("action", "publish"); fd.append("slot", box.getAttribute("data-slot")); fd.append("ids", box.getAttribute("data-id")); fd.append("again", "1");
        fd.append("lang", document.getElementById("admin-news-lang").value);
        fd.append("gapMinutes", "0");
        fd.append("template", String(tpl));
        var file = document.getElementById("admin-news-bg");
        if (file && file.files[0]) fd.append("background", file.files[0]);
        api("POST", fd, true).then(function (r) { out.textContent = r.ok ? " ✓ tekrar paylaşıldı" : " Hata: " + (r.error || "?"); setTimeout(render, 1500); });
      };
    });
    var bg = document.getElementById("admin-news-bg");
    if (bg) bg.onchange = function () { document.getElementById("admin-news-bgname").textContent = bg.files[0] ? "✓ " + bg.files[0].name : ""; };
    var ref = document.getElementById("admin-news-refresh");
    if (ref) ref.onclick = function () { ref.disabled = true; ref.textContent = "…"; api("POST", { action: "refresh" }).then(render); };
    // save edited texts when leaving a field
    document.querySelectorAll("#admin-news .news-f").forEach(function (f) {
      f.onchange = function () {
        var box = f.closest("[data-id]");
        var body = { action: "edit", slot: box.getAttribute("data-slot"), id: box.getAttribute("data-id") };
        body[f.getAttribute("data-f")] = f.value;
        api("POST", body);
      };
    });
    document.querySelectorAll("#admin-news .news-publish").forEach(function (btn) {
      btn.onclick = function () {
        var slot = btn.getAttribute("data-slot");
        var ids = Array.prototype.map.call(document.querySelectorAll('#admin-news [data-slot="' + slot + '"][data-id]'), function (box) {
          return box.querySelector(".news-pick").checked ? box.getAttribute("data-id") : null;
        }).filter(Boolean);
        var out = btn.parentNode.querySelector(".news-out");
        if (!ids.length) { out.textContent = "Önce konu seç."; return; }
        btn.disabled = true;
        var fd = new FormData();
        fd.append("action", "publish"); fd.append("slot", slot); fd.append("ids", ids.join(",")); fd.append("again", "1");
        fd.append("lang", document.getElementById("admin-news-lang").value);
        fd.append("gapMinutes", document.getElementById("admin-news-gap").value);
        fd.append("template", String(tpl));
        var file = document.getElementById("admin-news-bg");
        if (file && file.files[0]) fd.append("background", file.files[0]);
        api("POST", fd, true).then(function (r) {
          out.textContent = r.ok ? "✓ " + r.published + " story paylaşıldı / planlandı" : "Hata: " + (r.error || "?");
          setTimeout(render, 1500);
        });
      };
    });
  }

  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () {
      var r = base.apply(this, arguments);
      setTimeout(render, 0);
      return r;
    };
  }
})();
