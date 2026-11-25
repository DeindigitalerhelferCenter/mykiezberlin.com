/* /werben – Black Friday (2026-11-22, owner): the first 100 sponsors 3 months free, then Kiez Basic 29 / Plus 49 /
   Premium 89 € per month – MONATLICH KÜNDBAR. Banner with places left + countdown, a "Black Friday" box in the form
   (?bf=1 ticks it). Thank-you: share us once on Instagram or hang up our QR poster (we remind you weekly). */
(function () {
  "use strict";
  var T = {
    de: { h: "🖤 BLACK FRIDAY: 3 Monate GRATIS", sub: "Für die ersten 100 Betriebe – danach 3 Monate Aktionspreis (Basic/Plus 19 €, Premium 49 €), dann Kiez Basic 29 €, Plus 49 € oder Premium 89 € im Monat.", kund: "MONATLICH KÜNDBAR · keine Mindestlaufzeit · keine Zahlung jetzt", left: function (l, t) { return "Noch " + l + " von " + t + " Plätzen frei"; }, ends: "Endet am 30.11. um 23:59 Uhr", cta: "Jetzt Gratis-Platz sichern", deal: "Als kleines Dankeschön teilst du uns einmal auf Instagram oder hängst unser QR-Plakat in deinem Laden auf.", chk: "🖤 Black Friday: 3 Monate gratis (danach gewähltes Paket, monatlich kündbar)", pick: "Bitte wähle Kiez Basic, Plus oder Premium – das gilt nach den 3 Gratis-Monaten.", ok: "🖤 Danke! Dein Black-Friday-Platz ist reserviert: 3 Monate gratis, danach dein Paket – monatlich kündbar. Wir melden uns in Kürze.", over: "Die Black-Friday-Aktion ist vorbei.", d: "T", hh: "Std", mm: "Min" },
    tr: { h: "🖤 BLACK FRIDAY: 3 ay ÜCRETSİZ", sub: "İlk 100 işletmeye – sonra 3 ay kampanya fiyatı (Basic/Plus 19 €, Premium 49 €), ardından aylık Kiez Basic 29 €, Plus 49 € veya Premium 89 €.", kund: "HER AY İPTAL EDİLEBİLİR · asgari süre yok · şimdi ödeme yok", left: function (l, t) { return t + " yerden " + l + " yer kaldı"; }, ends: "30.11. saat 23:59'da bitiyor", cta: "Ücretsiz yerini hemen ayırt", deal: "Küçük bir teşekkür olarak bizi bir kez Instagram'da paylaş veya QR afişimizi dükkanına as.", chk: "🖤 Black Friday: 3 ay ücretsiz (sonra seçtiğin paket, her ay iptal edilebilir)", pick: "Lütfen Kiez Basic, Plus veya Premium seç – 3 ücretsiz aydan sonra bu geçerli olur.", ok: "🖤 Teşekkürler! Black Friday yerin ayrıldı: 3 ay ücretsiz, sonra paketin – her ay iptal edilebilir. Kısa sürede sana döneceğiz.", over: "Black Friday kampanyası sona erdi.", d: "G", hh: "Sa", mm: "Dk" },
    en: { h: "🖤 BLACK FRIDAY: 3 months FREE", sub: "For the first 100 businesses – then 3 months intro price (Basic/Plus 19 €, Premium 49 €), then Kiez Basic 29 €, Plus 49 € or Premium 89 € per month.", kund: "CANCEL MONTHLY · no minimum term · no payment now", left: function (l, t) { return l + " of " + t + " places left"; }, ends: "Ends 30 Nov at 23:59", cta: "Claim your free place", deal: "As a small thank-you, share us once on Instagram or hang up our QR poster in your shop.", chk: "🖤 Black Friday: 3 months free (then your package, cancel monthly)", pick: "Please choose Kiez Basic, Plus or Premium – it applies after the 3 free months.", ok: "🖤 Thank you! Your Black Friday place is reserved: 3 months free, then your package – cancel monthly. We will contact you soon.", over: "The Black Friday campaign has ended.", d: "d", hh: "h", mm: "min" },
  };
  function lang() { var l = document.documentElement.lang || "de"; return T[l] ? l : "de"; }
  function L() { return T[lang()]; }
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var st = null;

  var css = document.createElement("style");
  css.textContent =
    "@keyframes bfGlow{0%,100%{box-shadow:0 0 0 0 rgba(255,193,7,0)}50%{box-shadow:0 0 22px 6px rgba(255,193,7,.7)}}" +
    ".bf-box{margin:0 0 22px;padding:20px 18px;border-radius:20px;background:linear-gradient(135deg,#000,#1f1f1f 60%,#3a2c00);color:#fff;text-align:center;animation:bfGlow 2.4s ease-in-out infinite}" +
    ".bf-box h2{margin:0 0 6px;font-size:26px;color:#FFC107;letter-spacing:.5px}.bf-box p{margin:6px 0}.bf-kund{display:inline-block;margin:8px 0;padding:6px 12px;border-radius:999px;background:#FFC107;color:#000;font-weight:900;font-size:14px}" +
    ".bf-bar{height:12px;border-radius:6px;background:#333;overflow:hidden;margin:10px auto 4px;max-width:420px}.bf-bar i{display:block;height:100%;background:linear-gradient(90deg,#FFC107,#ff5722)}" +
    ".bf-left{font-weight:800;font-size:17px}.bf-cd{font-variant-numeric:tabular-nums;font-size:15px;opacity:.9}.bf-deal{font-size:13px;opacity:.85}" +
    ".bf-cta{display:inline-block;margin-top:10px;padding:12px 22px;border-radius:999px;background:#FFC107;color:#000!important;font-weight:900;text-decoration:none;animation:bfGlow 2.4s ease-in-out infinite}" +
    ".bf-chk{display:flex;gap:8px;align-items:flex-start;margin:6px 0 10px;padding:10px;border-radius:12px;background:#111;color:#FFC107;font-weight:700}.bf-chk input{margin-top:3px;width:18px;height:18px}" +
    "@media (prefers-reduced-motion:reduce){.bf-box,.bf-cta{animation:none}}";
  document.head.appendChild(css);

  function countdown() {
    var el = document.getElementById("bf-cd");
    if (!el || !st) return;
    var ms = Math.max(0, st.end - Date.now()), d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60;
    el.textContent = "⏳ " + d + " " + L().d + " " + h + " " + L().hh + " " + m + " " + L().mm + " · " + L().ends;
  }
  function paint() {
    if (!st || !st.active) { var old = document.getElementById("bf-box"); if (old) old.remove(); return; }
    var main = document.querySelector("main") || document.body;
    var box = document.getElementById("bf-box");
    if (!box) { box = document.createElement("section"); box.id = "bf-box"; box.className = "bf-box"; main.insertBefore(box, main.firstChild); }
    var l = L();
    box.innerHTML = "<h2>" + e(l.h) + "</h2><p>" + e(l.sub) + '</p><span class="bf-kund">' + e(l.kund) + "</span>" +
      '<div class="bf-bar"><i style="width:' + Math.round(100 * st.taken / st.total) + '%"></i></div><p class="bf-left">' + e(l.left(st.left, st.total)) + '</p><p class="bf-cd" id="bf-cd"></p>' +
      '<p class="bf-deal">🤝 ' + e(l.deal) + '</p><a class="bf-cta" href="#f" id="bf-go">' + e(l.cta) + " →</a>";
    document.getElementById("bf-go").onclick = function () { var c = document.getElementById("bf-check"); if (c) c.checked = true; fixSize(); };
    countdown();
    var form = document.getElementById("f");
    if (form && !document.getElementById("bf-check")) {
      var sel = form.querySelector("select[name=size]");
      var lab = document.createElement("label");
      lab.className = "bf-chk";
      lab.innerHTML = '<input type="checkbox" id="bf-check"><span id="bf-chk-t"></span>';
      sel.closest("label").insertAdjacentElement("afterend", lab);
      document.getElementById("bf-check").checked = new URLSearchParams(location.search).get("bf") === "1";
      document.getElementById("bf-check").onchange = fixSize;
    }
    var t = document.getElementById("bf-chk-t");
    if (t) t.textContent = l.chk;
    cardTexts();
    fixSize();
  }
  // 2026-11-25 (owner): while Black Friday runs, the package cards say it too (before: "Start: 3 Monate nur 19 €")
  var CARD = {
    de: ["🖤 Black Friday: 3 Monate gratis, dann 3 Monate 19 €/Monat", "🖤 Black Friday: 3 Monate gratis, dann 3 Monate 49 €/Monat", "🖤 Black Friday: 3 Monate kostenlos", "Für die ersten 100 Betriebe, Anmeldung bis 30.11. Als Dankeschön teilst du uns einmal auf Instagram oder hängst unser QR-Plakat im Laden auf. Monatlich kündbar."],
    tr: ["🖤 Black Friday: 3 ay ücretsiz, sonra 3 ay aylık 19 €", "🖤 Black Friday: 3 ay ücretsiz, sonra 3 ay aylık 49 €", "🖤 Black Friday: 3 ay ücretsiz", "İlk 100 işletme için, kayıt 30.11.'e kadar. Teşekkür olarak bizi bir kez Instagram'da paylaşırsın veya QR afişimizi dükkanına asarsın. Her ay iptal edilebilir."],
    en: ["🖤 Black Friday: 3 months free, then 3 months €19/month", "🖤 Black Friday: 3 months free, then 3 months €49/month", "🖤 Black Friday: 3 months free", "For the first 100 businesses, sign up until 30 Nov. As a thank-you, share us once on Instagram or hang up our QR poster. Cancel monthly."],
  };
  function cardTexts() {
    if (!st || !st.active) return;
    var c = CARD[lang()] || CARD.de;
    document.querySelectorAll('[data-i="start"]').forEach(function (el) { el.textContent = c[0]; });
    document.querySelectorAll('[data-i="start_l"]').forEach(function (el) { el.textContent = c[1]; });
    document.querySelectorAll('[data-i="st1_h"]').forEach(function (el) { el.textContent = c[2]; });
    document.querySelectorAll('[data-i="st1_txt"]').forEach(function (el) { el.textContent = c[3]; });
  }
  function fixSize() {
    var c = document.getElementById("bf-check"), sel = document.querySelector("select[name=size]");
    if (!c || !sel || !c.checked) return;
    if (["s", "m", "l"].indexOf(sel.value) < 0) sel.value = "m";
  }

  // the form sends bf: true when the box is ticked; success text for Black Friday
  var baseFetch = window.fetch;
  window.fetch = function (input, init) {
    try {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var c = document.getElementById("bf-check");
      if (/\/api\/werben$/.test(url) && init && init.body && c && c.checked && st && st.active) {
        var b = JSON.parse(init.body);
        if (["s", "m", "l"].indexOf(b.size) < 0) { alert(L().pick); return Promise.reject(new Error("bf_size")); }
        b.bf = true;
        init.body = JSON.stringify(b);
        return baseFetch.call(this, input, init).then(function (r) {
          r.clone().json().then(function (j) {
            if (j && j.bf) setTimeout(function () { var box = document.getElementById("formBox"); if (box) box.innerHTML = '<p class="ok">' + e(L().ok) + "</p>"; load(); }, 50);
          }).catch(function () {});
          return r;
        });
      }
    } catch (x) {}
    return baseFetch.call(this, input, init);
  };

  function load() {
    baseFetch.call(window, "/api/blackfriday", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { st = j; paint(); }).catch(function () {});
  }
  document.querySelectorAll(".langs button").forEach(function (b) { b.addEventListener("click", function () { setTimeout(paint, 0); }); });
  setInterval(countdown, 30000);
  load();
})();
