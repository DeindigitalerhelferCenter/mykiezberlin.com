/* My Kiez Berlin – admin additions for sponsors (2026-11-17, owner).
   1. 📸 Sponsor-Medien: closed by default (open/close is remembered), grouped per sponsor, 24 per page,
      filter "last 7 days"; button to make big old pictures smaller (they slowed down web and app).
   2. ⏸️ Ended / paused sponsors: own window under the active sponsors, reminder on top of the admin page,
      renewal offer by e-mail – the admin reads and changes the text first and sends it himself (approval).
   3. 📊 Short explanation how the statistics and the monthly goals are counted.
   Uses /api/sponsor-panel (admin actions adminMediaGroups, adminMediaOf, adminMediaBig, adminMediaReplace,
   adminAds, adminOffer, adminOfferLater, adminActivate, adminMedia). */
(function () {
  "use strict";
  var OPEN_KEY = "mk_admin_media_open";
  var DAY = 86400000;
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function panel(action, data) {
    return fetch("/api/sponsor-panel", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify(Object.assign({ action: action }, data || {})) })
      .then(function (r) { return r.json().catch(function () { return {}; }); }).catch(function () { return { error: "offline" }; });
  }
  var PLAN = { s: "Basic", m: "Plus", l: "Premium", gp: "Gründungspartner", banner: "Banner" };
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:14px;padding:16px;margin-bottom:16px;color:#e6edf3";
  var BTN = "background:#21262d;border:1px solid #30363d;color:#e6edf3;border-radius:10px;padding:7px 12px;font-weight:700;font-size:12.5px;cursor:pointer";
  var INPUT = "width:100%;background:#0d1117;border:1px solid #30363d;color:#fff;border-radius:8px;padding:8px 10px;margin:4px 0 8px;font:inherit;box-sizing:border-box";
  function kb(n) { n = Number(n) || 0; return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.round(n / 1024) + " KB"; }
  function date(ms) { return ms ? new Date(ms).toLocaleDateString("de-DE") : "–"; }
  function isOpen() { try { return localStorage.getItem(OPEN_KEY) === "1"; } catch (x) { return false; } }
  function setOpen(v) { try { localStorage.setItem(OPEN_KEY, v ? "1" : "0"); } catch (x) {} }

  function box(id, afterId) {
    var view = document.getElementById("admin-main-view");
    if (!view) return null;
    var b = document.getElementById(id);
    if (!b) {
      b = document.createElement("div");
      b.id = id;
      b.style.cssText = CARD;
      var after = afterId && document.getElementById(afterId);
      if (after && after.parentNode === view) after.insertAdjacentElement("afterend", b); else view.appendChild(b);
    }
    return b;
  }

  // ---------------- 1. sponsor media ----------------
  var mediaState = { adId: "", days: 0, offset: 0 };
  function mediaSection() {
    var b = document.getElementById("admin-sponsor-media") || box("admin-sponsor-media");
    if (!b) return;
    var open = isOpen();
    b.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<h3 style="margin:0;font-size:16px;font-weight:800">📸 Sponsor-Medien · Sponsor medyası</h3>' +
      '<span style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" data-opt style="' + BTN + '">🗜️ Büyük resimleri küçült</button>' +
      '<button type="button" data-toggle style="' + BTN + '">' + (open ? "🙈 Kapat · Gizle" : "👁 Aç · Göster") + "</button></span></div>" +
      '<div class="opt" style="font-size:12.5px;margin-top:8px"></div>' +
      '<div class="body" style="font-size:13px;color:#8b949e;margin-top:8px">' + (open ? "…" : "Kapalı. Sponsorların yüklediği resim/videoları görmek için \"Aç\". · Geschlossen – zum Ansehen \"Aç\" drücken.") + "</div>";
    b.querySelector("[data-toggle]").onclick = function () { setOpen(!isOpen()); mediaSection(); };
    b.querySelector("[data-opt]").onclick = function () { optimize(b.querySelector(".opt")); };
    if (open) groups(b.querySelector(".body"));
  }
  window.mkSponsorMediaV2 = mediaSection;

  function groups(body) {
    panel("adminMediaGroups").then(function (j) {
      if (!j.groups) { body.textContent = "Fehler · Hata: " + (j.error || "?"); return; }
      if (!j.groups.length) { body.innerHTML = "Henüz yükleme yok · Noch nichts hochgeladen"; return; }
      body.style.color = "#e6edf3";
      body.innerHTML = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' +
        '<button type="button" data-days="7" style="' + BTN + (mediaState.days === 7 && !mediaState.adId ? ";border-color:#2ea043" : "") + '">🆕 Son 7 gün · alle Sponsoren</button></div>' +
        j.groups.map(function (g) {
          return '<div data-ad="' + e(g.ad_id) + '" style="border-bottom:1px solid #30363d;padding:8px 0">' +
            '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;cursor:pointer" data-head>' +
            "<b>" + e(g.name || g.ad_id) + "</b><small style=\"color:#8b949e\">" + g.total + " medya" + (g.week ? " · 🆕 " + g.week + " son 7 gün" : "") + (g.hidden ? " · 🙈 " + g.hidden + " gizli" : "") + " · son: " + date(g.last) + " ▾</small></div>" +
            '<div class="items"></div></div>';
        }).join("") + '<div class="all7"></div>';
      body.querySelectorAll("[data-head]").forEach(function (h) {
        h.onclick = function () {
          var row = h.parentNode, items = row.querySelector(".items");
          if (items.innerHTML) { items.innerHTML = ""; return; }
          page(items, row.getAttribute("data-ad"), 0, 0);
        };
      });
      body.querySelector("[data-days]").onclick = function () {
        var out = body.querySelector(".all7");
        if (out.innerHTML) { out.innerHTML = ""; return; }
        page(out, "", 7, 0);
      };
    });
  }

  function page(target, adId, days, offset) {
    if (!offset) target.innerHTML = '<div style="color:#8b949e;padding:6px 0">…</div>';
    panel("adminMediaOf", { adId: adId, days: days, offset: offset, limit: 24 }).then(function (j) {
      if (!j.media) { target.textContent = "Fehler · Hata: " + (j.error || "?"); return; }
      var grid = target.querySelector(".mk-mgrid");
      if (!offset || !grid) {
        target.innerHTML = '<div class="mk-mgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px"></div><div class="more" style="margin-top:8px"></div>';
        grid = target.querySelector(".mk-mgrid");
      }
      if (!j.media.length && !offset) grid.innerHTML = '<span style="color:#8b949e">–</span>';
      grid.insertAdjacentHTML("beforeend", j.media.map(function (m) { return fig(m, !!adId); }).join(""));
      bindFigs(grid, function () { page(target, adId, days, 0); });
      var more = target.querySelector(".more");
      more.innerHTML = j.more ? '<button type="button" style="' + BTN + '">⬇️ Daha fazla yükle · Mehr laden</button>' : "";
      if (j.more) more.querySelector("button").onclick = function () { page(target, adId, days, offset + 24); };
    });
  }

  function src(m) { return m.media_key.charAt(0) === "/" || m.media_key.indexOf("https://") === 0 ? m.media_key : "/media/" + m.media_key; }
  function fig(m, movable) {
    var u = src(m);
    var pic = m.media_type === "instagram"
      ? '<a href="' + e(u) + '" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;width:100%;aspect-ratio:1;background:linear-gradient(135deg,#feda75,#d62976,#4f5bd5);color:#fff;font-weight:800">Instagram</a>'
      : m.media_type === "video"
        ? '<video src="' + e(u) + '#t=0.5" preload="metadata" muted playsinline controls style="width:100%;aspect-ratio:1;object-fit:cover;background:#000"></video>'
        : '<a href="' + e(u) + '" target="_blank" rel="noopener"><img src="' + e(u) + '" alt="" loading="lazy" decoding="async" style="width:100%;aspect-ratio:1;object-fit:cover;display:block"></a>';
    return '<figure data-id="' + e(m.id) + '" style="margin:0;background:#0d1117;border-radius:12px;overflow:hidden;' + (m.status === "hidden" ? "opacity:.45" : "") + '">' + pic +
      '<figcaption style="padding:6px 8px;font-size:11.5px"><b>' + e(m.name || m.ad_id) + "</b><br>" + e(m.caption || "") + '<br><span style="color:#8b949e">' + new Date(m.created_at).toLocaleString("de-DE") + (m.bytes ? " · " + kb(m.bytes) : "") + (m.status === "hidden" ? " · gizli" : "") + "</span>" +
      '<div style="display:flex;gap:4px;margin-top:6px"><button type="button" data-s="' + (m.status === "hidden" ? "live" : "hidden") + '" style="' + BTN + ';flex:1;padding:5px">' + (m.status === "hidden" ? "👁 Göster" : "🙈 Gizle") + '</button>' +
      '<button type="button" data-s="delete" style="' + BTN + ';padding:5px" title="Kalıcı sil · endgültig löschen">🗑️</button></div>' +
      // 2026-11-17 (owner): order of the pictures (same order in web and app) – only inside one sponsor
      (movable ? '<div style="display:flex;gap:4px;margin-top:4px">' + [["first", "⏮", "En öne"], ["up", "◀", "Bir öne"], ["down", "▶", "Bir arkaya"], ["last", "⏭", "En arkaya"]].map(function (b) { return '<button type="button" data-to="' + b[0] + '" title="' + b[2] + '" style="' + BTN + ';flex:1;padding:4px">' + b[1] + "</button>"; }).join("") + "</div>" : "") +
      "</figcaption></figure>";
  }
  function bindFigs(grid, reload) {
    grid.querySelectorAll("button[data-s]").forEach(function (b) {
      if (b.dataset.bound) return;
      b.dataset.bound = "1";
      b.onclick = function () {
        if (b.dataset.s === "delete" && !confirm("Kalıcı olarak silinsin mi? · Endgültig löschen?")) return;
        panel("adminMedia", { id: b.closest("figure").dataset.id, status: b.dataset.s }).then(reload);
      };
    });
    grid.querySelectorAll("button[data-to]").forEach(function (b) {
      if (b.dataset.bound) return;
      b.dataset.bound = "1";
      b.onclick = function () { b.disabled = true; panel("adminMove", { id: b.closest("figure").dataset.id, to: b.dataset.to }).then(reload); };
    });
  }

  // big old pictures -> smaller WebP in this browser, then uploaded again (original stays in R2)
  // 2026-11-17 (owner: "automatic, I cannot do this by hand"): shrinkList is used by the button and by autoShrink,
  // which runs by itself a few seconds after the admin page opens.
  var FAIL_KEY = "mk_shrink_failed_v1";
  var shrinking = false;
  function failedIds() { try { return JSON.parse(localStorage.getItem(FAIL_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function shrinkOne(m) {
    return fetch(m.url).then(function (r) { if (!r.ok) throw new Error("load"); return r.blob(); }).then(function (blob) {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(blob), img = new Image();
        img.onload = function () {
          // 2026-11-17: pictures the browser cannot decode (broken JPEG) are skipped, never replaced by a white one
          (img.decode ? img.decode() : Promise.resolve()).then(function () { return window.mkShrinkCanvas(img); })
            .then(function (b) { URL.revokeObjectURL(url); resolve(b); }, function (e) { URL.revokeObjectURL(url); reject(e); });
        };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("image")); };
        img.src = url;
      });
    }).then(function (small) {
      if (!small || small.size >= (m.bytes || Infinity)) throw new Error("not smaller");
      return new Promise(function (resolve) { var fr = new FileReader(); fr.onload = function () { resolve({ data: fr.result, size: small.size }); }; fr.readAsDataURL(small); });
    }).then(function (r) {
      return panel("adminMediaReplace", { id: m.id, data: r.data }).then(function (j2) {
        if (!j2.ok) throw new Error(j2.error || "save");
        return (m.bytes || 0) - r.size;
      });
    });
  }
  function shrinkList(list, show, finish) {
    if (shrinking) return;
    shrinking = true;
    var done = 0, saved = 0, failed = 0, bad = failedIds();
    var step = function (i) {
      if (i >= list.length) {
        shrinking = false;
        try { localStorage.setItem(FAIL_KEY, JSON.stringify(bad)); } catch (e) {}
        finish(done, saved, failed);
        return;
      }
      var m = list[i];
      show(i + 1, list.length, m);
      shrinkOne(m).then(function (s) { done++; saved += s; delete bad[m.id]; }, function () { failed++; bad[m.id] = Date.now(); }).then(function () { step(i + 1); });
    };
    step(0);
  }
  function bigList() {
    return panel("adminMediaBig").then(function (j) {
      var bad = failedIds(), week = Date.now() - 7 * DAY;
      // a picture that failed in this browser is tried again after 7 days at the earliest
      return (j.media || []).filter(function (m) { return !(bad[m.id] > week); });
    });
  }
  function statusLine() {
    var b = document.getElementById("admin-sponsor-media");
    return b ? b.querySelector(".opt") : null;
  }

  function optimize(out) {
    if (!window.mkShrinkCanvas) { out.textContent = "image-shrink.js fehlt"; return; }
    if (shrinking) { out.textContent = "⏳ Küçültme zaten çalışıyor · läuft schon"; return; }
    out.innerHTML = "🔎 Büyük resimler aranıyor…";
    bigList().then(function (list) {
      if (!list.length) { out.innerHTML = '<span style="color:#3fb950">✓ 300 KB üzerinde resim yok · keine großen Bilder</span>'; return; }
      var total = list.reduce(function (n, m) { return n + (m.bytes || 0); }, 0);
      out.innerHTML = list.length + " büyük resim (" + kb(total) + "). <button type=\"button\" style=\"" + BTN + "\">▶️ Hepsini küçült</button>";
      out.querySelector("button").onclick = function () {
        shrinkList(list, function (n, all, m) {
          var o = statusLine() || out;
          o.textContent = "⏳ " + n + " / " + all + " · " + (m.name || m.ad_id);
        }, function (done, saved, failed) {
          var o = statusLine() || out;
          o.innerHTML = '<span style="color:#3fb950">✓ ' + done + " resim küçültüldü, " + kb(saved) + " tasarruf" + (failed ? " · " + failed + " atlandı" : "") + "</span>";
          if (isOpen()) mediaSection();
        });
      };
    });
  }

  // runs by itself once per admin page visit, a few seconds after the page opened
  var autoStarted = false;
  function autoShrink() {
    if (autoStarted || !window.mkShrinkCanvas || !token()) return;
    autoStarted = true;
    setTimeout(function () {
      bigList().then(function (list) {
        if (!list.length) return;
        shrinkList(list, function (n, all) {
          var o = statusLine();
          if (o) o.textContent = "🗜️ Otomatik küçültme · automatisch: " + n + " / " + all;
        }, function (done, saved, failed) {
          var o = statusLine();
          if (o) o.innerHTML = '<span style="color:#3fb950">✓ Otomatik: ' + done + " resim küçültüldü, " + kb(saved) + " tasarruf" + (failed ? " · " + failed + " atlandı" : "") + "</span>";
        });
      });
    }, 5000);
  }

  // ---------------- 2. ended / paused sponsors ----------------
  function ended(a, now) { return a.active === 0 || (a.end_at && a.end_at < now); }
  function due(a, now) { return !a.offer_stop && (!a.offer_next || a.offer_next <= now); }

  function offerText(a) {
    return "Hallo " + (a.name || "") + ",\n\n" +
      "vielen Dank, dass Sie Sponsor bei My Kiez Berlin waren! Ihre Anzeige ist zurzeit nicht mehr online.\n" +
      "Gerne zeigen wir Sie wieder in Ihrem Kiez – in der App und auf mykiezberlin.com.\n\n" +
      "Pakete: Kiez Basic 29 € · Kiez Plus 49 € · Kiez Premium 89 € pro Monat.\n" +
      "Alle Infos und Buchung: https://mykiezberlin.com/werben\n\n" +
      "Antworten Sie einfach auf diese E-Mail, dann melden wir uns.\n\n" +
      "—\n\n" +
      "Merhaba " + (a.name || "") + ",\n\n" +
      "My Kiez Berlin'e sponsor olduğunuz için teşekkür ederiz! Reklamınız şu anda yayında değil.\n" +
      "Sizi tekrar Kiez'inizde – uygulamada ve mykiezberlin.com'da – göstermekten memnuniyet duyarız.\n\n" +
      "Paketler: Kiez Basic 29 € · Kiez Plus 49 € · Kiez Premium 89 € / ay.\n" +
      "Tüm bilgiler ve rezervasyon: https://mykiezberlin.com/werben\n\n" +
      "Bu e-postayı yanıtlamanız yeterli, size dönüş yapacağız.\n\n" +
      "Viele Grüße · Saygılarımızla\nMy Kiez Berlin";
  }

  function endedSection(ads, now) {
    var list = ads.filter(function (a) { return ended(a, now); });
    var b = box("admin-sponsor-ended", "admin-sponsor-panel");
    if (!b) return;
    if (!list.length) { b.innerHTML = '<h3 style="margin:0 0 6px;font-size:16px;font-weight:800">⏸️ Pasif / süresi bitmiş sponsorlar</h3><div style="color:#8b949e;font-size:13px">Yok · Keine</div>'; return; }
    b.innerHTML = '<h3 style="margin:0 0 4px;font-size:16px;font-weight:800">⏸️ Pasif / süresi bitmiş sponsorlar · Pausiert / abgelaufen (' + list.length + ")</h3>" +
      '<p style="color:#8b949e;font-size:12px;margin:0 0 8px">Bunlar sitede ve uygulamada görünmüyor. 🔔 = teklif zamanı (her 30 günde bir tekrar hatırlatılır). Teklif sadece sen metni okuyup "Gönder"e bastığında gider.</p>' +
      list.map(function (a) {
        var last = a.offer_log && a.offer_log.length ? a.offer_log[a.offer_log.length - 1] : null;
        var why = a.active === 0 ? "pasif · pausiert" : "süresi bitti · abgelaufen " + date(a.end_at);
        return '<div data-id="' + e(a.id) + '" style="border-bottom:1px solid #30363d;padding:8px 0;font-size:13px">' +
          '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">' +
          '<b style="flex:1;min-width:160px">' + (due(a, now) ? "🔔 " : "") + e(a.name) + ' <small style="color:#8b949e">' + e(PLAN[a.plan] || a.plan || "") + " · " + why + "</small></b>" +
          '<button type="button" data-act="offer" style="' + BTN + '">✉️ Teklif hazırla</button>' +
          '<button type="button" data-act="later" style="' + BTN + '">⏰ 30 gün sonra</button>' +
          '<button type="button" data-act="stop" style="' + BTN + '">🔕 Hatırlatma</button>' +
          '<button type="button" data-act="on" style="' + BTN + ';border-color:#2ea043">▶️ Tekrar aktif et</button></div>' +
          '<small style="color:#8b949e">' + (last ? "Son teklif: " + date(last.at) + " → " + e(last.to) : "Henüz teklif gönderilmedi") + (a.offer_stop ? " · 🔕 hatırlatma kapalı" : a.offer_next > now ? " · sonraki hatırlatma " + date(a.offer_next) : "") + "</small>" +
          '<div class="out"></div></div>';
      }).join("");
    b.querySelectorAll("button[data-act]").forEach(function (btn) {
      var row = btn.closest("[data-id]"), id = row.getAttribute("data-id"), out = row.querySelector(".out");
      var a = list.find(function (x) { return x.id === id; });
      btn.onclick = function () {
        var act = btn.dataset.act;
        if (act === "offer") {
          out.innerHTML = '<label style="font-size:12px;color:#8b949e">E-Mail</label><input data-k="email" style="' + INPUT + '" value="' + e(a.email || "") + '">' +
            '<label style="font-size:12px;color:#8b949e">Betreff · Konu</label><input data-k="subject" style="' + INPUT + '" value="' + e("Wieder dabei bei My Kiez Berlin? · " + a.name) + '">' +
            '<label style="font-size:12px;color:#8b949e">Text · Metin (değiştirebilirsin)</label><textarea data-k="text" rows="12" style="' + INPUT + '">' + e(offerText(a)) + "</textarea>" +
            '<button type="button" data-send style="' + BTN + ';background:#E30613;border-color:#E30613">✅ Onayla ve gönder</button> <span class="r"></span>';
          out.querySelector("[data-send]").onclick = function () {
            var v = function (k) { return out.querySelector('[data-k="' + k + '"]').value; };
            if (!confirm("Teklif " + v("email") + " adresine gönderilsin mi?")) return;
            panel("adminOffer", { adId: id, email: v("email"), subject: v("subject"), text: v("text") }).then(function (j) {
              out.querySelector(".r").innerHTML = j.ok ? '<span style="color:#3fb950">✓ Gönderildi · gesendet</span>' : "Fehler · Hata: " + e(j.error || "?");
              if (j.ok) setTimeout(refresh, 1200);
            });
          };
        } else if (act === "later" || act === "stop") {
          panel("adminOfferLater", { adId: id, days: act === "stop" ? 0 : 30 }).then(function (j) { if (j.ok) refresh(); else out.textContent = "Fehler · Hata: " + (j.error || "?"); });
        } else if (act === "on") {
          if (!confirm(a.name + " tekrar aktif edilsin mi? (bitiş tarihi kaldırılır)")) return;
          panel("adminActivate", { adId: id }).then(function (j) { if (j.ok) refresh(); else out.textContent = "Fehler · Hata: " + (j.error || "?"); });
        }
      };
    });
  }

  function reminder(ads, now) {
    var view = document.getElementById("admin-main-view");
    if (!view) return;
    var old = document.getElementById("admin-sponsor-reminder");
    if (old) old.remove();
    var offers = ads.filter(function (a) { return ended(a, now) && due(a, now); });
    var soon = ads.filter(function (a) { return a.active !== 0 && a.end_at && a.end_at > now && a.end_at < now + 7 * DAY; });
    if (!offers.length && !soon.length) return;
    var div = document.createElement("div");
    div.id = "admin-sponsor-reminder";
    div.style.cssText = CARD + ";border-color:#d29922;background:#2d2410";
    div.innerHTML = "<b>🔔 Hatırlatma · Erinnerung</b><ul style=\"margin:6px 0 0;padding-left:18px;font-size:13px\">" +
      (offers.length ? "<li>" + offers.length + " eski sponsora teklif zamanı: " + offers.map(function (a) { return e(a.name); }).join(", ") + ' – <a href="#admin-sponsor-ended" style="color:#58a6ff">aç</a></li>' : "") +
      (soon.length ? "<li>7 gün içinde süresi bitiyor: " + soon.map(function (a) { return e(a.name) + " (" + date(a.end_at) + ")"; }).join(", ") + "</li>" : "") + "</ul>";
    view.insertBefore(div, view.firstChild);
  }

  // the "Sponsor-Panel" list shows only active sponsors now (admin-sponsors.js reads this filter)
  window.mkAdminActiveOnly = function (ads) {
    var now = Date.now();
    return ads.filter(function (a) { return !ended(a, now); });
  };

  function refresh() {
    panel("adminAds").then(function (j) {
      if (!j || !j.ads) return;
      var now = j.now || Date.now();
      endedSection(j.ads, now);
      reminder(j.ads, now);
    });
  }

  // ---------------- 3. statistics explanation ----------------
  function statsHelp() {
    var b = box("admin-stats-help", "admin-stats");
    if (!b) return;
    b.style.cssText = CARD + ";font-size:12.5px;color:#c9d1d9";
    b.innerHTML = "<details><summary style=\"cursor:pointer;font-weight:800;font-size:14px\">ℹ️ Bu sayılar nasıl hesaplanıyor? · Wie wird gezählt?</summary>" +
      "<ul style=\"margin:8px 0 0;padding-left:18px;line-height:1.6\">" +
      "<li><b>Paket</b>: sponsorun veritabanındaki paketi (Basic / Plus / Premium). Sponsor-Panel'de değiştirilebilir.</li>" +
      "<li><b>Görüldü</b>: sponsor kartı ekranda <b>en az yarısı 1 saniye</b> göründüğünde 1 sayılır (13.11.2026'dan beri). Admin, testler ve botlar sayılmaz. Aynı sayfada aynı kart bir kez sayılır.</li>" +
      "<li><b>Tık</b>: kullanıcı karttaki Ara / WhatsApp / Web / Instagram'a bastığında 1 sayılır.</li>" +
      "<li><b>%</b> = tık ÷ görüldü × 100 (tıklama oranı).</li>" +
      "<li><b>Aylık hedef</b>: her pakete söz verilen aylık görüntülenme – Basic 1.000, Plus 3.000, Premium 8.000. Çubuk bu ayın sayısını gösterir; " +
      "<span style=\"color:#2ea043\">yeşil</span> = bugüne kadar olması gerekenin üstünde, <span style=\"color:#d29922\">sarı</span> = biraz geride, <span style=\"color:#f85149\">kırmızı</span> = çok geride.</li>" +
      "<li>Hedef sadece gösterge değil: <b>geride kalan sponsor rotasyonda otomatik daha sık gösterilir</b> (en fazla 3 kat), önde olan daha az. Böylece ay sonunda herkes hedefine yaklaşır.</li>" +
      "<li>Ziyaretçi = günlük cihaz sayısı (anonim, çerezsiz).</li></ul></details>";
  }

  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () {
      var r = base.apply(this, arguments);
      try { setTimeout(function () { statsHelp(); refresh(); autoShrink(); }, 0); } catch (x) {}
      return r;
    };
  }
})();
