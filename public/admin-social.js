/* 2026-11-22 (owner): web admin card "🗓️ Social-Planer" – times (default 08:00, 16:00, 23:00), what runs by itself
   (Telegram, Facebook/Instagram collection post), last runs, and the TikTok / WhatsApp package to share on the phone.
   Every story goes to every channel only once (server list social_items). */
(function () {
  "use strict";
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:12px;padding:14px;margin-bottom:16px;color:#c9d1d9;font-size:13px";
  var BTN = "background:#238636;border:0;color:#fff;border-radius:8px;padding:8px 12px;cursor:pointer;font:inherit;font-size:13px;font-weight:700;margin:4px 4px 0 0";
  var BTN2 = "background:#21262d;border:1px solid #30363d;color:#c9d1d9;border-radius:8px;padding:7px 11px;cursor:pointer;font:inherit;font-size:13px;margin:4px 4px 0 0";
  var NAMES = { tiktok: "🎵 TikTok", whatsapp: "🟢 WhatsApp-Kanal" };
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
          h.push("• " + e(r.slot) + " – Telegram: " + state(r.result.telegram) + " · FB/IG: " + state(r.result.meta) + (p.tiktok != null ? " · Paket TikTok " + p.tiktok + " / WhatsApp " + p.whatsapp : "") + "<br>");
        });
        h.push("</small></details>");
      }
      ["tiktok", "whatsapp"].forEach(function (c) {
        var p = j.pack[c];
        h.push('<div style="border-top:1px solid #30363d;margin-top:10px;padding-top:8px"><b>' + NAMES[c] + "</b> – " + (p.stories.length ? p.stories.length + " neue Story(s) zum Teilen · paylaşılacak" : "nichts neu · yeni yok ✓"));
        if (p.stories.length) {
          h.push('<div style="display:flex;gap:6px;overflow-x:auto;margin:6px 0">' + p.stories.map(function (x) {
            return x.media ? '<a href="' + e(x.media) + '" download target="_blank" title="' + e(x.headline) + '">' + (x.video ? '<span style="display:inline-block;width:64px;height:96px;background:#0d1117;border-radius:6px;text-align:center;line-height:96px">🎬</span>' : '<img src="' + e(x.media) + '" loading="lazy" style="width:64px;height:96px;object-fit:cover;border-radius:6px">') + "</a>" : "";
          }).join("") + "</div>");
          h.push('<textarea id="sp-text-' + c + '" readonly style="width:100%;height:110px;background:#0d1117;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;font:12px monospace">' + e(p.text) + "</textarea>");
          h.push('<button type="button" data-copy="' + c + '" style="' + BTN2 + '">📋 Text kopieren</button><button type="button" data-done="' + c + '" style="' + BTN + '">✓ Auf ' + NAMES[c] + " geteilt · paylaştım</button>");
          h.push('<br><small style="color:#8b949e">Bilder antippen = herunterladen. Erst teilen, dann „geteilt“ drücken – dann kommen diese Stories nie wieder ins Paket.</small>');
        }
        h.push("</div>");
      });
      b.innerHTML = h.join("");
      wire(b);
    });
  }
  function wire(b) {
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
  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () { var r = base.apply(this, arguments); setTimeout(render, 0); return r; };
  }
})();
