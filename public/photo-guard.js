/*
 * 2026-11-14 (owner): no stock photos that pretend to show a place. A card without a real photo shows a neutral
 * "no photo yet" box instead of a broken picture; real photos (Wikimedia Commons) get their credit on the picture.
 */
(function () {
  "use strict";
  var CREDIT = {
 "/assets/places/mustafas.webp": "Foto: JoachimKohler-HB · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/places/curry36.webp": "Foto: Er nun wieder · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/places/burgermeister.webp": "Foto: Burgermeister Berlin · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/places/schwarzes_cafe.webp": "Foto: Babewyn · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/places/quiz_baer.webp": "Foto: OTFW, Berlin · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/places/quiz_schrippe.webp": "Foto: Levin Holtkamp · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/places/quiz_mauerfall.webp": "Foto: Unknown photographer, Reproduction by Lear 21 at English Wikipedia. · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/places/bergmann.webp": "Foto: Fridolin freudenfett · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/tips/brandenburger-tor.webp": "Foto: Thomas Wolf, www.foto-tw.de · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/tips/reichstag.webp": "Foto: Jörg Braukmann · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/tips/east-side-gallery.webp": "Foto: Joachim F. Thurn · CC BY-SA 3.0 de · Wikimedia Commons",
 "/assets/tips/museumsinsel.webp": "Foto: Thomas Wolf, www.foto-tw.de · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/tips/tempelhofer-feld.webp": "Foto: Matti Blume · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/tips/tiergarten-park.webp": "Foto: beedubz · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/tips/mauer-gedenkstaette.webp": "Foto: HerrAdams · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/tips/mauerpark.webp": "Foto: Traktorminze · CC BY 3.0 · Wikimedia Commons",
 "/assets/tips/treptower-park.webp": "Foto: Andreas Steinhoff · Attribution · Wikimedia Commons",
 "/assets/tips/molecule-man.webp": "Foto: Avda · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/tips/schloss-charlottenburg.webp": "Foto: Times · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/tips/zoo-berlin.webp": "Foto: Jean-Pierre Dalbéra from Paris, France · CC BY 2.0 · Wikimedia Commons",
 "/assets/tips/tierpark.webp": "Foto: Dreizung · CC BY 3.0 · Wikimedia Commons",
 "/assets/tips/gaerten-der-welt.webp": "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/tips/britzer-garten.webp": "Foto: Denis Apel · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/tips/viktoriapark.webp": "Foto: A.Savin · FAL · Wikimedia Commons",
 "/assets/tips/checkpoint-charlie.webp": "Foto: Christian David · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/tips/holocaust-mahnmal.webp": "Foto: Alexander Blum · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/tips/gendarmenmarkt.webp": "Foto: Ansgar Koreng · CC BY 3.0 de · Wikimedia Commons",
 "/assets/tips/technikmuseum.webp": "Foto: Sir James · CC BY-SA 2.0 de · Wikimedia Commons",
 "/assets/tips/botanischer-garten.webp": "Foto: Axel Mauruszat · Attribution · Wikimedia Commons",
 "/assets/tips/zitadelle-spandau.webp": "Foto: Carsten Steger · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/tips/greenwichpromenade.webp": "Foto: Fridolin freudenfett · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/tips/koepenick.webp": "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/tips/volkspark-friedrichshain.webp": "Foto: A.Savin · FAL · Wikimedia Commons",
 "/assets/tips/koernerpark.webp": "Foto: Assenmacher · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/tips/gleisdreieck.webp": "Foto: A.Savin · FAL · Wikimedia Commons",
 "/assets/tips/humboldthain.webp": "Foto: Angela Monika Arnold · CC BY-SA 2.0 de · Wikimedia Commons",
 "/assets/tips/schoenhausen.webp": "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
 "/assets/tips/rathaus-schoeneberg.webp": "Foto: Dirk Ingo Franke · CC BY 3.0 · Wikimedia Commons",
 "/assets/tips/fernsehturm.webp": "Foto: Diego Delso · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/tips/naturkundemuseum.webp": "Foto: Dosseman · CC BY-SA 4.0 · Wikimedia Commons",
 "/assets/tips/stasimuseum.webp": "Foto: Gunnar Klack · CC BY-SA 4.0 · Wikimedia Commons"
};
  function L(de, tr) { var l = typeof currentLanguage === "string" ? currentLanguage.toLowerCase() : "de"; return l.indexOf("tr") === 0 ? tr : de; }
  function kiezCredit(src) {
    var list = typeof KIEZE_FULL === "object" ? KIEZE_FULL : [];
    for (var i = 0; i < list.length; i++) {
      var c = (list[i].photoCredits || []).find(function (x) { return x.url === src; });
      if (c) return "Foto: " + c.artist + " · " + c.license + " · Wikimedia Commons";
    }
    return "";
  }
  function fix(img) {
    if (img.__mkPhoto) return;
    img.__mkPhoto = 1;
    var raw = img.getAttribute("src") || "";
    if (!raw || raw === "#" || /\/#?$/.test(raw) && raw.indexOf("/assets/") < 0) {
      var box = document.createElement("div");
      box.className = (img.className || "") + " mk-nophoto";
      box.innerHTML = "<span>📷</span><b>" + L("Noch kein Foto", "Henüz fotoğraf yok") + "</b>";
      img.replaceWith(box);
      return;
    }
    var path = raw.replace(/^https:\/\/mykiezberlin\.com/, "");
    var credit = CREDIT[path] || kiezCredit(raw) || kiezCredit("https://mykiezberlin.com" + path);
    if (!credit || !img.parentElement || img.parentElement.querySelector(".mk-photo-credit")) return;
    var cs = getComputedStyle(img.parentElement);
    if (cs.position === "static") img.parentElement.style.position = "relative";
    var span = document.createElement("span");
    span.className = "mk-photo-credit";
    span.textContent = credit;
    img.insertAdjacentElement("afterend", span);
  }
  function scan(root) { (root || document).querySelectorAll("img.card-cover, .ext-gallery img, .kiez-photo img").forEach(fix); }
  var css = document.createElement("style");
  css.textContent = ".mk-nophoto{display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:120px;background:linear-gradient(180deg,#eceff3,#dde1e7);color:#6e7681;font-size:13px;border-radius:inherit}.mk-nophoto span{font-size:28px;opacity:.6}" +
    ".mk-photo-credit{position:absolute;right:6px;bottom:6px;max-width:90%;font-size:9.5px;line-height:1.4;color:#fff;background:rgba(0,0,0,.45);padding:1px 6px;border-radius:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}";
  document.head.appendChild(css);
  var q = false;
  new MutationObserver(function () { if (q) return; q = true; requestAnimationFrame(function () { q = false; scan(); }); }).observe(document.body, { childList: true, subtree: true });
  scan();
})();
