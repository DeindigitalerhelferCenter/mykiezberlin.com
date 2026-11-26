/* Admin – news stories (2026-11-22, owner), see functions/_lib/news-auto.js:
   every 2 hours (06–22 Berlin) a list: urgent news on top (not counted) + 5 topics with own DE/TR text by the AI.
   The admin ticks topics, can change the text, picks a background (one of 6 templates, rotating, or an own picture)
   and publishes with one button. Switch "Automatisch": every new list publishes urgent + the first 3 by itself. */
(function () {
  "use strict";
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:12px;padding:14px;margin-bottom:16px;color:#c9d1d9;font-size:13px";
  var BTN = "background:#21262d;border:1px solid #30363d;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit;font-size:12.5px";
  var INP = "width:100%;box-sizing:border-box;padding:6px;border-radius:8px;border:1px solid #30363d;background:#0d1117;color:#fff;font:inherit;font-size:12.5px";
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function api(method, body, isForm) {
    var h = { "x-admin-token": token() };
    if (!isForm) h["content-type"] = "application/json";
    return fetch("/api/news-stories", { method: method, headers: h, body: body ? (isForm ? body : JSON.stringify(body)) : undefined, cache: "no-store" })
      .then(function (r) { return r.json().catch(function () { return {}; }); });
  }
  var tpl = 0; // 0 = rotating (kept for older calls; 2026-11-22 the settings decide)
  // 2026-11-22 (owner): settings that stay (server) + own background folder
  var ST = { gap: 30, lang: "tr-de", bgMode: "rotate", bgPicks: [] };
  var BGS = [];
  var GAPS = [[0, "hemen"], [15, "15 dk"], [30, "30 dk"], [60, "60 dk"], [90, "90 dk"], [120, "120 dk"]];
  function saveSettings(patch) {
    for (var k in patch) ST[k] = patch[k];
    return api("POST", Object.assign({ action: "settings" }, patch)).then(function (r) { if (r && r.settings) ST = r.settings; return r; });
  }
  function previewPick() { return ST.bgMode === "pick" && ST.bgPicks.length ? ST.bgPicks[0] : ""; }
  function bgSrc(pick) { return pick.charAt(0) === "t" ? "/assets/news/tpl-" + pick.slice(1) + ".webp" : "/media/" + pick.slice(2); }
  // any picture (also HEIC / WEBP from the phone) -> JPEG, max. 1080 x 1920
  function loadScript(src) { return new Promise(function (ok, bad) { var x = document.createElement("script"); x.src = src; x.onload = ok; x.onerror = bad; document.head.appendChild(x); }); }
  function toJpeg(file) {
    var heic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name || "");
    var src = heic
      ? (window.heic2any ? Promise.resolve() : loadScript("https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js"))
          .then(function () { return window.heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 }); })
          .then(function (b) { return Array.isArray(b) ? b[0] : b; })
      : Promise.resolve(file);
    return src.then(function (blob) {
      return new Promise(function (ok, bad) {
        var url = URL.createObjectURL(blob);
        var img = new Image();
        img.onload = function () {
          var k = Math.min(1, 1080 / img.width, 1920 / img.height);
          var c = document.createElement("canvas");
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          c.toBlob(function (b) { b ? ok(b) : bad(new Error("convert")); }, "image/jpeg", 0.88);
        };
        img.onerror = function () { URL.revokeObjectURL(url); bad(new Error("read")); };
        img.src = url;
      });
    });
  }

  // 2026-11-21 (owner): big preview window (real colours, readable text) – backgrounds and finished pictures
  function lightbox(src, title, onPick, onDelete, pickLabel) {
    var old = document.getElementById("admin-news-lb");
    if (old) old.remove();
    var lb = document.createElement("div");
    lb.id = "admin-news-lb";
    lb.style.cssText = "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:12px";
    lb.innerHTML = '<div style="color:#fff;font-weight:800;font-size:14px;text-align:center">' + e(title || "") + "</div>" +
      '<div id="admin-news-lb-img" style="color:#8b949e">…</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">' +
      (onPick ? '<button type="button" id="admin-news-lb-pick" style="' + BTN + ';background:#2ea043">' + (pickLabel || "✓ Bu arka planı seç") + "</button>" : "") +
      (onDelete ? '<button type="button" id="admin-news-lb-del" style="' + BTN + ';background:#da3633">🗑 Klasörden sil</button>' : "") +
      '<button type="button" id="admin-news-lb-close" style="' + BTN + '">✕ Kapat</button></div>';
    document.body.appendChild(lb);
    var box = document.getElementById("admin-news-lb-img");
    var img = new Image();
    img.alt = "";
    img.style.cssText = "max-width:min(94vw,560px);max-height:80vh;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.6)";
    img.onload = function () { box.textContent = ""; box.appendChild(img); };
    img.onerror = function () { box.textContent = "Ön izleme yüklenemedi."; };
    if (typeof src === "string") img.src = src;
    else src.then(function (u) { if (u) img.src = u; else box.textContent = "Ön izleme çizilemedi."; });
    var close = function () { lb.remove(); };
    lb.onclick = function (ev) { if (ev.target === lb) close(); };
    document.getElementById("admin-news-lb-close").onclick = close;
    if (onPick) document.getElementById("admin-news-lb-pick").onclick = function () { close(); onPick(); };
    if (onDelete) document.getElementById("admin-news-lb-del").onclick = function () { close(); onDelete(); };
  }

  function previewUrl(slot, id) {
    var fd = new FormData();
    fd.append("action", "preview"); fd.append("slot", slot); fd.append("id", id);
    fd.append("lang", (document.getElementById("admin-news-lang") || {}).value || "tr-de");
    var pk = previewPick();
    if (pk.charAt(0) === "t") fd.append("template", pk.slice(1)); else { fd.append("template", "0"); if (pk) fd.append("bgPick", pk); }
    return fetch("/api/news-stories", { method: "POST", headers: { "x-admin-token": token() }, body: fd, cache: "no-store" })
      .then(function (r) { return r.ok && /image/.test(r.headers.get("content-type") || "") ? r.blob() : null; })
      .then(function (b) { return b ? URL.createObjectURL(b) : null; })
      .catch(function () { return null; });
  }

  function slotLabel(s) { var p = s.split("-"); return p[2] + "." + p[1] + ". " + p[3] + ":00"; }

  // 2026-11-23 (owner "UYGULA 6"): "paylaşıldı" was only the site – now Facebook/Instagram are shown apart
  function metaBadge(j, it) {
    var soc = (j && j.social) || {};
    var ids = [it.published].concat(it.shares || []).filter(Boolean);
    var m = null, single = null, hand = [];
    ids.forEach(function (id) { var x = soc[id]; if (!x) return; if (x.meta) m = x.meta; if (x.single) single = x.single; (x.channels || []).forEach(function (c) { if (c !== "meta" && hand.indexOf(c) < 0) hand.push(c); }); });
    var out;
    if (single && (single.fb || single.ig)) out = '<b style="color:#3fb950">FB ' + (single.fb ? "✓" : "✕") + " · IG " + (single.ig ? "✓" : "✕") + "</b>";
    else if (m && m.status === "manual") out = '<b style="color:#3fb950">FB/IG: elle paylaşıldı ✓</b>';
    else if (m && m.status === "open") out = '<b style="color:#d29922">FB/IG: ⏳ ' + e(String(m.slot).slice(11)) + " toplusunda gönderiliyor</b>";
    else if (m && m.status === "failed") out = '<b style="color:#f85149">FB/IG: ✕ gönderilemedi – sıradaki toplu paylaşımda tekrar</b>';
    else if (m) out = '<b style="color:#3fb950">FB/IG: ✓ ' + e(String(m.slot).slice(11) || m.slot) + " toplusunda</b>";
    else out = '<span style="color:#8b949e">FB/IG: sıradaki toplu ' + e(String((j && j.nextMeta) || "").slice(11) || "–") + "</span>";
    if (hand.length) out += ' <span style="color:#8b949e">· elle: ' + e(hand.join(", ")) + "</span>";
    return out + " ";
  }
  var BG_TAG_NAMES = { genel: "Genel", spor: "⚽ Spor", kultur: "🎭 Kültür", acil: "🚨 Polis-Acil" };
  // 2026-11-26 (owner "UYGULA arka plan önerisi 1-4"): more topics; yazili/reklam/duz are never used automatically
  var BG_TAG_LIST = ["genel", "berlin", "acil", "ariza", "ariza-ulasim", "ariza-enerji", "ariza-dijital", "trafik", "hava", "politika", "adalet", "spor", "kultur", "ekonomi", "insaat", "egitim", "saglik", "cevre", "sosyal", "teknik", "turkiye", "yazili", "reklam", "duz", "acil-polis", "acil-itfaiye", "acil-ambulans", "duz-yesil"];
  // 2026-11-26 (owner "UYGULA acil öneri 1-4"): urgent pictures by kind; plain pictures = choice when the topic is not clear
  BG_TAG_NAMES["acil-polis"] = "🚓 Acil polis"; BG_TAG_NAMES["acil-itfaiye"] = "🚒 Acil itfaiye"; BG_TAG_NAMES["acil-ambulans"] = "🚑 Acil ambulans";
  BG_TAG_NAMES["duz-yesil"] = "🟩 Düz yeşil (kararsız haber)";
  BG_TAG_NAMES.berlin = "🏙️ Berlin"; BG_TAG_NAMES.ariza = "⚠️ Arıza"; BG_TAG_NAMES["ariza-ulasim"] = "🚦 Arıza ulaşım"; BG_TAG_NAMES["ariza-enerji"] = "⚡ Arıza enerji/su";
  BG_TAG_NAMES["ariza-dijital"] = "🌐 Arıza internet/IT"; BG_TAG_NAMES.trafik = "🚗 Trafik"; BG_TAG_NAMES.hava = "🌦️ Hava"; BG_TAG_NAMES.politika = "🏛️ Politika";
  BG_TAG_NAMES.adalet = "⚖️ Adalet"; BG_TAG_NAMES.ekonomi = "💶 Ekonomi"; BG_TAG_NAMES.insaat = "🏗️ İnşaat"; BG_TAG_NAMES.egitim = "🎓 Eğitim"; BG_TAG_NAMES.saglik = "🏥 Sağlık";
  BG_TAG_NAMES.cevre = "🌳 Çevre"; BG_TAG_NAMES.sosyal = "🤝 Sosyal"; BG_TAG_NAMES.teknik = "💻 Teknik"; BG_TAG_NAMES.turkiye = "🇹🇷 Türkiye";
  BG_TAG_NAMES.yazili = "🔤 Yazılı (otomatik değil)"; BG_TAG_NAMES.reklam = "🏷️ Reklam (otomatik değil)"; BG_TAG_NAMES.duz = "⬛ Düz renk (otomatik değil)"; BG_TAG_NAMES.duz = "⬛ Düz renk (kararsız haber)"; BG_TAG_NAMES.acil = "🚨 Acil uyarı";

  // 2026-11-22 (owner: "otomatik haber paylaşmıyor"): clear status – is the auto mode really ON on the server, what happened last
  function hm(t) { if (!t) return "–"; try { return new Date(t).toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (x) { return "–"; } }
  function statusHtml(j) {
    var s = j.status || {};
    var on = !!j.auto;
    var line = on
      ? '<b style="color:#3fb950">🟢 Otomatik AÇIK (sunucuda)</b>'
      : '<b style="color:#f85149">🔴 Otomatik KAPALI (sunucuda) – haberler kendiliğinden paylaşılmaz. Yukarıdaki kutuyu işaretle.</b>';
    var slot = !s.slot ? "Şu an liste saati değil (06–22)."
      : "Güncel liste " + e(s.slot.slice(11)) + ":00 · " + s.items + " konu" + (s.open ? " · " + s.open + " metin yazılıyor…" : "") +
        (s.autoDone ? " · ✓ otomatik paylaşıldı" : on ? (s.open || !s.items ? " · metinler bitince paylaşılır" : " · birkaç dakika içinde paylaşılır") : "");
    return '<div id="admin-news-status" style="margin:-2px 0 8px;line-height:1.5">' + line + '<br><span style="color:#8b949e">' + slot +
      " · Son kontrol: " + hm(s.sweepAt) + " · Son haber story: " + hm(s.lastNewsAt) + "</span></div>";
  }

  function render() {
    var view = document.getElementById("admin-main-view");
    if (!view || !token()) return;
    var b = document.getElementById("admin-news");
    if (!b) { b = document.createElement("div"); b.id = "admin-news"; b.style.cssText = CARD; view.insertBefore(b, view.firstChild); }
    b.innerHTML = '<b style="font-size:15px;color:#fff">📰 Haber story\'leri · Nachrichten-Stories</b> <span style="color:#8b949e">(06–22, 2 saatte bir)</span><div id="admin-news-body">…</div>';
    api("GET").then(function (j) {
      var body = document.getElementById("admin-news-body");
      if (!body) return;
      if (!j || !j.slots) { body.textContent = "Yüklenemedi."; return; }
      if (j.settings) ST = j.settings;
      BGS = j.backgrounds || [];
      var picked = function (k) { return ST.bgMode === "pick" && ST.bgPicks.indexOf(k) >= 0; };
      var thumb = function (k, small) {
        var tg = ""; BGS.forEach(function (b) { if ("b:" + b.key === k) tg = b.tag || ""; }); // 2026-11-23: topic tag
        var tagCol = { spor: "#3fb950", kultur: "#a371f7", acil: "#f85149", yazili: "#6e7681", reklam: "#6e7681", duz: "#6e7681" }[tg] || (tg && tg !== "genel" ? "#58a6ff" : "");
        return '<img data-bg="' + e(k) + '" src="' + e(small) + '" alt="" title="' + e(BG_TAG_NAMES[tg] || "Genel") + '" loading="lazy" style="width:34px;height:60px;border-radius:6px;cursor:pointer;object-fit:cover;border:3px solid ' + (picked(k) ? "#2ea043" : "transparent") + (tagCol ? ";outline:2px dashed " + tagCol : "") + '">';
      };
      var tplHtml = '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:8px 0">Arka plan: ' +
        '<button type="button" id="admin-news-rotate" style="' + BTN + (ST.bgMode === "rotate" ? ";border-color:#2ea043;background:#238636" : "") + '">🔄 Sırayla (hepsi)</button>';
      // 2026-11-23 evening (owner "UYGULA 1"): the 6 old colour templates (box + logo) are not shown / used any more
      if (false) for (var i = 1; i <= (j.templates || 6); i++) tplHtml += thumb("t" + i, "/assets/news/tpl-" + i + "-s.webp");
      BGS.forEach(function (b) { tplHtml += thumb("b:" + b.key, "/media/" + b.key); });
      tplHtml += '<label style="' + BTN + ';background:#1f6feb">➕ Resim ekle (klasöre)<input type="file" id="admin-news-bgadd" accept="image/*,.heic,.heif" multiple style="display:none"></label><span id="admin-news-bgname" style="color:#8b949e"></span></div>' +
        '<div style="color:#8b949e;margin:-2px 0 8px">' + (ST.bgMode === "pick" && ST.bgPicks.length ? "✓ Seçili " + ST.bgPicks.length + " arka plan sırayla kullanılır (otomatik mod da)." : "🔄 Klasördeki " + BGS.length + " resim sırayla kullanılır (konu etiketine göre). Eski renkli şablonlar kullanılmaz.") + " Resme tıkla = büyük ön izleme, seç / kaldır / sil.</div>";
      var head = '<label style="display:flex;gap:8px;align-items:center;margin:8px 0;font-weight:700"><input type="checkbox" id="admin-news-auto"' + (j.auto ? " checked" : "") + "> 🤖 Otomatik · Automatisch (her listede acil + ilk 3 konu + işaretlediklerin · aralık, dil ve arka plan aşağıdaki ayarlara göre · kapalı haberler paylaşılmaz)</label>" +
        statusHtml(j) +
        tplHtml +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px">Dil: <select id="admin-news-lang" style="' + BTN + '">' + [["tr-de", "Türkçe + Deutsch"], ["tr-en", "Türkçe + English"], ["de", "Deutsch + Türkçe"], ["tr", "Sadece Türkçe"]].map(function (o) { return '<option value="' + o[0] + '"' + (ST.lang === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>" +
        ' Aralık: <select id="admin-news-gap" style="' + BTN + '">' + GAPS.map(function (o) { return '<option value="' + o[0] + '"' + (Number(ST.gap) === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>" +
        ' <button type="button" id="admin-news-refresh" style="' + BTN + '">🔎 Şimdi analiz et (yeni liste)</button></div>' +
        '<div style="color:#8b949e;margin-bottom:6px">Resme tıkla = büyük ön izleme · Kaynaklar: tagesschau, rbb24, Polizei Berlin, Tagesspiegel, Berliner Zeitung, Morgenpost, taz, Berliner Kurier</div>';
      if (!j.slots.length) { body.innerHTML = head + '<p style="color:#8b949e">Şu an liste yok (06:00–22:00 arası oluşur).</p>'; bind(j); return; }
      // 2026-11-21: texts are written step by step – look again in 20 s while something is open
      var pending = j.slots.some(function (s) { return !s.items.length || s.items.some(function (x) { return x.written === false; }); });
      clearTimeout(render.t);
      if (pending) render.t = setTimeout(function () { if (document.getElementById("admin-news") && !document.querySelector("#admin-news .news-f:focus") && !document.getElementById("admin-news-lb") && !/⏳/.test((document.getElementById("admin-news-bgname") || {}).textContent || "")) render(); }, 20000);
      body.innerHTML = head + j.slots.map(function (s, si) {
        return '<details' + (si === 0 ? " open" : "") + ' style="margin:6px 0"><summary style="cursor:pointer;font-weight:800;color:#fff">🕑 ' + slotLabel(s.slot) + " · " + (s.items.length ? s.items.length + " konu" : "⏳ analiz ediliyor…") + (s.auto_done ? " · 🤖 otomatik paylaşıldı" : "") + "</summary>" +
          s.items.map(function (it) {
            return '<div style="border:1px solid ' + (it.urgent ? "#f85149" : "#30363d") + ';border-radius:10px;padding:8px;margin:6px 0' + (it.hidden ? ";opacity:.45" : "") + '" data-slot="' + e(s.slot) + '" data-id="' + e(it.id) + '">' +
              (it.hidden ? '<b style="color:#d29922">🙈 kapalı – otomatik paylaşılmaz</b><br>' : "") +
              '<label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" class="news-pick"' + (it.picked ? " checked" : "") + ' title="İşaretli = paylaşılır (otomatik adım da paylaşır) · markiert = wird geteilt">' + // 2026-11-23: tick saved on the server
              '<span style="flex:1">' + (it.picked && !it.published ? '<b style="color:#58a6ff">☑ işaretli – sıradaki adımda paylaşılır</b> ' : "") + (it.urgent ? '<b style="color:#f85149">🚨 ACİL · EIL</b> ' : "") + (it.published ? '<b style="color:#3fb950">🌐 Sitede ✓' + ((it.shares || []).length > 1 ? " (" + it.shares.length + "×)" : "") + "</b> " + metaBadge(j, it) : "") + (it.written === false ? '<b style="color:#d29922">⏳ metin yazılıyor…</b> ' : "") + (it.renderError ? '<b style="color:#d29922">⚠ resim çizilemedi, eski yöntem kullanıldı</b> ' : "") +
              (it.noText ? '<b style="color:#f85149">⚠ metin yok – otomatik paylaşılmaz (metni yazıp elle paylaşabilirsin)</b> ' : "") + (it.textFromArticle ? '<b style="color:#8b949e">ℹ metin kaynağın ilk cümlelerinden</b> ' : "") + (it.bgNote ? '<small style="color:#d29922">⚠ arka plan: ' + e(it.bgNote) + '</small> ' : "") + // 2026-11-23
              '<small style="color:#8b949e">' + e(it.source) + ' · <a href="' + e(it.url) + '" target="_blank" rel="noopener" style="color:#58a6ff">kaynak ↗</a></small><br><small style="color:#8b949e">Orijinal: ' + e(it.orig) + "</small></span></label>" +
              '<input class="news-f" data-f="title_de" style="' + INP + ';margin-top:6px;font-weight:700" value="' + e(it.title_de) + '" placeholder="Titel (DE)">' +
              '<textarea class="news-f" data-f="text_de" rows="3" style="' + INP + ';margin-top:4px" placeholder="Text (DE)">' + e(it.text_de) + "</textarea>" +
              '<input class="news-f" data-f="title_tr" style="' + INP + ';margin-top:4px;font-weight:700" value="' + e(it.title_tr) + '" placeholder="Başlık (TR)">' +
              '<textarea class="news-f" data-f="text_tr" rows="3" style="' + INP + ';margin-top:4px" placeholder="Metin (TR)">' + e(it.text_tr) + "</textarea>" +
              '<input class="news-f" data-f="title_en" style="' + INP + ';margin-top:4px;font-weight:700" value="' + e(it.title_en) + '" placeholder="Title (EN)">' +
              '<textarea class="news-f" data-f="text_en" rows="3" style="' + INP + ';margin-top:4px" placeholder="Text (EN)">' + e(it.text_en) + "</textarea>" +
              '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" class="news-prev" style="' + BTN + '">👁 Ön izleme (büyük)</button>' +
              (it.published ? '<button type="button" class="news-again" style="' + BTN + ';background:#1f6feb">🔁 Tekrar paylaş</button><span class="news-again-out" style="color:#8b949e"></span>' : "") +
              (it.hidden ? '<button type="button" class="news-hide" data-act="unhide" style="' + BTN + '">👁 Aç</button>' : '<button type="button" class="news-hide" data-act="hide" style="' + BTN + '">🙈 Kapat (paylaşma)</button>') +
              '<button type="button" class="news-del" style="' + BTN + ';background:#da3633">🗑 Sil</button>' + "</div></div>";
          }).join("") +
          '<button type="button" class="news-publish" data-slot="' + e(s.slot) + '" style="' + BTN + ';background:#2ea043;margin-top:6px">📤 Seçilenleri şimdi paylaş (paylaşılmış olanlar atlanır · tekrar için 🔁 · aralık + arka plan ayarlarına göre)</button> <span class="news-out"></span></details>';
      }).join("");
      bind(j);
    });
  }

  function bind(j) {
    var auto = document.getElementById("admin-news-auto");
    if (auto) auto.onchange = function () {
      var want = auto.checked;
      var st = document.getElementById("admin-news-status");
      if (st) st.innerHTML = '<span style="color:#8b949e">⏳ Kaydediliyor…</span>';
      // 2026-11-22 (owner): the switch said "on" although the server stayed off – now the answer is checked
      fetch("/api/flags", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify({ name: "newsAuto", on: want }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (x) { if (!r.ok || !x.ok || !!x.newsAuto !== want) throw new Error(x.error || ("HTTP " + r.status)); }); })
        .then(function () { if (want) return api("POST", { action: "refresh", auto: "1" }).then(render); render(); }) // 2026-11-22: switching on = new analysis
        .catch(function (err) {
          auto.checked = !want;
          if (st) st.innerHTML = '<b style="color:#f85149">❌ Kaydedilmedi: ' + e(String(err && err.message || err)) + " – tekrar giriş yapıp yeniden dene.</b>";
        });
    };
    var rot = document.getElementById("admin-news-rotate");
    if (rot) rot.onclick = function () { saveSettings({ bgMode: "rotate", bgPicks: [] }).then(render); };
    document.querySelectorAll("#admin-news [data-bg]").forEach(function (x) {
      var k = x.getAttribute("data-bg");
      x.onclick = function () {
        var on = ST.bgMode === "pick" && ST.bgPicks.indexOf(k) >= 0;
        var toggle = function () {
          var list = ST.bgMode === "pick" ? ST.bgPicks.slice() : [];
          if (on) list = list.filter(function (y) { return y !== k; }); else list.push(k);
          saveSettings({ bgMode: list.length ? "pick" : "rotate", bgPicks: list }).then(render);
        };
        var del = k.charAt(0) === "b" ? function () {
          api("POST", { action: "bgDelete", key: k.slice(2) }).then(render);
        } : null;
        lightbox(bgSrc(k), (k.charAt(0) === "t" ? "Şablon " + k.slice(1) : "Kendi resmin") + " · metinsiz", toggle, del, on ? "✕ Seçimi kaldır" : "✓ Seç (sadece seçilenler kullanılır)");
        // 2026-11-23 (owner "UYGULA 8"): topic of this background – a sport picture only for sport news, a police/fire
        // picture only for police/accident news; urgent news without such a picture get the red EIL design
        if (k.charAt(0) === "b") {
          var cur = ""; BGS.forEach(function (b) { if ("b:" + b.key === k) cur = b.tag || "genel"; });
          var lb = document.getElementById("admin-news-lb");
          var row = document.createElement("div");
          row.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;justify-content:center;color:#fff;font-size:13px;align-items:center";
          row.innerHTML = "Konu · Thema: " + BG_TAG_LIST.map(function (t) {
            return '<button type="button" data-tag="' + t + '" style="' + BTN + (cur === t ? ";background:#238636;border-color:#2ea043" : "") + '">' + BG_TAG_NAMES[t] + "</button>";
          }).join("");
          if (lb) lb.appendChild(row);
          row.querySelectorAll("[data-tag]").forEach(function (b) {
            b.onclick = function (ev) {
              ev.stopPropagation();
              api("POST", { action: "bgTag", key: k.slice(2), tag: b.getAttribute("data-tag") }).then(function () { if (lb) lb.remove(); render(); });
            };
          });
        }
      };
    });
    var add = document.getElementById("admin-news-bgadd");
    if (add) add.onchange = function () {
      var files = Array.prototype.slice.call(add.files || []);
      var label = document.getElementById("admin-news-bgname");
      var done = 0, bad = 0;
      var next = function () {
        if (!files.length) { label.textContent = "✓ " + done + " resim eklendi" + (bad ? " · " + bad + " eklenemedi" : ""); setTimeout(render, 600); return; }
        var f = files.shift();
        label.textContent = "⏳ yükleniyor… (" + (done + bad + 1) + ")";
        toJpeg(f).then(function (jpg) {
          var fd = new FormData();
          fd.append("action", "bgUpload"); fd.append("name", f.name || ""); fd.append("file", jpg, "bg.jpg");
          return api("POST", fd, true);
        }).then(function (r) { if (r && r.ok) done++; else bad++; next(); }, function () { bad++; next(); });
      };
      next();
    };
    var lang = document.getElementById("admin-news-lang");
    if (lang) lang.onchange = function () { saveSettings({ lang: lang.value }); };
    var gap = document.getElementById("admin-news-gap");
    if (gap) gap.onchange = function () { saveSettings({ gap: Number(gap.value) }); };
    document.querySelectorAll("#admin-news .news-hide, #admin-news .news-del").forEach(function (b) {
      b.onclick = function () {
        var box = b.closest("[data-id]");
        var act = b.classList.contains("news-del") ? "delete" : b.getAttribute("data-act");
        if (act === "delete" && !confirm("Bu haber listeden silinsin mi? Bir daha analizde gelmez. (Paylaşılmış story yayında kalır.)")) return;
        b.disabled = true;
        api("POST", { action: act, slot: box.getAttribute("data-slot"), id: box.getAttribute("data-id") }).then(render);
      };
    });
    document.querySelectorAll("#admin-news .news-prev").forEach(function (b) {
      b.onclick = function () {
        var box = b.closest("[data-id]");
        lightbox(previewUrl(box.getAttribute("data-slot"), box.getAttribute("data-id")), "Ön izleme · metinli (" + (tpl ? "arka plan " + tpl : "sıradaki renk") + ")");
      };
    });
    document.querySelectorAll("#admin-news .news-again").forEach(function (b) {
      b.onclick = function () {
        var box = b.closest("[data-id]");
        var out = box.querySelector(".news-again-out");
        b.disabled = true;
        var fd = new FormData();
        fd.append("action", "publish"); fd.append("slot", box.getAttribute("data-slot")); fd.append("ids", box.getAttribute("data-id")); fd.append("again", "1");
        fd.append("lang", document.getElementById("admin-news-lang").value);
        fd.append("gapMinutes", "0");
        fd.append("template", "0");
        api("POST", fd, true).then(function (r) { out.textContent = r.ok ? " ✓ tekrar paylaşıldı" : " Hata: " + (r.error || "?"); setTimeout(render, 1500); });
      };
    });
    var ref = document.getElementById("admin-news-refresh");
    if (ref) ref.onclick = function () {
      ref.disabled = true; ref.textContent = "⏳ yeni haberler aranıyor…";
      api("POST", { action: "refresh" }).then(function (r) {
        if (r && r.error === "outside_hours") ref.textContent = "Sadece 06:00–22:00 arası";
        else if (!r || !r.ok) ref.textContent = "Hata: " + ((r && r.error) || "?");
        setTimeout(render, r && r.ok ? 300 : 2500);
      });
    };
    // save edited texts when leaving a field
    document.querySelectorAll("#admin-news .news-f").forEach(function (f) {
      f.onchange = function () {
        var box = f.closest("[data-id]");
        var body = { action: "edit", slot: box.getAttribute("data-slot"), id: box.getAttribute("data-id") };
        body[f.getAttribute("data-f")] = f.value;
        api("POST", body).then(function (r) {
          // 2026-11-23 (owner "UYGULA 10"): a shared story got the new text + a new picture
          var rd = r && r.redraw;
          if (!rd) return;
          var note = document.createElement("div");
          note.style.cssText = "margin-top:4px;font-weight:700;color:" + (rd.redrawn ? "#3fb950" : "#d29922");
          note.textContent = rd.redrawn ? "✓ Paylaşılan story yeni metinle güncellendi (resim yeniden çizildi). FB/Telegram tekrar gönderilir." + (rd.igManual ? " ⚠ Instagram'daki eskisini uygulamadan elle sil." : "") : "⚠ Story güncellenemedi: " + (rd.error || "?");
          f.parentNode.insertBefore(note, f.nextSibling);
          setTimeout(function () { note.remove(); }, 15000);
        });
      };
    });
    // 2026-11-23 (owner "UYGULA 1"): a tick is saved on the server at once (stays when the list is drawn again)
    document.querySelectorAll("#admin-news .news-pick").forEach(function (c) {
      c.onchange = function () {
        var box = c.closest("[data-id]");
        c.disabled = true;
        api("POST", { action: "pick", slot: box.getAttribute("data-slot"), id: box.getAttribute("data-id"), on: c.checked }).then(function (r) {
          c.disabled = false;
          if (!r || !r.ok) { c.checked = !c.checked; alert("İşaret kaydedilemedi: " + ((r && r.error) || "?")); }
        });
      };
    });
    document.querySelectorAll("#admin-news .news-publish").forEach(function (btn) {
      btn.onclick = function () {
        var slot = btn.getAttribute("data-slot");
        var ids = Array.prototype.map.call(document.querySelectorAll('#admin-news [data-slot="' + slot + '"][data-id]'), function (box) {
          return box.querySelector(".news-pick").checked ? box.getAttribute("data-id") : null;
        }).filter(Boolean);
        var out = btn.parentNode.querySelector(".news-out");
        if (!ids.length) { out.textContent = "Önce konu seç."; return; }
        btn.disabled = true;
        var fd = new FormData();
        fd.append("action", "publish"); fd.append("slot", slot); fd.append("ids", ids.join(",")); fd.append("again", "0"); // 2026-11-23 (owner "UYGULA 3"): shared ones are skipped (🔁 = again)
        fd.append("lang", document.getElementById("admin-news-lang").value);
        fd.append("gapMinutes", document.getElementById("admin-news-gap").value);
        fd.append("template", "0");
        api("POST", fd, true).then(function (r) {
          var skipped = ids.length - (r.published || 0);
          out.textContent = r.ok ? "✓ " + r.published + " story paylaşıldı / planlandı" + (skipped > 0 ? " · " + skipped + " zaten paylaşılmıştı (atlandı)" : "") : "Hata: " + (r.error || "?");
          setTimeout(render, 1500);
        });
      };
    });
  }

  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () {
      var r = base.apply(this, arguments);
      setTimeout(render, 0);
      return r;
    };
  }
})();
