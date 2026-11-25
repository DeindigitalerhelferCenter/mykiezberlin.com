/* 2026-11-22 (owner): web admin card "🗓️ Social-Planer" – times (default 08:00, 16:00, 23:00), what runs by itself
   (Telegram, Facebook/Instagram collection post), last runs, and the TikTok / WhatsApp package to share on the phone.
   Every story goes to every channel only once (server list social_items). */
(function () {
  "use strict";
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:12px;padding:14px;margin-bottom:16px;color:#c9d1d9;font-size:13px";
  var BTN = "background:#238636;border:0;color:#fff;border-radius:8px;padding:8px 12px;cursor:pointer;font:inherit;font-size:13px;font-weight:700;margin:4px 4px 0 0";
  var BTN2 = "background:#21262d;border:1px solid #30363d;color:#c9d1d9;border-radius:8px;padding:7px 11px;cursor:pointer;font:inherit;font-size:13px;margin:4px 4px 0 0";
  var NAMES = { tiktok: "🎵 TikTok", whatsapp: "🟢 WhatsApp-Kanal", wastatus: "📱 WhatsApp-Status" }; // 2026-11-25 (owner): + Status
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function api(body) {
    return fetch("/api/social-planer", { method: body ? "POST" : "GET", headers: { "content-type": "application/json", "x-admin-token": token() }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" })
      .then(function (r) { return r.json().catch(function () { return {}; }); });
  }
  function state(v) { return v === "not_set" ? '<span style="color:#d29922">nicht eingerichtet</span>' : v === "off" ? "aus" : e(v); }
  var data = null;
  function render() {
    if (!token()) return;
    var view = document.getElementById("admin-main-view");
    if (!view) return;
    api().then(function (j) {
      if (!j || j.error) return;
      data = j;
      var b = document.getElementById("admin-social");
      if (!b) { b = document.createElement("div"); b.id = "admin-social"; b.style.cssText = CARD; view.appendChild(b); }
      var s = j.settings, h = [];
      h.push('<b style="font-size:15px;color:#fff">🗓️ Social-Planer · Otomatik paylaşım</b><br>');
      h.push('<small style="color:#8b949e">Jeden Tag zu diesen Zeiten (Berlin) · Her gün bu saatlerde. Startet beim ersten Besuch nach der Zeit (Seite hat keinen Wecker).</small><br>');
      h.push('Zeiten / Saatler: <input id="sp-times" value="' + e(s.times.join(", ")) + '" style="background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;padding:5px;width:170px;font:inherit"> ');
      h.push('<label><input type="checkbox" id="sp-tg"' + (s.telegram ? " checked" : "") + "> Telegram</label> ");
      h.push('<label><input type="checkbox" id="sp-meta"' + (s.meta ? " checked" : "") + "> Facebook + Instagram</label> ");
      h.push('<label><input type="checkbox" id="sp-pack"' + (s.pack ? " checked" : "") + "> TikTok/WhatsApp-Paket</label><br>");
      h.push('<button type="button" id="sp-save" style="' + BTN2 + '">💾 Speichern · Kaydet</button><button type="button" id="sp-run" style="' + BTN + '">▶ Jetzt ausführen · Şimdi çalıştır</button> <span id="sp-out"></span><br>');
      h.push("Nächster Lauf / Sonraki: <b>" + e(j.next) + "</b> · Telegram: " + (j.ready.telegram ? "✅" : '<span style="color:#d29922">❌ Schlüssel fehlt</span>') +
        " · Facebook/Instagram: " + (j.ready.meta ? (j.ready.instagram ? "✅" : "✅ FB · ❌ IG_USER_ID") : '<span style="color:#d29922">❌ META_PAGE_TOKEN fehlt (trägst du im Cloudflare-Dashboard ein)</span>') + "<br>");
      if (j.runs && j.runs.length) {
        h.push('<details style="margin-top:6px"><summary>Letzte Läufe / Son çalışmalar (' + j.runs.length + ")</summary><small>");
        j.runs.forEach(function (r) {
          var p = r.result.pack || {};
          h.push("• " + e(r.slot) + " – Telegram: " + state(r.result.telegram) + " · FB/IG: " + state(r.result.meta) + (p.tiktok != null ? " · Paket TikTok " + p.tiktok + " / WhatsApp " + p.whatsapp + (p.wastatus != null ? " / Status " + p.wastatus : "") : "") + "<br>");
        });
        h.push("</small></details>");
      }
      // 2026-11-23 (owner "UYGULA 3"): report – every live story and where it went
      h.push('<details id="sp-report" style="margin-top:6px"><summary style="cursor:pointer;font-weight:700">📊 Paylaşım raporu · Wo wurde was geteilt? (canlı story\'ler)</summary><div id="sp-report-body" style="margin-top:6px">…</div></details>');
      ["tiktok", "whatsapp", "wastatus"].forEach(function (c) {
        var p = j.pack[c];
        if (!p) return; // 2026-11-25: older server without Status
        h.push('<div style="border-top:1px solid #30363d;margin-top:10px;padding-top:8px"><b>' + NAMES[c] + "</b> – " + (p.stories.length ? p.stories.length + " neue Story(s) zum Teilen · paylaşılacak" : "nichts neu · yeni yok ✓"));
        if (p.stories.length) {
          h.push('<div style="display:flex;gap:6px;overflow-x:auto;margin:6px 0">' + p.stories.map(function (x) {
            return x.media ? '<a href="' + e(x.media) + '" download target="_blank" title="' + e(x.headline) + '">' + (x.video ? '<span style="display:inline-block;width:64px;height:96px;background:#0d1117;border-radius:6px;text-align:center;line-height:96px">🎬</span>' : '<img src="' + e(x.media) + '" loading="lazy" style="width:64px;height:96px;object-fit:cover;border-radius:6px">') + "</a>" : "";
          }).join("") + "</div>");
          h.push('<textarea id="sp-text-' + c + '" readonly style="width:100%;height:110px;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;font:12px monospace">' + e(p.text) + "</textarea>");
          h.push('<button type="button" data-bundle="' + c + '" style="' + BTN + ';background:#1f6feb">📤 Resimler + metin birlikte paylaş</button>'); // 2026-11-23 evening (owner "UYGULA 8")
          h.push('<button type="button" data-copy="' + c + '" style="' + BTN2 + '">📋 Text kopieren</button><button type="button" data-done="' + c + '" style="' + BTN + '">✓ Auf ' + NAMES[c] + " geteilt · paylaştım</button>");
          h.push('<br><small style="color:#8b949e">Bilder antippen = herunterladen. Erst teilen, dann „geteilt“ drücken – dann kommen diese Stories nie wieder ins Paket.</small>');
        }
        h.push("</div>");
      });
      // 2026-11-22 (owner): one WhatsApp package per Kiez group – copy, open the group, send, tap "paylaştım"
      if (j.kiez && j.kiez.length) {
        var waitN = j.kiez.filter(function (g) { return g.stories.length; }).length;
        h.push('<div style="border-top:1px solid #30363d;margin-top:10px;padding-top:8px"><b>💬 WhatsApp Kiez-Gruppen · Mahalle grupları</b> – ' + (waitN ? waitN + " grup için yeni paket" : "hepsi güncel ✓") + "</div>");
        j.kiez.forEach(function (g) {
          var c = g.channel;
          h.push('<details style="margin:4px 0;background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:6px 8px"><summary style="cursor:pointer"><b>📍 ' + e(g.name) + "</b> · " + (g.stories.length ? g.stories.length + " yeni" : '<span style="color:#8b949e">yeni yok ✓</span>') + "</summary>");
          if (g.stories.length) {
            h.push('<div style="display:flex;gap:6px;overflow-x:auto;margin:6px 0">' + g.stories.map(function (x) {
              return x.media ? '<a href="' + e(x.media) + '" download target="_blank" title="' + e(x.headline) + '">' + (x.video ? '<span style="display:inline-block;width:48px;height:72px;background:#161b22;border-radius:6px;text-align:center;line-height:72px">🎬</span>' : '<img src="' + e(x.media) + '" loading="lazy" style="width:48px;height:72px;object-fit:cover;border-radius:6px">') + "</a>" : "";
            }).join("") + "</div>");
            h.push('<textarea id="sp-text-' + c + '" readonly style="width:100%;height:120px;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;font:12px monospace">' + e(g.text) + "</textarea>");
            h.push('<button type="button" data-bundle="' + c + '" style="' + BTN + ';background:#1f6feb">📤 Resimler + metin birlikte</button>'); // 2026-11-23 evening (owner "UYGULA 8")
            h.push('<button type="button" data-copy="' + c + '" style="' + BTN2 + '">📋 Kopyala</button>' +
              '<a href="' + e(g.url) + '" target="_blank" rel="noopener" style="' + BTN2 + ';text-decoration:none;display:inline-block">💬 Gruba git</a>' +
              '<button type="button" data-kdone="' + c + '" style="' + BTN + '">✓ Paylaştım · geteilt</button>');
          }
          h.push("</details>");
        });
        h.push('<small style="color:#8b949e">Sıra: 📋 Kopyala → 💬 Gruba git → yapıştır + gönder → ✓ Paylaştım. Paylaşılan story o gruba bir daha gelmez. Mahalle grubuna: kendi mahallesi + en yeni 3 Berlin haberi.</small>');
      }
      b.innerHTML = h.join("");
      wire(b);
    });
  }
  // 2026-11-23 (owner "UYGULA 3"): share report with "Sıraya al" and "author = sponsor / trusted / no"
  function loadReport() {
    var box = document.getElementById("sp-report-body");
    if (!box) return;
    box.textContent = "⏳ yükleniyor…";
    fetch("/api/social-planer?report=1", { headers: { "x-admin-token": token() }, cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.stories) { box.textContent = "Yüklenemedi."; return; }
        var adOpts = (j.ads || []).map(function (a) { return '<option value="ad:' + e(a.id) + '">' + e(a.name) + "</option>"; }).join("");
        var cnt = { all: j.stories.length, meta: 0, rule: 0, wait: 0 };
        j.stories.forEach(function (s) { if (/✓/.test(s.meta)) cnt.meta++; else if (/kural/.test(s.meta)) cnt.rule++; else cnt.wait++; });
        var rows = j.stories.map(function (s) {
          var col = /✓/.test(s.meta) ? "#3fb950" : /kural/.test(s.meta) ? "#8b949e" : /✕/.test(s.meta) ? "#f85149" : "#d29922";
          var t = new Date(s.approved_at).toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
          var sel = !s.news && !(s.who === "own") ? '<select data-amap="' + e(s.author) + '" style="background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;font-size:11px;max-width:150px"><option value="">' + (s.who ? "otomatik: " + e(s.who) : "– kim? –") + '</option><option value="trusted">güvenilir</option><option value="no">paylaşma</option>' + adOpts + "</select>" : "";
          return '<tr style="border-top:1px solid #30363d"><td style="padding:3px 4px;color:#8b949e;white-space:nowrap">' + t + '</td><td style="padding:3px 4px">' + (s.video ? "🎬 " : "") + (s.news ? "📰 " : "") + e(s.headline) + '<br><small style="color:#8b949e">' + e(s.author) + "</small> " + sel + "</td>" +
            '<td style="padding:3px 4px;text-align:center">✓</td><td style="padding:3px 4px;text-align:center">' + e(s.telegram) + '</td><td style="padding:3px 4px;color:' + col + '">' + e(s.meta) +
            (/kural/.test(s.meta) ? "" : ' <button type="button" data-rq="' + e(s.id) + '" title="Facebook/Instagram\'a tekrar sıraya al (kopya olabilir)" style="background:#21262d;border:1px solid #30363d;color:#c9d1d9;border-radius:6px;font-size:11px;cursor:pointer">↻</button>') + "</td>" +
            '<td style="padding:3px 4px;text-align:center">' + s.tiktok + '</td><td style="padding:3px 4px;text-align:center">' + (s.wastatus || "-") + '</td><td style="padding:3px 4px;text-align:center">' + s.whatsapp + (s.waKiez.length ? '<br><small style="color:#8b949e">' + e(s.waKiez.join(", ")) + "</small>" : "") + "</td></tr>";
        }).join("");
        box.innerHTML = '<div style="margin-bottom:6px">Canlı: <b>' + cnt.all + "</b> · FB/IG ✓ <b>" + cnt.meta + "</b> · bekliyor/eksik <b>" + cnt.wait + "</b> · kural gereği paylaşılmaz <b>" + cnt.rule + '</b> <button type="button" id="sp-report-reload" style="' + BTN2 + '">↻ Yenile</button></div>' +
          '<div style="overflow-x:auto"><table style="border-collapse:collapse;font-size:12px;width:100%"><tr style="color:#8b949e;text-align:left"><th>Zaman</th><th>Story · yazar</th><th>Site</th><th>Telegram</th><th>Facebook/Instagram</th><th>TikTok</th><th>Status</th><th>WhatsApp</th></tr>' + rows + "</table></div>" +
          '<small style="color:#8b949e">"kural: paylaşılmaz" = normal kullanıcı (sadece güvenilirler gider). Yazarın yanındaki seçimle "bu yazar = sponsor / güvenilir / paylaşma" diyebilirsin. ↻ = tekrar sıraya al (zaten paylaşıldıysa kopya olur). TikTok/WhatsApp elle paylaşılır (paket + "paylaştım").</small>';
        box.querySelector("#sp-report-reload").onclick = loadReport;
        box.querySelectorAll("[data-rq]").forEach(function (btn) {
          btn.onclick = function () {
            if (!confirm("Bu story Facebook/Instagram'a tekrar sıraya alınsın mı? Zaten paylaşıldıysa ikinci kopya olur.")) return;
            btn.disabled = true;
            api({ action: "requeue", id: btn.getAttribute("data-rq"), channel: "meta" }).then(loadReport);
          };
        });
        box.querySelectorAll("[data-amap]").forEach(function (s) {
          s.onchange = function () { s.disabled = true; api({ action: "authorMap", author: s.getAttribute("data-amap"), target: s.value }).then(loadReport); };
        });
      })
      .catch(function () { box.textContent = "Ağ hatası."; });
  }
  function wire(b) {
    var rep = b.querySelector("#sp-report");
    if (rep) rep.addEventListener("toggle", function () { if (rep.open) loadReport(); });
    var out = b.querySelector("#sp-out");
    b.querySelector("#sp-save").onclick = function () {
      api({ action: "settings", times: b.querySelector("#sp-times").value.split(/[,; ]+/), telegram: b.querySelector("#sp-tg").checked, meta: b.querySelector("#sp-meta").checked, pack: b.querySelector("#sp-pack").checked })
        .then(function (r) { out.textContent = r.ok ? " ✓ gespeichert: " + r.settings.times.join(", ") : " Fehler"; setTimeout(render, 1200); });
    };
    b.querySelector("#sp-run").onclick = function () {
      this.disabled = true; out.textContent = " läuft …";
      api({ action: "run" }).then(function (r) {
        var x = r.result || {};
        out.textContent = r.ok ? " ✓ Telegram: " + (x.telegram || "-") + " · FB/IG: " + (x.meta || "-") : " Fehler";
        setTimeout(render, 2500);
      }).catch(function () { out.textContent = " Netzwerkfehler"; });
    };
    Array.prototype.forEach.call(b.querySelectorAll("[data-copy]"), function (btn) {
      btn.onclick = function () {
        var t = b.querySelector("#sp-text-" + btn.getAttribute("data-copy"));
        t.select();
        (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(function () { btn.textContent = "✓ kopiert"; }, function () { try { document.execCommand("copy"); btn.textContent = "✓ kopiert"; } catch (err) {} });
      };
    });
    Array.prototype.forEach.call(b.querySelectorAll("[data-done]"), function (btn) {
      btn.onclick = function () {
        var c = btn.getAttribute("data-done");
        var ids = (data.pack[c].stories || []).map(function (x) { return x.id; });
        btn.disabled = true;
        api({ action: "mark", channel: c, ids: ids }).then(function (r) { btn.textContent = r.ok ? "✓ " + r.marked + " markiert" : "Fehler"; setTimeout(render, 1200); });
      };
    });
  }
  // 2026-11-22: "Paylaştım" for one Kiez group
  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest("[data-kdone]") : null;
    if (!btn) return;
    var c = btn.getAttribute("data-kdone");
    var g = ((data && data.kiez) || []).filter(function (x) { return x.channel === c; })[0];
    if (!g) return;
    btn.disabled = true;
    api({ action: "mark", channel: c, ids: g.stories.map(function (x) { return x.id; }) }).then(function (r) { btn.textContent = r.ok ? "✓ " + r.marked + " işaretlendi" : "Hata"; setTimeout(render, 1200); });
  });
  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () { var r = base.apply(this, arguments); setTimeout(render, 0); return r; };
  }
})();

// ---- 2026-11-23 evening (owner "UYGULA 8"): WhatsApp/TikTok package – pictures + text in ONE share (phone share sheet) ----
// First tap loads the pictures (max 10, videos up to 15 MB), the share sheet opens at once if the phone still allows it,
// otherwise the button says "tekrar bas" and the second tap shares the prepared files. Text is always copied too.
(function () {
  "use strict";
  var prepared = {}; // channel -> {key, data}
  function full(u) { return /^https?:/.test(u) ? u : location.origin + (u.charAt(0) === "/" ? "" : "/") + u; }
  function load(url, i) {
    return fetch(full(url)).then(function (r) { return r.ok ? r.blob() : null; }).then(function (b) {
      if (!b || b.size > 15 * 1024 * 1024) return null;
      var type = b.type || (/\.mp4/i.test(url) ? "video/mp4" : "image/jpeg");
      return new File([b], "MyKiezBerlin_" + (i + 1) + "." + (type.split("/")[1] || "jpg").replace("jpeg", "jpg"), { type: type });
    }).catch(function () { return null; });
  }
  document.addEventListener("click", function (ev) {
    var btn = ev.target && ev.target.closest ? ev.target.closest("[data-bundle]") : null;
    if (!btn) return;
    var c = btn.getAttribute("data-bundle");
    var ta = document.getElementById("sp-text-" + c);
    var text = ta ? ta.value : "";
    var box = btn.parentNode;
    var urls = Array.prototype.map.call(box.querySelectorAll("a[href][download]"), function (a) { return a.getAttribute("href"); }).filter(Boolean).slice(0, 10);
    var key = urls.join("|");
    try { navigator.clipboard && navigator.clipboard.writeText(text); } catch (e) { /* ignore */ }
    var p = prepared[c];
    if (p && p.key === key && navigator.share) {
      prepared[c] = null;
      navigator.share(p.data).then(function () { btn.textContent = "✓ Paylaşım açıldı – sonra „paylaştım“ bas"; }, function () { btn.textContent = "📤 Resimler + metin birlikte paylaş"; });
      return;
    }
    if (!navigator.share || !navigator.canShare) { btn.textContent = "Bu cihazda dosya paylaşımı yok – metin kopyalandı (telefondan dene)"; return; }
    btn.textContent = "⏳ resimler hazırlanıyor…";
    Promise.all(urls.map(load)).then(function (files) {
      files = files.filter(Boolean);
      var data = { text: text };
      if (files.length && navigator.canShare({ files: files })) data.files = files;
      navigator.share(data).then(function () { btn.textContent = "✓ Paylaşım açıldı – sonra „paylaştım“ bas"; }, function (e) {
        if (e && e.name === "NotAllowedError") { prepared[c] = { key: key, data: data }; btn.textContent = "✅ " + (data.files ? data.files.length : 0) + " dosya hazır – bir kez daha bas"; }
        else btn.textContent = "📤 Resimler + metin birlikte paylaş";
      });
    });
  });
})();
