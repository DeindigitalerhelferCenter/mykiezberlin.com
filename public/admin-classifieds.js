/* 2026-11-27 (owner "UYGULA ilan 1"): "📦 Kleinanzeigen · İlanlar" on top of the admin dashboard.
   Waiting ads first (with pictures, text, contact) – ✓ approve / ✕ reject (POST /api/admin type submission).
   Below: online ads (until when) and expired ones of the last 30 days. */
(function () {
  "use strict";
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function day(ts) { return ts ? new Date(ts).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""; }
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:14px;padding:16px;margin-bottom:16px;color:#e6edf3";
  var BTN = "border:1px solid #30363d;border-radius:10px;padding:7px 12px;font-weight:800;font-size:13px;cursor:pointer;color:#fff";

  function section() {
    var view = document.getElementById("admin-main-view");
    if (!view) return null;
    var box = document.getElementById("admin-classifieds");
    if (!box) {
      box = document.createElement("div"); box.id = "admin-classifieds"; box.style.cssText = CARD;
      view.insertBefore(box, view.firstChild);
    }
    return box;
  }
  function item(a, pending) {
    var pics = (a.media || []).filter(function (m) { return m.type !== "video"; }).slice(0, 5).map(function (m) {
      return '<a href="' + e(m.url) + '" target="_blank" rel="noopener"><img src="' + e(m.url) + '" style="width:72px;height:72px;object-fit:cover;border-radius:8px"></a>';
    }).join("");
    var vids = (a.media || []).filter(function (m) { return m.type === "video"; }).length;
    return '<div data-id="' + e(a.id) + '" style="border-top:1px solid #30363d;padding:10px 0;display:flex;gap:10px;flex-wrap:wrap">' +
      '<div style="flex:1;min-width:220px"><b>' + e(a.title) + "</b>" + (a.price ? ' · <span style="color:#3fb950">' + e(a.price) + "</span>" : "") +
      '<div style="font-size:12px;color:#8b949e">' + e(a.category || "") + " · " + e(a.kiezName || "") + " · " + day(a.created_at) + (pending ? "" : " → bis · " + day(a.ends)) +
      (a.ai ? " · KI: " + e(a.ai) : "") + "</div>" +
      '<div style="font-size:13px;margin:4px 0;white-space:pre-wrap">' + e(a.description || "") + "</div>" +
      '<div style="font-size:12.5px;color:#c9d1d9">📞 ' + e(a.contact || "–") + "</div>" +
      '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">' + pics + (vids ? '<span style="font-size:12px">🎬 ' + vids + " Video</span>" : "") + "</div></div>" +
      (pending ? '<div style="display:flex;flex-direction:column;gap:6px"><button data-ok style="' + BTN + ';background:#238636">✓ Freigeben · Onayla</button><button data-no style="' + BTN + ';background:#b62324">✕ Ablehnen · Reddet</button><span class="o" style="font-size:12px"></span></div>' : "") +
      "</div>";
  }
  function load() {
    var box = section();
    if (!box) return;
    fetch("/api/admin-classifieds", { headers: { "x-admin-token": token() } }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || d.error) { box.innerHTML = "<b>📦 Kleinanzeigen · İlanlar</b> – " + e((d && d.error) || "Fehler"); return; }
      var p = d.pending || [], l = d.live || [], x = d.expired || [];
      box.style.borderColor = p.length ? "#d29922" : "#30363d";
      box.innerHTML = '<h3 style="margin:0 0 6px;font-size:16px">📦 Kleinanzeigen · İlanlar ' + (p.length ? '<span style="background:#d29922;color:#000;border-radius:999px;padding:2px 9px;font-size:13px">' + p.length + " warten · bekliyor</span>" : "") + "</h3>" +
        '<p style="margin:0 0 6px;font-size:12.5px;color:#8b949e">Saubere Anzeigen gehen nach der KI-Prüfung sofort online, die anderen warten hier. · Temiz ilanlar yapay zekâ kontrolünden sonra hemen yayına girer, diğerleri burada bekler. 7 Tage gratis.</p>' +
        (p.length ? p.map(function (a) { return item(a, true); }).join("") : '<p style="font-size:13px">✓ Nichts wartet · Bekleyen ilan yok</p>') +
        (l.length ? '<h4 style="margin:12px 0 0;font-size:14px">🟢 Online (' + l.length + ")</h4>" + l.map(function (a) { return item(a, false); }).join("") : "") +
        (x.length ? '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px">⏱ Abgelaufen · Süresi dolan (' + x.length + ")</summary>" + x.map(function (a) { return item(a, false); }).join("") + "</details>" : "");
      box.querySelectorAll("[data-id]").forEach(function (row) {
        var id = row.getAttribute("data-id"), out = row.querySelector(".o");
        function act(action) {
          if (out) out.textContent = "…";
          fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify({ type: "submission", id: id, action: action }) })
            .then(function (r) { if (!r.ok) throw new Error(r.status); load(); }).catch(function (er) { if (out) out.textContent = "Fehler " + er.message; });
        }
        var ok = row.querySelector("[data-ok]"), no = row.querySelector("[data-no]");
        if (ok) ok.onclick = function () { act("approve"); };
        if (no) no.onclick = function () { if (window.confirm("Ablehnen? · Reddedilsin mi?")) act("reject"); };
      });
    }).catch(function () {});
  }
  window.mkAdminClassifieds = load;
  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () {
      try { return base.apply(this, arguments); } finally { try { load(); } catch (x) {} }
    };
  }
})();
