/* 2026-11-22 (owner): web admin card "📤 Telegram" – sends the live stories (own + sponsor, never user stories)
   that are not in the Telegram channel yet. Every story is sent only once (server keeps a list). */
(function () {
  "use strict";
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:12px;padding:14px;margin-bottom:16px;color:#c9d1d9;font-size:13px";
  var BTN = "background:#229ed9;border:0;color:#fff;border-radius:8px;padding:8px 12px;cursor:pointer;font:inherit;font-size:13px;font-weight:700";
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function api(body) {
    return fetch("/api/telegram-backlog", { method: body ? "POST" : "GET", headers: { "content-type": "application/json", "x-admin-token": token() }, body: body ? JSON.stringify(body) : undefined, cache: "no-store" })
      .then(function (r) { return r.json().catch(function () { return {}; }); });
  }
  var busy = false;
  function render() {
    if (!token() || busy) return;
    var view = document.getElementById("admin-main-view");
    if (!view) return;
    api().then(function (j) {
      if (!j || j.error || busy) return;
      var b = document.getElementById("admin-telegram");
      if (!b) { b = document.createElement("div"); b.id = "admin-telegram"; b.style.cssText = CARD; view.appendChild(b); }
      b.innerHTML = '<b style="font-size:15px;color:#fff">📤 Telegram-Kanal · Telegram kanalı</b><br>' +
        (j.ready ? "" : '<span style="color:#f85149">Telegram ist nicht eingerichtet (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).</span><br>') +
        "Noch nicht gesendet / Henüz gönderilmeyen: <b>" + j.open + "</b> Story(s) (nur eigene + Sponsor-Stories · sadece kendi + sponsor)<br>" +
        (j.list && j.list.length ? '<small style="color:#8b949e">' + j.list.slice(0, 12).map(function (s) { return "• " + e(s.headline); }).join("<br>") + (j.list.length > 12 ? "<br>…" : "") + "</small><br>" : "") +
        (j.open && j.ready ? '<button type="button" id="tg-send" style="' + BTN + ';margin-top:8px">📤 ' + j.open + " jetzt senden · şimdi gönder</button>" : "") +
        ' <span id="tg-out"></span><br><small style="color:#8b949e">Jede Story geht nur einmal in den Kanal. Neue Stories gehen weiter automatisch. · Her story kanala sadece bir kez gider.</small>';
      var btn = document.getElementById("tg-send");
      if (btn) btn.onclick = function () {
        busy = true; btn.disabled = true;
        var out = document.getElementById("tg-out"), total = 0, fail = 0;
        (function step() {
          api({ limit: 5 }).then(function (r) {
            if (r.error) { out.textContent = " Fehler: " + r.error; busy = false; return; }
            total += r.sent || 0; fail += r.failed || 0;
            out.textContent = " ✓ " + total + " gesendet" + (fail ? " · " + fail + " Fehler" : "") + (r.open ? " · noch " + r.open + " …" : " · fertig / bitti");
            if (r.open && (r.sent || r.failed)) setTimeout(step, 3000); else { busy = false; setTimeout(render, 1500); }
          }).catch(function () { out.textContent = " Netzwerkfehler"; busy = false; });
        })();
      };
    });
  }
  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () { var r = base.apply(this, arguments); setTimeout(render, 0); return r; };
  }
})();
