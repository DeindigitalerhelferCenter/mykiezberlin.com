/* My Kiez Berlin – admin login with own accounts (2026-11-11).
   Replaces the shared test password: e-mail + password (eye icon), "password forgotten" (recovery code or e-mail link),
   first setup, change password, new recovery code, add / remove admins. Server: /api/admin-auth. */
(function () {
  "use strict";
  var TOKEN_KEY = "mykiez_admin_token_v1";     // sessionStorage, read by admin-extended.js / admin-werbung.js / admin-planner.js
  var KEEP_KEY = "mykiez_admin_session_v1";    // localStorage: stay logged in on this device
  var AUTH_KEY = "mykiez_admin_auth_v1";       // localStorage flag used by the public pages (admin share buttons)

  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function token() { try { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(KEEP_KEY) || ""; } catch (e) { return ""; } }
  function store(t) {
    try { sessionStorage.setItem(TOKEN_KEY, t); localStorage.setItem(KEEP_KEY, t); localStorage.setItem(AUTH_KEY, "true"); } catch (e) {}
  }
  function clear() {
    try { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(KEEP_KEY); localStorage.removeItem(AUTH_KEY); } catch (e) {}
  }
  async function api(action, data) {
    var res = await fetch("/api/admin-auth", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify(Object.assign({ action: action }, data || {})) }).catch(function () { return null; });
    if (!res) return { error: "offline" };
    var out = await res.json().catch(function () { return {}; });
    out.status = res.status;
    return out;
  }
  var ERR = {
    wrong_password: "Falsches Passwort · Şifre yanlış",
    too_many_attempts: "Zu viele Versuche, bitte 1 Stunde warten · Çok fazla deneme, 1 saat bekleyin",
    password_too_short: "Mindestens 8 Zeichen · En az 8 karakter",
    wrong_code: "Notfall-Code oder E-Mail falsch · Acil durum kodu veya e-posta yanlış",
    link_expired: "Link abgelaufen · Linkin süresi doldu",
    email_invalid: "E-Mail ungültig · E-posta geçersiz",
    email_exists: "E-Mail gibt es schon · Bu e-posta zaten var",
    offline: "Keine Verbindung · Bağlantı yok",
    unauthorized: "Bitte neu anmelden · Lütfen yeniden giriş yapın",
  };
  function err(r) { return ERR[r && r.error] || "Fehler · Hata (" + esc(r && (r.error || r.status)) + ")"; }

  function pwField(id, ph) {
    return '<div style="position:relative;margin-bottom:12px"><input type="password" id="' + id + '" class="form-control" placeholder="' + esc(ph) + '" autocomplete="current-password" style="background:#0d1117;border-color:#30363d;color:#FFF;padding-right:42px">' +
      '<i class="bi bi-eye-slash-fill" data-eye="' + id + '" title="Anzeigen / Göster" style="position:absolute;right:12px;top:12px;cursor:pointer;color:#8b949e"></i></div>';
  }
  function textField(id, ph, type, val) {
    return '<input type="' + (type || "text") + '" id="' + id + '" class="form-control" placeholder="' + esc(ph) + '" value="' + esc(val || "") + '" style="background:#0d1117;border-color:#30363d;color:#FFF;margin-bottom:12px">';
  }
  document.addEventListener("click", function (ev) {
    var eye = ev.target.closest && ev.target.closest("[data-eye]");
    if (!eye) return;
    var input = document.getElementById(eye.getAttribute("data-eye"));
    if (!input) return;
    var show = input.type === "password";
    input.type = show ? "text" : "password";
    eye.className = show ? "bi bi-eye-fill" : "bi bi-eye-slash-fill";
  });
  function view() { return document.getElementById("admin-main-view"); }
  function card(inner) { return '<div class="admin-card-dark" style="margin-top:32px;text-align:center;padding:24px;max-width:440px;margin-left:auto;margin-right:auto">' + inner + "</div>"; }
  function msg(id, text, ok) { var n = document.getElementById(id); if (n) { n.style.color = ok ? "#3fb950" : "#f85149"; n.innerHTML = text; } }

  // ---------- login ----------
  window.renderLoginForm = function () {
    view().innerHTML = card(
      '<div style="font-size:40px;color:var(--berlin-red);margin-bottom:12px"><i class="bi bi-lock-fill"></i></div>' +
      '<h2 style="font-size:20px;font-weight:800;margin-bottom:16px">My Kiez Berlin Admin</h2>' +
      textField("aa-email", "E-Mail (optional)", "email") + pwField("admin-pwd-input", "Passwort · Şifre") +
      '<button class="btn-primary" style="background:#238636" onclick="attemptLogin()">Anmelden · Giriş yap</button>' +
      '<p id="aa-msg" style="font-size:12px;margin-top:10px"></p>' +
      '<a href="#" onclick="mkAdminForgot();return false" style="font-size:12px;color:#58a6ff">Passwort vergessen? · Şifremi unuttum</a>');
    var pw = document.getElementById("admin-pwd-input");
    if (pw) pw.addEventListener("keydown", function (e) { if (e.key === "Enter") attemptLogin(); });
  };

  window.attemptLogin = async function () {
    var r = await api("login", { email: (document.getElementById("aa-email") || {}).value || "", password: (document.getElementById("admin-pwd-input") || {}).value || "" });
    if (!r.ok) { msg("aa-msg", err(r)); return; }
    store(r.token);
    if (r.setupRequired) { renderSetup(r); return; }
    renderAdminDashboard();
  };

  window.handleLogout = async function () {
    if (!confirm("Abmelden? · Çıkış yapılsın mı?")) return;
    await api("logout");
    clear();
    renderLoginForm();
  };

  // ---------- first setup ----------
  // ---------- security questions (2026-11-11) ----------
  var CHOICES = [];
  fetch("/api/admin-auth").then(function (r) { return r.json(); }).then(function (j) { CHOICES = j.questionChoices || []; }).catch(function () {});
  function questionFields(current) {
    var dl = '<datalist id="aa-qchoices">' + CHOICES.map(function (c) { return '<option value="' + esc(c) + '">'; }).join("") + "</datalist>";
    var out = '<p style="font-size:12px;color:#8b949e;text-align:left;margin:4px 0 8px">🔐 3 Sicherheitsfragen – für „Passwort vergessen“. Frage wählen oder selbst schreiben. · 3 güvenlik sorusu – soruyu seç veya kendin yaz.</p>' + dl;
    for (var i = 0; i < 3; i++) {
      out += textField("aa-q" + i, "Frage " + (i + 1) + " · Soru " + (i + 1), "text", (current && current[i]) || CHOICES[i] || "").replace("<input ", '<input list="aa-qchoices" ') +
        pwField("aa-a" + i, "Antwort " + (i + 1) + " · Cevap " + (i + 1));
    }
    return out;
  }
  function readQuestions() {
    var list = [];
    for (var i = 0; i < 3; i++) list.push({ question: (document.getElementById("aa-q" + i) || {}).value || "", answer: (document.getElementById("aa-a" + i) || {}).value || "" });
    return list;
  }
  function questionsOk(list) { return list.every(function (q) { return q.question.trim() && q.answer.trim().length >= 2; }); }
  ERR.wrong_answers = "Antworten falsch · Cevaplar yanlış";
  ERR.no_questions = "Für diese E-Mail sind keine Fragen gespeichert · Bu e-posta için soru kayıtlı değil";
  ERR.questions_incomplete = "Bitte alle 3 Fragen und Antworten ausfüllen · Lütfen 3 soru ve cevabı doldurun";

  function renderSetup(r) {
    view().innerHTML = card(
      '<h2 style="font-size:19px;font-weight:800;margin-bottom:6px">Eigenes Passwort festlegen</h2>' +
      '<p style="font-size:12px;color:#8b949e;margin-bottom:16px">Kendi şifreni belirle. Danach gilt das alte Test-Passwort nicht mehr. · Sonra eski test şifresi çalışmaz.</p>' +
      textField("aa-name", "Name", "text", r.name || "Ersen Bakıcı") + textField("aa-mail", "E-Mail", "email", r.email || "bakiciersen@gmail.com") +
      pwField("aa-new", "Neues Passwort (min. 8) · Yeni şifre") + pwField("aa-new2", "Wiederholen · Tekrar") +
      questionFields() +
      '<button class="btn-primary" style="background:#238636" onclick="mkAdminSetup()">Speichern · Kaydet</button><p id="aa-msg" style="font-size:12px;margin-top:10px"></p>');
  }
  window.mkAdminSetup = async function () {
    var p1 = document.getElementById("aa-new").value, p2 = document.getElementById("aa-new2").value;
    if (p1 !== p2) { msg("aa-msg", "Passwörter sind verschieden · Şifreler farklı"); return; }
    var qs = readQuestions();
    if (!questionsOk(qs)) { msg("aa-msg", ERR.questions_incomplete); return; }
    var r = await api("setup", { name: document.getElementById("aa-name").value, email: document.getElementById("aa-mail").value, password: p1, questions: qs });
    if (!r.ok) { msg("aa-msg", err(r)); return; }
    store(r.token);
    showRecovery(r.recoveryCode, function () { renderAdminDashboard(); });
  };

  function showRecovery(code, done) {
    view().innerHTML = card(
      '<div style="font-size:34px">🔑</div><h2 style="font-size:18px;font-weight:800;margin:6px 0">Notfall-Code · Acil durum kodu</h2>' +
      '<p style="font-size:12px;color:#8b949e">Bitte aufschreiben und sicher aufbewahren. Er wird nur jetzt angezeigt. Damit setzt du ein vergessenes Passwort zurück.<br>Lütfen bir yere yaz ve sakla. Sadece şimdi gösterilir. Şifreni unutursan bununla sıfırlarsın.</p>' +
      '<div style="font:700 22px/1.4 monospace;letter-spacing:2px;background:#0d1117;border:1px dashed #F2B705;border-radius:10px;padding:12px;margin:14px 0;color:#F2B705;user-select:all">' + esc(code) + "</div>" +
      '<button class="btn-primary" style="background:#238636" id="aa-done">Notiert · Not aldım</button>');
    document.getElementById("aa-done").onclick = done;
  }

  // ---------- password forgotten ----------
  window.mkAdminForgot = async function () {
    var status = await fetch("/api/admin-auth").then(function (r) { return r.json(); }).catch(function () { return {}; });
    view().innerHTML = card(
      '<h2 style="font-size:19px;font-weight:800;margin-bottom:12px">Passwort vergessen · Şifremi unuttum</h2>' +
      '<p style="font-size:12px;color:#8b949e;text-align:left">1) Mit Sicherheitsfragen · Güvenlik sorularıyla:</p>' +
      textField("aa-qmail", "E-Mail", "email", "") +
      '<button class="chip-btn active" onclick="mkAdminLoadQuestions()">Fragen anzeigen · Soruları göster</button><div id="aa-qbox" style="margin-top:10px"></div>' +
      '<hr style="border-color:#30363d;margin:16px 0">' +
      '<p style="font-size:12px;color:#8b949e;text-align:left">2) Mit Notfall-Code · Acil durum koduyla:</p>' +
      textField("aa-mail", "E-Mail", "email", "") + textField("aa-code", "Notfall-Code (XXXX-XXXX-XXXX-XXXX)") +
      pwField("aa-new", "Neues Passwort (min. 8) · Yeni şifre") +
      '<button class="btn-primary" style="background:#238636" onclick="mkAdminRecover()">Zurücksetzen · Sıfırla</button>' +
      (status.emailReset
        ? '<p style="font-size:12px;color:#8b949e;text-align:left;margin-top:18px">2) Link per E-Mail · E-postayla link:</p><button class="btn-primary" style="background:#1f6feb" onclick="mkAdminMail()">Link senden · Link gönder</button>'
        : '<p style="font-size:11px;color:#8b949e;margin-top:14px">E-Mail-Versand ist noch nicht eingerichtet. · E-posta gönderimi henüz kurulmadı.</p>') +
      '<p id="aa-msg" style="font-size:12px;margin-top:10px"></p><a href="#" onclick="renderLoginForm();return false" style="font-size:12px;color:#58a6ff">← Zurück · Geri</a>');
  };
  window.mkAdminLoadQuestions = async function () {
    var mail = document.getElementById("aa-qmail").value;
    var r = await api("questions", { email: mail });
    var box = document.getElementById("aa-qbox");
    if (!r.ok) { box.innerHTML = '<p style="font-size:12px;color:#f85149">' + err(r) + "</p>"; return; }
    box.innerHTML = r.questions.map(function (q, i) { return '<p style="font-size:13px;text-align:left;margin:6px 0 4px">' + esc(q) + "</p>" + pwField("aa-ra" + i, "Antwort · Cevap"); }).join("") +
      pwField("aa-qnew", "Neues Passwort (min. 8) · Yeni şifre") +
      '<button class="btn-primary" style="background:#238636" onclick="mkAdminRecoverQuestions()">Zurücksetzen · Sıfırla</button>';
  };
  window.mkAdminRecoverQuestions = async function () {
    var answers = [0, 1, 2].map(function (i) { return (document.getElementById("aa-ra" + i) || {}).value || ""; });
    var r = await api("recoverQuestions", { email: document.getElementById("aa-qmail").value, answers: answers, newPassword: document.getElementById("aa-qnew").value });
    if (!r.ok) { msg("aa-msg", err(r)); return; }
    store(r.token);
    renderAdminDashboard();
  };
  window.mkAdminRecover = async function () {
    var r = await api("recover", { email: document.getElementById("aa-mail").value, code: document.getElementById("aa-code").value, newPassword: document.getElementById("aa-new").value });
    if (!r.ok) { msg("aa-msg", err(r)); return; }
    store(r.token);
    showRecovery(r.recoveryCode, function () { renderAdminDashboard(); });
  };
  window.mkAdminMail = async function () {
    var r = await api("forgot", { email: document.getElementById("aa-mail").value });
    msg("aa-msg", r.ok ? "Wenn die Adresse stimmt, ist die E-Mail unterwegs. · Adres doğruysa e-posta gönderildi." : err(r), r.ok);
  };
  function renderReset(resetToken) {
    view().innerHTML = card(
      '<h2 style="font-size:19px;font-weight:800;margin-bottom:12px">Neues Passwort · Yeni şifre</h2>' + pwField("aa-new", "Neues Passwort (min. 8)") +
      '<button class="btn-primary" style="background:#238636" id="aa-reset">Speichern · Kaydet</button><p id="aa-msg" style="font-size:12px;margin-top:10px"></p>');
    document.getElementById("aa-reset").onclick = async function () {
      var r = await api("reset", { resetToken: resetToken, newPassword: document.getElementById("aa-new").value });
      if (!r.ok) { msg("aa-msg", err(r)); return; }
      store(r.token);
      history.replaceState(null, "", "admin.html");
      renderAdminDashboard();
    };
  }

  // ---------- account section in the dashboard ----------
  async function accountSection() {
    document.getElementById("admin-account")?.remove();
    var host = document.querySelector("main") || document.body;
    var box = document.createElement("section");
    box.id = "admin-account";
    box.className = "admin-card-dark";
    box.style.marginTop = "22px";
    host.appendChild(box);
    var me = await api("me");
    if (!me.ok) { box.innerHTML = '<p style="font-size:12px;color:#8b949e">' + err(me) + "</p>"; return; }
    if (me.setupRequired) { renderSetup(me); return; }
    var list = await api("admins");
    var admins = (list.admins || []).map(function (a) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #30363d;font-size:13px"><span>👤 ' + esc(a.name) + ' <small style="color:#8b949e">' + esc(a.email) + "</small></span>" +
        (a.id !== list.me ? '<button class="chip-btn" onclick="mkAdminRemove(\'' + esc(a.id) + '\')">Entfernen · Kaldır</button>' : '<small style="color:#3fb950">du · sen</small>') + "</div>";
    }).join("");
    box.innerHTML =
      '<h3 style="font-size:16px;font-weight:800;margin-bottom:8px">🔐 Konto & Sicherheit · Hesap & güvenlik</h3>' +
      '<p style="font-size:12px;color:#8b949e;margin-bottom:12px">' + esc(me.name) + " · " + esc(me.email) + "</p>" +
      '<details style="margin-bottom:10px"><summary style="cursor:pointer;font-weight:700">Passwort ändern · Şifre değiştir</summary><div style="margin-top:10px">' +
      pwField("aa-old", "Altes Passwort · Eski şifre") + pwField("aa-new", "Neues Passwort (min. 8) · Yeni şifre") + pwField("aa-new2", "Wiederholen · Tekrar") +
      '<button class="chip-btn active" onclick="mkAdminChange()">Speichern · Kaydet</button></div></details>' +
      '<details style="margin-bottom:10px"' + (me.hasQuestions ? "" : " open") + '><summary style="cursor:pointer;font-weight:700">Sicherheitsfragen · Güvenlik soruları ' + (me.hasQuestions ? "✓" : "⚠️ fehlen · eksik") + '</summary><div style="margin-top:10px">' +
      questionFields(me.questions) + pwField("aa-qpw", "Aktuelles Passwort · Mevcut şifre") +
      '<button class="chip-btn active" onclick="mkAdminSaveQuestions()">Speichern · Kaydet</button></div></details>' +
      '<details style="margin-bottom:10px"><summary style="cursor:pointer;font-weight:700">Neuer Notfall-Code · Yeni acil durum kodu</summary><div style="margin-top:10px;font-size:12px;color:#8b949e">Der alte Code gilt danach nicht mehr. · Eski kod geçersiz olur.<br>' +
      '<button class="chip-btn active" style="margin-top:8px" onclick="mkAdminNewCode()">Code erzeugen · Kod oluştur</button></div></details>' +
      '<details><summary style="cursor:pointer;font-weight:700">Admins (' + (list.admins || []).length + ")</summary><div style=\"margin-top:8px\">" + admins +
      '<div style="margin-top:12px">' + textField("aa-add-name", "Name") + textField("aa-add-mail", "E-Mail", "email") + pwField("aa-add-pw", "Passwort (min. 8) · Şifre") +
      '<button class="chip-btn active" onclick="mkAdminAdd()">+ Admin hinzufügen · Admin ekle</button></div></div></details>' +
      '<p id="aa-acc-msg" style="font-size:12px;margin-top:10px"></p>';
  }
  window.mkAdminChange = async function () {
    var p1 = document.getElementById("aa-new").value;
    if (p1 !== document.getElementById("aa-new2").value) { msg("aa-acc-msg", "Passwörter sind verschieden · Şifreler farklı"); return; }
    var r = await api("change", { oldPassword: document.getElementById("aa-old").value, newPassword: p1 });
    msg("aa-acc-msg", r.ok ? "Passwort geändert ✓ · Şifre değişti ✓" : err(r), r.ok);
  };
  window.mkAdminSaveQuestions = async function () {
    var qs = readQuestions();
    if (!questionsOk(qs)) { msg("aa-acc-msg", ERR.questions_incomplete); return; }
    var r = await api("setQuestions", { questions: qs, password: document.getElementById("aa-qpw").value });
    msg("aa-acc-msg", r.ok ? "Sicherheitsfragen gespeichert ✓ · Kaydedildi ✓" : err(r), r.ok);
  };
  window.mkAdminNewCode = async function () {
    var r = await api("recovery");
    if (!r.ok) { msg("aa-acc-msg", err(r)); return; }
    showRecovery(r.recoveryCode, function () { renderAdminDashboard(); });
  };
  window.mkAdminAdd = async function () {
    var r = await api("addAdmin", { name: document.getElementById("aa-add-name").value, email: document.getElementById("aa-add-mail").value, password: document.getElementById("aa-add-pw").value });
    if (!r.ok) { msg("aa-acc-msg", err(r)); return; }
    showRecovery(r.recoveryCode, function () { renderAdminDashboard(); });
  };
  window.mkAdminRemove = async function (id) {
    if (!confirm("Diesen Admin entfernen? · Bu admin kaldırılsın mı?")) return;
    var r = await api("removeAdmin", { id: id });
    if (!r.ok) { msg("aa-acc-msg", err(r)); return; }
    accountSection();
  };

  // ---------- support messages (/api/support) ----------
  // 2026-11-14 (owner): suggested answers for support messages – always shown, German / Turkish / both,
  // inserted into the answer field; the admin can change or add text before sending. Own texts can be saved
  // as extra suggestions (only in this browser).
  var SUP_TPL = [
    ["thanks", "👋 Eingang / Alındı",
      "Hallo{name},\n\nvielen Dank für deine Nachricht an My Kiez Berlin. Wir haben sie erhalten und kümmern uns darum. Du hörst bald von uns.",
      "Merhaba{name},\n\nMy Kiez Berlin'e yazdığın için teşekkürler. Mesajını aldık ve ilgileniyoruz. Yakında bizden haber alacaksın."],
    ["fixed", "✅ Fehler behoben / Hata düzeltildi",
      "Hallo{name},\n\ndanke für deinen Hinweis! Der Fehler ist jetzt behoben. Bitte lade die Seite neu (oder aktualisiere die App) und probiere es noch einmal.",
      "Merhaba{name},\n\nbildirimin için teşekkürler! Hata düzeltildi. Lütfen sayfayı yenile (veya uygulamayı güncelle) ve tekrar dene."],
    ["progress", "⏳ In Arbeit / İşlemde",
      "Hallo{name},\n\nwir arbeiten gerade an deinem Anliegen. Sobald es fertig ist, melden wir uns wieder.",
      "Merhaba{name},\n\nkonun üzerinde çalışıyoruz. Biter bitmez sana tekrar yazacağız."],
    ["question", "❓ Rückfrage / Soru",
      "Hallo{name},\n\ndanke für deine Nachricht. Damit wir helfen können, brauchen wir noch ein paar Angaben: Auf welcher Seite ist es passiert, und nutzt du die Webseite oder die App (welches Handy)? Ein Bildschirmfoto hilft uns sehr.",
      "Merhaba{name},\n\nmesajın için teşekkürler. Yardımcı olabilmemiz için birkaç bilgi lazım: Hangi sayfada oldu, web sitesini mi yoksa uygulamayı mı (hangi telefon) kullanıyorsun? Bir ekran görüntüsü çok yardımcı olur."],
    ["sponsor", "🤝 Sponsor / Reklam",
      "Hallo{name},\n\nschön, dass du bei My Kiez Berlin werben möchtest! Alle Pakete (Basic 29 €, Plus 49 €, Premium 89 € im Monat) findest du unter https://mykiezberlin.com/werben. Gerne beraten wir dich auch persönlich.",
      "Merhaba{name},\n\nMy Kiez Berlin'de reklam vermek istemene sevindik! Tüm paketleri (aylık Basic 29 €, Plus 49 €, Premium 89 €) https://mykiezberlin.com/werben adresinde bulabilirsin. İstersen kişisel olarak da bilgi veririz."],
    ["done", "🙏 Erledigt / Tamamlandı",
      "Hallo{name},\n\ndein Anliegen ist erledigt. Danke, dass du My Kiez Berlin besser machst! Bei weiteren Fragen antworte einfach auf diese E-Mail.",
      "Merhaba{name},\n\nkonun tamamlandı. My Kiez Berlin'i daha iyi yaptığın için teşekkürler! Başka bir sorunda bu e-postaya cevap vermen yeterli."],
  ];
  var SUP_SIGN = { de: "\n\nViele Grüße\nDein My Kiez Berlin Team", tr: "\n\nSelamlar\nMy Kiez Berlin ekibi" };
  function supOwnTpl() { try { return JSON.parse(localStorage.getItem("mk_support_own_tpl") || "[]") || []; } catch (e) { return []; } }
  function supTplText(key, lang, name) {
    var own = supOwnTpl().find(function (x) { return "own" + x.id === key; });
    if (own) return own.text;
    var t = SUP_TPL.find(function (x) { return x[0] === key; });
    if (!t) return "";
    var n = name ? " " + name : "";
    var de = t[2].replace("{name}", n) + SUP_SIGN.de, tr = t[3].replace("{name}", n) + SUP_SIGN.tr;
    return lang === "tr" ? tr : lang === "de" ? de : de + "\n\n———\n\n" + tr;
  }
  function supTplHtml(IN) {
    var own = supOwnTpl();
    return '<div data-tplbox style="display:grid;gap:6px;padding:8px;border:1px dashed #30363d;border-radius:8px">' +
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:12px"><b>💡 Vorgeschlagene Texte · Önerilen metinler</b>' +
      '<select data-tpllang style="' + IN + ';width:auto"><option value="both">DE + TR</option><option value="de">Deutsch</option><option value="tr">Türkçe</option></select></div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap">' + SUP_TPL.map(function (t) { return '<button type="button" class="chip-btn" data-tpl="' + t[0] + '" style="font-size:12px">' + t[1] + "</button>"; }).join("") +
      own.map(function (x) { return '<span style="display:inline-flex;gap:2px"><button type="button" class="chip-btn" data-tpl="own' + esc(x.id) + '" style="font-size:12px">⭐ ' + esc(x.title) + '</button><button type="button" class="chip-btn" data-tpldel="' + esc(x.id) + '" title="Vorlage löschen · Şablonu sil" style="font-size:11px;padding:2px 6px">✕</button></span>'; }).join("") + "</div>" +
      '<div style="font-size:11px;color:#8b949e">Klick = Text kommt ins Antwortfeld, du kannst ihn ändern und ergänzen · Tıkla = metin cevap alanına gelir, değiştirip ekleme yapabilirsin. ' +
      '<button type="button" class="chip-btn" data-tplsave style="font-size:11px;padding:2px 8px">⭐ Aktuellen Text als Vorlage speichern · Bu metni şablon olarak kaydet</button></div></div>';
  }

  async function supportSection() {
    document.getElementById("admin-support")?.remove();
    var host = document.querySelector("main") || document.body;
    var box = document.createElement("section");
    box.id = "admin-support";
    box.className = "admin-card-dark";
    box.style.marginTop = "22px";
    host.appendChild(box);
    var res = await fetch("/api/support", { headers: { "x-admin-token": token() } }).catch(function () { return null; });
    var data = res && res.ok ? await res.json().catch(function () { return {}; }) : {};
    var list = data.messages || [];
    var open = list.filter(function (m) { return m.status !== "done"; }).length;
    var topic = { app: "App/Web", sponsor: "Sponsor", other: "Sonstiges" };
    // 2026-11-13 (owner): answer, edit and delete; filter; finished messages are deleted after 30 days
    var STATUS = { "new": "🆕 Neu · Yeni", progress: "⏳ In Arbeit · İşlemde", done: "✓ Erledigt · Tamamlandı" };
    var filter = window.mkSupportFilter || "open";
    var shown = list.filter(function (m) { return filter === "all" ? true : filter === "done" ? m.status === "done" : m.status !== "done"; });
    var IN = "width:100%;box-sizing:border-box;background:#0d1117;color:#e6edf3;border:1px solid #30363d;border-radius:8px;padding:7px;font:inherit;font-size:13px";
    var tab = function (k, label) { return '<button class="chip-btn' + (filter === k ? " active" : "") + '" data-supf="' + k + '">' + label + "</button>"; };
    box.innerHTML = '<h3 style="font-size:16px;font-weight:800;margin-bottom:8px">🛠 Support-Meldungen (' + open + " offen · açık)</h3>" +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' + tab("open", "Offen · Açık (" + open + ")") + tab("done", "Erledigt · Tamamlanan (" + (list.length - open) + ")") + tab("all", "Alle · Hepsi (" + list.length + ")") + "</div>" +
      '<p style="font-size:11px;color:#8b949e;margin:0 0 8px">Erledigte Meldungen werden nach ' + (data.keepDays || 30) + " Tagen automatisch gelöscht · Tamamlananlar " + (data.keepDays || 30) + " gün sonra otomatik silinir.</p>" +
      (shown.length ? shown.map(function (m) {
        var replies = (m.replies || []).map(function (r) {
          return '<div style="font-size:12px;border-left:3px solid #2ea043;padding:4px 8px;margin:4px 0;white-space:pre-wrap"><span style="color:#8b949e">↩ ' + esc(new Date(r.at).toLocaleString("de-DE")) + "</span><br>" + esc(r.text) + "</div>";
        }).join("");
        var left = m.status === "done" && m.done_at ? Math.max(0, Math.ceil((m.done_at + (data.keepDays || 30) * 86400000 - Date.now()) / 86400000)) : null;
        return '<div data-supbox="' + esc(m.id) + '" style="padding:10px;margin-bottom:8px;border:1px solid #30363d;border-radius:10px;background:#161b22;opacity:' + (m.status === "done" ? ".7" : "1") + '">' +
          '<div style="font-size:11px;color:#8b949e">' + esc(new Date(m.created_at).toLocaleString("de-DE")) + " · " + esc(topic[m.topic] || m.topic) + (m.sponsor ? " · " + esc(m.sponsor) : "") + (m.page ? " · " + esc(m.page) : "") + (m.name ? " · " + esc(m.name) : "") +
          (left !== null ? " · 🗑 in " + left + " Tagen · gün" : "") + "</div>" +
          '<div data-msgview style="font-size:13px;white-space:pre-wrap;margin:6px 0">' + esc(m.message) + "</div>" +
          '<textarea data-msgedit rows="4" style="' + IN + ';display:none">' + esc(m.message) + "</textarea>" +
          (m.email ? '<div style="font-size:12px">✉️ <a style="color:#58a6ff" href="mailto:' + esc(m.email) + '">' + esc(m.email) + "</a></div>" : '<div style="font-size:12px;color:#8b949e">Keine E-Mail – Antwort nicht möglich · E-posta yok, cevap gönderilemez</div>') +
          replies +
          '<div style="display:grid;gap:6px;margin-top:8px">' +
          '<label style="font-size:12px">Status · Durum <select data-status style="' + IN + ';width:auto">' + Object.keys(STATUS).map(function (k) { return '<option value="' + k + '"' + (m.status === k ? " selected" : "") + ">" + STATUS[k] + "</option>"; }).join("") + "</select></label>" +
          '<textarea data-note rows="2" placeholder="Interne Notiz (nur Admin) · Dahili not (sadece admin)" style="' + IN + '">' + esc(m.note || "") + "</textarea>" +
          (m.email ? '<textarea data-reply rows="3" placeholder="Antwort an den Nutzer (wird per E-Mail von support@ gesendet) · Kullanıcıya cevap (support@ adresinden e-posta ile gider)" style="' + IN + '"></textarea>' + supTplHtml(IN) : "") +
          '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="chip-btn active" data-act="save">💾 Speichern · Kaydet</button>' +
          (m.email ? '<button class="chip-btn" data-act="reply">✉️ Antwort senden · Cevap gönder</button>' : "") +
          '<button class="chip-btn" data-act="edit">✏️ Text bearbeiten · Metni düzenle</button>' +
          '<button class="chip-btn" data-act="del" style="color:#f85149">🗑 Löschen · Sil</button>' +
          '<span data-out style="font-size:12px;align-self:center"></span></div></div></div>';
      }).join("") : '<p style="font-size:12px;color:#8b949e">Keine Meldungen · Bildirim yok</p>');
    box.querySelectorAll("[data-supf]").forEach(function (b) {
      b.onclick = function () { window.mkSupportFilter = b.getAttribute("data-supf"); supportSection(); };
    });
    box.querySelectorAll("[data-supbox]").forEach(function (card) {
      var id = card.getAttribute("data-supbox");
      var out = card.querySelector("[data-out]");
      // suggested texts (2026-11-14)
      var msg = list.find(function (x) { return x.id === id; }) || {};
      var replyField = card.querySelector("[data-reply]");
      var langSel = card.querySelector("[data-tpllang]");
      if (langSel) {
        try { langSel.value = localStorage.getItem("mk_support_tpl_lang") || "both"; } catch (e) {}
        langSel.onchange = function () { try { localStorage.setItem("mk_support_tpl_lang", langSel.value); } catch (e) {} };
      }
      var firstName = String(msg.name || "").trim().split(/\s+/)[0] || "";
      function putTpl(key) {
        if (!replyField) return;
        var text = supTplText(key, langSel ? langSel.value : "both", firstName);
        var cur = replyField.value.trim();
        // empty field: the text goes in; otherwise the admin chooses replace or add below
        if (!cur) replyField.value = text;
        else if (confirm("Vorhandenen Text ersetzen? (Abbrechen = unten anhängen) · Mevcut metin değiştirilsin mi? (İptal = alta ekle)")) replyField.value = text;
        else replyField.value = cur + "\n\n" + text;
        replyField.rows = Math.min(14, Math.max(5, replyField.value.split("\n").length + 1));
        replyField.focus();
      }
      card.querySelectorAll("[data-tpl]").forEach(function (b) { b.onclick = function () { putTpl(b.getAttribute("data-tpl")); }; });
      card.querySelectorAll("[data-tpldel]").forEach(function (b) {
        b.onclick = function () {
          if (!confirm("Eigene Vorlage löschen? · Kendi şablonun silinsin mi?")) return;
          var keep = supOwnTpl().filter(function (x) { return x.id !== b.getAttribute("data-tpldel"); });
          try { localStorage.setItem("mk_support_own_tpl", JSON.stringify(keep)); } catch (e) {}
          supportSection();
        };
      });
      var saveTpl = card.querySelector("[data-tplsave]");
      if (saveTpl) saveTpl.onclick = function () {
        var text = replyField ? replyField.value.trim() : "";
        if (!text) { out.textContent = "Erst Text schreiben · Önce metin yaz"; return; }
        var title = prompt("Name der Vorlage · Şablonun adı:", "");
        if (!title) return;
        var own = supOwnTpl();
        own.push({ id: String(Date.now()), title: title.slice(0, 40), text: text });
        try { localStorage.setItem("mk_support_own_tpl", JSON.stringify(own.slice(-20))); } catch (e) {}
        supportSection();
      };
      // status "in Arbeit" / "erledigt" chosen and the answer is still empty: the matching text is put in at once
      var stSel = card.querySelector("[data-status]");
      if (stSel && replyField) stSel.addEventListener("change", function () {
        if (!replyField.value.trim() && (stSel.value === "done" || stSel.value === "progress")) putTpl(stSel.value === "done" ? "fixed" : "progress");
      });
      var call = function (method, body) {
        return fetch("/api/support", { method: method, headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify(body) })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j.httpOk = r.ok; return j; }); })
          .catch(function () { return { error: "network" }; });
      };
      card.querySelectorAll("[data-act]").forEach(function (b) {
        b.onclick = async function () {
          var act = b.getAttribute("data-act");
          if (act === "edit") {
            var ed = card.querySelector("[data-msgedit]"), view = card.querySelector("[data-msgview]");
            var on = ed.style.display === "none"; ed.style.display = on ? "block" : "none"; view.style.display = on ? "none" : "block";
            return;
          }
          if (act === "del") {
            if (!confirm("Meldung endgültig löschen? · Bildirim kalıcı olarak silinsin mi?")) return;
            out.textContent = "…"; var d = await call("DELETE", { id: id });
            if (d.httpOk) supportSection(); else out.textContent = "Fehler · Hata: " + (d.error || "?");
            return;
          }
          if (act === "reply") {
            var text = card.querySelector("[data-reply]").value.trim();
            if (!text) { out.textContent = "Bitte Antwort schreiben · Lütfen cevap yazın"; return; }
            out.textContent = "Wird gesendet … · Gönderiliyor …";
            var r = await call("POST", { action: "reply", id: id, text: text });
            if (r.httpOk) supportSection(); else out.textContent = "Fehler · Hata: " + (r.error || "?") + (r.detail ? " (" + r.detail + ")" : "");
            return;
          }
          var ed2 = card.querySelector("[data-msgedit]");
          var body = { id: id, status: card.querySelector("[data-status]").value, note: card.querySelector("[data-note]").value };
          if (ed2.style.display !== "none") body.message = ed2.value;
          out.textContent = "…"; var s = await call("PATCH", body);
          if (s.httpOk) supportSection(); else out.textContent = "Fehler · Hata: " + (s.error || "?");
        };
      });
    });
  }
  window.mkSupportDone = async function (id, status) {
    await fetch("/api/support", { method: "PATCH", headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify({ id: id, status: status }) }).catch(function () {});
    supportSection();
  };

  // "+ Yeni Story" in the header: jump to the story planner (pictures / videos with preview)
  window.mkGoPlanner = function () {
    var n = document.getElementById("admin-planner");
    if (n) n.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  var baseDashboard = window.renderAdminDashboard;
  window.renderAdminDashboard = function () {
    try { var t = token(); if (t) sessionStorage.setItem(TOKEN_KEY, t); } catch (e) {}
    baseDashboard();
    supportSection();
    accountSection();
  };

  window.checkAdminAuth = async function () {
    var reset = new URLSearchParams(location.search).get("reset");
    if (reset) { renderReset(reset); return; }
    if (!token()) { clear(); renderLoginForm(); return; }
    var me = await api("me");
    if (!me.ok) { clear(); renderLoginForm(); return; }
    if (me.setupRequired) { renderSetup(me); return; }
    renderAdminDashboard();
  };
})();
