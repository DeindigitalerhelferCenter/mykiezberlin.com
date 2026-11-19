/* 2026-11-19 (owner): the 5 sample stories at the end of the story bar (Kiez-Team "Maybachufer", "Mauerpark Verein",
   "Berlin Event" Festival of Lights in November, "Kiez-Gastro" …) had pictures that did not fit and old topics.
   Now the end of the story bar always shows CURRENT Berlin topics:
   1. real events from /api/events (berlin.de open data: Volksfeste, Weihnachtsmärkte) in the next 14 days,
   2. the yearly Berlin calendar below – a topic is shown only in its time window and disappears by itself afterwards,
   3. two all-year topics (Museumssonntag, Flohmarkt im Mauerpark) fill up to 5.
   Every picture is a real, free photo of exactly that topic (Wikimedia Commons, credit in the text).
   The old sample stories story_1 … story_5 are removed, also from copies kept in the browser (localStorage). */
(function () {
  "use strict";
  if (typeof getStories !== "function") return;

  var OLD_IDS = { story_1: 1, story_2: 1, story_3: 1, story_4: 1, story_5: 1 };
  var MAX = 5;
  var AUTHOR = "Kiez-Redaktion";
  var C = {
    trojak: "📷 Foto: Andreas Trojak · CC BY 2.0 · Wikimedia Commons",
    lenz: "📷 Foto: Leonhard Lenz · CC0 · Wikimedia Commons",
    kraft: "📷 Foto: Martin Kraft · CC BY-SA 4.0 · Wikimedia Commons",
    schnitzler: "📷 Foto: MSchnitzler2000 · CC BY-SA 3.0 · Wikimedia Commons",
    izilla: "📷 Foto: iZilla (Flickr) · CC0 · Wikimedia Commons",
    suthorn: "📷 Foto: C.Suthorn · CC BY-SA 4.0 · Wikimedia Commons",
    barthel: "📷 Foto: Denis Barthel · CC BY-SA 4.0 · Wikimedia Commons",
    lotse: "📷 Foto: Lotse · CC BY-SA 3.0 · Wikimedia Commons",
    savin: "📷 Foto: A.Savin · CC BY-SA 3.0 · Wikimedia Commons",
    adams: "📷 Foto: HerrAdams · CC BY-SA 4.0 · Wikimedia Commons",
    traktor: "📷 Foto: Traktorminze · CC BY 3.0 · Wikimedia Commons",
    wolf: "📷 Foto: Thomas Wolf, www.foto-tw.de · CC BY-SA 3.0 · Wikimedia Commons",
    blume: "📷 Foto: Matti Blume · CC BY-SA 4.0 · Wikimedia Commons",
  };

  // from / to = "MM-DD" (to may be in the next year, e.g. Silvester 12-20 … 01-01). No exact event dates are
  // invented: the texts only say what is true every year; the link leads to the official page with the dates.
  var TOPICS = [
    { id: "weihnachtsmarkt", from: "11-15", to: "12-31", kiez: "Mitte", img: "assets/stories/weihnachtsmarkt.webp", credit: C.trojak,
      link: "https://www.berlin.de/weihnachtsmarkt/",
      tr: ["Berlin'de Noel pazarları", "Advent döneminde Berlin'de 60'tan fazla Noel pazarı var – Gendarmenmarkt'tan Spandau'ya. Tüm pazarlar, saatler ve adresler berlin.de'de."],
      de: ["Weihnachtsmärkte in Berlin", "In der Adventszeit öffnen in Berlin über 60 Weihnachtsmärkte – vom Gendarmenmarkt bis Spandau. Alle Märkte, Zeiten und Adressen auf berlin.de."] },
    { id: "weihnachtsmarkt-charlottenburg", from: "11-15", to: "12-27", kiez: "Charlottenburg", img: "assets/stories/weihnachtsmarkt-charlottenburg.webp", credit: C.lenz,
      link: "https://www.berlin.de/weihnachtsmarkt/",
      tr: ["Charlottenburg Sarayı önünde Noel pazarı", "Barok sarayın önünde ışıklı tezgâhlar, sıcak şarap ve el işleri – Berlin'in en sevilen Noel pazarlarından biri."],
      de: ["Weihnachtsmarkt vor Schloss Charlottenburg", "Leuchtende Buden, Glühwein und Kunsthandwerk vor dem Barockschloss – einer der beliebtesten Weihnachtsmärkte Berlins."] },
    { id: "silvester", from: "12-20", to: "01-01", kiez: "Mitte", img: "assets/stories/silvester.webp", credit: C.lenz,
      link: "https://www.berlin.de/silvester/",
      tr: ["Brandenburg Kapısı'nda yılbaşı", "Berlin yeni yılı Brandenburg Kapısı'nda kutluyor. Program, giriş ve güvenlik bilgileri berlin.de'de. Havai fişeklerde dikkatli olun!"],
      de: ["Silvester am Brandenburger Tor", "Berlin feiert den Jahreswechsel am Brandenburger Tor. Programm, Einlass und Sicherheitshinweise auf berlin.de. Vorsicht mit Feuerwerk!"] },
    { id: "berlinale", from: "01-20", to: "02-28", kiez: "Tiergarten", img: "assets/stories/berlinale.webp", credit: C.kraft,
      link: "https://www.berlin.de/berlinale/",
      tr: ["Berlinale – Berlin Film Festivali", "Her şubatta dünyanın en büyük film festivallerinden biri Potsdamer Platz'da. Program ve biletler resmî sayfada."],
      de: ["Berlinale – Internationale Filmfestspiele", "Jeden Februar eines der größten Filmfestivals der Welt rund um den Potsdamer Platz. Programm und Tickets auf der offiziellen Seite."] },
    { id: "gaerten-der-welt", from: "03-25", to: "05-10", kiez: "Marzahn", img: "assets/tips/gaerten-der-welt.webp", credit: C.savin,
      link: "https://www.gaertenderwelt.de/",
      tr: ["Dünya Bahçeleri'nde bahar", "Marzahn'daki Gärten der Welt'te kiraz ağaçları ve bahar çiçekleri açıyor – teleferikle de gidilebilir."],
      de: ["Frühling in den Gärten der Welt", "In den Gärten der Welt in Marzahn blühen Kirschbäume und Frühlingsblumen – auch mit der Seilbahn erreichbar."] },
    { id: "tempelhofer-feld", from: "04-01", to: "10-15", kiez: "Neukölln", img: "assets/tips/tempelhofer-feld.webp", credit: C.blume,
      link: "https://gruen-berlin.de/projekte/parks/tempelhofer-feld",
      tr: ["Tempelhofer Feld", "Eski havalimanının pistlerinde bisiklet, paten, piknik ve gün batımı – Berlin'in en büyük açık alanı."],
      de: ["Tempelhofer Feld", "Radfahren, Skaten, Picknick und Sonnenuntergang auf den alten Rollbahnen – Berlins größte Freifläche."] },
    { id: "karneval-der-kulturen", from: "05-01", to: "06-10", kiez: "Kreuzberg", img: "assets/stories/karneval-der-kulturen.webp", credit: C.schnitzler,
      link: "https://karneval.berlin/",
      tr: ["Karneval der Kulturen", "Pentekost'ta Kreuzberg'de dünyanın dört bir yanından müzik, dans ve renkli kortej. Tarihler resmî sayfada."],
      de: ["Karneval der Kulturen", "Zu Pfingsten ziehen Musik, Tanz und bunte Umzugsgruppen aus aller Welt durch Kreuzberg. Termine auf der offiziellen Seite."] },
    { id: "fete-de-la-musique", from: "06-07", to: "06-21", kiez: "Ganz Berlin", img: "assets/stories/fete-de-la-musique.webp", credit: C.izilla,
      link: "https://www.fetedelamusique.de/",
      tr: ["Fête de la Musique – 21 Haziran", "Her yıl 21 Haziran'da Berlin'in her köşesinde ücretsiz konserler: sokaklarda, parklarda ve avlularda."],
      de: ["Fête de la Musique – 21. Juni", "Jedes Jahr am 21. Juni kostenlose Konzerte in ganz Berlin: auf Straßen, in Parks und Höfen."] },
    { id: "csd", from: "07-01", to: "07-31", kiez: "Schöneberg", img: "assets/stories/csd.webp", credit: C.suthorn,
      link: "https://csd-berlin.de/",
      tr: ["CSD Berlin – Pride", "Temmuz'da yüz binlerce kişi çeşitlilik ve eşit haklar için Berlin'de yürüyor. Güzergâh ve tarih resmî sayfada."],
      de: ["CSD Berlin – Pride", "Im Juli demonstrieren Hunderttausende in Berlin für Vielfalt und gleiche Rechte. Route und Termin auf der offiziellen Seite."] },
    { id: "lange-nacht-der-museen", from: "08-01", to: "08-31", kiez: "Mitte", img: "assets/tips/museumsinsel.webp", credit: C.wolf,
      link: "https://langenachtdermuseen.berlin/",
      tr: ["Müzeler Gecesi", "Bir bilet ile gece yarısından sonrasına kadar onlarca Berlin müzesi. Tarih ve program resmî sayfada."],
      de: ["Lange Nacht der Museen", "Mit einem Ticket bis nach Mitternacht durch Dutzende Berliner Museen. Termin und Programm auf der offiziellen Seite."] },
    { id: "berlin-marathon", from: "09-01", to: "09-30", kiez: "Ganz Berlin", img: "assets/stories/berlin-marathon.webp", credit: C.barthel,
      link: "https://www.bmw-berlin-marathon.com/",
      tr: ["Berlin Maratonu", "Eylül'de on binlerce koşucu Berlin sokaklarında. Kapalı yollar ve otobüs değişiklikleri için resmî sayfaya bakın."],
      de: ["Berlin-Marathon", "Im September laufen Zehntausende durch Berlins Straßen. Straßensperrungen und BVG-Änderungen auf der offiziellen Seite."] },
    { id: "festival-of-lights", from: "10-01", to: "10-20", kiez: "Mitte", img: "assets/stories/festival-of-lights.webp", credit: C.lotse,
      link: "https://festival-of-lights.de/",
      tr: ["Festival of Lights", "Ekim'de Brandenburg Kapısı, Fernsehturm ve daha birçok yapı ışık projeksiyonlarıyla parlıyor."],
      de: ["Festival of Lights", "Im Oktober leuchten Brandenburger Tor, Fernsehturm und viele weitere Bauwerke mit Lichtprojektionen."] },
    { id: "mauerfall", from: "11-01", to: "11-10", kiez: "Mitte", img: "assets/tips/mauer-gedenkstaette.webp", credit: C.adams,
      link: "https://www.stiftung-berliner-mauer.de/de/gedenkstaette-berliner-mauer",
      tr: ["9 Kasım – Berlin Duvarı'nın yıkılışı", "Bernauer Straße'deki Berlin Duvarı Anıtı'nda 1989'u anma. Ziyaret ücretsiz."],
      de: ["9. November – Mauerfall", "Gedenken an 1989 an der Gedenkstätte Berliner Mauer in der Bernauer Straße. Der Besuch ist kostenlos."] },
  ];
  // all year: fill up to MAX
  var ALWAYS = [
    { id: "museumssonntag", kiez: "Mitte", img: "assets/tips/museumsinsel.webp", credit: C.wolf, link: "https://www.museumssonntag.berlin/",
      tr: ["Müze Pazarı – her ayın ilk pazarı ücretsiz", "Her ayın ilk pazar günü birçok Berlin müzesine giriş ücretsiz. Zaman dilimi biletini önceden alın."],
      de: ["Museumssonntag – jeden 1. Sonntag frei", "An jedem ersten Sonntag im Monat ist der Eintritt in viele Berliner Museen frei. Zeitfenster-Ticket vorher buchen."] },
    { id: "flohmarkt-mauerpark", kiez: "Prenzlauer Berg", img: "assets/tips/mauerpark.webp", credit: C.traktor, link: "https://www.mauerpark.info/",
      tr: ["Mauerpark'ta pazar bit pazarı", "Her pazar Mauerpark'ta bit pazarı, sokak yemekleri ve müzik. Hava güzelse amfi tiyatroda karaoke."],
      de: ["Sonntags Flohmarkt im Mauerpark", "Jeden Sonntag Flohmarkt, Streetfood und Musik im Mauerpark. Bei gutem Wetter Karaoke im Amphitheater."] },
  ];

  function berlinMD(d) {
    var s = d.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" }); // YYYY-MM-DD
    return s.slice(5);
  }
  function inWindow(md, from, to) { return from <= to ? md >= from && md <= to : md >= from || md <= to; }

  function toStory(t, kind) {
    var tr = typeof currentLanguage === "string" && currentLanguage.indexOf("tr") === 0;
    return {
      id: "topic_" + t.id,
      author: AUTHOR,
      kiez: t.kiez,
      // 2026-11-19 (owner): Turkish first, German after it – same order as the admin stories
      headline: t.tr[0] + " · " + t.de[0],
      subtext: "🇹🇷 " + t.tr[1] + "\n\n🇩🇪 " + t.de[1] + "\n\n" + t.credit,
      image: t.img,
      isVideo: false,
      status: "approved",
      link: t.link,
      cats: kind === "always" ? ["berlin", "events"] : ["events", "berlin"],
      mkTopic: true,
      lang: tr ? "tr" : "de",
    };
  }

  // real events (berlin.de) – loaded once, then the bar is drawn again
  var events = [];
  function eventStories() {
    var now = Date.now(), soon = now + 14 * 86400000;
    return events.filter(function (e) { return e && e.title && e.from && e.to && e.from <= soon && e.to >= now - 86400000; })
      .slice(0, 2).map(function (e) {
        var xmas = e.category === "Weihnachtsmarkt";
        var day = function (ms) { return new Date(ms).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", timeZone: "UTC" }); };
        var when = day(e.from) + (e.to !== e.from ? " – " + day(e.to) : "");
        var kiezImg = typeof mkKiezPhoto === "function" ? mkKiezPhoto(e.district) : "";
        return {
          id: "event_" + e.id, author: AUTHOR, kiez: e.district || "Berlin",
          headline: e.title + " · " + when,
          subtext: [e.time, e.address, e.description].filter(Boolean).join("\n") + (xmas ? "\n\n" + C.trojak : ""),
          image: xmas ? "assets/stories/weihnachtsmarkt.webp" : (kiezImg || "assets/tips/brandenburger-tor.webp"),
          isVideo: false, status: "approved", link: e.url, cats: ["events", "berlin"], mkTopic: true,
        };
      });
  }

  function topicStories() {
    var md = berlinMD(new Date());
    var list = eventStories();
    TOPICS.filter(function (t) { return inWindow(md, t.from, t.to); }).forEach(function (t) { if (list.length < MAX) list.push(toStory(t, "season")); });
    ALWAYS.forEach(function (t) { if (list.length < MAX) list.push(toStory(t, "always")); });
    return list.map(function (s) { return typeof escapeStory === "function" ? escapeStory(s) : s; });
  }
  window.mkTopicStories = topicStories;

  var base = getStories;
  getStories = function () {
    var list = base.apply(this, arguments) || [];
    return list.filter(function (s) { return !(s && OLD_IDS[s.id]); }).concat(topicStories());
  };

  try {
    fetch("/api/events").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && Array.isArray(d.events) && d.events.length) {
        events = d.events;
        if (typeof renderStoriesBar === "function") renderStoriesBar();
      }
    }).catch(function () {});
  } catch (e) {}
  if (typeof renderStoriesBar === "function") renderStoriesBar();
})();
