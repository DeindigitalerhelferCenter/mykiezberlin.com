// 2026-11-20 (owner): "Kiez-Redaktion" topic stories for the Android app (and any other client).
// Until now they were made only in the browser by public/topic-stories.js, so the APK never showed them.
// Same rules as the web: real berlin.de events (next 14 days, max 2), the yearly Berlin calendar
// (only inside its time window), then the all-year topics up to 5.
// KEEP IN SYNC: the list below is a copy of public/topic-stories.js – change both together.
import { json } from "../_lib/util.js";
import { onRequestGet as eventsGet } from "./events.js";

const SITE = "https://mykiezberlin.com/";
const MAX = 5;
const AUTHOR = "Kiez-Redaktion";
const C = {
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
const TOPICS = [
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
const ALWAYS = [
    { id: "museumssonntag", kiez: "Mitte", img: "assets/tips/museumsinsel.webp", credit: C.wolf, link: "https://www.museumssonntag.berlin/",
      tr: ["Müze Pazarı – her ayın ilk pazarı ücretsiz", "Her ayın ilk pazar günü birçok Berlin müzesine giriş ücretsiz. Zaman dilimi biletini önceden alın."],
      de: ["Museumssonntag – jeden 1. Sonntag frei", "An jedem ersten Sonntag im Monat ist der Eintritt in viele Berliner Museen frei. Zeitfenster-Ticket vorher buchen."] },
    { id: "flohmarkt-mauerpark", kiez: "Prenzlauer Berg", img: "assets/tips/mauerpark.webp", credit: C.traktor, link: "https://www.mauerpark.info/",
      tr: ["Mauerpark'ta pazar bit pazarı", "Her pazar Mauerpark'ta bit pazarı, sokak yemekleri ve müzik. Hava güzelse amfi tiyatroda karaoke."],
      de: ["Sonntags Flohmarkt im Mauerpark", "Jeden Sonntag Flohmarkt, Streetfood und Musik im Mauerpark. Bei gutem Wetter Karaoke im Amphitheater."] },
  ];


function berlinMD(d) {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" }).slice(5);
}
function inWindow(md, from, to) { return from <= to ? md >= from && md <= to : md >= from || md <= to; }

function toStory(t, kind, now) {
  return {
    id: "topic_" + t.id,
    author: AUTHOR,
    kiez: t.kiez,
    kind: "event",
    headline: t.tr[0] + " · " + t.de[0],
    subtext: "🇹🇷 " + t.tr[1] + "\n\n🇩🇪 " + t.de[1] + "\n\n" + t.credit,
    image: SITE + t.img,
    media_type: "image",
    link: t.link,
    cats: kind === "always" ? ["berlin", "events"] : ["events", "berlin"],
    approved_at: now,
    duration_hours: 24,
    topic: true,
  };
}

function eventStories(events, now) {
  const soon = now + 14 * 86400000;
  const day = (ms) => new Date(ms).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
  return events.filter((e) => e && e.title && e.from && e.to && e.from <= soon && e.to >= now - 86400000)
    .slice(0, 2).map((e) => {
      const xmas = e.category === "Weihnachtsmarkt";
      const when = day(e.from) + (e.to !== e.from ? " – " + day(e.to) : "");
      return {
        id: "event_" + e.id, author: AUTHOR, kiez: e.district || "Berlin", kind: "event",
        headline: e.title + " · " + when,
        subtext: [e.time, e.address, e.description].filter(Boolean).join("\n") + (xmas ? "\n\n" + C.trojak : ""),
        image: SITE + (xmas ? "assets/stories/weihnachtsmarkt.webp" : "assets/tips/brandenburger-tor.webp"),
        media_type: "image", link: e.url || "", cats: ["events", "berlin"], approved_at: now, duration_hours: 24, topic: true,
      };
    });
}

export async function onRequestGet(context) {
  const now = Date.now();
  let events = [];
  try {
    const r = await eventsGet(context);
    if (r && r.ok) events = ((await r.json()) || {}).events || [];
  } catch (e) { events = []; }
  const md = berlinMD(new Date(now));
  const list = eventStories(Array.isArray(events) ? events : [], now);
  TOPICS.filter((t) => inWindow(md, t.from, t.to)).forEach((t) => { if (list.length < MAX) list.push(toStory(t, "season", now)); });
  ALWAYS.forEach((t) => { if (list.length < MAX) list.push(toStory(t, "always", now)); });
  return json({ stories: list }, 200, { "cache-control": "public, max-age=1800" });
}
