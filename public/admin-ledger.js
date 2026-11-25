/* 2026-11-22 (owner): web admin
   1. ⏰ Erinnerungen – red banner when a reminder is due (WhatsApp Info …), field for the new end date.
   2. 📒 Bakiye / Buchhaltung – monthly report of all sponsors (German, for the tax office): print / PDF, CSV,
      mark a line as paid, add a manual line (cash, bank). Finished months are saved for ever by the server. */
(function () {
  "use strict";
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:12px;padding:14px;margin-bottom:16px;color:#c9d1d9;font-size:13px";
  var BTN = "background:#21262d;border:1px solid #30363d;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit;font-size:12.5px";
  var INP = "padding:6px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#fff;font:inherit;font-size:12.5px";
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function api(path, body) {
    return fetch(path, { method: body ? "POST" : "GET", headers: { "content-type": "application/json", "x-admin-token": token() }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" })
      .then(function (r) { return r.json().catch(function () { return {}; }); });
  }
  function eur(c) { return (Number(c || 0) / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }
  function dt(ts, time) {
    if (!ts) return "–";
    var o = { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric" };
    if (time) { o.hour = "2-digit"; o.minute = "2-digit"; }
    return new Intl.DateTimeFormat("de-DE", o).format(new Date(ts));
  }
  function card(id, firstChild) {
    var view = document.getElementById("admin-main-view");
    if (!view) return null;
    var b = document.getElementById(id);
    if (!b) { b = document.createElement("div"); b.id = id; b.style.cssText = CARD; if (firstChild) view.insertBefore(b, view.firstChild); else view.appendChild(b); }
    return b;
  }

  // ---------------- 1. reminders ----------------
  function renderReminders() {
    if (!token()) return;
    api("/api/reminders").then(function (j) {
      if (!j || !j.reminders) return;
      var b = card("admin-reminders", true);
      if (!b) return;
      var act = j.reminders.filter(function (r) { return r.active; });
      b.style.borderColor = act.length ? "#f85149" : "#30363d";
      b.innerHTML = '<b style="font-size:15px;color:#fff">⏰ Erinnerungen · Hatırlatmalar</b>' +
        (act.length ? '<div style="background:#da3633;color:#fff;border-radius:8px;padding:8px;margin:8px 0;font-weight:800">' + act.map(function (r) { return (r.overdue ? "ABGELAUFEN / SÜRESİ DOLDU: " : "Fällig / Son gün " + dt(r.due_at, true) + ": ") + e(r.title); }).join("<br>") + "</div>" : "") +
        j.reminders.map(function (r) {
          var d = new Date(r.due_at + 3600000);
          var local = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(r.due_at)).replace(" ", "T");
          void d;
          return '<div style="border:1px solid #30363d;border-radius:10px;padding:8px;margin:6px 0" data-rem="' + e(r.id) + '"><b>' + e(r.title) + "</b><br><small style=\"color:#8b949e\">" + e(r.text) + "</small><br>" +
            'Ende / Bitiş: <input type="datetime-local" class="rem-due" value="' + e(local) + '" style="' + INP + '"> · ' +
            'Erinnern ab / önceden <select class="rem-lead" style="' + INP + '">' + [1, 2, 3, 5, 7].map(function (n) { return '<option value="' + n + '"' + (Number(r.lead_days) === n ? " selected" : "") + ">" + n + " Tag(e)</option>"; }).join("") + "</select> " +
            '<button type="button" class="rem-save" style="' + BTN + ';background:#2ea043">✓ Erneuert – neues Datum speichern</button> <span class="rem-out"></span></div>';
        }).join("") +
        '<small style="color:#8b949e">Ab dem Erinnerungstag kommt jeden Tag eine Meldung aufs Admin-Handy, bis du das neue Datum speicherst. E-Mail nur, wenn Brevo eingerichtet ist.</small>';
      b.querySelectorAll(".rem-save").forEach(function (btn) {
        btn.onclick = function () {
          var box = btn.closest("[data-rem]");
          var out = box.querySelector(".rem-out");
          api("/api/reminders", { action: "save", id: box.getAttribute("data-rem"), due: box.querySelector(".rem-due").value, lead_days: box.querySelector(".rem-lead").value })
            .then(function (r) { out.textContent = r.ok ? " ✓ gespeichert" : " Fehler: " + (r.error || "?"); setTimeout(renderReminders, 800); });
        };
      });
    });
  }

  // ---------------- 2. book-keeping ----------------
  var month = "";
  var last = null;
  function renderLedger() {
    if (!token()) return;
    var b = card("admin-ledger", false);
    if (!b) return;
    b.innerHTML = '<b style="font-size:15px;color:#fff">📒 Bakiye · Buchhaltung (Sponsoren)</b><div id="admin-ledger-body">…</div>';
    api("/api/ledger" + (month ? "?month=" + month : "")).then(function (j) {
      var body = document.getElementById("admin-ledger-body");
      if (!body) return;
      if (!j || !j.report) { body.textContent = "Konnte nicht geladen werden."; return; }
      last = j;
      month = j.report.month;
      var r = j.report, t = r.totals;
      body.innerHTML =
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0">Monat: <select id="ledger-month" style="' + INP + '">' + j.months.map(function (m) { return '<option value="' + m + '"' + (m === month ? " selected" : "") + ">" + m + "</option>"; }).join("") + "</select>" +
        (j.saved ? '<span style="color:#3fb950">🔒 abgeschlossen & gespeichert am ' + dt(j.savedAt, true) + "</span>" : '<span style="color:#d29922">⏳ laufender Monat (Zwischenstand)</span>') +
        ' <button type="button" id="ledger-print" style="' + BTN + ';background:#1f6feb">🖨 Drucken / PDF</button>' +
        ' <button type="button" id="ledger-csv" style="' + BTN + '">⬇ CSV (Excel)</button></div>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;margin:6px 0"><span>Listenpreis: <b>' + eur(t.list) + "</b></span><span>Rabatt: <b>" + eur(t.discount) + "</b></span><span>Rechnungsbetrag: <b>" + eur(t.due) + "</b></span><span>Bezahlt: <b style=\"color:#3fb950\">" + eur(t.paid) + "</b></span><span>Offen: <b style=\"color:" + (t.open ? "#f85149" : "#8b949e") + "\">" + eur(t.open) + "</b></span></div>" +
        '<div style="overflow-x:auto"><table style="border-collapse:collapse;width:100%;font-size:12px"><tr style="color:#8b949e;text-align:left"><th>Datum</th><th>Sponsor</th><th>Paket</th><th>Zeitraum</th><th>Liste</th><th>Rabatt</th><th>Betrag</th><th>Bezahlt</th><th>Zahlungsart</th><th></th></tr>' +
        r.lines.map(function (x) {
          return '<tr style="border-top:1px solid #30363d" data-line="' + e(x.id) + '"><td>' + dt(x.ts) + "</td><td>" + e(x.sponsor) + "<br><small style=\"color:#8b949e\">" + e(x.campaign || x.note || "") + "</small></td><td>" + e(x.plan) + "</td><td>" + (x.period_from ? dt(x.period_from) + "–" + dt(x.period_to) : "–") + "</td><td>" + eur(x.list_cents) + "</td><td>" + eur(x.discount_cents) + "</td><td>" + eur(x.due_cents) + "</td><td>" + eur(x.paid_cents) + "</td><td>" + e(x.method) + "</td><td>" +
            (!j.saved && x.due_cents > x.paid_cents ? '<button type="button" class="ledger-paid" style="' + BTN + '">✓ bezahlt</button>' : "") + "</td></tr>";
        }).join("") + "</table></div>" +
        (r.lines.length ? "" : '<p style="color:#8b949e">Keine Einträge in diesem Monat.</p>') +
        '<details style="margin-top:8px"><summary style="cursor:pointer;color:#fff;font-weight:700">➕ Eintrag von Hand (Bar, Überweisung …)</summary>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><input id="lg-sponsor" placeholder="Sponsor / Kunde" style="' + INP + '"><input id="lg-date" type="date" style="' + INP + '"><input id="lg-list" placeholder="Listenpreis €" style="' + INP + ';width:110px"><input id="lg-due" placeholder="Betrag €" style="' + INP + ';width:90px"><input id="lg-paid" placeholder="bezahlt €" style="' + INP + ';width:90px">' +
        '<select id="lg-method" style="' + INP + '"><option>Bar</option><option>Überweisung</option><option>PayPal</option><option>Stripe (Karte)</option><option>keine Zahlung (Aktion)</option></select><input id="lg-note" placeholder="Bemerkung" style="' + INP + ';flex:1">' +
        '<button type="button" id="lg-add" style="' + BTN + ';background:#2ea043">Speichern</button><span id="lg-out"></span></div></details>';
      var sel = document.getElementById("ledger-month");
      sel.onchange = function () { month = sel.value; renderLedger(); };
      document.getElementById("ledger-print").onclick = function () { printReport(last); };
      document.getElementById("ledger-csv").onclick = function () { csv(last); };
      body.querySelectorAll(".ledger-paid").forEach(function (btn) {
        btn.onclick = function () {
          var id = btn.closest("[data-line]").getAttribute("data-line");
          var line = last.report.lines.filter(function (x) { return x.id === id; })[0];
          var amount = prompt("Bezahlter Betrag in € für " + line.sponsor + ":", (line.due_cents / 100).toFixed(2).replace(".", ","));
          if (amount == null) return;
          var method = prompt("Zahlungsart (Bar, Überweisung, PayPal …):", "Überweisung") || "Überweisung";
          api("/api/ledger", { action: "paid", id: id, paid: amount, method: method }).then(function (r) { if (!r.ok) alert("Fehler: " + (r.error || "?")); renderLedger(); });
        };
      });
      document.getElementById("lg-add").onclick = function () {
        var g = function (id) { return document.getElementById(id).value; };
        api("/api/ledger", { action: "add", sponsor: g("lg-sponsor"), date: g("lg-date"), list: g("lg-list"), due: g("lg-due"), paid: g("lg-paid"), method: g("lg-method"), note: g("lg-note") })
          .then(function (r) { document.getElementById("lg-out").textContent = r.ok ? " ✓" : " Fehler: " + (r.error || "?"); if (r.ok) renderLedger(); });
      };
    });
  }

  function csv(j) {
    var r = j.report;
    var rows = [["Datum", "Sponsor", "Adresse", "Paket", "Zeitraum von", "Zeitraum bis", "Listenpreis", "Rabatt", "Rechnungsbetrag", "Bezahlt", "Bezahlt am", "Zahlungsart", "Aktion", "Bemerkung"]];
    r.lines.forEach(function (x) {
      rows.push([dt(x.ts), x.sponsor, x.address, x.plan, x.period_from ? dt(x.period_from) : "", x.period_to ? dt(x.period_to) : "", (x.list_cents / 100).toFixed(2).replace(".", ","), (x.discount_cents / 100).toFixed(2).replace(".", ","), (x.due_cents / 100).toFixed(2).replace(".", ","), (x.paid_cents / 100).toFixed(2).replace(".", ","), x.paid_at ? dt(x.paid_at, true) : "", x.method, x.campaign, x.note]);
    });
    var text = "﻿" + rows.map(function (row) { return row.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(";"); }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    a.download = "MyKiezBerlin-Buchhaltung-" + r.month + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
  }

  function printReport(j) {
    var r = j.report, t = r.totals, B = r.business;
    var MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    var mm = r.month.split("-");
    var title = "Monatsbericht Einnahmen Werbung / Sponsoring – " + MONTHS[Number(mm[1]) - 1] + " " + mm[0];
    var html = "<!doctype html><html lang=\"de\"><head><meta charset=\"utf-8\"><title>" + e(title) + "</title><style>" +
      "@page{size:A4 landscape;margin:12mm}body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:10.5pt}h1{font-size:15pt;margin:0 0 4px}" +
      ".head{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:10px}" +
      "table{border-collapse:collapse;width:100%;font-size:9.5pt}th,td{border:1px solid #999;padding:4px 5px;vertical-align:top}th{background:#eee;text-align:left}td.n{text-align:right;white-space:nowrap}" +
      "tfoot td{font-weight:bold;background:#f5f5f5}.small{font-size:8.5pt;color:#333}.box{border:1px solid #999;padding:6px 8px;margin:10px 0}" +
      ".sign{margin-top:28px;display:flex;gap:60px}.sign div{border-top:1px solid #111;padding-top:3px;width:240px;font-size:9pt}" +
      "@media screen{body{max-width:1100px;margin:20px auto}.bar{margin-bottom:12px}}@media print{.bar{display:none}}</style></head><body>" +
      '<div class="bar"><button onclick="print()">🖨 Drucken / Als PDF speichern</button></div>' +
      '<div class="head"><div><h1>' + e(title) + "</h1>" +
      "<div>Zeitraum: <b>" + dt(r.from) + " – " + dt(r.to) + "</b></div>" +
      "<div>Erstellt am: <b>" + dt(j.saved ? j.savedAt : Date.now(), true) + " Uhr</b> " + (j.saved ? "(Monatsabschluss, gespeichert)" : "(Zwischenstand, Monat läuft noch)") + "</div></div>" +
      "<div><b>" + e(B.name) + "</b><br>" + e(B.owner) + "<br>" + e(B.street) + "<br>" + e(B.city) + "<br>" + e(B.mail) + " · " + e(B.web) + "</div></div>" +
      "<table><thead><tr><th>Nr.</th><th>Datum</th><th>Sponsor / Kunde</th><th>Paket</th><th>Leistungszeitraum</th><th>Listenpreis</th><th>Rabatt (Aktion)</th><th>Rechnungsbetrag</th><th>Bezahlt</th><th>Zahlungsart / Datum</th><th>Aktion / Bemerkung</th></tr></thead><tbody>" +
      r.lines.map(function (x, i) {
        return "<tr><td>" + (i + 1) + "</td><td>" + dt(x.ts) + "</td><td>" + e(x.sponsor) + (x.address ? '<br><span class="small">' + e(x.address) + "</span>" : "") + "</td><td>" + e(planName(x.plan)) + "</td><td>" + (x.period_from ? dt(x.period_from) + " – " + dt(x.period_to) : "–") + '</td><td class="n">' + eur(x.list_cents) + '</td><td class="n">' + eur(x.discount_cents) + '</td><td class="n">' + eur(x.due_cents) + '</td><td class="n">' + eur(x.paid_cents) + "</td><td>" + e(x.method) + (x.paid_at && x.paid_cents ? "<br>" + dt(x.paid_at, true) : "") + "</td><td>" + e(x.campaign) + (x.note ? '<br><span class="small">' + e(x.note) + "</span>" : "") + "</td></tr>";
      }).join("") +
      (r.lines.length ? "" : '<tr><td colspan="11">Keine Einträge in diesem Zeitraum.</td></tr>') +
      '</tbody><tfoot><tr><td colspan="5">Summe (' + r.lines.length + ' Einträge)</td><td class="n">' + eur(t.list) + '</td><td class="n">' + eur(t.discount) + '</td><td class="n">' + eur(t.due) + '</td><td class="n">' + eur(t.paid) + '</td><td colspan="2">Offen: ' + eur(t.open) + "</td></tr></tfoot></table>" +
      '<div class="box"><b>Hinweise zur Aktion</b><br>' +
      "Black-Friday-Angebot für alle aktiven Werbepartner: 20.11.2026 – 19.02.2027 drei Monate kostenlos (0 €). " +
      "Danach 20.02.2027 – 19.05.2027 Aktionspreis 19 €/Monat, Kiez Premium 49 €/Monat (drei Monate). Danach regulärer Preis: Kiez Basic 29 €, Kiez Plus 49 €, Kiez Premium 89 € pro Monat. " +
      "Bei späterem Beginn gelten die Zeiträume ab dem eigenen Startdatum. Die Leistung (Werbeplatz) wurde erbracht; der Rabatt ist als Aktionsrabatt ausgewiesen.<br>" +
      e(B.tax) + "</div>" +
      '<div class="sign"><div>Ort, Datum</div><div>Unterschrift ' + e(B.owner) + "</div></div>" +
      '<p class="small">Automatisch erstellt mit My Kiez Berlin (mykiezberlin.com/admin) · Bericht ' + e(r.month) + " · " + r.lines.length + " Einträge.</p>" +
      "</body></html>";
    var w = window.open("", "_blank");
    if (!w) { alert("Bitte Pop-ups für diese Seite erlauben."); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
  function planName(p) { return { s: "Kiez Basic", m: "Kiez Plus", gp: "Kiez Plus (Gründungspartner)", banner: "Banner-Sponsoring", l: "Kiez Premium" }[String(p || "").toLowerCase()] || p || "–"; }

  function all() { setTimeout(function () { renderReminders(); renderLedger(); }, 0); }
  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () { var r = base.apply(this, arguments); all(); return r; };
  }
})();
