// Customer register (My Kiez BERLIN_Kundenregister, Nov 2026): partner businesses as sponsor ads.
// Inserted once (table "seeds"); afterwards the admin panel is the place to change or stop them.
const IG = (h) => (h ? `https://www.instagram.com/${h.replace(/^@/, "")}/` : "");

export const SPONSOR_SEED = [
  // ---- Groß (89 €) ----
  {
    id: "jetgas", plan: "l", name: "JETGAS Propanvertrieb", kieze: "",
    headline_de: "Propan-Lieferung für Berlin & Umgebung – 24 Stunden erreichbar",
    headline_tr: "Berlin ve çevresine propan teslimatı – 24 saat ulaşılabilir",
    headline_en: "Propane delivery for Berlin & surroundings – available 24 hours",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "", link_wa: "+491772132213", link_tel: "+49 177 2132213", link_ig: "",
    extra: { category: { de: "Propan-Lieferung", tr: "Propan teslimatı", en: "Propane delivery" }, address: "Berlin und Umgebung", hours: "24 Stunden", email: "2727@gmx.de", contact: "Hasan GASMAN", primary: "wa" },
  },
  {
    id: "fight-shop-berlin", plan: "l", name: "Fight Shop Berlin", kieze: "Wedding",
    headline_de: "Kampfsport & Fitness: Boxen, MMA, Muay Thai, Kickboxen – Ausrüstung seit 2010",
    headline_tr: "Dövüş sporları ve fitness: boks, MMA, Muay Thai, kickboks – 2010'dan beri ekipman",
    headline_en: "Martial arts & fitness: boxing, MMA, Muay Thai, kickboxing – gear since 2010",
    cta_de: "Zum Shop", cta_tr: "Mağazaya git", cta_en: "Visit shop",
    link_web: "https://fightshopberlin.de", link_wa: "", link_tel: "+49 30 60938128", link_ig: IG("@gultekin_ozcifci"),
    extra: { category: { de: "Kampfsport & Fitness", tr: "Dövüş sporu & fitness", en: "Martial arts & fitness" }, address: "Müllerstraße 131, 13349 Berlin", hours: "Mo–Fr 10–19, Sa 10–18", email: "info@fightshopberlin.de" },
  },
  {
    id: "babybeach-berlin", plan: "l", name: "Babybeach Berlin", kieze: "Charlottenburg-Wilmersdorf",
    headline_de: "Indoor-Salzspielplatz: natürliche Salzluft für Kinder und die ganze Familie",
    headline_tr: "Kapalı tuz oyun alanı: çocuklar ve tüm aile için doğal tuzlu hava",
    headline_en: "Indoor salt playground: natural salt air for kids and the whole family",
    cta_de: "Termin buchen", cta_tr: "Randevu al", cta_en: "Book a visit",
    link_web: "https://www.babybeach-berlin.de/", link_wa: "", link_tel: "+49 30 53845505", link_ig: IG("@babybeach_berlin"),
    extra: { category: { de: "Indoor-Salzspielplatz", tr: "Tuz oyun alanı", en: "Salt playground" }, address: "Kaiserin-Augusta-Allee 40, 10589 Berlin", hours: "Termin nach Vereinbarung", email: "babybeach.charlottenburg@gmail.com" },
  },
  // ---- Mittel (49 €) ----
  {
    id: "allianz-efeoglu", plan: "m", name: "Allianz Versicherung Ceyhun Efeoglu", kieze: "Charlottenburg-Wilmersdorf",
    headline_de: "Private & gewerbliche Versicherungen – mit Kiez-Rabatt KIEZ10",
    headline_tr: "Özel ve ticari sigortalar – KIEZ10 mahalle indirimiyle",
    headline_en: "Private & business insurance – with Kiez discount KIEZ10",
    cta_de: "Beratung anfragen", cta_tr: "Danışmanlık iste", cta_en: "Get advice",
    link_web: "https://vertretung.allianz.de/ceyhun.efeoglu/", link_wa: "", link_tel: "030 34502524", link_ig: IG("@allianz.ceyhunefeoglu"),
    extra: {
      category: { de: "Versicherungsagentur", tr: "Sigorta acentesi", en: "Insurance agency" }, address: "Wilmersdorfer Straße 165, 10585 Berlin", hours: "Mo–Fr nach Absprache", email: "ceyhun.efeoglu@allianz.de", primary: "tel",
      coupon: { code: "KIEZ10", de: "10 % auf alle Versicherungsprodukte", tr: "Tüm sigorta ürünlerinde %10", en: "10% on all insurance products" },
    },
  },
  {
    id: "exakt-sicherheit", plan: "m", name: "Exakt Sicherheitstechnik", kieze: "Reinickendorf",
    headline_de: "Schlüsseldienst 24/7 – schnell, kompetent, transparent. In 30–45 Minuten vor Ort",
    headline_tr: "7/24 çilingir – hızlı, uzman, şeffaf. 30–45 dakikada kapınızda",
    headline_en: "Locksmith 24/7 – fast, skilled, transparent. On site in 30–45 minutes",
    cta_de: "Notdienst anrufen", cta_tr: "Acil servisi ara", cta_en: "Call emergency service",
    link_web: "https://exaktsicherheitstechnik.de", link_wa: "+4915172894655", link_tel: "+49 30 93490864", link_ig: "",
    extra: { category: { de: "Schlüsseldienst & Sicherheitstechnik", tr: "Çilingir & güvenlik", en: "Locksmith & security" }, address: "Wilhelmsruher Damm 138-140, 13439 Berlin", hours: "24/7 Notdienst", email: "info@exakt-sicherheitstechnik.de" },
  },
  {
    id: "berlin-schuh-schluessel", plan: "m", name: "Berlin Schuh & Schlüsseldienst", kieze: "Pankow",
    headline_de: "Schlüssel kopieren & Schuhreparatur im Rathaus-Center Pankow – 24/7 Notdienst",
    headline_tr: "Rathaus-Center Pankow'da anahtar kopyalama & ayakkabı tamiri – 7/24 acil servis",
    headline_en: "Key cutting & shoe repair at Rathaus-Center Pankow – 24/7 emergency service",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "https://www.berlin-schuh-schluesseldienst.de", link_wa: "+4917631768052", link_tel: "+49 176 31768052", link_ig: "",
    extra: { category: { de: "Schlüsseldienst & Schuhreparatur", tr: "Çilingir & ayakkabı tamiri", en: "Locksmith & shoe repair" }, address: "Breite Straße 20, 13187 Berlin", hours: "24/7 Notdienst", email: "info@berlin-schuh-schluesseldienst.de" },
  },
  {
    id: "grz-haustechnik", plan: "m", name: "GRZ Haustechnik", kieze: "Reinickendorf",
    headline_de: "Sanitär, Heizung, Lüftung & Klima – moderne, effiziente Lösungen, 24 Stunden erreichbar",
    headline_tr: "Sıhhi tesisat, ısıtma, havalandırma ve klima – modern çözümler, 24 saat ulaşılabilir",
    headline_en: "Plumbing, heating, ventilation & air conditioning – available 24 hours",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "", link_wa: "+4917622250775", link_tel: "+49 176 22250775", link_ig: "",
    extra: { category: { de: "Sanitär · Heizung · Klima", tr: "Tesisat · Isıtma · Klima", en: "Plumbing · Heating · AC" }, address: "Wilhelmsruher Damm 122, 13439 Berlin", hours: "24 Stunden", primary: "wa" },
  },
  // ---- Klein (29 €) ----
  {
    id: "signal-iduna-akseki", plan: "s", name: "SIGNAL IDUNA Emre Akseki", kieze: "Charlottenburg-Wilmersdorf",
    headline_de: "Engagiert, gewissenhaft und zuverlässig – Fachberater für Vorsorge und Versicherung",
    headline_tr: "Sadık, titiz ve güvenilir – sigorta ve emeklilik danışmanı",
    headline_en: "Dedicated and reliable – advisor for pensions and insurance",
    cta_de: "Termin vereinbaren", cta_tr: "Randevu al", cta_en: "Book appointment",
    link_web: "https://signal-iduna-agentur.de/emre.akseki/", link_wa: "", link_tel: "030 49989430", link_ig: IG("@signal.iduna.gruppe"),
    extra: { category: { de: "Versicherungsagentur", tr: "Sigorta acentesi", en: "Insurance agency" }, address: "Kurfürstendamm 150, 10709 Berlin", hours: "Mo–Fr 09:00–16:30", email: "emre.akseki@signal-iduna.net" },
  },
  {
    id: "sari-beratung", plan: "s", name: "Songül Sari Unternehmensberatung", kieze: "Neukölln",
    headline_de: "Buchführung & Beratung für KMU: Lohn, Finanzen, Jahresabschluss, Steuervorbereitung",
    headline_tr: "KOBİ'ler için muhasebe ve danışmanlık: bordro, finans, yıl sonu, vergi hazırlığı",
    headline_en: "Bookkeeping & consulting for SMEs: payroll, finance, annual accounts, tax prep",
    cta_de: "Kontakt", cta_tr: "İletişim", cta_en: "Contact",
    link_web: "", link_wa: "", link_tel: "+49 30 61675197", link_ig: "",
    extra: { category: { de: "Unternehmensberatung", tr: "İşletme danışmanlığı", en: "Business consulting" }, address: "Hertzbergstr. 7, 12055 Berlin", hours: "Mo–Fr 09:00–17:00", email: "info@sari-beratung.de", primary: "tel" },
  },
  {
    id: "troja-consulting", plan: "s", name: "TROJA CONSULTING", kieze: "",
    headline_de: "Unternehmensberatung, Lohn- und Gehaltsabrechnung, Buchhaltung & Immobilien",
    headline_tr: "İşletme danışmanlığı, bordro, muhasebe ve emlak danışmanlığı",
    headline_en: "Business consulting, payroll, bookkeeping & real estate",
    cta_de: "WhatsApp schreiben", cta_tr: "WhatsApp yaz", cta_en: "Message on WhatsApp",
    link_web: "", link_wa: "+491784100116", link_tel: "+49 178 4619431", link_ig: "",
    extra: { category: { de: "Beratung · Buchhaltung · Immobilien", tr: "Danışmanlık · Muhasebe · Emlak", en: "Consulting · Bookkeeping · Real estate" }, address: "", hours: "", email: "trojaconsulting@email.de", primary: "wa" },
  },
  {
    id: "terra-verde-tek", plan: "s", name: "Terra Verde TEK Getränke", kieze: "Spandau",
    headline_de: "Großhandel für Getränke, Verpackungen, Hygiene & Lebensmittel – für Privat & Gewerbe",
    headline_tr: "İçecek, ambalaj, hijyen ve gıda toptancısı – bireysel ve kurumsal müşterilere",
    headline_en: "Wholesale drinks, packaging, hygiene & food – for private and business customers",
    cta_de: "Zum Großhandel", cta_tr: "Toptancıya git", cta_en: "Visit wholesaler",
    link_web: "https://www.tekgetraenke.de", link_wa: "", link_tel: "+49 173 2393939", link_ig: IG("@terraverdegetraenke"),
    extra: { category: { de: "Getränke- & Lebensmittelgroßhandel", tr: "İçecek & gıda toptancısı", en: "Drinks & food wholesale" }, address: "Beusselstraße 44 n-q, 10553 Berlin", hours: "Mo–Sa 06:00–18:00", email: "info@tekgetraenke.de" },
  },
  // ---- Kiez Plus (added 2026-11-11) ----
  {
    id: "istanbul-reisen", plan: "m", name: "Umut Tabu – Istanbul Reisen", kieze: "Wedding",
    headline_de: "Reisebüro in Wedding: Flüge mit Turkish Airlines & SunExpress – persönliche Beratung",
    headline_tr: "Wedding'de seyahat acentesi: Turkish Airlines & SunExpress uçuşları – birebir danışmanlık",
    headline_en: "Travel agency in Wedding: Turkish Airlines & SunExpress flights – personal advice",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "", link_wa: "", link_tel: "030 45809915", link_ig: IG("@istanbulreisen49"),
    extra: { category: { de: "Reisebüro", tr: "Seyahat acentesi", en: "Travel agency" }, address: "Reinickendorfer Str. 71, 13347 Berlin", hours: "ab 10:00 Uhr", fax: "030 45809917", primary: "tel" },
  },
];

// One-time corrections for sponsors that are already in the live database (seeds are only inserted once).
// Each fix runs once (table "seeds", id "fix:<id>"). Only the listed fields change; nothing is deleted.
// 2026-11-11: jet-gas.de led to foreign/adult pages, sari-beratung.de and grzhaustechnikberlin.de are offline,
// Allianz shows only the office phone. "Dein Finanzen Helfer" is paused for one month (active = 0, row kept).
const FIX_ID = "fix:2026-11-11";
const LINK_FIX_IDS = ["jetgas", "allianz-efeoglu", "sari-beratung", "grz-haustechnik", "troja-consulting", "fight-shop-berlin",
  "babybeach-berlin", "exakt-sicherheit", "berlin-schuh-schluessel", "signal-iduna-akseki", "terra-verde-tek"];

async function applyFixes(database) {
  const done = await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(FIX_ID).first();
  if (done) return;
  const stmts = [];
  for (const id of LINK_FIX_IDS) {
    const s = SPONSOR_SEED.find((x) => x.id === id);
    const row = await database.prepare(`SELECT extra FROM ads WHERE id = ?`).bind(id).first();
    if (!s || !row) continue;
    let old = {};
    try { old = JSON.parse(row.extra || "{}") || {}; } catch (e) { old = {}; }
    const extra = { ...old, ...s.extra };
    stmts.push(database.prepare(`UPDATE ads SET link_web = ?, link_wa = ?, link_tel = ?, extra = ?, updated_at = ? WHERE id = ?`)
      .bind(s.link_web, s.link_wa, s.link_tel, JSON.stringify(extra), Date.now(), id));
  }
  stmts.push(database.prepare(`UPDATE ads SET active = 0, updated_at = ? WHERE id = 'deinfinanzenhelfer'`).bind(Date.now()));
  stmts.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(FIX_ID, Date.now()));
  await database.batch(stmts);
}

const PRIORITY = { l: 30, m: 20, s: 10 };

// Adds every seed ad once. A seed the admin later deleted is not added again.
export async function seedSponsors(database) {
  await database.prepare(`CREATE TABLE IF NOT EXISTS seeds (id TEXT PRIMARY KEY, created_at INTEGER)`).run();
  const { results } = await database.prepare(`SELECT id FROM seeds WHERE id LIKE 'ad:%'`).all();
  const done = new Set(results.map((r) => r.id));
  const now = Date.now();
  const todo = SPONSOR_SEED.filter((s) => !done.has(`ad:${s.id}`));
  if (todo.length) await database.batch(todo.flatMap((s) => [
    database.prepare(`INSERT OR IGNORE INTO ads (id, name, image, headline_de, headline_tr, headline_en, cta_de, cta_tr, cta_en, link_web, link_wa, link_tel, link_ig, places, kieze, priority, plan, request_id, start_at, end_at, active, extra, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'',0,0,1,?,?,?)`)
      .bind(s.id, s.name, `/assets/sponsors/${s.id}.webp`, s.headline_de, s.headline_tr, s.headline_en, s.cta_de, s.cta_tr, s.cta_en,
        s.link_web, s.link_wa, s.link_tel, s.link_ig, "", s.kieze, PRIORITY[s.plan] || 0, s.plan,
        JSON.stringify({ ...s.extra, logo: `/assets/sponsors/${s.id}-logo.webp` }), now, now),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(`ad:${s.id}`, now),
  ]));
  await applyFixes(database);
}
