/* My Kiez Berlin – "Fehler melden / Support" (2026-11-11).
   A small form; the message goes to /api/support (saved, admin is notified, copy to support@mykiezberlin.com).
   The user never sees a private address. Open with mkOpenSupport({ topic, sponsor }). */
(function () {
  "use strict";
  function lang() { return typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0 ? "tr" : typeof currentLanguage === "string" && currentLanguage.indexOf("en") === 0 ? "en" : "de"; }
  function L(de, tr, en) { var l = lang(); return l === "tr" ? tr : l === "en" ? en : de; }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function close() { var n = document.getElementById("mk-sup"); if (n) n.remove(); }

  window.mkOpenSupport = function (opts) {
    opts = opts || {};
    close();
    var topic = opts.topic || "app";
    var box = document.createElement("div");
    box.id = "mk-sup";
    box.innerHTML =
      '<div class="mk-sup-bg"></div><form class="mk-sup-sheet" novalidate>' +
      '<button type="button" class="mk-sup-x" aria-label="' + e(L("Schließen", "Kapat", "Close")) + '">✕</button>' +
      "<h3>🛠 " + e(L("Fehler melden / Support", "Hata bildir / Destek", "Report a problem / Support")) + "</h3>" +
      '<p class="mk-sup-hint">' + e(L("Falsche Nummer, Link geht nicht, App-Fehler? Schreib uns – wir kümmern uns.", "Yanlış numara, açılmayan link, uygulama hatası? Bize yaz, ilgilenelim.", "Wrong number, broken link, app error? Tell us and we will fix it.")) + "</p>" +
      '<label>' + e(L("Worum geht es?", "Konu nedir?", "What is it about?")) + '<select name="topic">' +
      '<option value="app"' + (topic === "app" ? " selected" : "") + ">" + e(L("App / Webseite", "Uygulama / web sitesi", "App / website")) + "</option>" +
      '<option value="sponsor"' + (topic === "sponsor" ? " selected" : "") + ">" + e(L("Sponsor / Betrieb", "Sponsor / işletme", "Sponsor / business")) + "</option>" +
      '<option value="other"' + (topic === "other" ? " selected" : "") + ">" + e(L("Sonstiges", "Diğer", "Other")) + "</option></select></label>" +
      '<label>' + e(L("Sponsor (optional)", "Sponsor (isteğe bağlı)", "Sponsor (optional)")) + '<input name="sponsor" maxlength="120" value="' + e(opts.sponsor || "") + '"></label>' +
      '<label>' + e(L("Was ist passiert?", "Ne oldu?", "What happened?")) + ' *<textarea name="message" maxlength="2000" required></textarea></label>' +
      '<label>' + e(L("Deine E-Mail (optional, für eine Antwort)", "E-postan (isteğe bağlı, cevap için)", "Your e-mail (optional, for a reply)")) + '<input name="email" type="email" maxlength="120"></label>' +
      '<input name="hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">' +
      '<button type="submit" class="mk-sup-send">' + e(L("Senden", "Gönder", "Send")) + "</button>" +
      '<p class="mk-sup-msg"></p>' +
      '<p class="mk-sup-alt">' + e(L("Oder per E-Mail:", "Ya da e-postayla:", "Or by e-mail:")) + ' <a href="mailto:support@mykiezberlin.com">support@mykiezberlin.com</a></p>' +
      "</form>";
    document.body.appendChild(box);
    box.querySelector(".mk-sup-bg").onclick = close;
    box.querySelector(".mk-sup-x").onclick = close;
    var form = box.querySelector("form");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var g = function (k) { return form.elements[k].value.trim(); };
      var msg = box.querySelector(".mk-sup-msg");
      if (g("message").length < 5) { msg.textContent = L("Bitte kurz beschreiben, was passiert ist.", "Lütfen ne olduğunu kısaca yaz.", "Please describe briefly what happened."); return; }
      var btn = form.querySelector(".mk-sup-send"); btn.disabled = true;
      fetch("/api/support", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topic: g("topic"), sponsor: g("sponsor"), message: g("message"), email: g("email"), hp: g("hp"), page: location.pathname + location.hash }) })
        .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
        .then(function (r) {
          if (r.j.ok) { form.innerHTML = '<h3>✅ ' + e(L("Danke! Deine Meldung ist angekommen.", "Teşekkürler! Bildirimin bize ulaştı.", "Thank you! We received your report.")) + '</h3><button type="button" class="mk-sup-send">' + e(L("Schließen", "Kapat", "Close")) + "</button>"; form.querySelector("button").onclick = close; return; }
          msg.textContent = r.s === 429 ? L("Zu viele Meldungen – bitte später noch einmal.", "Çok fazla bildirim – lütfen sonra tekrar dene.", "Too many reports – please try again later.") : L("Bitte prüfe deine Angaben.", "Lütfen bilgilerini kontrol et.", "Please check your input.");
          btn.disabled = false;
        })
        .catch(function () { msg.textContent = L("Keine Verbindung.", "Bağlantı yok.", "No connection."); btn.disabled = false; });
    });
  };

  var css = document.createElement("style");
  css.textContent =
    "#mk-sup{position:fixed;inset:0;z-index:10060;display:flex;align-items:flex-end;justify-content:center}" +
    ".mk-sup-bg{position:absolute;inset:0;background:rgba(0,0,0,.45)}" +
    ".mk-sup-sheet{position:relative;width:100%;max-width:520px;max-height:90vh;overflow:auto;background:var(--card-bg,#fff);color:inherit;border-radius:20px 20px 0 0;padding:18px 16px 22px;display:grid;gap:10px}" +
    "@media(min-width:640px){#mk-sup{align-items:center}.mk-sup-sheet{border-radius:20px}}" +
    ".mk-sup-sheet h3{margin:0;font-size:18px;padding-right:40px}.mk-sup-hint{margin:0;font-size:13px;opacity:.75}" +
    ".mk-sup-sheet label{display:grid;gap:4px;font-weight:700;font-size:13px}" +
    ".mk-sup-sheet input,.mk-sup-sheet select,.mk-sup-sheet textarea{font:inherit;font-weight:400;padding:10px;border-radius:10px;border:1px solid rgba(0,0,0,.2);background:transparent;color:inherit}" +
    ".mk-sup-sheet textarea{min-height:100px}" +
    ".mk-sup-x{position:absolute;top:10px;right:10px;border:0;background:rgba(0,0,0,.06);border-radius:50%;width:34px;height:34px;cursor:pointer;color:inherit}" +
    ".mk-sup-send{border:0;border-radius:12px;padding:12px;background:#E30613;color:#fff;font-weight:800;font-size:15px;cursor:pointer}" +
    ".mk-sup-msg{margin:0;color:#E30613;font-size:13px}.mk-sup-alt{margin:0;font-size:12px;opacity:.75}" +
    ".ext-dark .mk-sup-sheet{background:#1e2329;color:#e6edf3}.ext-dark .mk-sup-sheet input,.ext-dark .mk-sup-sheet select,.ext-dark .mk-sup-sheet textarea{border-color:#30363d}";
  document.head.appendChild(css);
})();
