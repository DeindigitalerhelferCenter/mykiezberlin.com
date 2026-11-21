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
      tplHtml += '<label style="' + BTN + '">📷 Kendi resmim<input type="file" id="admin-news-bg" accept="image/jpeg,image/png,image/webp" style="display:none"></label><span id="admin-news-bgname" style="color:#8b949e"></span></div>';
      var head = '<label style="display:flex;gap:8px;align-items:center;margin:8px 0;font-weight:700"><input type="checkbox" id="admin-news-auto"' + (j.auto ? " checked" : "") + "> 🤖 Otomatik · Automatisch (her listede acil + ilk 3 konu, 20 dk arayla, şablon resim)</label>" +
        tplHtml +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">Dil: <select id="admin-news-lang" style="' + BTN + '"><option value="de">Deutsch (+TR)</option><option value="tr">Türkçe</option></select>' +
        ' Aralık: <select id="admin-news-gap" style="' + BTN + '"><option value="0">hemen</option><option value="15">15 dk</option><option value="30" selected>30 dk</option><option value="60">60 dk</option></select>' +
        ' <button type="button" id="admin-news-refresh" style="' + BTN + '">↻ Listeyi yenile</button></div>';
      if (!j.slots.length) { body.innerHTML = head + '<p style="color:#8b949e">Şu an liste yok (06:00–22:00 arası oluşur).</p>'; bind(j); return; }
      body.innerHTML = head + j.slots.map(function (s, si) {
        return '<details' + (si === 0 ? " open" : "") + ' style="margin:6px 0"><summary style="cursor:pointer;font-weight:800;color:#fff">🕑 ' + slotLabel(s.slot) + " · " + s.items.length + " konu" + (s.auto_done ? " · 🤖 otomatik paylaşıldı" : "") + "</summary>" +
          s.items.map(function (it) {
            return '<div style="border:1px solid ' + (it.urgent ? "#f85149" : "#30363d") + ';border-radius:10px;padding:8px;margin:6px 0" data-slot="' + e(s.slot) + '" data-id="' + e(it.id) + '">' +
              '<label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" class="news-pick"' + (it.published ? " disabled" : "") + ">" +
              '<span style="flex:1">' + (it.urgent ? '<b style="color:#f85149">🚨 ACİL · EIL</b> ' : "") + (it.published ? '<b style="color:#3fb950">✓ paylaşıldı</b> ' : "") +
              '<small style="color:#8b949e">' + e(it.source) + ' · <a href="' + e(it.url) + '" target="_blank" rel="noopener" style="color:#58a6ff">kaynak ↗</a></small><br><small style="color:#8b949e">Orijinal: ' + e(it.orig) + "</small></span></label>" +
              '<input class="news-f" data-f="title_de" style="' + INP + ';margin-top:6px;font-weight:700" value="' + e(it.title_de) + '" placeholder="Titel (DE)">' +
              '<textarea class="news-f" data-f="text_de" rows="2" style="' + INP + ';margin-top:4px" placeholder="Text (DE)">' + e(it.text_de) + "</textarea>" +
              '<input class="news-f" data-f="title_tr" style="' + INP + ';margin-top:4px;font-weight:700" value="' + e(it.title_tr) + '" placeholder="Başlık (TR)">' +
              '<textarea class="news-f" data-f="text_tr" rows="2" style="' + INP + ';margin-top:4px" placeholder="Metin (TR)">' + e(it.text_tr) + "</textarea></div>";
          }).join("") +
          '<button type="button" class="news-publish" data-slot="' + e(s.slot) + '" style="' + BTN + ';background:#2ea043;margin-top:6px">📤 Seçilenleri paylaş</button> <span class="news-out"></span></details>';
      }).join("");
      bind(j);
    });
  }

  function bind(j) {
    var auto = document.getElementById("admin-news-auto");
    if (auto) auto.onchange = function () {
      fetch("/api/flags", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify({ name: "newsAuto", on: auto.checked }) });
    };
    document.querySelectorAll("#admin-news [data-tpl]").forEach(function (x) { x.onclick = function () { tpl = Number(x.getAttribute("data-tpl")); render(); }; });
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
        fd.append("action", "publish"); fd.append("slot", slot); fd.append("ids", ids.join(","));
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
