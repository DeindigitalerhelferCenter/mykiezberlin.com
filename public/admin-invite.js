/* 2026-11-27 (owner "UYGULA grup 5"): admin section "📲 Davet kartları · Einladungskarten"
   - switch: the 5 Kiez WhatsApp groups (Neukölln, Kreuzberg, Wedding, Moabit, Spandau) promoted or not
     (off = only "Ganz Berlin"; old Kiez links lead to Ganz Berlin; the groups themselves stay in WhatsApp)
   - clicks of the last 30 days per card (/davet/<key>) */
(function () {
  "use strict";
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:14px;padding:16px;margin-bottom:16px;color:#e6edf3";
  function section() {
    var view = document.getElementById("admin-main-view");
    if (!view) return null;
    var box = document.getElementById("admin-invite");
    if (!box) {
      box = document.createElement("div"); box.id = "admin-invite"; box.style.cssText = CARD;
      var after = document.getElementById("admin-classifieds");
      if (after && after.nextSibling) view.insertBefore(box, after.nextSibling); else view.appendChild(box);
    }
    return box;
  }
  function load() {
    var box = section();
    if (!box) return;
    fetch("/api/davet?stats=1&all=1", { headers: { "x-admin-token": token() } }).then(function (r) { return r.json(); }).then(function (d) {
      var on = !!d.kiezGroups, clicks = d.clicks || {};
      var rows = (d.all || d.cards || []).map(function (c) {
        var shown = (d.cards || []).some(function (x) { return x.key === c.key; });
        return '<tr><td style="padding:4px 6px">' + e(c.title_de) + '</td><td style="padding:4px 6px;text-align:right">' + (clicks[c.key] || 0) + '</td><td style="padding:4px 6px">' + (shown ? "✓" : '<span style="color:#8b949e">aus · kapalı</span>') + "</td></tr>";
      }).join("");
      box.innerHTML = '<h3 style="margin:0 0 8px;font-size:16px">📲 Davet kartları · Einladungskarten</h3>' +
        '<label style="display:flex;gap:10px;align-items:center;font-weight:800;cursor:pointer"><input type="checkbox" data-kiez ' + (on ? "checked" : "") + ' style="width:22px;height:22px">' +
        "Kiez-Gruppen zeigen · Semt gruplarını göster (Neukölln, Kreuzberg, Wedding, Moabit, Spandau)</label>" +
        '<p style="margin:6px 0 10px;font-size:12.5px;color:#8b949e">Aus = nur „Ganz Berlin“; alte Kiez-Links führen zu Ganz Berlin. Einschalten, wenn Ganz Berlin ca. 100 Mitglieder hat. · Kapalı = sadece „Ganz Berlin“; eski semt linkleri Ganz Berlin’e gider. Ganz Berlin ~100 üyeye ulaşınca aç.</p>' +
        '<table style="font-size:13px;border-collapse:collapse"><tr><th style="text-align:left;padding:4px 6px">Karte · Kart</th><th style="padding:4px 6px">Klicks 30 T.</th><th style="padding:4px 6px">Gezeigt</th></tr>' + rows + "</table>";
      box.querySelector("[data-kiez]").onchange = function () {
        var cb = this;
        fetch("/api/davet", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify({ action: "kiezGroups", on: cb.checked }) })
          .then(function () { load(); }).catch(function () { cb.checked = !cb.checked; });
      };
    }).catch(function () {});
  }
  window.mkAdminInvite = load;
  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () {
      try { return base.apply(this, arguments); } finally { try { load(); } catch (x) {} }
    };
  }
})();
