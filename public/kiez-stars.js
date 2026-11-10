/* My Kiez Berlin: "Kiez-Stars der Woche" – same ranking, badges and trophy as the app (/api/stars).
   Also makes the name required when sharing a story (it counts for the ranking). */
(function () {
  "use strict";
  var NAME_KEY = "mk_author";
  var SEEN_KEY = "mk_stars_seen";
  var data = null;

  function lang() {
    var l = (typeof currentLanguage === "string" ? currentLanguage : "de").toLowerCase();
    return l.indexOf("tr") === 0 ? "tr" : l.indexOf("en") === 0 ? "en" : "de";
  }
  function t(de, tr, en) { var l = lang(); return l === "tr" ? tr : l === "en" ? en : de; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function getName() { try { return localStorage.getItem(NAME_KEY) || ""; } catch (e) { return ""; } }
  function setName(v) { try { localStorage.setItem(NAME_KEY, v); } catch (e) {} }
  function medal(r) { return r === 1 ? "🏆" : r === 2 ? "🥈" : r === 3 ? "🥉" : "⭐"; }
  // singular / plural: "1 Story", "2 Stories"
  function storyWord(n) { return n === 1 ? t("Story", "hikâye", "story") : t("Stories", "hikâye", "stories"); }
  function badgeName(b) { return b ? b.icon + " " + (lang() === "tr" ? b.tr : lang() === "en" ? b.en : b.de) : ""; }

  function render() {
    var section = document.querySelector(".stories-section");
    if (!section) return;
    var box = document.getElementById("mk-stars");
    if (!box) {
      box = document.createElement("section");
      box.id = "mk-stars";
      box.style.cssText = "margin:8px 16px;padding:14px;border:2px solid #F2B705;border-radius:18px;background:linear-gradient(rgba(242,183,5,.18),transparent)";
      section.insertAdjacentElement("afterend", box);
    }
    var top = (data && data.top || []).slice(0, 3);
    var rows = top.length ? top.map(function (s) {
      var bg = s.rank === 1 ? "rgba(242,183,5,.22)" : s.rank === 2 ? "rgba(184,194,204,.25)" : "rgba(205,127,50,.18)";
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;margin-top:6px;background:' + bg + '"><span style="font-size:22px">' + medal(s.rank) + '</span><div style="flex:1"><b>' + esc(s.name) + '</b>' + (s.badge ? '<div style="font-size:11.5px">' + esc(badgeName(s.badge)) + "</div>" : "") + '</div><b>' + s.count + " " + storyWord(s.count) + "</b></div>";
    }).join("") : '<div style="font-size:13px;margin-top:6px">' + t("Diese Woche hat noch niemand eine Story geteilt. Sei die/der Erste und hol dir den Pokal! 🚀", "Bu hafta henüz kimse hikâye paylaşmadı. İlk sen ol, kupayı kap! 🚀", "Nobody has shared a story this week yet. Be the first and grab the trophy! 🚀") + "</div>";
    var name = getName(), mine = data && data.me ? data.me.count : 0, progress;
    var steps = [[3, t("Bronze", "Bronz", "Bronze")], [7, t("Silber", "Gümüş", "Silver")], [12, "Gold"]];
    var next = steps.filter(function (s) { return mine < s[0]; })[0];
    if (!name) progress = t("Teile eine Story und komm mit deinem Namen auf die Liste!", "Hikâye paylaş, adınla listeye gir!", "Share a story and get on the list with your name!");
    else if (!next) progress = esc(name) + t(", " + mine + " Stories diese Woche – 🥇 Gold gehört dir! 🎉", ", bu hafta " + mine + " hikâye – 🥇 Altın rozet senin! 🎉", ", " + mine + " stories this week – 🥇 Gold is yours! 🎉");
    else progress = esc(name) + t(", du hast diese Woche " + mine + " Stories geteilt – noch " + (next[0] - mine) + " bis " + next[1] + " 💪", ", bu hafta " + mine + " hikâye paylaştın – " + next[1] + " rozete " + (next[0] - mine) + " kaldı 💪", ", you shared " + mine + " stories this week – " + (next[0] - mine) + " more for " + next[1] + " 💪");
    var last = data && data.lastWeek && data.lastWeek.top && data.lastWeek.top.length;
    box.innerHTML = '<div style="display:flex;align-items:center"><b style="font-size:17px;flex:1">🏆 ' + t("Kiez-Stars der Woche", "Haftanın Kiez Yıldızları", "Kiez Stars of the week") + "</b>" +
      (last ? '<a href="#" id="mk-stars-last" style="font-size:12px;font-weight:700;color:#0369A1">' + t("Letzte Woche →", "Geçen hafta →", "Last week →") + "</a>" : "") + "</div>" + rows +
      '<div style="font-size:12.5px;font-weight:600;margin-top:8px">' + progress + "</div>" +
      '<div style="font-size:11px;opacity:.7;margin-top:2px">🥉 3 · 🥈 7 · 🥇 12 ' + t("Stories / Woche", "hikâye / hafta", "stories / week") + "</div>" +
      '<button id="mk-stars-share" style="margin-top:10px;width:100%;padding:10px;border:0;border-radius:12px;background:#E30613;color:#fff;font-weight:700"><i class="bi bi-camera-fill" aria-hidden="true"></i> ' + t("Story teilen", "Hikâye paylaş", "Share a story") + "</button>";
    var share = document.getElementById("mk-stars-share");
    if (share) share.onclick = function () { if (typeof openCreateStoryModal === "function") openCreateStoryModal(); };
    var lastLink = document.getElementById("mk-stars-last");
    if (lastLink) lastLink.onclick = function (e) { e.preventDefault(); trophy(); };
  }

  function trophy() {
    var winners = data && data.lastWeek && data.lastWeek.top || [];
    if (!winners.length) return;
    var o = document.createElement("div");
    o.className = "mk-stars-overlay";
    o.setAttribute("role", "dialog");
    o.setAttribute("aria-modal", "true");
    o.setAttribute("aria-label", t("Kiez-Star der letzten Woche", "Geçen haftanın Kiez Yıldızı", "Last week's Kiez Star"));
    o.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(16,24,32,.93);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:24px 16px;cursor:pointer;box-sizing:border-box;overflow-wrap:anywhere";
    // Title says "last week": the card below shows the current week, the overlay last week's winners
    o.innerHTML = '<button type="button" class="mk-stars-close" aria-label="' + t("Schließen", "Kapat", "Close") + '">✕</button>' +
      '<div style="max-width:min(520px,100%);position:relative">' +
      '<div style="font-size:clamp(64px,18vw,96px)">🏆</div><div style="color:#F2B705;font-size:clamp(20px,6vw,26px);font-weight:900">' + t("Kiez-Star der letzten Woche", "Geçen haftanın Kiez Yıldızı", "Last week's Kiez Star") + "</div>" +
      winners.map(function (w) { return '<div style="font-size:' + (w.rank === 1 ? "clamp(18px,5.5vw,24px)" : "clamp(15px,4.5vw,18px)") + ';font-weight:800;margin-top:8px">' + medal(w.rank) + " " + esc(w.name) + " · " + w.count + " " + storyWord(w.count) + "</div>"; }).join("") +
      '<div style="margin-top:12px;font-size:15px;line-height:1.4">' + t("Glückwunsch! Diese Woche bist du dran – teile deine Story.", "Tebrikler! Bu hafta sıra sende – hikâyeni paylaş.", "Congratulations! This week it's your turn – share your story.") + "</div>" +
      '<div style="margin-top:14px;font-size:12px;opacity:.75">' + t("Tippen oder Esc zum Schließen", "Kapatmak için dokun veya Esc", "Tap or press Esc to close") + "</div></div>";
    function close() { if (o.isConnected) o.remove(); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    o.onclick = close;
    document.addEventListener("keydown", onKey);
    setTimeout(close, 6000); // closes by itself after 6 s
    document.body.appendChild(o);
    var btn = o.querySelector(".mk-stars-close");
    if (btn) btn.focus();
    // Confetti (own canvas, no library needed)
    var c = document.createElement("canvas");
    c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
    o.insertBefore(c, o.firstChild);
    var ctx = c.getContext("2d"), W = c.width = innerWidth, H = c.height = innerHeight, start = performance.now();
    var colors = ["#F2B705", "#fff", "#E30613", "#0052A5", "#B8C2CC"];
    var pieces = Array.from({ length: 160 }, function () { return { x: Math.random() * W, y: -Math.random() * H, s: 8 + Math.random() * 10, v: 0.2 + Math.random() * 0.35, d: Math.random() * 0.1 - 0.05, c: colors[Math.floor(Math.random() * colors.length)] }; });
    (function frame(now) {
      if (!o.isConnected) return;
      var sec = (now - start) / 1000;
      ctx.clearRect(0, 0, W, H);
      pieces.forEach(function (p) { ctx.fillStyle = p.c; ctx.fillRect(p.x + p.d * sec * W, (p.y + p.v * sec * H) % (H * 1.2), p.s, p.s * 0.6); });
      if (sec < 9) requestAnimationFrame(frame);
    })(start);
  }

  function load() {
    var name = getName();
    fetch("/api/stars" + (name ? "?name=" + encodeURIComponent(name) : "")).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d) return;
      data = d;
      render();
      var week = d.lastWeek && d.lastWeek.week, seen = "";
      try { seen = localStorage.getItem(SEEN_KEY) || ""; } catch (e) {}
      if (week && d.lastWeek.top && d.lastWeek.top.length && seen !== week) {
        try { localStorage.setItem(SEEN_KEY, week); } catch (e) {}
        trophy();
      }
    }).catch(function () {});
  }

  // Name field in the story form (required), remembered for next time
  function addNameField() {
    var headline = document.getElementById("new-story-headline");
    if (!headline || document.getElementById("new-story-author")) return;
    var group = headline.closest(".form-group") || headline.parentNode;
    var div = document.createElement("div");
    div.className = "form-group";
    div.innerHTML = '<label class="form-label">' + t("Dein Name / Nutzername (Pflicht) *", "Adın / kullanıcı adın (zorunlu) *", "Your name / user name (required) *") + '</label><input id="new-story-author" class="form-control" maxlength="40"><div style="font-size:11px;opacity:.7">🏆 ' + t("Zählt für die Kiez-Stars der Woche", "Haftanın Kiez Yıldızları bu isimle sayılır", "Counts for the Kiez Stars of the week") + "</div>";
    group.insertAdjacentElement("afterend", div);
    document.getElementById("new-story-author").value = getName();
  }
  new MutationObserver(addNameField).observe(document.documentElement, { childList: true, subtree: true });

  // The upload sends the name; without a name nothing is sent
  var baseFetch = window.fetch;
  window.fetch = function (input, init) {
    try {
      var url = typeof input === "string" ? input : input && input.url;
      if (url && /\/api\/stories(\?|$)/.test(url) && init && init.method === "POST" && init.body instanceof FormData) {
        var field = document.getElementById("new-story-author");
        var name = field ? field.value.trim() : getName();
        if (!name) {
          if (typeof showToast === "function") showToast(t("Bitte gib deinen Namen ein.", "Lütfen adını yaz.", "Please enter your name."));
          if (field) field.focus();
          return Promise.resolve(new Response("{}", { status: 400 }));
        }
        setName(name);
        init.body.set("author", name);
      }
    } catch (e) {}
    return baseFetch.apply(this, arguments);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load); else load();
  setInterval(load, 5 * 60000);
})();
