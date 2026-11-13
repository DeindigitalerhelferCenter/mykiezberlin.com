/* My Kiez Berlin – additions 2026-11-14 (owner):
   1. Notruf: more real numbers + "Ihre Sicherheit" / "Saisonale Informationen" of the Berliner Feuerwehr (links, own short texts)
   2. Berlin-Tipps: every card opens a detail window (map, description, route) – before only "Route" opened Google Maps
   3. Berlin Telefonbuch / İş rehberi: search in the real directories (Das Örtliche, Gelbe Seiten, 11880, Das Telefonbuch)
   4. Exklusive Kiez-Vorteile: offers written into a story are shown in the coupon tab as long as the story runs
   Only additions: the old functions are called first, then the new parts are added. */
(function () {
  "use strict";
  function T(de, trText) { return typeof tr === "function" ? tr(de, trText) : de; }
  function E(s) { return typeof esc === "function" ? esc(s) : String(s == null ? "" : s); }

  // ---------- 1. Notruf ----------
  var MORE_NUMBERS = [
    ["behoerde115", "Behördennummer 115", "Devlet daireleri hattı 115", "Bürgeramt, Ordnungsamt, Termine – Auskunft aller Berliner Behörden", "Vatandaşlık dairesi, zabıta, randevular – tüm Berlin daireleri", "115", "service"],
    ["polizei-buerger", "Polizei Berlin – Bürgertelefon", "Berlin Polisi – vatandaş hattı", "Keine Notlage? Fragen, Hinweise, Lärm", "Acil değil mi? Sorular, ihbarlar, gürültü", "030 4664 4664", "service"],
    ["apotheke", "Apotheken-Notdienst", "Nöbetçi eczane", "Nächste Notdienst-Apotheke (Festnetz kostenlos)", "En yakın nöbetçi eczane (sabit hattan ücretsiz)", "0800 00 22833", "medizin"],
    ["zahnarzt", "Zahnärztlicher Notdienst Berlin", "Nöbetçi diş hekimi", "Ansage mit den diensthabenden Praxen", "Nöbetteki muayenehanelerin anonsu", "030 89004333", "medizin"],
    ["seelsorge", "Telefonseelsorge (24 h, kostenlos)", "Telefonla manevi destek (24 saat)", "Anonym reden, wenn es schwer wird", "Zor anlarda isimsiz konuşma", "0800 111 0 111", "hilfe"],
    ["frauen116016", "Hilfetelefon Gewalt gegen Frauen", "Kadına şiddet yardım hattı", "24 h, kostenlos, auch auf Türkisch", "24 saat, ücretsiz, Türkçe de var", "116 016", "hilfe"],
    ["kummer", "Nummer gegen Kummer (Kinder & Jugend)", "Çocuk ve gençler için yardım hattı", "Kostenlos und anonym", "Ücretsiz ve isimsiz", "116 111", "hilfe"],
    ["sperr", "Sperr-Notruf (Karte / Handy sperren)", "Kart / telefon kapatma hattı", "Bankkarte oder Handy verloren?", "Banka kartı veya telefon mu kayboldu?", "116 116", "service"],
    ["strom", "Stromausfall – Stromnetz Berlin", "Elektrik arızası – Stromnetz Berlin", "24 h Störungsdienst", "24 saat arıza servisi", "0800 211 2525", "stoerung"],
    ["gas", "Gasgeruch / Gasstörung – NBB", "Gaz kokusu / gaz arızası – NBB", "24 h Entstörung; bei Gefahr sofort 112", "24 saat arıza; tehlikede hemen 112", "030 787272", "stoerung"],
    ["wasser", "Wasserstörung – Berliner Wasserbetriebe", "Su arızası – Berliner Wasserbetriebe", "Rohrbruch, kein Wasser – 24 h", "Boru patlaması, su yok – 24 saat", "0800 292 7587", "stoerung"],
    ["licht", "Straßenlaterne kaputt", "Sokak lambası arızalı", "Störung an Straßenbeleuchtung melden", "Sokak aydınlatması arızası bildir", "0800 110 2010", "stoerung"],
  ];
  if (typeof EMERGENCY_CONTACTS === "object" && EMERGENCY_CONTACTS && !EMERGENCY_CONTACTS.some(function (c) { return c.id === "behoerde115"; })) {
    MORE_NUMBERS.forEach(function (n) {
      EMERGENCY_CONTACTS.push({ id: n[0], nameDe: n[1], nameTr: n[2], nameEn: n[1], descDe: n[3], descTr: n[4], descEn: n[3], number: n[5], category: n[6], isFree: /^(0800|11)/.test(n[5]) });
    });
  }
  var FW = "https://www.berliner-feuerwehr.de/ihre-sicherheit/";
  var FW_TOPICS = [
    ["🔥", "Verhalten im Brandfall", "Yangında ne yapılır", "Raus, Tür zu, 112 rufen – nie durch Rauch gehen.", "Dışarı çık, kapıyı kapat, 112'yi ara – dumanın içinden geçme.", FW],
    ["📍", "Die richtige Nummer im richtigen Moment", "Doğru anda doğru numara", "Wann 112, wann 116 117, wann 110?", "Ne zaman 112, ne zaman 116 117, ne zaman 110?", FW],
    ["🤟", "Notruf für Menschen mit Hör- oder Sprachbeeinträchtigung", "İşitme / konuşma engelliler için acil çağrı", "Notruf per App und Fax.", "Uygulama ve faks ile acil çağrı.", FW],
    ["🔋", "Lithium-Ionen-Akkus & Feuerlöscher", "Lityum piller & yangın söndürücü", "E-Bike- und Handy-Akkus sicher laden, Rauchmelder prüfen.", "E-bisiklet ve telefon pillerini güvenli şarj et, duman dedektörünü kontrol et.", FW],
  ];
  var FW_SEASON = [
    ["☀️", "Hitze", "Sıcak"], ["🌲", "Waldbrandgefahr", "Orman yangını"], ["🍖", "Grillen", "Mangal"], ["⛈️", "Unwetter", "Fırtına"],
    ["🏊", "Baderegeln", "Yüzme kuralları"], ["🐝", "Insekten", "Böcekler"], ["❄️", "Winterzeit", "Kış"], ["🕯️", "Vorweihnachtszeit", "Noel öncesi"], ["🎆", "Silvester", "Yılbaşı"],
  ];
  function feuerwehrHtml() {
    return '<div class="mk-plus-sec"><h3 class="ext-subheading" style="margin-top:18px">🚒 ' + E(T("Berliner Feuerwehr – Ihre Sicherheit", "Berlin İtfaiyesi – Güvenliğiniz")) + "</h3>" +
      FW_TOPICS.map(function (t) {
        return '<a class="card-item mk-plus-link" href="' + t[5] + '" target="_blank" rel="noopener"><span class="mk-plus-ico">' + t[0] + "</span><span><b>" + E(T(t[1], t[2])) + "</b><small>" + E(T(t[3], t[4])) + "</small></span><i class=\"bi bi-box-arrow-up-right\"></i></a>";
      }).join("") +
      '<div class="card-item" style="padding:14px"><b>' + E(T("Saisonale Informationen", "Mevsimlik bilgiler")) + "</b>" +
      '<p class="card-desc" style="margin:4px 0 8px">' + E(T("Tipps der Feuerwehr für jede Jahreszeit.", "İtfaiyeden her mevsim için öneriler.")) + "</p>" +
      '<div class="mk-plus-chips">' + FW_SEASON.map(function (s) { return '<a class="chip-btn" href="' + FW + 'saisonale-informationen/" target="_blank" rel="noopener">' + s[0] + " " + E(T(s[1], s[2])) + "</a>"; }).join("") + "</div>" +
      '<a class="chip-btn active" style="margin-top:10px;display:inline-block" href="' + FW + '" target="_blank" rel="noopener">' + E(T("Alle Infos der Feuerwehr", "İtfaiyenin tüm bilgileri")) + " ↗</a></div>" +
      '<button class="btn-primary" style="margin-top:12px" onclick="switchTab(\'telefonbuch\')">📒 ' + E(T("Berliner Telefonbuch öffnen", "Berlin telefon rehberini aç")) + "</button></div>";
  }
  if (typeof renderEmergencyTab === "function") {
    var baseEmergency = renderEmergencyTab;
    renderEmergencyTab = function (container) {
      baseEmergency.apply(this, arguments);
      try { container.insertAdjacentHTML("beforeend", feuerwehrHtml()); } catch (e) {}
    };
  }

  // ---------- 2. Berlin-Tipps detail window ----------
  // 2026-11-14: categories are English keys – shown in German / Turkish
  var TIP_CAT = { culture: ["Kultur", "Kültür"], view: ["Aussicht", "Manzara"], park: ["Park & Natur", "Park & Doğa"], kids: ["Für Kinder", "Çocuklar için"], museum: ["Museum", "Müze"] };
  // 2026-11-14 (owner): real photos of every tip (Wikipedia / Wikimedia Commons, checked one by one, credit shown)
  // and a tap on the card opens the real Google Maps place page (name + address -> photos, reviews, hours)
  var TIP_PHOTO = {
    "botanischer-garten": "Foto: Axel Mauruszat · Attribution · Wikimedia Commons",
    "brandenburger-tor": "Foto: Thomas Wolf, www.foto-tw.de · CC BY-SA 3.0 · Wikimedia Commons",
    "britzer-garten": "Foto: Denis Apel · CC BY-SA 4.0 · Wikimedia Commons",
    "checkpoint-charlie": "Foto: Christian David · CC BY-SA 4.0 · Wikimedia Commons",
    "east-side-gallery": "Foto: Joachim F. Thurn · CC BY-SA 3.0 de · Wikimedia Commons",
    "fernsehturm": "Foto: Diego Delso · CC BY-SA 4.0 · Wikimedia Commons",
    "gaerten-der-welt": "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
    "gendarmenmarkt": "Foto: Ansgar Koreng · CC BY 3.0 de · Wikimedia Commons",
    "gleisdreieck": "Foto: A.Savin · FAL · Wikimedia Commons",
    "greenwichpromenade": "Foto: Fridolin freudenfett · CC BY-SA 4.0 · Wikimedia Commons",
    "holocaust-mahnmal": "Foto: Alexander Blum · CC BY-SA 4.0 · Wikimedia Commons",
    "humboldthain": "Foto: Angela Monika Arnold · CC BY-SA 2.0 de · Wikimedia Commons",
    "koepenick": "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
    "koernerpark": "Foto: Assenmacher · CC BY-SA 3.0 · Wikimedia Commons",
    "mauer-gedenkstaette": "Foto: HerrAdams · CC BY-SA 4.0 · Wikimedia Commons",
    "mauerpark": "Foto: Traktorminze · CC BY 3.0 · Wikimedia Commons",
    "molecule-man": "Foto: Avda · CC BY-SA 3.0 · Wikimedia Commons",
    "museumsinsel": "Foto: Thomas Wolf, www.foto-tw.de · CC BY-SA 3.0 · Wikimedia Commons",
    "naturkundemuseum": "Foto: Dosseman · CC BY-SA 4.0 · Wikimedia Commons",
    "rathaus-schoeneberg": "Foto: Dirk Ingo Franke · CC BY 3.0 · Wikimedia Commons",
    "reichstag": "Foto: Jörg Braukmann · CC BY-SA 4.0 · Wikimedia Commons",
    "schloss-charlottenburg": "Foto: Times · CC BY-SA 3.0 · Wikimedia Commons",
    "schoenhausen": "Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
    "stasimuseum": "Foto: Gunnar Klack · CC BY-SA 4.0 · Wikimedia Commons",
    "technikmuseum": "Foto: Sir James · CC BY-SA 2.0 de · Wikimedia Commons",
    "tempelhofer-feld": "Foto: Matti Blume · CC BY-SA 4.0 · Wikimedia Commons",
    "tiergarten-park": "Foto: beedubz · CC BY-SA 3.0 · Wikimedia Commons",
    "tierpark": "Foto: Dreizung · CC BY 3.0 · Wikimedia Commons",
    "treptower-park": "Foto: Andreas Steinhoff · Attribution · Wikimedia Commons",
    "viktoriapark": "Foto: A.Savin · FAL · Wikimedia Commons",
    "volkspark-friedrichshain": "Foto: A.Savin · FAL · Wikimedia Commons",
    "zitadelle-spandau": "Foto: Carsten Steger · CC BY-SA 4.0 · Wikimedia Commons",
    "zoo-berlin": "Foto: Jean-Pierre Dalbéra from Paris, France · CC BY 2.0 · Wikimedia Commons"
  };
  function tipPhoto(t) { return TIP_PHOTO[t.id] ? "/assets/tips/" + t.id + ".webp" : ""; }
  function tipMaps(t) { return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(t.name + ", " + (t.address || "Berlin")); }
  window.mkOpenTip = function (id) {
    var t = (typeof BERLIN_TIPS === "object" ? BERLIN_TIPS : []).find(function (x) { return x.id === id; });
    if (!t || typeof openDetailModal !== "function") return;
    var lang = typeof currentLanguage === "string" ? currentLanguage : "de";
    var desc = lang === "tr" ? t.descTr : lang === "en" ? t.descEn || t.descDe : t.descDe;
    var kiez = (typeof KIEZE_FULL === "object" ? KIEZE_FULL : []).find(function (k) { return k.id === t.kiezId; });
    var route = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(t.lat && t.lng ? t.lat + "," + t.lng : t.address || t.name);
    var more = "https://www.google.com/search?q=" + encodeURIComponent(t.name + " Berlin");
    // same map embed as the sponsor contact sheet (allowed by the CSP: maps.google.com)
    var map = '<iframe title="Karte" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="display:block;width:100%;height:220px;border:0;border-radius:12px;margin-top:12px;background:#e5e3df" src="https://maps.google.com/maps?q=' +
      encodeURIComponent(t.lat && t.lng ? t.lat + "," + t.lng : (t.address || t.name)) + '&z=16&output=embed"></iframe>';
    var photo = tipPhoto(t)
      ? '<figure style="margin:6px 0 0"><img src="' + tipPhoto(t) + '" alt="' + E(t.name) + '" style="display:block;width:100%;max-height:300px;object-fit:cover;border-radius:12px"><figcaption style="font-size:10.5px;opacity:.65;margin-top:3px">' + E(TIP_PHOTO[t.id]) + "</figcaption></figure>" : "";
    openDetailModal(photo +
      '<h3 class="modal-title" style="padding-right:36px;margin-top:6px">' + E(t.name) + "</h3>" +
      '<div class="card-subtitle" style="margin-top:4px">📍 ' + E(t.address || "") + (kiez ? " · " + E(kiez.name) : "") + "</div>" +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + (t.isFree ? '<span class="card-tag">' + E(T("Gratis", "Ücretsiz")) + "</span>" : "") +
      (t.categories || []).map(function (c) { var n = TIP_CAT[c]; return '<span class="card-tag" style="background:rgba(0,0,0,.06);color:inherit">' + E(n ? T(n[0], n[1]) : c) + "</span>"; }).join("") + "</div>" +
      '<p class="card-desc" style="margin-top:10px;font-size:14.5px">' + E(desc || "") + "</p>" + map +
      '<div class="ext-actions" style="margin-top:12px"><a class="chip-btn active" href="' + route + '" target="_blank" rel="noopener"><i class="bi bi-geo-alt-fill"></i> ' + E(T("Route", "Yol tarifi")) + "</a>" +
      '<a class="chip-btn" href="' + more + '" target="_blank" rel="noopener"><i class="bi bi-search"></i> ' + E(T("Mehr erfahren", "Daha fazla bilgi")) + "</a></div>");
  };
  if (typeof EXTRA_TABS === "object" && EXTRA_TABS && EXTRA_TABS.tips) {
    var baseTips = EXTRA_TABS.tips;
    EXTRA_TABS.tips = function (container) {
      baseTips.apply(this, arguments);
      var filter = (typeof filters === "object" && filters && filters.tips) || "all";
      var shown = BERLIN_TIPS.filter(function (t) { return filter === "all" || (t.categories || []).indexOf(filter) >= 0; });
      container.querySelectorAll(".card-item").forEach(function (card, i) {
        var t = shown[i];
        if (!t) return;
        card.style.cursor = "pointer";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        // 2026-11-14 (owner): card = real Google Maps place page; "Details" = our window
        card.addEventListener("click", function (ev) {
          if (ev.target.closest("a")) return;
          if (ev.target.closest(".mk-tip-details")) { window.mkOpenTip(t.id); return; }
          window.open(tipMaps(t), "_blank", "noopener");
        });
        card.addEventListener("keydown", function (ev) { if (ev.key === "Enter") window.open(tipMaps(t), "_blank", "noopener"); });
        var actions = card.querySelector(".ext-actions");
        if (actions) actions.insertAdjacentHTML("afterbegin", '<button type="button" class="chip-btn active mk-tip-details"><i class="bi bi-info-circle-fill"></i> ' + E(T("Details", "Detaylar")) + "</button>");
        if (tipPhoto(t) && !card.querySelector(".mk-tip-photo")) {
          card.insertAdjacentHTML("afterbegin", '<div class="mk-tip-photo" style="position:relative;margin:-14px -14px 10px;overflow:hidden;border-radius:16px 16px 0 0"><img src="' + tipPhoto(t) + '" alt="' + E(t.name) + '" loading="lazy" style="display:block;width:100%;aspect-ratio:16/9;object-fit:cover">' +
            '<span style="position:absolute;right:6px;bottom:4px;font-size:9.5px;color:#fff;background:rgba(0,0,0,.45);padding:1px 6px;border-radius:6px;max-width:90%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + E(TIP_PHOTO[t.id]) + "</span></div>");
        }
      });
    };
  }

  // ---------- 3. Berlin Telefonbuch / İş rehberi ----------
  var BOOKS = [
    ["Das Örtliche", function (w, o) { return "https://www.dasoertliche.de/?kw=" + encodeURIComponent(w) + "&ci=" + encodeURIComponent(o); }],
    ["Gelbe Seiten", function (w, o) { return "https://www.gelbeseiten.de/suche/" + encodeURIComponent(w) + "/" + encodeURIComponent(o); }],
    ["Das Telefonbuch", function (w, o) { return "https://www.dastelefonbuch.de/Suche/" + encodeURIComponent(w) + "/" + encodeURIComponent(o); }],
    ["11880", function (w, o) { return "https://www.11880.com/suche/" + encodeURIComponent(w) + "/" + encodeURIComponent(o); }],
    ["Google Maps", function (w, o) { return "https://www.google.com/maps/search/" + encodeURIComponent(w + " " + o); }],
  ];
  var QUICK = [["Zahnarzt", "Diş hekimi"], ["Hausarzt", "Aile hekimi"], ["Apotheke", "Eczane"], ["Schlüsseldienst", "Çilingir"], ["Friseur", "Kuaför"], ["Rechtsanwalt", "Avukat"], ["Steuerberater", "Mali müşavir"], ["Autowerkstatt", "Oto tamir"], ["Klempner", "Tesisatçı"], ["Elektriker", "Elektrikçi"]];
  var OFFICIAL = [
    ["115", "Behördennummer Berlin", "Berlin devlet daireleri hattı", "tel:115"],
    ["Service-Portal", "Bürgeramt-Termine & Formulare", "Vatandaşlık dairesi randevu & formlar", "https://service.berlin.de/"],
    ["Ordnungsamt online", "Falschparker, Müll, Lärm melden", "Yanlış park, çöp, gürültü bildir", "https://ordnungsamt.berlin.de/"],
    ["BVG", "Fahrinfo & Kundenservice 030 19449", "Sefer bilgisi & müşteri hizmetleri", "https://www.bvg.de/"],
  ];
  function lookup(where) {
    var w = (document.getElementById("mk-tb-what") || {}).value || "";
    var o = (document.getElementById("mk-tb-where") || {}).value || "Berlin";
    w = w.trim();
    if (!w) { if (typeof showToast === "function") showToast(T("Bitte gib ein, was du suchst.", "Lütfen ne aradığını yaz.")); return; }
    var book = BOOKS.find(function (b) { return b[0] === where; }) || BOOKS[0];
    window.open(book[1](w, o.trim() || "Berlin"), "_blank", "noopener");
  }
  window.mkTbSearch = lookup;
  window.mkTbQuick = function (w) { var f = document.getElementById("mk-tb-what"); if (f) { f.value = w; f.focus(); } };
  function renderTelefonbuch(container) {
    var kieze = (typeof KIEZE_FULL === "object" ? KIEZE_FULL : []).map(function (k) { return k.name; });
    var ads = (window.mkAllAds || []).length;
    container.innerHTML =
      '<h2 class="ext-heading">📒 ' + E(T("Berliner Telefonbuch & Branchen", "Berlin telefon & iş rehberi")) + "</h2>" +
      '<div class="card-item" style="padding:16px;grid-column:1/-1">' +
      '<label class="form-label">' + E(T("Was suchst du?", "Ne arıyorsun?")) + '</label><input id="mk-tb-what" class="form-control" placeholder="' + E(T("Name, Firma oder Branche", "İsim, firma veya sektör")) + '" onkeydown="if(event.key===\'Enter\')mkTbSearch(\'Das Örtliche\')">' +
      '<label class="form-label" style="margin-top:8px">' + E(T("Wo?", "Nerede?")) + '</label><input id="mk-tb-where" class="form-control" list="mk-tb-kieze" value="Berlin"><datalist id="mk-tb-kieze">' + kieze.map(function (k) { return '<option value="' + E(k) + '">'; }).join("") + "</datalist>" +
      '<div class="mk-plus-chips" style="margin-top:10px">' + QUICK.map(function (q) { return '<button type="button" class="chip-btn" onclick="mkTbQuick(\'' + q[0] + '\')">' + E(T(q[0], q[1])) + "</button>"; }).join("") + "</div>" +
      '<p class="ext-note" style="margin:12px 0 6px">' + E(T("Suchen in den echten Verzeichnissen:", "Gerçek rehberlerde ara:")) + "</p>" +
      '<div class="mk-plus-books">' + BOOKS.map(function (b) { return '<button type="button" class="chip-btn active" onclick="mkTbSearch(\'' + b[0] + '\')">🔎 ' + E(b[0]) + "</button>"; }).join("") + "</div>" +
      '<p class="ext-note" style="margin-top:10px">' + E(T("Die Suche öffnet die Seite des Verzeichnisses. My Kiez speichert keine Daten.", "Arama rehberin kendi sayfasını açar. My Kiez veri kaydetmez.")) + "</p></div>" +
      '<h3 class="ext-subheading">🏛️ ' + E(T("Offizielle Stellen", "Resmî kurumlar")) + "</h3>" +
      OFFICIAL.map(function (o) { return '<a class="card-item mk-plus-link" href="' + o[3] + '"' + (o[3].indexOf("http") === 0 ? ' target="_blank" rel="noopener"' : "") + '><span class="mk-plus-ico">☎️</span><span><b>' + E(o[0]) + "</b><small>" + E(T(o[1], o[2])) + '</small></span><i class="bi bi-chevron-right"></i></a>'; }).join("") +
      '<h3 class="ext-subheading">🤝 ' + E(T("Betriebe aus deinem Kiez", "Mahallendeki işletmeler")) + "</h3>" +
      '<button class="btn-primary" onclick="switchTab(\'sponsors\')">' + E(T("Alle Kiez-Partner ansehen", "Tüm Kiez partnerlerini gör")) + (ads ? " (" + ads + ")" : "") + " →</button>" +
      '<button class="chip-btn" style="margin-top:10px" onclick="switchTab(\'emergency\')">🚨 ' + E(T("Notrufnummern", "Acil numaralar")) + "</button>";
  }
  if (typeof EXTRA_TABS === "object" && EXTRA_TABS) {
    EXTRA_TABS.telefonbuch = renderTelefonbuch;
    if (EXTRA_TABS.more) {
      var baseMore = EXTRA_TABS.more;
      EXTRA_TABS.more = function (container) {
        baseMore.apply(this, arguments);
        var grid = container.querySelector(".ext-grid");
        if (grid && !grid.querySelector("[data-mk-tb]")) grid.insertAdjacentHTML("beforeend", '<button class="ext-tile" data-mk-tb="1" onclick="switchTab(\'telefonbuch\')"><i class="bi bi-journal-bookmark-fill"></i><span>' + E(T("Telefonbuch", "Telefon rehberi")) + "</span></button>");
      };
    }
  }

  // ---------- 4. Exklusive Kiez-Vorteile: offers from stories ----------
  function storyDeals() {
    var list = typeof getStories === "function" ? getStories().filter(function (s) { return s.status === "approved"; }) : [];
    var out = [];
    list.forEach(function (s, i) { if (s.deal && s.deal.what && s.deal.price) out.push({ s: s, i: i }); });
    return out;
  }
  window.mkStoryDealsCount = function () { return storyDeals().length; };
  function dealsHtml() {
    var d = storyDeals();
    var head = '<div class="card-item mk-plus-dealhead"><b>🏷️ ' + E(T("Exklusive Kiez-Vorteile", "Özel Kiez İndirimleri")) + "</b><small>" +
      E(T("Aktuelle Angebote aus den Kiez-Stories – solange die Story läuft.", "Kiez hikâyelerindeki güncel indirimler – hikâye yayında olduğu sürece.")) + "</small></div>";
    if (!d.length) return head + '<p class="ext-note" style="margin:0 0 12px">' + E(T("Gerade keine Story-Angebote. Teile selbst eins über „Story teilen“ → „Angebot / Rabatt“.", "Şu an hikâye indirimi yok. „Hikâye paylaş“ → „İndirim / kampanya“ ile sen de paylaş.")) + "</p>";
    return head + '<div class="mk-plus-deals">' + d.map(function (x) {
      var s = x.s, img = s.image && s.image.indexOf("hero_berlin") < 0 ? s.image : "";
      var ends = s.approvedAt && s.durationHours ? new Date(s.approvedAt + s.durationHours * 3600000) : null;
      return '<button type="button" class="card-item mk-plus-deal" onclick="openStoryViewer(' + x.i + ')">' +
        (img ? '<img src="' + img + '" alt="" loading="lazy">' : '<div class="mk-plus-deal-noimg">🏷️</div>') +
        '<div class="mk-plus-deal-body"><b>' + E(s.deal.what) + '</b><div class="mk-plus-price"><span>' + E(s.deal.price) + "</span>" + (s.deal.old ? "<s>" + E(s.deal.old) + "</s>" : "") + "</div>" +
        "<small>" + s.author + " · " + s.kiez + (ends ? " · " + E(T("bis", "bitiş")) + " " + ends.toLocaleString(undefined, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "") + "</small></div></button>";
    }).join("") + "</div>";
  }
  if (typeof EXTRA_TABS === "object" && EXTRA_TABS && EXTRA_TABS.deals) {
    var baseDeals = EXTRA_TABS.deals;
    EXTRA_TABS.deals = function (container) {
      baseDeals.apply(this, arguments);
      var h = container.querySelector(".ext-heading");
      if (h) h.insertAdjacentHTML("afterend", dealsHtml()); else container.insertAdjacentHTML("afterbegin", dealsHtml());
    };
  }

  var css = document.createElement("style");
  css.textContent =
    ".mk-plus-link{display:flex;align-items:center;gap:12px;padding:12px 14px;text-decoration:none;color:inherit}.mk-plus-link>span:nth-child(2){flex:1;min-width:0}" +
    ".mk-plus-link b{display:block;font-size:14.5px}.mk-plus-link small{display:block;font-size:12.5px;opacity:.75;margin-top:2px}.mk-plus-ico{font-size:24px;flex:none}" +
    ".mk-plus-chips,.mk-plus-books{display:flex;gap:6px;flex-wrap:wrap}" +
    ".mk-plus-dealhead{padding:12px 14px;background:rgba(227,6,19,.07);border:1px solid rgba(227,6,19,.2)}.mk-plus-dealhead b{display:block;color:#B00010;font-size:15px}.mk-plus-dealhead small{opacity:.8}" +
    ".mk-plus-deals{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin:0 0 16px;grid-column:1/-1}" +
    ".mk-plus-deal{display:flex;flex-direction:column;padding:0;overflow:hidden;text-align:left;border:2px solid #F2B705;cursor:pointer;font:inherit;color:inherit;background:var(--surface-color,#fff)}" +
    ".mk-plus-deal img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}.mk-plus-deal-noimg{aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;font-size:42px;background:rgba(242,183,5,.15)}" +
    ".mk-plus-deal-body{padding:10px 12px}.mk-plus-deal-body b{display:block;font-size:14.5px}.mk-plus-deal-body small{display:block;opacity:.7;font-size:12px;margin-top:4px}" +
    ".mk-plus-price{display:flex;gap:8px;align-items:baseline;margin-top:4px}.mk-plus-price span{font-size:20px;font-weight:900;color:#E30613}.mk-plus-price s{opacity:.6;font-size:13px}" +
    "@media(min-width:768px){.main-content>.mk-plus-sec{grid-column:1/-1}" +
    ".mk-plus-sec{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;align-items:start}.mk-plus-sec>h3,.mk-plus-sec>.btn-primary{grid-column:1/-1}.mk-plus-sec>.card-item{margin:0}" +
    /* 2026-11-14 (owner): sponsor cards that rotate into lists (Notruf, Events …) stretched the card next to them
       into a big empty window – cards keep their own height, sponsor cards take the full width */
    ".main-content>.card-item,.main-content>.mk-deck-box{align-self:start}" +
    ".main-content>.mk-sp.mk-sz,.main-content>.mk-sp-slot{grid-column:1/-1;align-self:start}" +
    ".main-content>.mk-sp-slot .mk-sp.mk-sz-m{flex-direction:row;min-height:0}.main-content>.mk-sp-slot .mk-sz-m .mk-sz-pic{flex:0 0 min(40%,480px);display:flex;align-items:center}.main-content>.mk-sp-slot .mk-sz-m .mk-sz-pic img{height:auto;object-fit:contain}" +
    ".main-content>.mk-sp.mk-sz-m{flex-direction:row;min-height:0}.main-content>.mk-sp.mk-sz-m .mk-sz-pic{flex:0 0 min(40%,480px);display:flex;align-items:center}.main-content>.mk-sp.mk-sz-m .mk-sz-pic img{height:auto;object-fit:contain}}" +
    "@media(min-width:768px){.main-content>.mk-plus-dealhead,.main-content>.mk-plus-deals,.main-content>.mk-plus-link,.main-content>.ext-note{grid-column:1/-1}}";
  document.head.appendChild(css);
})();
