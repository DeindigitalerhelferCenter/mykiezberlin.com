/* My Kiez Berlin – admin: statistics + sponsor panel (2026-11-13).
   1. 📊 Statistik: visitors and views (web / app), how often each sponsor was shown and clicked (30 days)
   2. 🤝 Sponsor-Panel: create a login link for a sponsor (copy / WhatsApp / e-mail),
      emergency edit of texts, address and links
   3. 📸 Sponsor-Medien: every picture/video sponsors uploaded – hide, show again or delete */
(function () {
  "use strict";
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function panel(action, data) {
    return fetch("/api/sponsor-panel", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify(Object.assign({ action: action }, data || {})) })
      .then(function (r) { return r.json().catch(function () { return {}; }); }).catch(function () { return { error: "offline" }; });
  }
  var PLAN = { s: "Basic", m: "Plus", l: "Premium", gp: "Gründungspartner", banner: "Banner" };
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:14px;padding:16px;margin-bottom:16px;color:#e6edf3";
  var BTN = "background:#21262d;border:1px solid #30363d;color:#e6edf3;border-radius:10px;padding:7px 12px;font-weight:700;font-size:12.5px;cursor:pointer";
  var INPUT = "width:100%;background:#0d1117;border:1px solid #30363d;color:#fff;border-radius:8px;padding:8px 10px;margin:4px 0 8px;font:inherit";

  function section(id, title) {
    var view = document.getElementById("admin-main-view");
    if (!view) return null;
    var box = document.getElementById(id);
    if (!box) { box = document.createElement("div"); box.id = id; box.style.cssText = CARD; view.appendChild(box); }
    box.innerHTML = '<h3 style="margin:0 0 10px;font-size:16px;font-weight:800">' + title + '</h3><div class="body" style="font-size:13px;color:#8b949e">…</div>';
    return box.querySelector(".body");
  }

  // ---------- 1. statistics ----------
  function stats() {
    var body = section("admin-stats", "📊 Statistik · İstatistik (30 Tage · gün)");
    if (!body) return;
    fetch("/api/visit", { headers: { "x-admin-token": token() } }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d.days) { body.textContent = "Keine Daten · Veri yok (" + e(d.error || "") + ")"; return; }
      var sum = function (filter, key) { return d.days.filter(filter).reduce(function (n, x) { return n + (x[key] || 0); }, 0); };
      var today = function (x) { return x.day === d.today; };
      var week = function (x) { return x.day >= new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10); };
      var all = function () { return true; };
      var src = function (s, f) { return function (x) { return x.src === s && f(x); }; };
      var tile = function (label, f) {
        return '<div style="flex:1;min-width:150px;background:#0d1117;border-radius:12px;padding:12px"><div style="color:#8b949e;font-size:12px">' + label + '</div>' +
          '<div style="font-size:24px;font-weight:800;color:#fff">' + sum(f, "visitors") + ' <small style="font-size:12px;color:#8b949e">Besucher · ziyaretçi</small></div>' +
          '<div style="font-size:12px">' + sum(f, "views") + " Aufrufe · görüntüleme</div>" +
          '<div style="font-size:11.5px;margin-top:4px">🌐 Web ' + sum(src("web", f), "visitors") + " · 📱 App " + sum(src("app", f), "visitors") + " · App-Web " + sum(src("app-web", f), "visitors") + "</div></div>";
      };
      var rows = (d.sponsors || []).map(function (s) {
        var ctr = s.views ? ((s.clicks || 0) / s.views * 100).toFixed(1) + " %" : "–";
        return "<tr><td style=\"text-align:left\">" + e(s.name || s.ad_id) + "</td><td>" + e(PLAN[s.plan] || s.plan || "") + "</td><td>" + (s.views || 0) + "</td><td>" + (s.clicks || 0) + "</td><td>" + ctr + "</td></tr>";
      }).join("");
      body.style.color = "#e6edf3";
      body.innerHTML = '<div style="display:flex;gap:10px;flex-wrap:wrap">' + tile("Heute · Bugün", today) + tile("7 Tage · gün", week) + tile("30 Tage · gün", all) + "</div>" +
        '<p style="font-size:11.5px;color:#8b949e;margin:8px 0 14px">Besucher = Geräte pro Tag (anonym, ohne Cookies) · Ziyaretçi = günlük cihaz sayısı (anonim, çerezsiz). Zählung ab 13.11.2026.</p>' +
        '<b>Sponsoren · Sponsorlar</b><table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-top:6px"><thead><tr style="color:#8b949e"><th style="text-align:left">Name</th><th>Paket</th><th>Gesehen · görüldü</th><th>Klicks · tık</th><th>Rate</th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="5">–</td></tr>') + "</tbody></table>";
      body.querySelectorAll("td,th").forEach(function (c) { c.style.padding = "6px 4px"; c.style.borderBottom = "1px solid #30363d"; if (!c.style.textAlign) c.style.textAlign = "right"; });
    }).catch(function () { body.textContent = "Keine Verbindung · Bağlantı yok"; });
  }

  // ---------- 2. sponsor panel links + emergency edit ----------
  function sponsors() {
    var body = section("admin-sponsor-panel", "🤝 Sponsor-Panel · Sponsor paneli");
    if (!body) return;
    // 2026-11-13: all sponsors incl. paused ones (admin API), public list only as fallback
    panel("adminAds").then(function (j) { return j && j.ads ? j : fetch("/api/ads?place=page").then(function (r) { return r.json(); }); }).then(function (d) {
      var ads = d.ads || [];
      body.style.color = "#e6edf3";
      body.innerHTML = '<p style="color:#8b949e;margin:0 0 10px">Link erstellen → per WhatsApp/E-Mail an den Sponsor schicken (30 Tage gültig). Sponsor ändert Texte, Adresse, Bilder & Videos selbst. · Link oluştur → sponsora WhatsApp/e-posta ile gönder (30 gün geçerli).</p>' +
        ads.map(function (a) {
          return '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #30363d" data-id="' + e(a.id) + '">' +
            '<b style="flex:1;min-width:160px">' + e(a.name) + (a.active === 0 ? ' <small style="background:#6e7681;color:#fff;border-radius:6px;padding:1px 6px">pasif · pausiert</small>' : "") + "</b>" +
            '<select data-plan style="' + BTN + '">' + ["s", "m", "l"].map(function (p) { return '<option value="' + p + '"' + (a.plan === p ? " selected" : "") + ">" + { s: "🔵 Basic", m: "🟢 Plus", l: "🔴 Premium" }[p] + "</option>"; }).join("") +
            (["s", "m", "l"].indexOf(a.plan) < 0 ? '<option value="" selected>' + e(PLAN[a.plan] || a.plan || "–") + "</option>" : "") + "</select>" +
            '<button type="button" data-act="link" style="' + BTN + '">🔗 Panel-Link</button>' +
            '<button type="button" data-act="edit" style="' + BTN + '">✏️ Bearbeiten · Düzenle</button>' +
            '<div class="out" style="flex-basis:100%"></div></div>';
        }).join("");
      body.querySelectorAll("select[data-plan]").forEach(function (s) {
        s.onchange = function () {
          var row = s.closest("[data-id]");
          if (!s.value) return;
          panel("adminPlan", { adId: row.getAttribute("data-id"), plan: s.value }).then(function (j) {
            row.querySelector(".out").innerHTML = j.ok ? '<span style="color:#3fb950">✓ Paket gespeichert · paket kaydedildi</span>' : "Fehler · Hata: " + e(j.error || "?");
          });
        };
      });
      body.querySelectorAll("button[data-act]").forEach(function (b) {
        var row = b.closest("[data-id]"), id = row.getAttribute("data-id"), out = row.querySelector(".out");
        var ad = ads.find(function (x) { return x.id === id; });
        b.onclick = function () {
          if (b.dataset.act === "link") {
            out.innerHTML = '<input type="email" placeholder="E-Mail (optional – dann wird der Link gemailt · e-posta yazılırsa link gönderilir)" style="' + INPUT + '" value="' + e(ad.email || "") + '"><button type="button" style="' + BTN + '">Erstellen · Oluştur</button>';
            out.querySelector("button").onclick = function () {
              panel("adminLink", { adId: id, email: out.querySelector("input").value }).then(function (j) {
                if (!j.link) { out.textContent = "Fehler · Hata: " + (j.error || "?"); return; }
                var wa = "https://wa.me/" + String(ad.link_wa || "").replace(/[^\d]/g, "") + "?text=" + encodeURIComponent("Hallo! Dein Sponsor-Panel von My Kiez Berlin / Sponsor panelin: " + j.link);
                out.innerHTML = '<input readonly style="' + INPUT + '" value="' + e(j.link) + '">' +
                  '<button type="button" data-c style="' + BTN + '">📋 Kopieren</button> ' +
                  (ad.link_wa ? '<a href="' + e(wa) + '" target="_blank" rel="noopener" style="' + BTN + ';text-decoration:none;display:inline-block">💬 WhatsApp</a> ' : "") +
                  '<span style="color:#3fb950">' + (j.mailed ? "✓ E-Mail gesendet" : "") + "</span>";
                out.querySelector("[data-c]").onclick = function () { var i = out.querySelector("input"); i.select(); try { navigator.clipboard.writeText(i.value); } catch (x) { document.execCommand("copy"); } };
              });
            };
          } else {
            var f = [["headline_de", "Kurztext DE"], ["headline_tr", "Kurztext TR"], ["headline_en", "Kurztext EN"], ["description", "Beschreibung · Açıklama"], ["address", "Adresse · Adres"], ["hours", "Öffnungszeiten · Saatler"], ["link_tel", "Telefon"], ["link_wa", "WhatsApp"], ["link_web", "Webseite"], ["link_ig", "Instagram"]];
            out.innerHTML = f.map(function (x) {
              var v = ad[x[0]] || "";
              return '<label style="font-size:12px;color:#8b949e">' + x[1] + "</label>" + (x[0] === "description" ? '<textarea data-k="' + x[0] + '" rows="4" style="' + INPUT + '">' + e(v) + "</textarea>" : '<input data-k="' + x[0] + '" style="' + INPUT + '" value="' + e(v) + '">');
            }).join("") + '<button type="button" style="' + BTN + ';background:#E30613;border-color:#E30613">Speichern · Kaydet</button> <span class="r"></span>';
            out.querySelector("button").onclick = function () {
              var fields = {}; out.querySelectorAll("[data-k]").forEach(function (i) { fields[i.dataset.k] = i.value; });
              panel("adminUpdate", { adId: id, fields: fields }).then(function (j) { out.querySelector(".r").textContent = j.ok ? "✓ gespeichert · kaydedildi" : "Fehler · Hata: " + (j.error || "?"); });
            };
          }
        };
      });
    });
  }

  // ---------- 3. sponsor media ----------
  function media() {
    var body = section("admin-sponsor-media", "📸 Sponsor-Medien · Sponsor medyası");
    if (!body) return;
    panel("adminList").then(function (j) {
      body.style.color = "#e6edf3";
      if (!j.media) { body.textContent = "Fehler · Hata: " + (j.error || "?"); return; }
      if (!j.media.length) { body.innerHTML = '<span style="color:#8b949e">Noch nichts hochgeladen · Henüz yükleme yok</span>'; return; }
      body.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px">' + j.media.map(function (m) {
        var src = "/media/" + m.media_key;
        return '<figure data-id="' + e(m.id) + '" style="margin:0;background:#0d1117;border-radius:12px;overflow:hidden;' + (m.status === "hidden" ? "opacity:.45" : "") + '">' +
          (m.media_type === "video" ? '<video src="' + e(src) + '" controls preload="metadata" style="width:100%;aspect-ratio:1;object-fit:cover;background:#000"></video>' : '<img src="' + e(src) + '" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover">') +
          '<figcaption style="padding:6px 8px;font-size:11.5px"><b>' + e(m.name || m.ad_id) + "</b><br>" + e(m.caption || "") + '<br><span style="color:#8b949e">' + new Date(m.created_at).toLocaleString("de-DE") + (m.status === "hidden" ? " · ausgeblendet" : "") + "</span>" +
          '<div style="display:flex;gap:4px;margin-top:6px"><button type="button" data-s="' + (m.status === "hidden" ? "live" : "hidden") + '" style="' + BTN + ';flex:1;padding:5px">' + (m.status === "hidden" ? "👁 Zeigen" : "🙈 Ausblenden") + '</button><button type="button" data-s="delete" style="' + BTN + ';color:#f85149;padding:5px">🗑</button></div></figcaption></figure>';
      }).join("") + "</div>";
      body.querySelectorAll("button[data-s]").forEach(function (b) {
        b.onclick = function () {
          if (b.dataset.s === "delete" && !confirm("Endgültig löschen? · Kalıcı olarak silinsin mi?")) return;
          panel("adminMedia", { id: b.closest("figure").dataset.id, status: b.dataset.s }).then(media);
        };
      });
    });
  }

  function quicknav() {
    var nav = document.querySelector("#admin-main-view .mk-admin-quicknav");
    if (!nav || nav.querySelector("[href='#admin-stats']")) return;
    nav.insertAdjacentHTML("beforeend",
      '<a href="#admin-werbung" class="chip-btn" style="text-decoration:none">📢 Sponsor-Anzeigen</a>' +
      '<button type="button" class="chip-btn active" onclick="window.openAdForm&&openAdForm()">➕ Neue Anzeige · Yeni sponsor</button>' +
      '<a href="#admin-stats" class="chip-btn" style="text-decoration:none">📊 Statistik</a>' +
      '<a href="#admin-sponsor-panel" class="chip-btn" style="text-decoration:none">🤝 Sponsoren</a>' +
      '<a href="#admin-sponsor-media" class="chip-btn" style="text-decoration:none">📸 Sponsor-Medien</a>');
  }

  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () {
      var r = base.apply(this, arguments);
      try { quicknav(); stats(); sponsors(); media(); } catch (x) {}
      return r;
    };
  }
})();
