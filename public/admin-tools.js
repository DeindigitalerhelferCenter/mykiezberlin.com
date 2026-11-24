/* Admin (2026-11-22, owner):
   1. Switch "Neue Ansicht für alle" (/api/flags ui2): Startseite in the bottom bar, no Live-Ticker button in the
      header, no clock/weather under the stories. The admin already sees it; the switch opens it for everybody.
   2. Black Friday: places taken / left.
   3. Weekly sponsor reminder (Instagram share / QR poster): list + text, sent only after the admin presses "Senden". */
(function () {
  "use strict";
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:12px;padding:14px;margin-bottom:16px;color:#c9d1d9;font-size:13px";
  var BTN = "background:#21262d;border:1px solid #30363d;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit;font-size:12.5px";
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function api(path, method, body) {
    return fetch(path, { method: method || "GET", headers: { "content-type": "application/json", "x-admin-token": token() }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" })
      .then(function (r) { return r.json().catch(function () { return {}; }); });
  }
  function card(id) {
    var view = document.getElementById("admin-main-view");
    if (!view) return null;
    var b = document.getElementById(id);
    if (!b) { b = document.createElement("div"); b.id = id; b.style.cssText = CARD; view.insertBefore(b, view.firstChild); }
    return b;
  }

  function flags() {
    var b = card("admin-flags");
    if (!b) return;
    api("/api/flags").then(function (f) {
      b.innerHTML = '<b style="font-size:15px;color:#fff">🚀 Yeni görünüm · Neue Ansicht</b>' +
        '<p style="color:#8b949e;margin:4px 0 8px">Alt menüde "Ana sayfa", üstte Live-Ticker butonu yok, story altında saat/hava yok. Sen zaten görüyorsun; açınca herkes görür (web + uygulama).</p>' +
        '<label style="display:flex;gap:8px;align-items:center;font-weight:700"><input type="checkbox" id="flag-ui2"' + (f.ui2 ? " checked" : "") + "> Herkese aç · Für alle</label>";
      document.getElementById("flag-ui2").onchange = function () { api("/api/flags", "POST", { name: "ui2", on: this.checked }); };
    });
  }

  function blackFriday() {
    var b = card("admin-bf");
    if (!b) return;
    fetch("/api/blackfriday", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (s) {
      b.innerHTML = '<b style="font-size:15px;color:#FFC107">🖤 Black Friday</b> ' + (s.active ? "aktif" : "bitti") +
        ' · <b>' + s.taken + "/" + s.total + "</b> dolu (sitedeki tüm aktif sponsorlar + açık BF başvuruları), <b>" + s.left + "</b> boş · bitiş " + new Date(s.end).toLocaleString("de-DE") +
        '<div style="color:#8b949e;margin-top:4px">Başvurular "Werbeanfragen" listesinde [BLACK FRIDAY] ile başlar.</div>';
    });
  }

  function reminders() {
    var b = card("admin-remind");
    if (!b) return;
    b.innerHTML = '<b style="font-size:15px;color:#fff">📣 Haftalık sponsor hatırlatması · Wöchentliche Erinnerung</b><div id="admin-remind-list">…</div>';
    api("/api/sponsor-reminders").then(function (j) {
      var list = document.getElementById("admin-remind-list");
      if (!list) return;
      if (!j || !j.due) { list.textContent = "Liste yüklenemedi."; return; }
      var rows = j.due.map(function (a) {
        return '<label style="display:flex;gap:8px;align-items:center;padding:4px 0"><input type="checkbox" data-rid="' + e(a.id) + '" checked> ' + e(a.name) + ' <small style="color:#8b949e">' + e(a.email) + (a.last ? " · son: " + new Date(a.last).toLocaleDateString("de-DE") : " · hiç gönderilmedi") + "</small></label>";
      }).join("");
      list.innerHTML = '<p style="color:#8b949e;margin:4px 0">Bu hafta hatırlatılacak: <b>' + j.due.length + "</b> · bu hafta gönderildi: " + (j.done || []).length + (j.mail ? "" : ' · <b style="color:#ff7b72">Mail sağlayıcı yok – gönderilemez</b>') + "</p>" +
        (rows || '<p style="color:#3fb950">Bu hafta herkese gönderildi ✓</p>') +
        '<details style="margin:8px 0"><summary style="cursor:pointer">Metni göster · Text ansehen</summary><pre style="white-space:pre-wrap;font-size:12px;color:#c9d1d9">' + e(j.text.subject + "\n\n" + j.text.body) + "</pre></details>" +
        (j.due.length ? '<button type="button" id="admin-remind-send" style="' + BTN + ';background:#2ea043">Seçilenlere gönder · Senden</button> <span id="admin-remind-out"></span>' : "");
      var btn = document.getElementById("admin-remind-send");
      if (btn) btn.onclick = function () {
        var ids = Array.prototype.map.call(list.querySelectorAll("[data-rid]:checked"), function (x) { return x.getAttribute("data-rid"); });
        if (!ids.length || !confirm(ids.length + " sponsora mail gönderilsin mi?")) return;
        btn.disabled = true;
        api("/api/sponsor-reminders", "POST", { ids: ids }).then(function (r) { document.getElementById("admin-remind-out").textContent = "Gönderildi: " + (r.sent || 0) + (r.failed ? " · hata: " + r.failed : ""); setTimeout(reminders, 1500); });
      };
    });
  }

  // 4. classifieds waiting for a manual extension (no card payment set up yet)
  function classifiedRequests() {
    api("/api/classified-extend?admin=1").then(function (j) {
      var old = document.getElementById("admin-clreq");
      if (!j || !j.requests || !j.requests.length) { if (old) old.remove(); return; }
      var b = card("admin-clreq");
      b.innerHTML = '<b style="font-size:15px;color:#fff">📢 İlan uzatma talepleri · Kleinanzeigen verlängern</b><p style="color:#8b949e;margin:4px 0">Ödeme alındıktan sonra uzat.</p>' +
        j.requests.map(function (r) {
          return '<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid #30363d"><span style="flex:1">' + e(r.title) + ' <small style="color:#8b949e">(' + (r.plan === "month" ? "1 ay 10 €" : "1 hafta 5 €") + ", " + new Date(r.created_at).toLocaleString("de-DE") + ')</small></span>' +
            '<button type="button" data-cl="' + e(r.classified_id) + '" data-plan="' + e(r.plan) + '" style="' + BTN + ';background:#2ea043">Uzat ✓</button></div>';
        }).join("");
      b.querySelectorAll("[data-cl]").forEach(function (btn) {
        btn.onclick = function () { api("/api/classified-extend", "POST", { id: btn.getAttribute("data-cl"), plan: btn.getAttribute("data-plan"), admin: true }).then(function () { classifiedRequests(); }); };
      });
    });
  }

  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () {
      var r = base.apply(this, arguments);
      setTimeout(function () { if (!token()) return; reminders(); blackFriday(); flags(); classifiedRequests(); }, 0);
      return r;
    };
  }
})();
