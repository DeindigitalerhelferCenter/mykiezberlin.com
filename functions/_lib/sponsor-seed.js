// Customer register (My Kiez BERLIN_Kundenregister, Nov 2026): partner businesses as sponsor ads.
// Inserted once (table "seeds"); afterwards the admin panel is the place to change or stop them.
import { ensureSponsorTables } from "./sponsor-panel.js";

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
    headline_de: "Private & gewerbliche Versicherungen – persönliche Beratung im Kiez",
    headline_tr: "Özel ve ticari sigortalar – mahallede kişisel danışmanlık",
    headline_en: "Private & business insurance – personal advice in your Kiez",
    cta_de: "Beratung anfragen", cta_tr: "Danışmanlık iste", cta_en: "Get advice",
    link_web: "https://vertretung.allianz.de/ceyhun.efeoglu/", link_wa: "", link_tel: "030 34502524", link_ig: IG("@allianz.ceyhunefeoglu"),
    extra: {
      category: { de: "Versicherungsagentur", tr: "Sigorta acentesi", en: "Insurance agency" }, address: "Wilmersdorfer Straße 165, 10585 Berlin", hours: "Mo–Fr nach Absprache", email: "ceyhun.efeoglu@allianz.de", primary: "tel",
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
    id: "grz-haustechnik", plan: "s", name: "GRZ Haustechnik", kieze: "Reinickendorf",
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
    id: "troja-consulting", plan: "s", name: "Adnan Bekar", kieze: "", // 2026-11-13 (owner): was "TROJA CONSULTING"; id kept for the statistics
    headline_de: "Unternehmensberatung, Lohn- und Gehaltsabrechnung, Buchhaltung & Immobilien",
    headline_tr: "İşletme danışmanlığı, bordro, muhasebe ve emlak danışmanlığı",
    headline_en: "Business consulting, payroll, bookkeeping & real estate",
    cta_de: "WhatsApp schreiben", cta_tr: "WhatsApp yaz", cta_en: "Message on WhatsApp",
    link_web: "", link_wa: "+491784100116", link_tel: "+49 178 4619431", link_ig: "",
    extra: { category: { de: "Beratung · Buchhaltung · Immobilien", tr: "Danışmanlık · Muhasebe · Emlak", en: "Consulting · Bookkeeping · Real estate" }, address: "", hours: "", email: "trojaconsulting@email.de", primary: "wa" },
  },
  {
    id: "terra-verde-tek", plan: "l", name: "Terra Verde TEK Getränke", kieze: "Spandau",
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
  // ---- Kiez Plus (added 2026-11-13, Kundenregister_updated rows 13–20) ----
  {
    id: "schah-hairdesign", plan: "m", name: "Schah Hairdesign", kieze: "Charlottenburg",
    headline_de: "Exklusiver Friseursalon: Haarverlängerung, Balayage & Haarschnitt – Haarverlängerung Special ab 549 €",
    headline_tr: "Özel kuaför salonu: saç uzatma, balyaj ve saç kesimi – saç uzatma kampanyası 549 €'dan",
    headline_en: "Exclusive hair salon: hair extensions, balayage & haircuts – extensions special from €549",
    cta_de: "Termin anfragen", cta_tr: "Randevu al", cta_en: "Book an appointment",
    link_web: "https://www.schahhairdesign.de", link_wa: "", link_tel: "0163 8114764", link_ig: IG("@schahhairdesign"),
    extra: { category: { de: "Friseursalon · Haarverlängerung", tr: "Kuaför · Saç uzatma", en: "Hair salon · Extensions" }, address: "Krumme Str. 50, 10627 Berlin", hours: "Mo–Fr 10:00–18:00, Sa 10:00–16:00", email: "info@schahhairdesign.de",
      description: "Exklusiver Friseursalon in Berlin-Charlottenburg. Spezialist für Haarverlängerung, Balayage und Haarschnitt. Haarverlängerung Special ab 549 €.\nTelefon Salon: 030 235905170" },
  },
  {
    id: "dr-turan-karkin", plan: "m", name: "Dr. Turan Karkin – Gemeinschaftspraxis", kieze: "Charlottenburg-Wilmersdorf",
    headline_de: "Hausarzt in Charlottenburg – Gemeinschaftspraxis Dr. Turan Karkin & Dr. Hasan Sari. Kasse, Privat & Selbstzahler",
    headline_tr: "Charlottenburg'da aile hekimi – Dr. Turan Karkin & Dr. Hasan Sari ortak muayenehanesi. Kasa, özel sigorta ve kendi ödeyen",
    headline_en: "Family doctor in Charlottenburg – joint practice Dr. Turan Karkin & Dr. Hasan Sari. Public, private & self-pay",
    cta_de: "Praxis anrufen", cta_tr: "Muayenehaneyi ara", cta_en: "Call the practice",
    link_web: "", link_wa: "", link_tel: "030 301116688", link_ig: "",
    extra: { category: { de: "Hausarzt · Allgemeinmedizin", tr: "Aile hekimi · Genel tıp", en: "Family doctor · General medicine" }, address: "Reichsstraße 105, 14052 Berlin", hours: "Mo–Do 08:30–19:00, Fr 08:30–14:00", email: "drhasan@web.de", fax: "030 301116689", primary: "tel",
      description: "Gemeinschaftspraxis Dr. Turan Karkin & Dr. Hasan Sari. Hausarzt / Facharzt für Allgemeinmedizin in Berlin-Charlottenburg. Kasse, Privat und Selbstzahler.\nFax: 030 301116689" },
  },
  {
    id: "zahnarzt-bundesplatz", plan: "m", name: "Zahnarztpraxis am Bundesplatz – Dr. Ozan Cinar", kieze: "Charlottenburg-Wilmersdorf",
    headline_de: "Zahnarzt in Wilmersdorf: Endodontie, Implantologie & Parodontologie – Kasse & Privat",
    headline_tr: "Wilmersdorf'ta diş hekimi: kanal tedavisi, implant ve diş eti tedavisi – kasa ve özel sigorta",
    headline_en: "Dentist in Wilmersdorf: endodontics, implants & periodontics – public & private",
    cta_de: "Termin vereinbaren", cta_tr: "Randevu al", cta_en: "Make an appointment",
    link_web: "https://www.zahnarztpraxis-am-bundesplatz.de", link_wa: "", link_tel: "030 91145657", link_ig: "",
    extra: { category: { de: "Zahnarzt · Implantologie", tr: "Diş hekimi · İmplant", en: "Dentist · Implants" }, address: "Bundesplatz 12a, 10715 Berlin", hours: "ab 10:00 Uhr", email: "kontakt@zahnarztpraxis-am-bundesplatz.de", fax: "030-85071879",
      description: "Zahnarzt und Zahntechniker in Berlin-Wilmersdorf. Spezialist für Endodontie, Implantologie und Parodontologie. Kasse & Privat.\nFax: 030-85071879" },
  },
  {
    id: "richys-car-service", plan: "m", name: "Richy's Car-Service", kieze: "Charlottenburg-Nord",
    headline_de: "Autowerkstatt in Charlottenburg – Kfz-Reparatur und Wartung aus einer Hand",
    headline_tr: "Charlottenburg'da oto tamirhanesi – araç tamiri ve bakımı tek elden",
    headline_en: "Car workshop in Charlottenburg – repairs and servicing in one place",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "", link_wa: "", link_tel: "030 34710425", link_ig: "",
    extra: { category: { de: "Autowerkstatt · Kfz-Service", tr: "Oto tamir · Araç servisi", en: "Car workshop · Car service" }, address: "Sophie-Charlotten-Straße 31–32, 14059 Berlin", hours: "Mo–Fr 08:00–19:00, Sa 08:00–16:00", primary: "tel",
      description: "Autowerkstatt in Berlin-Charlottenburg. Umfassende Kfz-Reparatur und Wartungsservice." },
  },
  {
    id: "mmb-beratung", plan: "m", name: "MMB Unternehmensberatung GmbH", kieze: "Charlottenburg",
    headline_de: "Unternehmensberatung, Vermietung und Verpachtung in Charlottenburg",
    headline_tr: "Charlottenburg'da işletme danışmanlığı, kiralama ve işletme devri",
    headline_en: "Business consulting, renting and leasing in Charlottenburg",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "", link_wa: "", link_tel: "030 25093730", link_ig: "",
    extra: { category: { de: "Unternehmensberatung · Vermietung", tr: "Danışmanlık · Kiralama", en: "Consulting · Renting" }, address: "Behaimstraße 3, 10585 Berlin", hours: "", email: "karaarslan@mmbgmbh.com", fax: "030 39493724", primary: "tel",
      description: "Unternehmensberatung, Vermietung und Verpachtung. Geschäftsführer: Dursun Karaarslan. HRB 177958 B, AG Berlin-Charlottenburg.\nFax: 030 39493724" },
  },
  {
    id: "pc-doctor", plan: "m", name: "PC Doctor – Computer Reparatur", kieze: "Spandau",
    headline_de: "PC- & Laptop-Reparatur in Spandau: Datenrettung, SSD-Einbau, Virenschutz, Netzwerk & Mac – schnell und zuverlässig",
    headline_tr: "Spandau'da PC ve laptop tamiri: veri kurtarma, SSD takma, virüs temizliği, ağ ve Mac – hızlı ve güvenilir",
    headline_en: "PC & laptop repair in Spandau: data recovery, SSD upgrades, virus removal, networks & Mac – fast and reliable",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "https://www.pcdoctor-24.de", link_wa: "+493065707585", link_tel: "030 65707585", link_ig: "",
    extra: { category: { de: "Computer-Reparatur · IT-Service", tr: "Bilgisayar tamiri · IT servisi", en: "Computer repair · IT service" }, address: "Pichelsdorfer Str. 126, 13595 Berlin", hours: "Mo–Fr 10:00–18:00, Sa 10:00–14:00", email: "info@pcdoctor-24.de", fax: "030 65707587",
      description: "PC & Laptop Reparatur, Hardware-Aufrüstung, SSD-Einbau & Datenrettung, Virenschutz & Systempflege, Netzwerk & Internet, Mac-Reparatur. Vor-Ort- und Werkstattservice, Windows-11-Umstieg, An- und Verkauf gebrauchter Notebooks, PCs und Handys. Schnell, zuverlässig, kompetent.\nFax: 030 65707587" },
  },
  {
    id: "aqua-marinn", plan: "m", name: "Aqua Marinn Hotel – Aqua Park, Spa & Wellness", kieze: "",
    headline_de: "4★ Hotel in Altınova / Yalova (Türkei) mit Aqua Park, Spa & Wellness, offenen und geschlossenen Pools",
    headline_tr: "Altınova / Yalova'da aqua park, spa & wellness, açık ve kapalı havuzlu 4★ otel",
    headline_en: "4★ hotel in Altınova / Yalova (Turkey) with aqua park, spa & wellness, outdoor and indoor pools",
    cta_de: "Hotel ansehen", cta_tr: "Oteli gör", cta_en: "View hotel",
    link_web: "https://www.aquamarinn.com", link_wa: "+905526200077", link_tel: "+90 226 420 00 77", link_ig: IG("@aquamarinnotel"),
    extra: { category: { de: "Hotel · Aqua Park · Spa", tr: "Otel · Aqua park · Spa", en: "Hotel · Aqua park · Spa" }, address: "Köy Altı Mevkii, Devlet Yolu Altı Cad. No:16/1, Tokmak, Altınova / Yalova, Türkiye", hours: "", email: "info@aquamarinn.com",
      description: "4★ Hotel mit Aqua Park, Spa & Wellness, offenen und geschlossenen Pools. Turizm Belgesi Nr. 21806.\nTelefon: +90 226 420 00 77 / +90 226 420 00 78" },
  },
  {
    id: "dr-adnan-guercan", plan: "m", name: "Dr. Adnan Gürcan – Medikal Estetik", kieze: "",
    headline_de: "Medizinische Ästhetik in İstanbul seit 2004: Botox, Filler, Mesotherapie, PRP & Haarausfall",
    headline_tr: "2004'ten beri İstanbul'da medikal estetik: botoks, dolgu, mezoterapi, PRP ve saç dökülmesi",
    headline_en: "Medical aesthetics in İstanbul since 2004: Botox, fillers, mesotherapy, PRP & hair loss",
    cta_de: "Beratung anfragen", cta_tr: "Danışmanlık al", cta_en: "Ask for advice",
    link_web: "https://www.dradnangurcan.com", link_wa: "+905324516928", link_tel: "+90 212 280 80 30", link_ig: "",
    extra: { category: { de: "Medizinische Ästhetik", tr: "Medikal estetik", en: "Medical aesthetics" }, address: "Nisbetiye Mah., Aytar Cad. Burç Apt. No:36/6, 34340 Beşiktaş / İstanbul, Türkiye", hours: "Mo–Fr 09:30–18:30", email: "iletisim@dradnangurcan.com", primary: "wa",
      description: "Medizinische Ästhetik seit 2004 (vom Gesundheitsministerium zertifiziert). Botox, Filler, Mesotherapie, PRP und Behandlung von Haarausfall. Gast bei CNN Türk „Uzmanı Anlatıyor“." },
  },
  // 2026-11-14 (owner): "The Visit" and "Berlin Handel" (before only in the old app sponsor list) – package Plus
  {
    id: "the-visit", plan: "m", name: "The Visit Coffee Roastery", kieze: "Kreuzberg",
    headline_de: "Handgerösteter Specialty Coffee in Berlin-Kreuzberg – Rösterei & Café",
    headline_tr: "Berlin-Kreuzberg'de el yapımı kavrulmuş specialty kahve – kavurma evi & kafe",
    headline_en: "Hand-roasted specialty coffee in Berlin-Kreuzberg – roastery & café",
    cta_de: "Website ansehen", cta_tr: "Siteye git", cta_en: "Visit website",
    link_web: "https://thevisitcoffeeroastery.pages.dev/", link_wa: "", link_tel: "", link_ig: IG("@thevisitcoffee"),
    extra: { category: { de: "Café · Kaffeerösterei", tr: "Kafe · Kahve kavurma evi", en: "Café · Coffee roastery" }, address: "Die Macherei (M40), Hallesches Ufer 40, 10963 Berlin", hours: "Täglich 08–22 Uhr (Eröffnung bald)", email: "info@thevisitcoffee.de",
      description: "Handgerösteter Specialty Coffee in Berlin-Kreuzberg. Neuer Standort in der Macherei (M40) am Halleschen Ufer – eröffnet bald, dann täglich 08–22 Uhr." },
  },
  {
    id: "berlin-handel", plan: "m", name: "Berlin Handel", kieze: "",
    headline_de: "Getränke-Lieferservice für Berlin & Umgebung – Bestellung per WhatsApp",
    headline_tr: "Berlin ve çevresine içecek teslimatı – WhatsApp ile sipariş",
    headline_en: "Beverage delivery for Berlin & surroundings – order via WhatsApp",
    cta_de: "WhatsApp bestellen", cta_tr: "WhatsApp ile sipariş", cta_en: "Order on WhatsApp",
    link_web: "", link_wa: "+4915126509586", link_tel: "+49 151 26509586", link_ig: "",
    extra: { category: { de: "Getränke-Lieferservice", tr: "İçecek teslimatı", en: "Beverage delivery" }, address: "Berlin und Umgebung", hours: "",
      description: "Getränke-Lieferservice für Berlin und Umgebung. Bestellungen per WhatsApp oder Telefon: 0151 265 09 586." },
  },
  // ---- 2026-11-14 (owner): "NEUE SPONSOREN.zip" + Kundenregister rows 21–26, package Plus ----
  {
    id: "tam-et", plan: "m", name: "Tam Et – Halal Fleischerei", kieze: "Reinickendorf",
    headline_de: "Halal-Fleischerei in Reinickendorf – frisches Fleisch, Marinaden & Grillspieße. Google 4,7★",
    headline_tr: "Reinickendorf'ta helal kasap – taze et, marine etler ve mangal şişleri. Google 4,7★",
    headline_en: "Halal butcher in Reinickendorf – fresh meat, marinades & skewers. Google 4.7★",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "", link_wa: "", link_tel: "0176 71099594", link_ig: "",
    extra: { category: { de: "Fleischerei · Halal", tr: "Kasap · Helal et", en: "Butcher · Halal" }, address: "Residenzstraße 128, 13409 Berlin", hours: "Mo–Sa 07:00–19:00", contact: "Tamer Cetinkaya", primary: "tel",
      description: "Halal-Fleischerei in Berlin-Reinickendorf. Inhaber: Tamer Cetinkaya. Google-Bewertung 4,7★ (67 Rezensionen)." },
  },
  {
    id: "gumus-baeckerei", plan: "m", name: "Gümüş Bäckerei", kieze: "Schöneberg",
    headline_de: "Türkische Bäckerei seit über 30 Jahren: Fladenbrot, Simit, Börek, Lahmacun & Baklava – täglich 05–22 Uhr",
    headline_tr: "30 yılı aşkın Türk fırını: pide, simit, börek, lahmacun ve baklava – her gün 05–22",
    headline_en: "Turkish bakery for over 30 years: flatbread, simit, börek, lahmacun & baklava – daily 5am–10pm",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "https://www.gumusbaeckerei.com", link_wa: "", link_tel: "030 81821002", link_ig: "",
    extra: { category: { de: "Bäckerei · Imbiss", tr: "Fırın · Lokanta", en: "Bakery · Snack bar" }, address: "Hauptstraße 148, 10827 Berlin", hours: "Täglich 05:00–22:00", primary: "tel",
      description: "Türkische Bäckerei seit über 30 Jahren. Fladenbrot, Simit, Börek, Lahmacun, Baklava und Frühstück. Filialen: Hauptstraße 148 und Dominicusstraße 43, 10827 Berlin." },
  },
  {
    id: "tugra-gida", plan: "m", name: "Tugra Gida", kieze: "Schöneberg",
    headline_de: "Türkischer Supermarkt in Schöneberg – Lebensmittel aus der Heimat",
    headline_tr: "Schöneberg'de Türk süpermarketi – memleketten gıda ürünleri",
    headline_en: "Turkish supermarket in Schöneberg – groceries from home",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "", link_wa: "", link_tel: "030 78711191", link_ig: "",
    extra: { category: { de: "Supermarkt", tr: "Süpermarket", en: "Supermarket" }, address: "Hauptstraße 13, 10827 Berlin", hours: "", primary: "tel",
      description: "Türkischer Supermarkt in Berlin-Schöneberg. Tugra Gida GmbH, HRB 266954 B, AG Berlin." },
  },
  {
    id: "berlin-pos", plan: "m", name: "Berlin POS Kassensysteme GmbH", kieze: "Schöneberg",
    headline_de: "Kassensysteme für Gastronomie, Metzgerei, Bäckerei & Supermarkt – Beratung, Verkauf & Reparatur",
    headline_tr: "Restoran, kasap, fırın ve market için kasa sistemleri – danışmanlık, satış ve tamir",
    headline_en: "POS systems for restaurants, butchers, bakeries & supermarkets – advice, sales & repair",
    cta_de: "Beratung anfragen", cta_tr: "Danışmanlık al", cta_en: "Ask for advice",
    link_web: "https://www.berlin-pos.de", link_wa: "+491637534290", link_tel: "030 54715148", link_ig: "",
    extra: { category: { de: "Kassensysteme · IT", tr: "Kasa sistemleri · IT", en: "POS systems · IT" }, address: "Hauptstraße 15, 10827 Berlin", hours: "", email: "info@berlin-pos.de", contact: "Mustafa Cihat Gürsoy",
      description: "Kassensysteme für Metzgerei, Bäckerei, Supermarkt und Gastronomie (Lotus Pecas, Self-Order-Kiosk, VNE Bargeldsystem). Beratung, Vertrieb & Reparatur. Netzwerk in 10 Ländern." },
  },
  {
    id: "orhan-bestattungen", plan: "m", name: "Orhan Islamische Bestattungen & Überführungen", kieze: "Neukölln",
    headline_de: "Islamische Bestattungen & Überführungen – Tag und Nacht erreichbar, über 25 Jahre Erfahrung",
    headline_tr: "İslami cenaze ve nakil hizmetleri – gece gündüz ulaşılabilir, 25 yılı aşkın tecrübe",
    headline_en: "Islamic funerals & repatriation – available day and night, over 25 years of experience",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "https://orhan-bestattung.com", link_wa: "+4917682138391", link_tel: "030 25931630", link_ig: "",
    extra: { category: { de: "Islamische Bestattungen", tr: "İslami cenaze hizmetleri", en: "Islamic funerals" }, address: "Flughafenstraße 40, 12053 Berlin", hours: "24/7 – Tag & Nacht", email: "info@orhan-bestattung.com", primary: "tel",
      description: "Islamische Bestattungen & Überführungen: Erdbestattung, Feuerbestattung, Auslandsüberführung (Türkei, Balkan, arabische Welt). 24/7 erreichbar. Sprachen: DE, TR, EN, AR, BS, HR u. v. m.\nHandy: 0176 82138391" },
  },
  // ---- Türkei-Sponsoren (extra.region = "tr", own page "Türkiye Sponsorları") ----
  {
    id: "yusuf-car-rental", plan: "m", name: "Yusuf Car Rental", kieze: "",
    headline_de: "Autovermietung in Antalya: Tages-, Wochen- & Monatsmiete – vom Kleinwagen bis zum Premium-SUV",
    headline_tr: "Antalya'da araç kiralama: günlük, haftalık ve aylık – ekonomik araçtan premium SUV'a",
    headline_en: "Car rental in Antalya: daily, weekly & monthly – from economy cars to premium SUVs",
    cta_de: "WhatsApp schreiben", cta_tr: "WhatsApp yaz", cta_en: "Message on WhatsApp",
    link_web: "https://yusufcarrental.com", link_wa: "+905350178526", link_tel: "+90 535 017 85 26", link_ig: "",
    extra: { category: { de: "Autovermietung", tr: "Araç kiralama", en: "Car rental" }, address: "Antalya, Türkiye", hours: "", contact: "Yusuf Sepetci", primary: "wa", region: "tr",
      description: "Autovermietung in Antalya. Tages-, Wochen- und Monatsmiete mit transparenten TL-Preisen. Klassen: City, Executive, Premium SUV.\nTelefon: +90 535 017 85 26 / +90 224 233 02 33" },
  },
  {
    id: "packpress", plan: "m", name: "PackPress", kieze: "",
    headline_de: "Bedruckte Verpackungen mit Ihrem Logo: Pizzakartons, Burgerboxen, Tüten, Becher & Dönerpapier",
    headline_tr: "Logonuzla baskılı ambalaj: pizza kutusu, burger kutusu, poşet, bardak ve döner kağıdı",
    headline_en: "Packaging printed with your logo: pizza boxes, burger boxes, bags, cups & wrapping paper",
    cta_de: "Zum Shop", cta_tr: "Mağazaya git", cta_en: "Visit shop",
    link_web: "https://packpress.de", link_wa: "+4915738173297", link_tel: "+49 157 38173297", link_ig: "",
    extra: { category: { de: "Verpackungsdruck · B2B", tr: "Ambalaj baskı · B2B", en: "Packaging print · B2B" }, address: "", hours: "Mo–Fr 08:00–18:00", email: "info@packpress.de", region: "tr",
      description: "PackPress B2B Packaging Solutions: individuell bedruckte Verpackungen für Gastronomie und Handel. Kostenloser Design-Service, DAP-Lieferung (frei Haus) in die EU und die Schweiz." },
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
  await applyPlanFix(database);
  await applyTekLogoFix(database);
  await applyTekRedFix(database);
  await applyNewSponsorsFix(database);
  await applyAdnanBekarFix(database);
  await applyAllianzFix(database);
  await applyAquaAdnanFix(database);
  await applyNeueSponsorenFix(database);
}

// 2026-11-14 (owner): "NEUE SPONSOREN.zip" – gallery pictures of the new sponsors, 2 offers of Adnan Bekar,
// Aqua Marinn and Dr. Adnan Gürcan also on the page "Türkiye Sponsorları" (extra.region = "tr"). Runs once.
const NEUE_GALLERY = [
  ["g-packpress-1", "packpress", "/assets/sponsors/gallery/packpress-1.webp", "Alles aus einer Hand für Ihren Lieferdienst"],
  ["g-packpress-2", "packpress", "/assets/sponsors/gallery/packpress-2.webp", "Premium Dönerpapier mit Ihrem Logo"],
  ["g-packpress-3", "packpress", "/assets/sponsors/gallery/packpress-3.webp", "Unsere Produkte"],
  ["g-packpress-4", "packpress", "/assets/sponsors/gallery/packpress-4.webp", "XXL Doppel-Burgerbox"],
  ["g-packpress-5", "packpress", "/assets/sponsors/gallery/packpress-5.webp", "Bäckertüten & Faltenbeutel"],
  ["g-packpress-6", "packpress", "/assets/sponsors/gallery/packpress-6.webp", "Pizzakartons"],
  ["g-yusuf-1", "yusuf-car-rental", "/assets/sponsors/gallery/yusuf-car-rental-1.webp", "City"],
  ["g-yusuf-2", "yusuf-car-rental", "/assets/sponsors/gallery/yusuf-car-rental-2.webp", "Executive"],
  ["g-yusuf-3", "yusuf-car-rental", "/assets/sponsors/gallery/yusuf-car-rental-3.webp", "Premium SUV"],
  ["g-yusuf-4", "yusuf-car-rental", "/assets/sponsors/gallery/yusuf-car-rental-4.webp", "Rezervasyondan teslimata net, kontrollü ve hızlı"],
  ["g-tamet-1", "tam-et", "/assets/sponsors/gallery/tam-et-1.webp", "Residenzstraße 128"],
  ["g-tamet-2", "tam-et", "/assets/sponsors/gallery/tam-et-2.webp", "Frisch mariniert"],
  ["g-gumus-1", "gumus-baeckerei", "/assets/sponsors/gallery/gumus-baeckerei-1.webp", "Hauptstraße 148"],
  ["g-gumus-2", "gumus-baeckerei", "/assets/sponsors/gallery/gumus-baeckerei-2.webp", "Café & Imbiss"],
  ["g-gumus-3", "gumus-baeckerei", "/assets/sponsors/gallery/gumus-baeckerei-3.webp", "Türkisches Frühstück"],
  ["g-berlinpos-1", "berlin-pos", "/assets/sponsors/gallery/berlin-pos-1.webp", "Kassen · Kiosk · Bargeldsystem"],
  ["g-berlinpos-2", "berlin-pos", "/assets/sponsors/gallery/berlin-pos-2.webp", "Hauptstraße 15"],
  ["g-berlinpos-3", "berlin-pos", "/assets/sponsors/gallery/berlin-pos-3.webp", "Kasse im Einsatz"],
  ["g-orhan-1", "orhan-bestattungen", "/assets/sponsors/gallery/orhan-bestattungen-1.webp", "Tag & Nacht geöffnet"],
  ["g-orhan-2", "orhan-bestattungen", "/assets/sponsors/gallery/orhan-bestattungen-2.webp", "Orhan Bestattungen"],
  ["g-orhan-3", "orhan-bestattungen", "/assets/sponsors/gallery/orhan-bestattungen-3.webp", "Orhan Bestattungen"],
  ["g-troja-1", "troja-consulting", "/assets/sponsors/gallery/troja-consulting-1.webp", "Miete gesenkt – 4-Zimmer-Altbauwohnung"],
  ["g-troja-2", "troja-consulting", "/assets/sponsors/gallery/troja-consulting-2.webp", "Angebot"],
  // existing sponsors without (enough) pictures: photos from their own websites
  ["g-fightshop-1", "fight-shop-berlin", "/assets/sponsors/gallery/fight-shop-berlin-1.webp", "Sparring-Handschuhe"],
  ["g-babybeach-1", "babybeach-berlin", "/assets/sponsors/gallery/babybeach-berlin-1.webp", "Vorteile eines Salzraums für Kinder"],
  ["g-babybeach-2", "babybeach-berlin", "/assets/sponsors/gallery/babybeach-berlin-2.webp", "Salz & Gesundheit"],
  ["g-schuh-1", "berlin-schuh-schluessel", "/assets/sponsors/gallery/berlin-schuh-schluessel-1.webp", "Im Rathaus-Center Pankow"],
  ["g-zahnarzt-1", "zahnarzt-bundesplatz", "/assets/sponsors/gallery/zahnarzt-bundesplatz-1.webp", "Zahnersatz"],
  ["g-zahnarzt-2", "zahnarzt-bundesplatz", "/assets/sponsors/gallery/zahnarzt-bundesplatz-2.webp", "Prophylaxe"],
  ["g-thevisit-1", "the-visit", "/assets/sponsors/gallery/the-visit-1.webp", "Die Macherei (M40)"],
  ["g-thevisit-2", "the-visit", "/assets/sponsors/gallery/the-visit-2.webp", "Rösterei & Café"],
  ["g-exakt-2", "exakt-sicherheit", "/assets/sponsors/gallery/exakt-sicherheit-2.webp", "Schlüsseldienst 24/7"],
  ["g-schah-2", "schah-hairdesign", "/assets/sponsors/gallery/schah-hairdesign-2.webp", "Haarverlängerung & Balayage"],
  ["g-tek-2", "terra-verde-tek", "/assets/sponsors/gallery/terra-verde-tek-g2.webp", "Großhandel Beusselstraße"],
];
async function applyNeueSponsorenFix(database) {
  const id = "fix:2026-11-14-neue-sponsoren";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  await ensureSponsorTables(database);
  const now = Date.now();
  const steps = NEUE_GALLERY.map(([mid, adId, key, caption], i) =>
    database.prepare(`INSERT OR IGNORE INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin) VALUES (?, ?, ?, 'image', ?, 'live', 0, ?, 1)`)
      .bind(mid, adId, key, caption, now - i));
  for (const adId of ["aqua-marinn", "dr-adnan-guercan"]) {
    const row = await database.prepare(`SELECT extra FROM ads WHERE id = ?`).bind(adId).first();
    if (!row) continue;
    let extra = {};
    try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
    extra.region = "tr";
    steps.push(database.prepare(`UPDATE ads SET extra = ?, updated_at = ? WHERE id = ?`).bind(JSON.stringify(extra), now, adId));
  }
  steps.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(steps);
}

// 2026-11-14 (owner): Aqua Marinn – real logo, new banner (logo + 2 pictures), 2 pictures + 4 Instagram posts/reels in the
// sponsor's own gallery (media_type 'instagram', media_key = the post link). Adnan Bekar – his real profile photo as logo.
// New file names because of the asset cache. Runs once.
const AQUA_MEDIA = [
  ["g-aqua-1", "/assets/sponsors/gallery/aqua-marinn-1.webp", "image", "Spor salonu – kendine iyilik yap"],
  ["g-aqua-2", "/assets/sponsors/gallery/aqua-marinn-2.webp", "image", "Günaydın – Aqua Park"],
  ["ig-aqua-1", "https://www.instagram.com/p/DeydZG0ovNJ/", "instagram", "Instagram"],
  ["ig-aqua-2", "https://www.instagram.com/p/DeRV9HSoA_7/", "instagram", "Instagram"],
  ["ig-aqua-3", "https://www.instagram.com/reel/Dc8fTVgiJwT/", "instagram", "Instagram Reel"],
  ["ig-aqua-4", "https://www.instagram.com/reel/DeMEm27o9Ba/", "instagram", "Instagram Reel"],
];
async function applyAquaAdnanFix(database) {
  const id = "fix:2026-11-14-aqua-adnan";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  await ensureSponsorTables(database);
  const now = Date.now();
  const extraOf = async (adId) => {
    const row = await database.prepare(`SELECT extra FROM ads WHERE id = ?`).bind(adId).first();
    if (!row) return null;
    try { return JSON.parse(row.extra || "{}") || {}; } catch (e) { return {}; }
  };
  const aqua = await extraOf("aqua-marinn");
  const adnan = await extraOf("troja-consulting");
  const steps = [];
  if (aqua) {
    aqua.logo = "/assets/sponsors/aqua-marinn-logo-2.webp";
    steps.push(database.prepare(`UPDATE ads SET image = ?, extra = ?, updated_at = ? WHERE id = 'aqua-marinn'`).bind("/assets/sponsors/aqua-marinn-2.webp", JSON.stringify(aqua), now));
    AQUA_MEDIA.forEach(([mid, key, type, caption], i) => steps.push(
      database.prepare(`INSERT OR IGNORE INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin) VALUES (?, 'aqua-marinn', ?, ?, ?, 'live', 0, ?, 1)`)
        .bind(mid, key, type, caption, now - i)));
  }
  if (adnan) {
    adnan.logo = "/assets/sponsors/troja-consulting-logo-3.webp";
    steps.push(database.prepare(`UPDATE ads SET extra = ?, updated_at = ? WHERE id = 'troja-consulting'`).bind(JSON.stringify(adnan), now));
  }
  steps.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(steps);
}

// 2026-11-14 (owner): Allianz has no KIEZ10 coupon – coupon and "KIEZ10" in the headline removed; "CE" replaced by the
// word "Allianz" (banner + logo). Package stays Plus. Runs once.
async function applyAllianzFix(database) {
  const id = "fix:2026-11-14-allianz";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const row = await database.prepare(`SELECT extra FROM ads WHERE id = 'allianz-efeoglu'`).first();
  if (!row) return;
  let extra = {};
  try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
  delete extra.coupon;
  extra.logo = "/assets/sponsors/allianz-efeoglu-logo-2.webp";
  const now = Date.now();
  await database.batch([
    database.prepare(`UPDATE ads SET image = ?, extra = ?, plan = 'm', headline_de = ?, headline_tr = ?, headline_en = ?, updated_at = ? WHERE id = 'allianz-efeoglu'`).bind(
      "/assets/sponsors/allianz-efeoglu-2.webp", JSON.stringify(extra),
      "Private & gewerbliche Versicherungen – persönliche Beratung im Kiez",
      "Özel ve ticari sigortalar – mahallede kişisel danışmanlık",
      "Private & business insurance – personal advice in your Kiez", now),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now),
  ]);
}

// 2026-11-13 (owner): "TROJA CONSULTING" is now "Adnan Bekar" – name, banner and logo (AB). Contact data stays. Runs once.
async function applyAdnanBekarFix(database) {
  const id = "fix:2026-11-13-adnanbekar";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const row = await database.prepare(`SELECT extra FROM ads WHERE id = 'troja-consulting'`).first();
  if (!row) return;
  let extra = {};
  try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
  extra.logo = "/assets/sponsors/troja-consulting-logo-2.webp";
  if (typeof extra.description === "string") extra.description = extra.description.replace(/TROJA\s*Consulting:?\s*/gi, "");
  const now = Date.now();
  await database.batch([
    database.prepare(`UPDATE ads SET name = 'Adnan Bekar', image = ?, extra = ?, updated_at = ? WHERE id = 'troja-consulting'`).bind("/assets/sponsors/troja-consulting-2.webp", JSON.stringify(extra), now),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now),
  ]);
}

// 2026-11-13 (owner): pictures from "YENI SPONSORLAR.zip" in the sponsors' own gallery (contact sheet).
// They live in /assets (no R2 access from here); by_admin = 1, so they do not count against the sponsor's daily/weekly limit.
// The admin can hide or delete them in "📸 Sponsor-Medien" like every other picture.
const GALLERY_SEED = [
  ["g-schah-1", "schah-hairdesign", "/assets/sponsors/gallery/schah-hairdesign-1.webp", "Haarverlängerung Special – nur 549 €"],
  ["g-pcdoctor-1", "pc-doctor", "/assets/sponsors/gallery/pc-doctor-1.webp", "Unsere Leistungen"],
  ["g-pcdoctor-2", "pc-doctor", "/assets/sponsors/gallery/pc-doctor-2.webp", "Ihr PC in besten Händen"],
  ["g-adnan-1", "dr-adnan-guercan", "/assets/sponsors/gallery/dr-adnan-guercan-1.webp", "CNN Türk – Uzmanı Anlatıyor"],
  ["g-exakt-1", "exakt-sicherheit", "/assets/sponsors/gallery/exakt-sicherheit-1.webp", "Neueröffnung im Märkischen Zentrum"],
  ["g-tek-1", "terra-verde-tek", "/assets/sponsors/gallery/terra-verde-tek-g1.webp", "Folgen Sie uns!"],
];

// One-time: gallery pictures, new Exakt phone number (from the owner's picture), test story from 2026-11-13 rejected. Runs once.
async function applyNewSponsorsFix(database) {
  const id = "fix:2026-11-13-newsponsors";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  await ensureSponsorTables(database);
  const now = Date.now();
  await database.batch([
    ...GALLERY_SEED.map(([mid, adId, key, caption], i) =>
      database.prepare(`INSERT OR IGNORE INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin) VALUES (?, ?, ?, 'image', ?, 'live', 0, ?, 1)`)
        .bind(mid, adId, key, caption, now - i)),
    database.prepare(`UPDATE ads SET link_tel = ?, updated_at = ? WHERE id = 'exakt-sicherheit'`).bind("+49 173 2379395", now),
    // own test story (author "☝💯"), created by mistake on the live site – only this one id
    database.prepare(`UPDATE stories SET status = 'rejected' WHERE id = '4944a6e9-76f5-48fc-9559-1b99e3208558' AND status = 'pending'`),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now),
  ]);
}

// 2026-11-13 (owner): TEK banner background red like the TEK logo (was green), new file name because of the 4 h asset cache. Runs once.
async function applyTekRedFix(database) {
  const id = "fix:2026-11-13-tekred";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const now = Date.now();
  await database.batch([
    database.prepare(`UPDATE ads SET image = ?, updated_at = ? WHERE id = 'terra-verde-tek'`).bind("/assets/sponsors/terra-verde-tek-3.webp", now),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now),
  ]);
}

// 2026-11-13: real TEK logo (logo + banner) under new file names, so browsers and the app do not keep the old cached pictures. Runs once.
async function applyTekLogoFix(database) {
  const id = "fix:2026-11-13-teklogo";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const row = await database.prepare(`SELECT extra FROM ads WHERE id = 'terra-verde-tek'`).first();
  if (!row) return;
  let extra = {};
  try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
  extra.logo = "/assets/sponsors/terra-verde-tek-logo-2.webp";
  const now = Date.now();
  await database.batch([
    database.prepare(`UPDATE ads SET image = ?, extra = ?, updated_at = ? WHERE id = 'terra-verde-tek'`).bind("/assets/sponsors/terra-verde-tek-2.webp", JSON.stringify(extra), now),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now),
  ]);
}

// 2026-11-13 (owner): Terra Verde TEK is Kiez Premium, GRZ Haustechnik is Kiez Basic. Runs once.
async function applyPlanFix(database) {
  const id = "fix:2026-11-13-plans";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const now = Date.now();
  await database.batch([
    database.prepare(`UPDATE ads SET plan = 'l', priority = 30, updated_at = ? WHERE id = 'terra-verde-tek'`).bind(now),
    database.prepare(`UPDATE ads SET plan = 's', priority = 10, updated_at = ? WHERE id = 'grz-haustechnik'`).bind(now),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now),
  ]);
}
