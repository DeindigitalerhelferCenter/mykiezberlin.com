/* 2026-11-27 (owner): admin section "🏷️ Güncel indirimler · Aktuelle Angebote" – every running story that is shown
   in the offers (also found automatically from words like Angebot / Kampanya / Rabatt / İndirim, see
   functions/_lib/story-offer.js), with its picture. Per offer the admin can:
   - change the offer text, price and old price (💾)            -> /api/admin action storyDeal
   - take it out of the offers, the story stays (🚫)              -> storyDeal remove
   - change the story title / text (✏️)                           -> action edit
   - put a new picture (🖼️, made smaller in the browser)          -> action storyImage
   - run longer (+1 / +3 / +7 days)                               -> action extend
   - take the story off the site (🗑️, can be approved again)      -> action reject
   Sponsor offers (pictures of the sponsor panel) are managed in "📸 Sponsor-Medien". */
(function () {
  "use strict";
  function token() { try { return sessionStorage.getItem("mykiez_admin_token_v1") || localStorage.getItem("mykiez_admin_session_v1") || ""; } catch (e) { return ""; } }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var CARD = "background:#161b22;border:1px solid #30363d;border-radius:14px;padding:16px;margin-bottom:16px;color:#e6edf3";
  var BTN = "background:#21262d;border:1px solid #30363d;color:#e6edf3;border-radius:10px;padding:6px 10px;font-weight:700;font-size:12.5px;cursor:pointer;margin:2px";
  var INPUT = "width:100%;box-sizing:border-box;background:#0d1117;border:1px solid #30363d;color:#fff;border-radius:8px;padding:7px 9px;margin:3px 0;font:inherit;font-size:13px";
  function post(body) {
    return fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json", "x-admin-token": token() }, body: JSON.stringify(Object.assign({ type: "story" }, body)) })
      .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); }).catch(function () { return { error: "offline" }; });
  }
  function section() {
    var view = document.getElementById("admin-main-view");
    if (!view) return null;
    var box = document.getElementById("admin-deals");
    if (!box) {
      box = document.createElement("div"); box.id = "admin-deals"; box.style.cssText = CARD;
      var after = document.getElementById("admin-invite") || document.getElementById("admin-classifieds");
      if (after && after.nextSibling) view.insertBefore(box, after.nextSibling); else view.appendChild(box);
    }
    return box;
  }
  function picOf(s) {
    var m = (s.media || [])[0];
    if (m && m.type !== "video") return "/media/" + m.key;
    if (s.media_key && s.media_type !== "video") return "/media/" + s.media_key;
    return "";
  }
  function ends(s) { return new Date(Number(s.approved_at) + Number(s.duration_hours) * 3600000).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  function shrink(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1600, w = img.naturalWidth, h = img.naturalHeight, f = Math.min(1, max / Math.max(w, h));
        var c = document.createElement("canvas"); c.width = Math.round(w * f); c.height = Math.round(h * f);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.86));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("bad image")); };
      img.src = url;
    });
  }
  function load() {
    var box = section();
    if (!box) return;
    fetch("/api/stories?x=" + Date.now()).then(function (r) { return r.json(); }).then(function (d) {
      var list = (d.stories || []).filter(function (s) { return s.deal; });
      box.innerHTML = '<h3 style="margin:0 0 6px;font-size:16px">🏷️ Güncel indirimler · Aktuelle Angebote (' + list.length + ")</h3>" +
        '<p style="margin:0 0 10px;font-size:12.5px;color:#8b949e">Alle laufenden Stories mit Angebot – auch automatisch erkannt (Angebot, Kampanya, Rabatt, İndirim …). Text, Preis, Bild, Laufzeit ändern oder herausnehmen. · Yayındaki tüm kampanyalı story\'ler – otomatik bulunanlar dahil. Metin, fiyat, resim, süre değiştir veya çıkar. Sponsor resimleri: „📸 Sponsor-Medien“.</p>' +
        (list.length ? "" : '<p style="color:#8b949e">Keine · Yok</p>') +
        list.map(function (s) {
          var pic = picOf(s);
          return '<div data-id="' + e(s.id) + '" style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid #30363d;flex-wrap:wrap">' +
            (pic ? '<img src="' + e(pic) + '" alt="" style="width:84px;height:110px;object-fit:cover;border-radius:10px;background:#000">' : '<div style="width:84px;height:110px;border-radius:10px;background:#0d1117;display:flex;align-items:center;justify-content:center;font-size:28px">🎬</div>') +
            '<div style="flex:1;min-width:220px"><b style="font-size:13.5px">' + e(s.headline) + '</b><div style="font-size:11.5px;color:#8b949e">' + e(s.author || "") + " · " + e(s.kiez || "") + " · bis · bitiş " + e(ends(s)) + "</div>" +
            '<input data-f="what" style="' + INPUT + '" value="' + e(s.deal.what) + '" placeholder="Angebot · Kampanya">' +
            '<div style="display:flex;gap:6px"><input data-f="price" style="' + INPUT + '" value="' + e(s.deal.price) + '" placeholder="Preis · Fiyat"><input data-f="old" style="' + INPUT + '" value="' + e(s.deal.old || "") + '" placeholder="statt · eski fiyat"></div>' +
            '<div><button type="button" data-a="save" style="' + BTN + ';background:#238636;border-color:#238636">💾 Speichern · Kaydet</button>' +
            '<button type="button" data-a="text" style="' + BTN + '">✏️ Text · Metin</button>' +
            '<button type="button" data-a="pic" style="' + BTN + '">🖼️ Bild · Resim</button>' +
            '<button type="button" data-a="ext" data-h="24" style="' + BTN + '">+1 T</button><button type="button" data-a="ext" data-h="72" style="' + BTN + '">+3 T</button><button type="button" data-a="ext" data-h="168" style="' + BTN + '">+7 T</button>' +
            '<button type="button" data-a="out" style="' + BTN + '">🚫 Aus Angeboten · İndirimden çıkar</button>' +
            '<button type="button" data-a="del" style="' + BTN + ';border-color:#f85149;color:#f85149">🗑️ Story entfernen · Kaldır</button>' +
            '<input type="file" accept="image/*" data-file style="display:none"></div><div data-r style="font-size:12.5px;margin-top:4px"></div><div data-ed></div></div></div>';
        }).join("");
      box.querySelectorAll("[data-id]").forEach(function (row) {
        var id = row.getAttribute("data-id"), r = row.querySelector("[data-r]");
        var s = list.find(function (x) { return x.id === id; });
        function v(f) { return row.querySelector('[data-f="' + f + '"]').value; }
        function done(j, msg) { if (j && (j.ok || j.redraw)) { r.innerHTML = '<span style="color:#3fb950">✓ ' + msg + "</span>"; setTimeout(load, 900); } else r.innerHTML = '<span style="color:#f85149">Fehler · Hata: ' + e((j && j.error) || "?") + "</span>"; }
        row.querySelectorAll("[data-a]").forEach(function (b) {
          b.onclick = function () {
            var a = b.getAttribute("data-a");
            if (a === "save") post({ id: id, action: "storyDeal", what: v("what"), price: v("price"), old: v("old") }).then(function (j) { done(j, "gespeichert · kaydedildi"); });
            else if (a === "ext") post({ id: id, action: "extend", hours: Number(b.getAttribute("data-h")) }).then(function (j) { done(j, "verlängert · uzatıldı"); });
            else if (a === "out") { if (confirm("Aus den Angeboten nehmen? Die Story bleibt. · İndirimlerden çıkarılsın mı? Story kalır.")) post({ id: id, action: "storyDeal", remove: true }).then(function (j) { done(j, "herausgenommen · çıkarıldı"); }); }
            else if (a === "del") { if (confirm("Story von der Seite nehmen? (kann wieder freigegeben werden) · Story kaldırılsın mı? (tekrar onaylanabilir)")) post({ id: id, action: "reject" }).then(function (j) { done(j, "entfernt · kaldırıldı"); }); }
            else if (a === "pic") row.querySelector("[data-file]").click();
            else if (a === "text") {
              var ed = row.querySelector("[data-ed]");
              ed.innerHTML = '<input data-h style="' + INPUT + '" value="' + e(s.headline) + '"><textarea data-t rows="6" style="' + INPUT + '">' + e(s.subtext || "") + '</textarea><button type="button" data-ok style="' + BTN + ';background:#238636;border-color:#238636">💾 Text speichern · Metni kaydet</button>';
              ed.querySelector("[data-ok]").onclick = function () {
                post({ id: id, action: "edit", headline: ed.querySelector("[data-h]").value, subtext: ed.querySelector("[data-t]").value }).then(function (j) { done(j, "Text gespeichert · metin kaydedildi"); });
              };
            }
          };
        });
        row.querySelector("[data-file]").onchange = function () {
          var f = this.files && this.files[0];
          if (!f) return;
          r.textContent = "⏳";
          shrink(f).then(function (data) { return post({ id: id, action: "storyImage", data: data }); }).then(function (j) { done(j, "Bild gespeichert · resim kaydedildi"); })
            .catch(function () { r.textContent = "Bild nicht lesbar · resim okunamadı"; });
        };
      });
    }).catch(function () {});
  }
  window.mkAdminDeals = load;
  var base = window.renderAdminDashboard;
  if (typeof base === "function") {
    window.renderAdminDashboard = function () {
      try { return base.apply(this, arguments); } finally { try { load(); } catch (x) {} }
    };
  }
})();
