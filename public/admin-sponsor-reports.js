/* My Kiez Berlin – admin: monthly sponsor reports (2026-11-25, owner "UYGULA 1-7, seçenek a, takvim ayı").
   One report per sponsor and calendar month (saved for ever on the 1st of the next month).
   Per sponsor: open the report page (PDF), send by WhatsApp (opens wa.me ready-written, then "notiert"),
   send by e-mail (Brevo), and option a: "🎁 +1 Monat gratis" when the monthly goal was not reached.
   The running month shows live numbers only (no link yet). */
(function () {
  "use strict";
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:14px;padding:16px;margin-bottom:16px;color:#e6edf3";
  var BTN = "background:#21262d;border:1px solid #30363d;color:#e6edf3;border-radius:10px;padding:6px 10px;font-weight:700;font-size:12px;cursor:pointer;text-decoration:none;display:inline-block";
  var GREEN = ";background:#238636;border-color:#238636;color:#fff";
  var PLAN = { s: "🔵 Basic", m: "🟢 Plus", l: "🔴 Premium", gp: "🟢 Gründungspartner", banner: "🟢 Banner" };
  var ERR = { already_given: "schon gegeben · zaten verildi", month_not_finished: "Monat läuft noch · ay bitmedi", goal_reached: "Ziel erreicht · hedefe ulaşıldı", paid_started: "bezahlte Monate laufen schon – bitte in der Buchhaltung · ücretli aylar başladı, muhasebeden ekle", email_invalid: "E-Mail fehlt/ungültig · e-posta yok/geçersiz" };
  var month = "";

  function api(method, data) {
    var url = "/api/sponsor-reports" + (method === "GET" && data ? "?month=" + encodeURIComponent(data) : "");
    return fetch(url, method === "GET" ? { headers: { "x-admin-token": token() } } : { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }); }).catch(function () { return { error: "offline" }; });
  }
  function when(ts) { return ts ? new Date(ts).toLocaleDateString("de-DE") : ""; }

  function section() {
    var view = document.getElementById("admin-main-view");
    if (!view) return null;
    var box = document.getElementById("admin-sponsor-reports");
    if (!box) {
      box = document.createElement("div"); box.id = "admin-sponsor-reports"; box.style.cssText = CARD;
      var after = document.getElementById("admin-stats");
      if (after && after.nextSibling) view.insertBefore(box, after.nextSibling); else view.appendChild(box);
    }
    box.innerHTML = '<h3 style="margin:0 0 10px;font-size:16px;font-weight:800">📑 Monatsberichte · Aylık sponsor raporları</h3><div class="body" style="font-size:13px;color:#8b949e">…</div>';
    return box.querySelector(".body");
  }

  function render(body, d) {
    var rows = d.reports || [];
    var live = d.month === d.current;
    var under = rows.filter(function (r) { return (r.pct || 0) < 100; }).length;
    var head = '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">' +
      '<select data-month style="' + BTN + '">' + (d.months || []).map(function (m) { return '<option value="' + e(m) + '"' + (m === d.month ? " selected" : "") + ">" + e(m) + (m === d.current ? " (läuft · devam ediyor)" : "") + "</option>"; }).join("") + "</select>" +
      (!live ? '<button type="button" data-all-mail style="' + BTN + '">✉️ Alle offenen per E-Mail · Hepsini e-postayla</button>' : "") + "</div>" +
      '<p style="margin:0 0 10px;font-size:12px">' + (live
        ? "Dieser Monat läuft noch – Zahlen live. Der fertige Bericht (mit Link/PDF) entsteht automatisch am 1. des nächsten Monats. · Bu ay devam ediyor – sayılar canlı. Linkli/PDF rapor gelecek ayın 1'inde otomatik oluşur."
        : "Gespeichert (ändert sich nie mehr). Ziel nicht erreicht: " + under + " von " + rows.length + " → „🎁 +1 Monat gratis“ (Option a). · Kaydedildi (bir daha değişmez). Hedefe ulaşmayan: " + under + "/" + rows.length + ".") + "</p>";
    var list = rows.map(function (r) {
      var pct = r.pct || 0, color = pct >= 100 ? "#2ea043" : pct >= 70 ? "#d29922" : "#f85149";
      var wa = String(r.wa || "").replace(/[^\d]/g, "");
      var btns = "";
      if (r.token) {
        btns += '<a href="' + e(r.link) + '" target="_blank" rel="noopener" style="' + BTN + '">📄 Bericht · PDF</a>';
        btns += wa ? '<button type="button" data-wa style="' + BTN + (r.sent_wa ? "" : GREEN) + '">📲 WhatsApp' + (r.sent_wa ? " ✓ " + when(r.sent_wa) : "") + "</button>" : '<span style="font-size:11px">kein WA · WA yok</span>';
        btns += '<button type="button" data-mail style="' + BTN + (r.sent_mail ? "" : r.email ? GREEN : "") + '">✉️ E-Mail' + (r.sent_mail ? " ✓ " + when(r.sent_mail) : "") + "</button>";
        if (r.comp) btns += '<span style="font-size:11.5px;color:#d29922">🎁 +1 Monat gegeben · verildi ' + when(r.comp) + "</span>";
        else if (pct < 100) btns += '<button type="button" data-comp style="' + BTN + ';border-color:#d29922;color:#d29922">🎁 +1 Monat gratis</button>';
      }
      return '<div data-token="' + e(r.token || "") + '" style="padding:9px 0;border-bottom:1px solid #30363d">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:baseline"><b style="color:#e6edf3;flex:1;min-width:160px">' + e(r.name) + ' <small style="color:#8b949e">' + (PLAN[r.plan] || e(r.plan)) + "</small></b>" +
        '<span style="color:#e6edf3">' + (r.views || 0) + " / " + (r.goal || 0) + ' <b style="color:' + color + '">' + pct + " %</b></span><span>👆 " + (r.clicks || 0) + "</span></div>" +
        '<div style="background:#30363d;border-radius:6px;height:6px;margin:5px 0"><div style="width:' + Math.min(100, pct) + "%;height:6px;border-radius:6px;background:" + color + '"></div></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' + btns + '<span class="out" style="font-size:11.5px"></span></div></div>';
    }).join("");
    body.innerHTML = head + (list || "<p>Keine Sponsoren in diesem Monat · Bu ay sponsor yok</p>");

    body.querySelector("[data-month]").onchange = function () { month = this.value; load(); };
    body.querySelectorAll("[data-token]").forEach(function (row) {
      var r = rows.filter(function (x) { return x.token && x.token === row.getAttribute("data-token"); })[0];
      if (!r) return;
      var out = row.querySelector(".out");
      var wa = row.querySelector("[data-wa]");
      if (wa) wa.onclick = function () {
        window.open("https://wa.me/" + String(r.wa).replace(/[^\d]/g, "") + "?text=" + encodeURIComponent(r.text || ""), "_blank", "noopener");
        api("POST", { action: "mark", token: r.token, via: "wa" }).then(function (j) { if (j.ok) { r.sent_wa = j.sent_wa; wa.textContent = "📲 WhatsApp ✓ " + when(j.sent_wa); wa.style.background = "#21262d"; } });
      };
      var mail = row.querySelector("[data-mail]");
      if (mail) mail.onclick = function () {
        var to = window.prompt("E-Mail an · E-posta:", r.email || "");
        if (!to) return;
        out.textContent = "…";
        api("POST", { action: "mail", token: r.token, email: to }).then(function (j) {
          out.innerHTML = j.ok ? '<span style="color:#3fb950">✓ gesendet · gönderildi</span>' : '<span style="color:#f85149">' + e(ERR[j.error] || j.error || "Fehler · hata") + "</span>";
          if (j.ok) { r.sent_mail = j.sent_mail; r.email = j.email; mail.textContent = "✉️ E-Mail ✓ " + when(j.sent_mail); mail.style.background = "#21262d"; }
        });
      };
      var comp = row.querySelector("[data-comp]");
      if (comp) comp.onclick = function () {
        if (!window.confirm(r.name + ": +1 Gratis-Monat geben? Die bezahlten Monate verschieben sich um 1 Monat. · 1 ay ücretsiz verilsin mi? Ücretli aylar 1 ay kayar.")) return;
        api("POST", { action: "comp", token: r.token }).then(function (j) {
          if (j.ok) { r.comp = j.comp; comp.outerHTML = '<span style="font-size:11.5px;color:#d29922">🎁 +1 Monat gegeben · verildi ' + when(j.comp) + "</span>"; out.textContent = "Bitte Bericht neu senden (mit Geschenk-Hinweis) · Raporu tekrar gönder (hediye notuyla)"; }
          else out.innerHTML = '<span style="color:#f85149">' + e(ERR[j.error] || j.error || "Fehler") + "</span>";
        });
      };
    });
    var all = body.querySelector("[data-all-mail]");
    if (all) all.onclick = function () {
      var open = rows.filter(function (r) { return r.token && !r.sent_mail && r.email; });
      if (!open.length) { all.textContent = "Keine offenen mit E-Mail · E-postalı açık yok"; return; }
      if (!window.confirm(open.length + " Berichte per E-Mail senden? · " + open.length + " rapor e-postayla gönderilsin mi?")) return;
      var i = 0, ok = 0;
      (function next() {
        if (i >= open.length) { all.textContent = "✓ " + ok + "/" + open.length + " gesendet · gönderildi"; load(); return; }
        all.textContent = "… " + (i + 1) + "/" + open.length;
        api("POST", { action: "mail", token: open[i].token }).then(function (j) { if (j.ok) ok++; i++; setTimeout(next, 1200); });
      })();
    };
  }

  function load() {
    var body = section();
    if (!body) return;
    api("GET", month).then(function (d) {
      if (!d.reports) { body.textContent = "Keine Daten · Veri yok (" + e(d.error || "") + ")"; return; }
      month = d.month;
      render(body, d);
    });
  }

  window.mkSponsorReports = load; // reload by hand (console / tests)
  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () {
      // the reports also load when another admin part throws an error
      try { return base.apply(this, arguments); } finally { try { load(); } catch (x) {} }
    };
  }
})();
