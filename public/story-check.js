/* My Kiez Berlin – check a story BEFORE sending (2026-11-22, owner), same in the app (StoryCheck.kt):
   "Gönder" -> /api/story-check. Fine -> sent at once. Problem -> a window shows the text with the problem words in RED,
   why (DE/TR) and a better wording: "✏️ Öneriyi kullan" (replaces the words), "Kendim düzelteyim" (back to the form),
   "Yine de gönder" (light problem -> the admin decides, heavy -> refused). Admin stories are not checked. */
(function () {
  "use strict";
  if (typeof submitUserStory !== "function") return;
  var baseSubmit = submitUserStory;
  var skipOnce = false;

  function L(de, tr) { var l = typeof currentLanguage === "string" ? currentLanguage : "de"; return l.indexOf("tr") === 0 ? tr : de; }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function isAdmin() { try { return !!sessionStorage.getItem("mykiez_admin_token_v1"); } catch (x) { return false; } }
  function field(id) { return document.getElementById(id); }

  function mark(text, issues) {
    var out = e(text);
    issues.forEach(function (it) {
      if (!it.text) return;
      var t = e(it.text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(new RegExp(t, "gi"), function (m) { return '<mark class="mk-chk-bad">' + m + "</mark>"; });
    });
    return out.replace(/\n/g, "<br>");
  }

  function replaceIn(el, from, to) {
    if (!el || !from) return;
    var re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    el.value = el.value.replace(re, to);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function show(res) {
    var r = res.review || { issues: [] };
    var heavy = res.verdict === "heavy";
    var h = field("new-story-headline"), s = field("new-story-subtext");
    var box = document.createElement("div");
    box.id = "mk-chk";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    var issues = r.issues || [];
    box.innerHTML = '<div class="mk-chk-card">' +
      "<h3>" + (heavy ? "⛔ " + e(L("So kann die Story nicht online gehen", "Bu hikâye bu haliyle yayınlanamaz")) : "⚠️ " + e(L("Bitte kurz prüfen", "Lütfen kısaca kontrol et"))) + "</h3>" +
      "<p class=\"mk-chk-why\">" + e(L(r.reason_de || "", r.reason_tr || r.reason_de || "")) + "</p>" +
      (r.image_problem ? '<p class="mk-chk-img">🖼️ ' + e(L("Bild:", "Resim:")) + " " + e(r.image_problem) + "</p>" : "") +
      (issues.length ? '<div class="mk-chk-text"><b>' + e(h ? h.value : "") + "</b><br>" + mark(s ? s.value : "", issues) + "</div>" : "") +
      issues.map(function (it, i) {
        return '<div class="mk-chk-issue"><div><mark class="mk-chk-bad">' + e(it.text) + "</mark> – " + e(L(it.why_de, it.why_tr || it.why_de)) + "</div>" +
          (it.suggestion ? '<div class="mk-chk-sug">💡 ' + e(L("Besser:", "Bunun yerine:")) + " <b>" + e(it.suggestion) + '</b> <button type="button" data-i="' + i + '">✏️ ' + e(L("Übernehmen", "Öneriyi kullan")) + "</button></div>" : "") + "</div>";
      }).join("") +
      '<div class="mk-chk-btns">' +
      (issues.some(function (x) { return x.suggestion; }) ? '<button type="button" class="mk-chk-all">✏️ ' + e(L("Alle Vorschläge übernehmen", "Tüm önerileri kullan")) + "</button>" : "") +
      '<button type="button" class="mk-chk-edit">' + e(L("Selbst ändern", "Kendim düzelteyim")) + "</button>" +
      '<button type="button" class="mk-chk-send">' + e(heavy ? L("Trotzdem senden (wird abgelehnt)", "Yine de gönder (reddedilir)") : L("Trotzdem senden – Admin prüft", "Yine de gönder – admin kontrol eder")) + "</button>" +
      "</div></div>";
    document.body.appendChild(box);
    var close = function () { box.remove(); };
    var apply = function (it) { replaceIn(h, it.text, it.suggestion); replaceIn(s, it.text, it.suggestion); };
    box.querySelectorAll("[data-i]").forEach(function (b) {
      b.onclick = function () { apply(issues[Number(b.getAttribute("data-i"))]); b.textContent = "✓"; b.disabled = true; };
    });
    var all = box.querySelector(".mk-chk-all");
    if (all) all.onclick = function () { issues.forEach(function (it) { if (it.suggestion) apply(it); }); close(); if (typeof showToast === "function") showToast(L("Vorschläge übernommen – bitte nochmal senden.", "Öneriler eklendi – lütfen tekrar gönder.")); };
    box.querySelector(".mk-chk-edit").onclick = function () { close(); if (s) s.focus(); };
    box.querySelector(".mk-chk-send").onclick = function () { close(); skipOnce = true; window.submitUserStory(); };
  }

  window.submitUserStory = submitUserStory = async function () {
    if (skipOnce || isAdmin()) { skipOnce = false; return baseSubmit.apply(this, arguments); }
    var h = field("new-story-headline"), s = field("new-story-subtext"), f = field("new-story-file");
    if (!h || !h.value.trim()) return baseSubmit.apply(this, arguments); // the normal form message
    try {
      var fd = new FormData();
      fd.append("headline", h.value.trim());
      fd.append("subtext", s ? s.value.trim() : "");
      var file = f && f.files && f.files[0];
      if (file && /^image\//.test(file.type) && file.size <= 3 * 1024 * 1024) fd.append("file", file);
      if (typeof showToast === "function") showToast(L("Wird kurz geprüft …", "Kısaca kontrol ediliyor …"));
      var res = await fetch("/api/story-check", { method: "POST", body: fd }).then(function (r) { return r.ok ? r.json() : null; });
      if (res && res.verdict && res.verdict !== "ok") { show(res); return; }
    } catch (x) {
      // check not reachable: send as before (the server checks again)
    }
    return baseSubmit.apply(this, arguments);
  };

  var css = document.createElement("style");
  css.textContent =
    "#mk-chk{position:fixed;inset:0;z-index:10060;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:14px}" +
    ".mk-chk-card{width:100%;max-width:460px;max-height:90vh;overflow:auto;background:var(--surface-color,#fff);color:var(--text-main,#0F172A);border-radius:18px;padding:18px}" +
    ".mk-chk-card h3{margin:0 0 6px;font-size:18px}.mk-chk-why{margin:0 0 8px;font-size:14px}.mk-chk-img{margin:0 0 8px;font-size:13px;color:#b91c1c;font-weight:700}" +
    ".mk-chk-text{padding:10px;border-radius:10px;background:rgba(127,127,127,.1);font-size:14px;line-height:1.5;margin:6px 0 10px;max-height:200px;overflow:auto}" +
    ".mk-chk-bad{background:#fecaca;color:#b91c1c;font-weight:800;border-radius:4px;padding:0 3px}" +
    ".mk-chk-issue{border-left:4px solid #E30A17;padding:6px 10px;margin:6px 0;font-size:13.5px}.mk-chk-sug{margin-top:4px;color:#15803d}" +
    ".mk-chk-sug button{margin-left:6px;border:0;border-radius:8px;padding:4px 8px;background:#15803d;color:#fff;font:inherit;font-size:12px;cursor:pointer}" +
    ".mk-chk-btns{display:flex;flex-direction:column;gap:8px;margin-top:12px}.mk-chk-btns button{padding:11px;border-radius:12px;border:0;font:inherit;font-weight:800;cursor:pointer}" +
    ".mk-chk-all{background:#15803d;color:#fff}.mk-chk-edit{background:#1E3A8A;color:#fff}.mk-chk-send{background:transparent;color:inherit;border:1px solid rgba(127,127,127,.4)!important;font-weight:600!important}";
  document.head.appendChild(css);
})();
