/* Admin: trusted accounts ("Güvenilir hesaplar", 2026-11-21, owner) – see functions/_lib/story-vip.js.
   - Person (e.g. "Kiez26"): gets a personal story key. Web: send the link once. App: type the key into the story
     form (🔑). Stories: no daily limit, up to 10 pictures/videos, online at once, the AI check stays.
   - Sponsor (Terra Verde TEK, The Visit, Berlin Handel are in the list from the start): sponsor panel without limit. */
(function () {
  "use strict";
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:12px;padding:14px;margin-bottom:16px;color:#c9d1d9";
  var BTN = "background:#21262d;border:1px solid #30363d;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit;font-size:12.5px";
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function api(method, body) {
    return fetch("/api/admin-vip", { method: method, headers: { "content-type": "application/json", "x-admin-token": token() }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" })
      .then(function (r) { return r.json().catch(function () { return {}; }); });
  }

  function render() {
    var view = document.getElementById("admin-main-view");
    if (!view || !token()) return;
    var b = document.getElementById("admin-vip");
    if (!b) {
      b = document.createElement("div");
      b.id = "admin-vip";
      b.style.cssText = CARD;
      view.appendChild(b);
    }
    b.innerHTML = "<b style=\"font-size:15px;color:#fff\">🔑 Güvenilir hesaplar · Vertrauens-Konten</b><p style=\"font-size:12px;color:#8b949e;margin:4px 0 10px\">Kişi: sınırsız story, bir story'de 10 resim/video, onaysız hemen yayın (yapay zekâ kontrolü kalır). Sponsor: sponsor panelinde paket sınırı yok.</p><div id=\"admin-vip-list\" style=\"font-size:13px\">…</div>";
    api("GET").then(function (j) {
      var list = document.getElementById("admin-vip-list");
      if (!list) return;
      if (!j || !j.vip) { list.textContent = "Liste yüklenemedi."; return; }
      var rows = j.vip.map(function (v) {
        return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #30363d"><span style="flex:1">' + (v.kind === "ad" ? "🤝 " + e(v.ad_name || v.name) + " <small style=\"color:#8b949e\">(Sponsor)</small>" : "👤 " + e(v.name) + " <small style=\"color:#8b949e\">(Story-Schlüssel)</small>") +
          '</span><button type="button" data-vip-rm="' + e(v.id) + '" style="' + BTN + ';color:#f85149">Kaldır</button></div>';
      }).join("") || '<p style="color:#8b949e">Henüz kimse yok.</p>';
      var opts = (j.ads || []).map(function (a) { return '<option value="' + e(a.id) + '">' + e(a.name) + "</option>"; }).join("");
      list.innerHTML = rows +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px"><input id="admin-vip-name" maxlength="40" placeholder="İsim, örn. Kiez26" style="flex:1 1 160px;padding:7px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#fff"><button type="button" id="admin-vip-addkey" style="' + BTN + '">+ Kişi (anahtar oluştur)</button></div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"><select id="admin-vip-ad" style="flex:1 1 160px;padding:7px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#fff">' + opts + '</select><button type="button" id="admin-vip-addad" style="' + BTN + '">+ Sponsor</button></div>' +
        '<div id="admin-vip-out" style="margin-top:10px"></div>';
      list.querySelectorAll("[data-vip-rm]").forEach(function (btn) {
        btn.onclick = function () { if (confirm("Listeden kaldırılsın mı?")) api("POST", { action: "remove", id: btn.getAttribute("data-vip-rm") }).then(render); };
      });
      document.getElementById("admin-vip-addad").onclick = function () { api("POST", { action: "ad", adId: document.getElementById("admin-vip-ad").value }).then(render); };
      document.getElementById("admin-vip-addkey").onclick = function () {
        var name = document.getElementById("admin-vip-name").value.trim();
        if (!name) return;
        api("POST", { action: "key", name: name }).then(function (r) {
          if (!r || !r.key) { document.getElementById("admin-vip-out").textContent = "Hata: " + ((r && r.error) || "?"); return; }
          render();
          setTimeout(function () {
            var out = document.getElementById("admin-vip-out");
            if (!out) return;
            out.innerHTML = '<div style="background:#0d1117;border:1px solid #2ea043;border-radius:10px;padding:10px;font-size:12.5px"><b style="color:#3fb950">✓ ' + e(name) + " için anahtar oluşturuldu – sadece şimdi görünür, kaydet!</b>" +
              '<div style="margin-top:6px">Web linki (bir kez açması yeter):<br><code style="word-break:break-all;color:#fff">' + e(r.link) + "</code></div>" +
              '<div style="margin-top:6px">Uygulama: story formunda 🔑 alanına bu anahtarı yazsın:<br><code style="word-break:break-all;color:#fff">' + e(r.key) + "</code></div>" +
              '<button type="button" id="admin-vip-copy" style="' + BTN + ';margin-top:8px">Linki kopyala</button></div>';
            document.getElementById("admin-vip-copy").onclick = function () { try { navigator.clipboard.writeText(r.link + "\n\nApp-Schlüssel: " + r.key); this.textContent = "Kopyalandı ✓"; } catch (x) {} };
          }, 400);
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
