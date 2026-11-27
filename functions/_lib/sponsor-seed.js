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
    // 2026-11-21 (owner): new number +90 532 617 05 64, the old ones removed
    link_web: "https://yusufcarrental.com", link_wa: "+905326170564", link_tel: "+90 532 617 05 64", link_ig: "",
    extra: { category: { de: "Autovermietung", tr: "Araç kiralama", en: "Car rental" }, address: "Antalya, Türkiye", hours: "", contact: "Yusuf Sepetci", primary: "wa", region: "tr",
      description: "Autovermietung in Antalya. Tages-, Wochen- und Monatsmiete mit transparenten TL-Preisen. Klassen: City, Executive, Premium SUV.\nTelefon / WhatsApp: +90 532 617 05 64" },
  },
  // ---- 2026-11-21 (owner): MAXAT Event Location, package Plus ("Yusuf Car Rental -- MAXAT.zip", cover = MAXAT - 004) ----
  {
    id: "maxat", plan: "m", name: "MAXAT Event Location", kieze: "Wedding",
    headline_de: "Eventlocation in Wedding für bis zu 70 Personen: Geburtstag, Weihnachts- & Firmenfeier – ab 800 €",
    headline_tr: "Wedding'de 70 kişiye kadar salon kiralama: doğum günü, yılbaşı ve şirket kutlaması – 800 €'dan itibaren",
    headline_en: "Event location in Wedding for up to 70 guests: birthdays, Christmas & company parties – from €800",
    cta_de: "WhatsApp schreiben", cta_tr: "WhatsApp yaz", cta_en: "Message on WhatsApp",
    link_web: "", link_wa: "+491633135709", link_tel: "+49 163 3135709", link_ig: "",
    extra: { category: { de: "Eventlocation · Raumvermietung", tr: "Salon kiralama · Etkinlik mekânı", en: "Event location · Venue hire" }, address: "Prinzenallee 86 B, 13359 Berlin", hours: "Mietzeit bis 4 Uhr morgens", primary: "wa",
      description: "Eventlocation mitten in Berlin-Wedding für bis zu 70 Personen: Geburtstagsfeier, Weihnachtsfeier, Silvester, Firmenfeier.\nPreise (inkl. Reinigung, zzgl. 19 % MwSt.): Mo–Do 800 €, Fr & So 1.000 €, Sa 1.300 € (außer Feiertage).\nRaucherbereich · unter 18 Jahren bis 22 Uhr · sonst bis 4 Uhr morgens (Mietzeit).\nTelefon / WhatsApp: +49 163 3135709" },
  },
  // ---- 2026-11-22 (owner): EM-Performance, package Plus (folder "Sponsor -EM-PERFORMANCE", cover = EM-PERFORMANCE-1, logo = -5) ----
  {
    id: "em-performance", plan: "m", name: "EM-Performance Softwareoptimierung", kieze: "Charlottenburg",
    headline_de: "Mehr Leistung, weniger Verbrauch: Custom-Software für Motor & Getriebe – alle Marken, Vor-Ort-Service",
    headline_tr: "Daha fazla güç, daha az yakıt: motor ve şanzıman için özel yazılım – tüm markalar, yerinde servis",
    headline_en: "More power, less fuel: custom software for engine & gearbox – all brands, on-site service",
    cta_de: "WhatsApp schreiben", cta_tr: "WhatsApp yaz", cta_en: "Message on WhatsApp",
    link_web: "", link_wa: "+4917684004379", link_tel: "0176 84004379", link_ig: "https://www.instagram.com/emperformance60",
    extra: { category: { de: "Kfz · Softwareoptimierung", tr: "Araç · Yazılım optimizasyonu", en: "Cars · Software tuning" }, address: "14059 Berlin · Vor-Ort-Service in Berlin & Umgebung", hours: "Nach Terminvereinbarung", email: "em-performance60@outlook.com", primary: "wa",
      description: "Professionelle Custom-Softwareoptimierung für Motor & Getriebe – alle Marken (BMW, Audi, Mercedes u. a.).\nLeistungssteigerung / Chiptuning (Stage 1/2/3), Getriebeoptimierung, Schubabschaltung, Pops and Bangs / AK-47, Verbrauchsoptimierung, AGR/DPF/AdBlue-Lösungen, Codierung, individuelle Softwarelösungen. Rückrüstung jederzeit möglich.\nVor-Ort-Service möglich · Termin nach Vereinbarung.\nTelefon / WhatsApp: 0176 84004379" },
  },
  // ---- 2026-11-24 (owner): "neue sponsoren.zip" – Aktiv Zulassungsdienst = Basic, Aesthetic Laser Lyas = Plus ----
  // Aktiv: not in the Excel list, data from aktiv-zulassungsdienst.de (home + Impressum). Owner: mobile 0172 979 36 55 first,
  // the other mobile also on the page, DEVK office in the same shop mentioned.
  {
    id: "aktiv-zulassungsdienst", plan: "s", name: "Aktiv Zulassungsdienst", kieze: "Kreuzberg",
    headline_de: "Kfz-Zulassung in Berlin: An-, Um- & Abmeldung, Kurzzeit, Wunschkennzeichen & Schilder – mit Abhol- und Bringservice",
    headline_tr: "Berlin'de araç tescil: kayıt, nakil ve kayıt silme, kısa süreli plaka, özel plaka ve plakalar – evrak alıp getirme hizmeti",
    headline_en: "Vehicle registration in Berlin: register, transfer & deregister, short-term & custom plates – with pick-up and delivery",
    cta_de: "Jetzt anrufen", cta_tr: "Hemen ara", cta_en: "Call now",
    link_web: "https://www.aktiv-zulassungsdienst.de", link_wa: "", link_tel: "030 81797600", link_ig: "",
    extra: { category: { de: "Kfz-Zulassungsdienst", tr: "Araç tescil hizmeti", en: "Vehicle registration service" }, address: "Heimstraße 9a, 10965 Berlin", hours: "Mo–Do 07:30–12:30 & 13:30–17:00, Fr 08:30–14:30", email: "info@aktiv-zulassungsdienst.de", contact: "Mehmet Cakmak", fax: "030 81797622", primary: "tel",
      description: "Ihr Zulassungsdienst in Berlin-Kreuzberg: Anmeldung, Ummeldung, Abmeldung, Kurzzeitkennzeichen (5 Tage), Zoll-Zulassung, Wunschkennzeichen, Kfz-Schilder und Fahrtenbücher. Abholung und Zustellung Ihrer Unterlagen in Berlin und Umgebung. Individuelle Preise für Gewerbe, Firmen und Freiberufler.\n⭐ Google: 4,9 von 5 (192 Bewertungen)\nIm selben Büro: DEVK Versicherung · Mert Cakmak e. K. – Versicherung, Vorsorge, Finanzierung. Fahranfänger starten mit SF2 (55 %) oder SF15 (30 %).\n\nBerlin-Kreuzberg'de araç tescil hizmeti: kayıt, nakil, kayıt silme, kısa süreli plaka (5 gün), gümrük tescili, özel plaka, plakalar. Evraklarınızı Berlin ve çevresinde alıp getiriyoruz. Aynı ofiste: DEVK sigorta (Mert Cakmak).\n\nHotline: 030 817 97 600\nMobil: 0172 979 36 55\nMobil: 0176 84 54 31 85" },
  },
  // Lyas: Excel row 30. Owner: name "Aesthetic Laser Lyas", Kiez Britz (12347), text DE + TR + RU + EN,
  // WhatsApp for women +49 176 43459085, phone/WhatsApp only for men 0163 0078766. Black Week coupon ends 27.11.2026.
  {
    id: "laser-lyas", plan: "m", name: "Aesthetic Laser Lyas", kieze: "Britz",
    headline_de: "Premium-Laserhaarentfernung für Frauen in Britz – Dioden- & Alexandritlaser, Ganzkörper 5 Zonen 249 €",
    headline_tr: "Britz'te kadınlara premium lazer epilasyon – diyot ve aleksandrit lazer, tüm vücut 5 bölge 249 €",
    headline_en: "Premium laser hair removal for women in Britz – diode & alexandrite laser, full body 5 zones €249",
    cta_de: "WhatsApp schreiben", cta_tr: "WhatsApp yaz", cta_en: "Message on WhatsApp",
    link_web: "", link_wa: "+4917643459085", link_tel: "+49 176 43459085", link_ig: IG("@aesthetic.laser.lyas"),
    extra: { category: { de: "Kosmetik · Laser-Haarentfernung", tr: "Kozmetik · Lazer epilasyon", en: "Beauty · Laser hair removal" }, address: "Tempelhofer Weg 91, 12347 Berlin", hours: "Termin nach Vereinbarung", primary: "wa",
      coupon: { code: "BLACK WEEK", until: Date.parse("2026-11-27T23:59:59+01:00"),
        de: "23.–27.11.: 1 Zone −10 %, 2 Zonen −15 %, 3 Zonen −20 % (Neukundinnen, erste Sitzung)",
        tr: "23–27.11.: 1 bölge %10, 2 bölge %15, 3 bölge %20 indirim (yeni müşteriler, ilk seans)",
        en: "23–27 Nov: 1 zone −10%, 2 zones −15%, 3 zones −20% (new clients, first session)" },
      description: "🇩🇪 Premium-Laserhaarentfernung für Frauen mit Dioden- und Alexandritlaser – sichtbare Ergebnisse. Ganzkörper 5 Zonen 249 €, alle Zonen 349 €. Kostenloses Beratungsgespräch per WhatsApp. Gutscheine für Laser-Haarentfernung – das perfekte Geschenk.\n\n🇹🇷 Kadınlara diyot ve aleksandrit lazer ile premium lazer epilasyon – görünür sonuçlar. Tüm vücut 5 bölge 249 €, tüm bölgeler 349 €. WhatsApp üzerinden ücretsiz danışmanlık. Hediye çeki mevcut.\n\n🇷🇺 Премиальная лазерная эпиляция для женщин (диодный и александритовый лазер) – видимый результат. Всё тело 5 зон 249 €, все зоны 349 €. Бесплатная консультация в WhatsApp. Подарочные сертификаты.\n\n🇬🇧 Premium laser hair removal for women with diode and alexandrite laser – visible results. Full body 5 zones €249, all zones €349. Free consultation via WhatsApp. Gift vouchers available.\n\n👩 Frauen / Kadınlar / Женщины / Women – WhatsApp: +49 176 43459085\n👨 Nur für Männer / Sadece erkekler / Только для мужчин / Men only – Telefon & WhatsApp: 0163 0078766\n📸 Instagram: @aesthetic.laser.lyas" },
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
  // ---- 2026-11-27 evening (owner: archive group "My MyKiezBerlin - Archiv", "sana bırakıyorum"): Irmak Gutachten,
  // data + pictures from irmak-gutachten.de (TÜV-Rheinland certificate, 5,0★ / 72 Google reviews). Plus like the
  // other new sponsors of today; nothing is sent to him automatically.
  {
    id: "irmak-gutachten", plan: "m", name: "Irmak Gutachten · Kfz-Gutachter", kieze: "Reinickendorf",
    headline_de: "TÜV-zertifizierter Kfz-Gutachter in Berlin: Unfallgutachten – Kosten trägt meist die gegnerische Versicherung",
    headline_tr: "Berlin'de TÜV sertifikalı oto eksperi: kaza raporu – masrafı genelde karşı tarafın sigortası öder",
    headline_en: "TÜV-certified car damage expert in Berlin: accident reports – usually paid by the other party's insurance",
    cta_de: "WhatsApp schreiben", cta_tr: "WhatsApp yaz", cta_en: "Message on WhatsApp",
    link_web: "https://irmak-gutachten.de", link_wa: "+4917670630770", link_tel: "+49 176 70630770", link_ig: IG("@kfz_sachverstaendiger_irmak"),
    extra: { category: { de: "Kfz-Gutachter", tr: "Oto eksper", en: "Car damage expert" }, address: "Lieberoser Str. 25, 13439 Berlin", hours: "Termin nach Vereinbarung – wir kommen zu Ihnen", email: "info@irmak-gutachten.de", contact: "Mehmet Irmak", primary: "wa",
      description: "🇩🇪 Sie hatten einen Unfall und sind nicht schuld? Mehmet Irmak – Ingenieur (B.Eng. Elektrotechnik) und TÜV-Rheinland-zertifizierter Kfz-Sachverständiger, über 700 Gutachten, 5,0 ★ bei 72 Google-Bewertungen. Unabhängig und schnell; die Kosten trägt in der Regel die Versicherung des Unfallgegners, abgerechnet wird direkt mit ihr. Wir kommen zu Ihnen – in ganz Berlin und im Umland.\nLeistungen: Unfallgutachten, Kaskogutachten (Hagel, Sturm, Wild, Vandalismus), Kurzgutachten / Kostenvoranschlag, Beweissicherung & Gutachtenprüfung, E-Auto & Hybrid, Wertgutachten, Oldtimergutachten, Motorrad, Transporter & Nutzfahrzeuge. Antwort innerhalb von 24 Stunden.\n☎️ 0176 70630770 · WhatsApp: Fotos vom Schaden senden · info@irmak-gutachten.de · Instagram @kfz_sachverstaendiger_irmak\n\n🇹🇷 Kazada kusurunuz yok mu? Mehmet Irmak – mühendis ve TÜV Rheinland sertifikalı oto eksperi, 700'den fazla rapor, Google'da 5,0 ★ (72 değerlendirme). Bağımsız ve hızlı; masrafı genelde karşı tarafın sigortası öder, hesap doğrudan sigortayla yapılır. Size geliyoruz – tüm Berlin'de ve çevresinde.\nHizmetler: kaza raporu, kasko raporu (dolu, fırtına, hayvan, vandalizm), kısa rapor / masraf tahmini, delil tespiti ve rapor kontrolü, elektrikli ve hibrit araçlar, değer tespiti, klasik araç raporu, motosiklet, kamyonet ve ticari araçlar. 24 saat içinde dönüş.\n☎️ 0176 70630770 · WhatsApp'tan hasar fotoğraflarını gönderin" },
  },
  // ---- 2026-11-27 (owner "UYGULA 2-4"): 3 new Plus sponsors (Black Friday offer), data from the owner's story pictures
  // (Downloads "cigköfte BERLIN - NAUE.zip"), their websites and directories. No message is sent to them automatically.
  // Berlin Çiğköfte: story pictures + berlincigkoftespandau.de (Impressum: Moritzstraße 12, info@…); WhatsApp from the flyer.
  {
    id: "berlin-cigkoefte", plan: "m", name: "Berlin Çiğköfte Spandau", kieze: "Spandau",
    headline_de: "Frische, 100 % vegane Çiğköfte – von Hand geformt: Wrap ab 6 €, Teller & Menüs ab 9 €, Turkish Sushi",
    headline_tr: "Taze, %100 vegan çiğköfte – elde yoğrulmuş: dürüm 6 €'dan, tabak ve menüler 9 €'dan, Turkish Sushi",
    headline_en: "Fresh, 100% vegan çiğköfte – hand-made: wrap from €6, plates & menus from €9, Turkish sushi",
    cta_de: "Per WhatsApp bestellen", cta_tr: "WhatsApp'tan sipariş ver", cta_en: "Order on WhatsApp",
    link_web: "https://berlincigkoftespandau.de/", link_wa: "+4915906730016", link_tel: "+49 159 06730016", link_ig: "",
    extra: { category: { de: "Çiğköfte · vegan", tr: "Çiğköfte · vegan", en: "Çiğköfte · vegan" }, address: "Moritzstraße 12, 13597 Berlin", hours: "Täglich ab 10:30 Uhr", email: "info@berlincigkoftespandau.de", primary: "wa",
      description: "🇩🇪 Dein Çiğköfte-Spot in Spandau (Adıyaman Çiğköfte · Orhan Usta): traditionelle, 100 % vegane Çiğköfte – von Hand geformt, mit Liebe gemacht. Çiğköfte-Wrap ab 6,00 €, vegane Teller & Menüs ab 9,00 € (Familien-Menüs für bis zu 6 Personen), Turkish Sushi 10 Stück 9,00 €. 4,8 ★ bei 199 Google-Bewertungen.\nBestellen per WhatsApp 0159 / 06 73 00 16 – abholen, liefern lassen (Lieferando, Uber Eats, Wolt) oder vor Ort genießen. Online-Shop mit Versand in ganz Deutschland: Çiğköfte, Soßen, Olivenöl, Pasten, Süßes – ab 50 € versandkostenfrei (Code HALLO).\n\n🇹🇷 Spandau'daki çiğköfte noktan (Adıyaman Çiğköfte · Orhan Usta): geleneksel, %100 vegan çiğköfte – elde yoğrulmuş, sevgiyle hazırlanmış. Çiğköfte dürüm 6,00 €'dan, vegan tabak ve menüler 9,00 €'dan (6 kişiye kadar aile menüleri), Turkish Sushi 10 adet 9,00 €. Google'da 4,8 ★ (199 değerlendirme).\nWhatsApp ile sipariş: 0159 / 06 73 00 16 – gel al, eve sipariş (Lieferando, Uber Eats, Wolt) veya yerinde ye. Online mağaza tüm Almanya'ya gönderir: çiğköfte, soslar, zeytinyağı, salçalar, tatlılar – 50 € üzeri kargo ücretsiz (kod HALLO)." },
  },
  // Kfz-Werkstatt Nauen: only the owner's flyers (no name, website or e-mail found online, 0177 3467556 not listed anywhere).
  {
    id: "kfz-werkstatt-nauen", plan: "m", name: "KFZ-Werkstatt Nauen · Typenoffen", kieze: "Spandau",
    headline_de: "Typenoffene Kfz-Werkstatt in Nauen, spezialisiert auf VW, Audi, Škoda & Seat – mit Abhol- und Bringservice im Raum Spandau",
    headline_tr: "Nauen'de tüm markalara açık oto tamirhanesi, VW, Audi, Škoda ve Seat uzmanı – Spandau bölgesinde aracı alıp getirme servisi",
    headline_en: "Independent car workshop in Nauen, specialised in VW, Audi, Škoda & Seat – pick-up and delivery around Spandau",
    cta_de: "Termin per WhatsApp", cta_tr: "WhatsApp'tan randevu", cta_en: "Book on WhatsApp",
    link_web: "", link_wa: "+491773467556", link_tel: "+49 177 3467556", link_ig: "",
    extra: { category: { de: "Kfz-Werkstatt", tr: "Oto tamirhanesi", en: "Car workshop" }, address: "Nauen – ca. 25 Min. von Spandau, wenige Gehminuten zum Bahnhof Nauen", hours: "Termin nach Vereinbarung", primary: "wa",
      description: "🇩🇪 Performance. Präzision. Vertrauen. Dein Auto in besten Händen – typenoffene Kfz-Werkstatt in Nauen, spezialisiert auf VW, Audi, Škoda und Seat (Reparaturen aller Fahrzeugmarken möglich). Unsere Leistungen: Inspektion & Wartung, Bremsen & Bremsanlagen, Motor & Getriebe, Fahrzeugdiagnose & Elektrik, Fahrwerk & Lenkung, Batterie & Lichtmaschine, Auspuff & Abgasanlage, Zahnriemen & Steuerkette, Reparaturen & Instandsetzungen, Fehlersuche & Diagnose, TÜV-/AU-Vorbereitung. Fachkompetent, zuverlässig, faire Preise. Abhol- und Bringservice im Raum Spandau. Von Spandau ca. 25 Minuten Fahrzeit, wenige Gehminuten zum Bahnhof Nauen. Jetzt Termin sichern: 0177 3467556.\n\n🇹🇷 Performans. Hassasiyet. Güven. Aracın en iyi ellerde – Nauen'de tüm markalara açık oto tamirhanesi, VW, Audi, Škoda ve Seat uzmanı (tüm markaların tamiri mümkün). Hizmetlerimiz: muayene ve bakım, frenler, motor ve şanzıman, araç arıza tespiti ve elektrik, yürüyen aksam ve direksiyon, akü ve alternatör, egzoz sistemi, triger kayışı ve zincir, tamir ve onarım, hata arama ve teşhis, TÜV/AU hazırlığı. Uzman, güvenilir, uygun fiyat. Spandau bölgesinde aracı alıp getirme servisi. Spandau'dan yaklaşık 25 dakika, Nauen garına birkaç dakika yürüme mesafesinde. Hemen randevu al: 0177 3467556." },
  },
  // Burnout Motors: burnout-trade.de (title "Burnout Motors", footer: Hennigsdorf head office + Berlin-Tempelhof branch,
  // kontakt@burnout-motors.de, +49 30 2096738-70, Instagram/Facebook/TikTok/YouTube links), logo from the site.
  // Owner: Kiez Wilmersdorf first (the story video shows the shop at U Deutsche Oper), then Tempelhof.
  // Landline only -> no WhatsApp button (owner: WhatsApp only where there is a number for it).
  {
    id: "burnout-motors", plan: "m", name: "Burnout Motors", kieze: "Wilmersdorf,Tempelhof",
    headline_de: "Motorroller, Elektroroller & 125er Motorräder – seit 2005, Probefahrt, eigene Werkstatt, 0 % Finanzierung",
    headline_tr: "Motorlu scooter, elektrikli scooter ve 125'lik motosikletler – 2005'ten beri, test sürüşü, kendi servisi, %0 finansman",
    headline_en: "Scooters, e-scooters & 125cc motorcycles – since 2005, test rides, own workshop, 0% financing",
    cta_de: "Zum Shop", cta_tr: "Mağazaya git", cta_en: "Visit shop",
    link_web: "https://www.burnout-trade.de/", link_wa: "", link_tel: "+49 30 2096738-70", link_ig: IG("@burnout_motors"),
    extra: { category: { de: "Motorroller & Motorräder", tr: "Scooter ve motosiklet", en: "Scooters & motorcycles" }, address: "Bismarckstraße 24, 10625 Berlin (U Deutsche Oper) · Colditzstraße 27/29, 12099 Berlin-Tempelhof · Veltener Str. 13, 16761 Hennigsdorf", hours: "Mo–Fr 10–18 Uhr, Sa 10–16 Uhr (Tempelhof Showroom Mo–Fr ab 12 Uhr)", email: "kontakt@burnout-motors.de",
      description: "🇩🇪 Burnout Motors – Zweiradspezialist seit über 20 Jahren (seit 2005): Retro-Roller, Motorroller (50, 125, 300 ccm), Elektroroller und 125er Motorräder (fahrbar mit A1 oder B196), Helme & Zubehör. Probefahrt im Showroom, hauseigene Werkstatt für Inspektion, Service und Reparatur, 0 % Finanzierung bis 12 Monate. 🔥 Black Week: 300 € Rabatt auf Roller.\nShowrooms: Berlin-Wilmersdorf (bei U Deutsche Oper), Berlin-Tempelhof (Colditzstraße 27/29) und Hennigsdorf (Veltener Str. 13). Telefon +49 30 2096738-70 · kontakt@burnout-motors.de\nInstagram @burnout_motors · Facebook facebook.com/burnouttrade · TikTok @burnouttradede · YouTube @burnoutmotors\n\n🇹🇷 Burnout Motors – 20 yılı aşkın (2005'ten beri) iki tekerlek uzmanı: retro scooter, motorlu scooter (50, 125, 300 cc), elektrikli scooter ve 125'lik motosikletler (A1 veya B196 ile), kask ve aksesuar. Showroom'da test sürüşü, kendi servisinde bakım ve tamir, 12 aya kadar %0 finansman. 🔥 Black Week: scooter'larda 300 € indirim.\nShowroom'lar: Berlin-Wilmersdorf (U Deutsche Oper yanı), Berlin-Tempelhof (Colditzstraße 27/29) ve Hennigsdorf (Veltener Str. 13). Telefon +49 30 2096738-70 · kontakt@burnout-motors.de" },
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
  await applyTugraInfoFix(database);
  await applyStoryFolderFix(database);
  await applyMosqueFolderFix(database);
  await applyOwnFirmsFix(database);
  await applyOwnFirmsByNameFix(database);
  await applyRestoreOptimizedFix(database);
  await applyMaxatYusufFix(database);
  await applyEmPerformanceMediaFix(database);
  await applyAktivLyasMediaFix(database);
  await applyAktivLyasMoreFix(database);
  await applyCarouselNewPlusFix(database); // 2026-11-27
  await applyBurnoutBismarckFix(database); // 2026-11-27
  await applyBurnoutMoreFix(database); // 2026-11-27 later
  await applyBurnoutLogoBackFix(database); // 2026-11-27 owner
  await applyArchivTamEtIrmakFix(database); // 2026-11-27 evening
}

// 2026-11-27 evening (owner: links in the WhatsApp group "My MyKiezBerlin - Archiv"): Tam Et – round logo cut from the
// Google Maps photo of the shop sign, the photo in the gallery, WhatsApp button (0176 = mobile), Google Maps link;
// Irmak Gutachten – 4 pictures of irmak-gutachten.de in the gallery. Pictures stay (days 36500). Runs once.
const ARCHIV_MEDIA = [
  ["g-tamet-3", "tam-et", "/assets/sponsors/gallery/tam-et-3.webp", "Tam Et – Premium Quality Meat Cuts · Residenzstraße 128"],
  ["g-irmak-1", "irmak-gutachten", "/assets/sponsors/gallery/irmak-gutachten-1.webp", "Unfallgutachten – wir kommen zu Ihnen · Size geliyoruz"],
  ["g-irmak-2", "irmak-gutachten", "/assets/sponsors/gallery/irmak-gutachten-2.webp", "Mehmet Irmak – Kfz-Sachverständiger"],
  ["g-irmak-3", "irmak-gutachten", "/assets/sponsors/gallery/irmak-gutachten-3.webp", "Oldtimergutachten · Klasik araç raporu"],
  ["g-irmak-4", "irmak-gutachten", "/assets/sponsors/gallery/irmak-gutachten-4.webp", "TÜV Rheinland zertifiziert"],
];
async function applyArchivTamEtIrmakFix(database) {
  const id = "fix:2026-11-27-archiv-tamet-irmak";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  await ensureSponsorTables(database);
  const now = Date.now();
  const ops = ARCHIV_MEDIA.map(([mid, adId, key, caption], i) =>
    database.prepare(`INSERT OR IGNORE INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin, days) VALUES (?, ?, ?, 'image', ?, 'live', 0, ?, 1, 36500)`)
      .bind(mid, adId, key, caption, now - i));
  const row = await database.prepare(`SELECT extra, link_wa, link_web FROM ads WHERE id = 'tam-et'`).first();
  if (row) {
    let extra = {};
    try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
    extra.logo = "/assets/sponsors/tam-et-logo-2.webp";
    extra.maps = "https://maps.app.goo.gl/iVKXGJBtwnAmr2wn7";
    ops.push(database.prepare(`UPDATE ads SET extra = ?, link_wa = ?, link_web = ?, updated_at = ? WHERE id = 'tam-et'`)
      .bind(JSON.stringify(extra), row.link_wa || "+4917671099594", row.link_web || "https://maps.app.goo.gl/iVKXGJBtwnAmr2wn7", now));
  }
  ops.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(ops);
}

// 2026-11-27 (owner): the first Burnout logo (white, the round badge fills the round logo window) looks much better than
// the picture with the black background – back to /assets/sponsors/burnout-motors-logo.webp. Runs once.
async function applyBurnoutLogoBackFix(database) {
  const id = "fix:2026-11-27-burnout-logo-back";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const row = await database.prepare(`SELECT extra FROM ads WHERE id = 'burnout-motors'`).first();
  if (!row) return;
  let extra = {};
  try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
  extra.logo = "/assets/sponsors/burnout-motors-logo.webp";
  const now = Date.now();
  await database.batch([
    database.prepare(`UPDATE ads SET extra = ?, updated_at = ? WHERE id = 'burnout-motors'`).bind(JSON.stringify(extra), now),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now),
  ]);
}

// 2026-11-27 later (owner): Burnout – his logo + 4 pictures from burnout-trade.de ("BORNOUT BILDER.zip"), new cover,
// 4 Instagram reels in the gallery; Black Weeks offer from the site: "1 ccm = 1 €" (100 € on 50er … 400 € on 400er,
// free storage until 01.03.2027). Pictures and reels stay until the owner deletes them (days 36500). Runs once.
const BURNOUT_MORE = [
  ["g-burnout-3", "/assets/sponsors/gallery/burnout-motors-3.webp", "image", "Neu: GT-S 400 – 400 ccm, 39,4 PS, Führerschein A2"],
  ["g-burnout-4", "/assets/sponsors/gallery/burnout-motors-4.webp", "image", "Black Weeks: 1 ccm = 1 € Rabatt · bis 400 €"],
  ["g-burnout-5", "/assets/sponsors/gallery/burnout-motors-5.webp", "image", "Vom 50er bis zum 300er – Motorroller, E-Roller, 125er Motorräder"],
  ["g-burnout-6", "/assets/sponsors/gallery/burnout-motors-6.webp", "image", "Lieferung bis vor die Haustür"],
  ["ig-burnout-1", "https://www.instagram.com/reel/DbvR302ICyY/", "instagram", "Instagram Reel"],
  ["ig-burnout-2", "https://www.instagram.com/reel/DdgHjJ3uoIe/", "instagram", "Instagram Reel"],
  ["ig-burnout-3", "https://www.instagram.com/reel/Df-GYU0us_u/", "instagram", "Instagram Reel"],
  ["ig-burnout-4", "https://www.instagram.com/reel/DNEBNljIsqb/", "instagram", "Instagram Reel"],
];
async function applyBurnoutMoreFix(database) {
  const id = "fix:2026-11-27-burnout-more";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const row = await database.prepare(`SELECT extra FROM ads WHERE id = 'burnout-motors'`).first();
  if (!row) return;
  await ensureSponsorTables(database);
  let extra = {};
  try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
  extra.logo = "/assets/sponsors/burnout-motors-logo-2.webp";
  extra.coupon = { code: "BLACK WEEKS", until: Date.parse("2026-11-30T23:59:59+01:00"),
    de: "1 ccm = 1 € Rabatt: 100 € auf 50er · 125 € auf 125er · 300 € auf 300er · 400 € auf 400er – jetzt kaufen, kostenlos einlagern bis 01.03.2027",
    tr: "1 cc = 1 € indirim: 50'likte 100 € · 125'likte 125 € · 300'lükte 300 € · 400'lükte 400 € – şimdi al, 01.03.2027'ye kadar ücretsiz depola",
    en: "1 ccm = €1 off: €100 on 50cc · €125 on 125cc · €300 on 300cc · €400 on 400cc – buy now, free storage until 01.03.2027" };
  if (typeof extra.description === "string" && !/1 ccm = 1 €/.test(extra.description)) {
    extra.description = extra.description
      .replace("🔥 Black Week: 300 € Rabatt auf Roller.", "🔥 Black Weeks – jeder Kubik zählt: 1 ccm = 1 € Rabatt (100 € auf 50er, 125 € auf 125er, 300 € auf 300er, 400 € auf 400er), jetzt kaufen und kostenlos einlagern bis 01.03.2027. Neu: GT-S 400 Maxi-Scooter – 400 ccm, 39,4 PS, Camouflage-Look, Führerschein A2.")
      .replace("🔥 Black Week: scooter'larda 300 € indirim.", "🔥 Black Weeks – her cc değerli: 1 cc = 1 € indirim (50'likte 100 €, 125'likte 125 €, 300'lükte 300 €, 400'lükte 400 €), şimdi al, 01.03.2027'ye kadar ücretsiz depola. Yeni: GT-S 400 maxi scooter – 400 cc, 39,4 PS, A2 ehliyet.");
  }
  const now = Date.now();
  const ops = BURNOUT_MORE.map(([mid, key, type, caption], i) =>
    database.prepare(`INSERT OR IGNORE INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin, days) VALUES (?, 'burnout-motors', ?, ?, ?, 'live', 0, ?, 1, 36500)`)
      .bind(mid, key, type, caption, now + 10 - i));
  ops.push(database.prepare(`UPDATE ads SET image = ?, extra = ?, updated_at = ? WHERE id = 'burnout-motors'`).bind("/assets/sponsors/burnout-motors-2.webp", JSON.stringify(extra), now));
  ops.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(ops);
}

// 2026-11-27 (owner): Burnout Wilmersdorf shop = Bismarckstraße 24 (at U Deutsche Oper) first; more from burnout-trade.de
// (models + prices, e-scooters, helmets, licence classes, workshop, 0 % financing, delivery) + Black Week coupon. Runs once.
const BURNOUT_DESC = "🇩🇪 Burnout Motors – Zweiradspezialist seit über 20 Jahren (seit 2005). 🔥 Black Week: 300 € Rabatt auf Roller.\n" +
  "📍 Neu in Wilmersdorf: Bismarckstraße 24, 10625 Berlin (U Deutsche Oper) · Showroom Berlin-Tempelhof: Colditzstraße 27/29, 12099 Berlin · Hauptsitz Hennigsdorf: Veltener Str. 13, 16761 Hennigsdorf\n" +
  "🛵 Motorroller 50 ccm (Führerschein AM, in Klasse B enthalten, 45 km/h): MiniMe 2.0 ab 1.699 €, Luna ab 1.799 €, EasyCruiser ab 1.999 €, BAD s ab 2.199 €, GS 50 ab 2.199 €\n" +
  "🛵 Motorroller 125 ccm (A1 oder B196, bis 99 km/h): QS125 C ab 2.499 €, QS125 ADV ab 2.999 €, TENNIS ab 2.999 €, MOBSTER ab 3.499 €, CITY-X ab 3.799 €, GT-X ab 3.899 €\n" +
  "🛵 ab 250 ccm (A2 oder A, bis 126 km/h): GT-R ab 4.999 €, GT-X 300 ab 5.499 €, GT-S ab 5.799 €\n" +
  "🏍️ Neu: Motorräder 125 ccm (A1 oder B196): GP1 ab 3.899 €, GP2 ab 3.699 €, Scrambler ab 3.899 €\n" +
  "⚡ Elektroroller: MiniMe 2.0 Elektro ab 2.299 €, EasyCruiser Elektro ab 2.499 € – leise durch die Stadt\n" +
  "⛑️ Helme ab 59,90 € (Jet-, Klapp- und Integralhelme, XS–XXL) – vor Ort anprobieren · Zubehör & Ersatzteile\n" +
  "✅ Probefahrt im Showroom · hauseigene Werkstatt (Inspektion, Service, Reparatur) · 0 % Finanzierung bis 12 Monate · Lieferung per Spedition\n" +
  "☎️ +49 30 2096738-70 · ✉️ kontakt@burnout-motors.de · Mo–Fr 10–18 Uhr, Sa 10–16 Uhr\n" +
  "Instagram @burnout_motors · Facebook facebook.com/burnouttrade · TikTok @burnouttradede · YouTube @burnoutmotors\n\n" +
  "🇹🇷 Burnout Motors – 20 yılı aşkın (2005'ten beri) iki tekerlek uzmanı. 🔥 Black Week: scooter'larda 300 € indirim.\n" +
  "📍 Wilmersdorf'ta yeni: Bismarckstraße 24, 10625 Berlin (U Deutsche Oper) · Tempelhof showroom: Colditzstraße 27/29 · Merkez Hennigsdorf: Veltener Str. 13\n" +
  "🛵 50 cc scooter (AM ehliyeti, B sınıfında dahil, 45 km/s): 1.699 €'dan · 125 cc (A1 veya B196): 2.499 €'dan · 250 cc üstü: 4.999 €'dan\n" +
  "🏍️ Yeni: 125 cc motosikletler (GP1, GP2, Scrambler) 3.699 €'dan · ⚡ Elektrikli scooter 2.299 €'dan · ⛑️ Kask 59,90 €'dan\n" +
  "✅ Showroom'da test sürüşü · kendi servisi · 12 aya kadar %0 finansman · nakliye ile teslimat\n" +
  "☎️ +49 30 2096738-70 · ✉️ kontakt@burnout-motors.de · Pzt–Cum 10–18, Cmt 10–16";
async function applyBurnoutBismarckFix(database) {
  const id = "fix:2026-11-27-burnout-bismarck";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const row = await database.prepare(`SELECT extra FROM ads WHERE id = 'burnout-motors'`).first();
  if (!row) return;
  let extra = {};
  try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
  extra.address = "Bismarckstraße 24, 10625 Berlin (U Deutsche Oper) · Colditzstraße 27/29, 12099 Berlin-Tempelhof · Veltener Str. 13, 16761 Hennigsdorf";
  extra.hours = "Mo–Fr 10–18 Uhr, Sa 10–16 Uhr";
  extra.description = BURNOUT_DESC;
  extra.coupon = { code: "BLACK WEEK", until: Date.parse("2026-11-30T23:59:59+01:00"),
    de: "Black Week: 300 € Rabatt auf Roller", tr: "Black Week: scooter'larda 300 € indirim", en: "Black Week: €300 off scooters" };
  const now = Date.now();
  await database.batch([
    database.prepare(`UPDATE ads SET extra = ?, updated_at = ? WHERE id = 'burnout-motors'`).bind(JSON.stringify(extra), now),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now),
  ]);
}

// 2026-11-27 (owner "UYGULA 2-5"): pictures of the 3 new Plus sponsors + Aesthetic Laser Lyas' Instagram carousel in the
// order of the numbers top right (1/6 … 6/6). Owner: sponsor carousels stay in the stories until he deletes them
// -> days = 36500 (no end). Order: first picture newest (MEDIA_ORDER = newest first). Runs once.
const CAROUSEL_NEW_PLUS = [
  ["laser-lyas", [
    ["g-laser-lyas-c1", "laser-lyas-carousel-1", "Gestern rasiert. Heute Kaktus. – Frag mich nach Laser-Haarentfernung"],
    ["g-laser-lyas-c2", "laser-lyas-carousel-2", "Der Rasierer macht Feierabend. Deine Haare nicht."],
    ["g-laser-lyas-c3", "laser-lyas-carousel-3", "Rasierer: oben ab. Laser: tiefer dran."],
    ["g-laser-lyas-c4", "laser-lyas-carousel-4", "Einmal lasern und tschüss? Haare wachsen in Phasen."],
    ["g-laser-lyas-c5", "laser-lyas-carousel-5", "Weniger Stoppeln. Mehr Zeit für Kaffee."],
    ["g-laser-lyas-c6", "laser-lyas-carousel-6", "Kostenlose Beratung per WhatsApp · Tempelhofer Weg 91"],
  ]],
  ["berlin-cigkoefte", [
    ["g-cigkoefte-1", "berlin-cigkoefte-1", "Frische Çiğköfte – von Hand geformt · Taze çiğköfte"],
    ["g-cigkoefte-2", "berlin-cigkoefte-2", "Black Friday 27.–29.11.: 2 Menüs + 250 g gratis · Vegane Platte 15 €"],
    ["g-cigkoefte-3", "berlin-cigkoefte-3", "Große vegane Auswahl · Büyük vegan seçenek"],
    ["g-cigkoefte-4", "berlin-cigkoefte-4", "Teller & Menüs für bis zu 6 Personen"],
    ["g-cigkoefte-5", "berlin-cigkoefte-5", "Jetzt bestellen: WhatsApp 0159 / 06 73 00 16"],
    ["g-cigkoefte-6", "berlin-cigkoefte-6", "Moritzstraße 12 – komm vorbei!"],
  ]],
  ["kfz-werkstatt-nauen", [
    ["g-kfznauen-1", "kfz-werkstatt-nauen-1", "Dein Auto in besten Händen – VW, Audi, Škoda, Seat"],
    ["g-kfznauen-2", "kfz-werkstatt-nauen-2", "Unsere Leistungen · Hizmetlerimiz"],
  ]],
  ["burnout-motors", [
    ["g-burnout-1", "burnout-motors-1", "Kommt nach Wilmersdorf! · U Deutsche Oper"],
    ["g-burnout-2", "burnout-motors-2", "Black Week: 300 € Rabatt auf Roller"],
  ]],
];
async function applyCarouselNewPlusFix(database) {
  const id = "fix:2026-11-27-carousel-newplus";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  await ensureSponsorTables(database);
  const now = Date.now();
  const ops = [];
  for (const [adId, list] of CAROUSEL_NEW_PLUS) {
    list.forEach(([mid, file, caption], i) => ops.push(
      database.prepare(`INSERT OR IGNORE INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin, days) VALUES (?, ?, ?, 'image', ?, 'live', 0, ?, 1, 36500)`)
        .bind(mid, adId, `/assets/sponsors/gallery/${file}.webp`, caption, now - i)));
  }
  // Burnout's own story video (owner's story 26.11) in its gallery as well
  ops.push(database.prepare(`INSERT OR IGNORE INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin, days) VALUES (?, ?, ?, 'video', ?, 'live', 0, ?, 1, 36500)`)
    .bind("v-burnout-1", "burnout-motors", "stories/29e630e0-b35b-44ea-98ac-594bc1b3f512.mp4", "Black Week-Aktion · Burnout Motors", now + 1));
  ops.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(ops);
}

// 2026-11-24 later (owner): Aktiv – 3 pictures cut from the owner's Google Maps screenshot (side, office, sign) + Google
// rating in the text; Lyas – cover moved down (new file name because of the asset cache) + 3 Instagram reels
// (DgGG8RJB6Lv, C7XKFjAAGx3, DYPyuAWxU8y; DfC3kH1tAcC is age/region restricted and could not be downloaded). Runs once.
const AKTIV_LYAS_MORE = [
  ["g-aktiv-zulassungsdienst-2", "aktiv-zulassungsdienst", "/assets/sponsors/gallery/aktiv-zulassungsdienst-2.webp", "image", "Heimstraße 9a · Kreuzberg"],
  ["g-aktiv-zulassungsdienst-3", "aktiv-zulassungsdienst", "/assets/sponsors/gallery/aktiv-zulassungsdienst-3.webp", "image", "Unser Büro · Ofisimiz"],
  ["g-aktiv-zulassungsdienst-4", "aktiv-zulassungsdienst", "/assets/sponsors/gallery/aktiv-zulassungsdienst-4.webp", "image", "Anmeldung · Ummeldung · Abmeldung · Kurzzeit · Schilder"],
  ["v-laser-lyas-1", "laser-lyas", "/assets/sponsors/gallery/laser-lyas-video-1.mp4", "video", "Aesthetic Laser Lyas"],
  ["v-laser-lyas-2", "laser-lyas", "/assets/sponsors/gallery/laser-lyas-video-2.mp4", "video", "Aesthetic Laser Lyas"],
  ["v-laser-lyas-3", "laser-lyas", "/assets/sponsors/gallery/laser-lyas-video-3.mp4", "video", "Aesthetic Laser Lyas"],
];
async function applyAktivLyasMoreFix(database) {
  const id = "fix:2026-11-24-aktiv-lyas-2";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  await ensureSponsorTables(database);
  const now = Date.now();
  const ops = AKTIV_LYAS_MORE.map(([mid, adId, key, type, caption], i) =>
    database.prepare(`INSERT OR IGNORE INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin) VALUES (?, ?, ?, ?, ?, 'live', 0, ?, 1)`)
      .bind(mid, adId, key, type, caption, now + i));
  ops.push(database.prepare(`UPDATE ads SET image = ?, updated_at = ? WHERE id = 'laser-lyas' AND image = '/assets/sponsors/laser-lyas.webp'`).bind("/assets/sponsors/laser-lyas-2.webp", now));
  const a = SPONSOR_SEED.find((x) => x.id === "aktiv-zulassungsdienst");
  const row = await database.prepare(`SELECT extra FROM ads WHERE id = 'aktiv-zulassungsdienst'`).first();
  if (a && row) {
    let extra = {};
    try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
    extra.description = a.extra.description;
    ops.push(database.prepare(`UPDATE ads SET extra = ?, updated_at = ? WHERE id = 'aktiv-zulassungsdienst'`).bind(JSON.stringify(extra), now));
  }
  ops.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(ops);
}

// 2026-11-24 (owner): "neue sponsoren.zip" – Aktiv Zulassungsdienst (1 shop picture; the Google Maps screenshot is not used)
// and Aesthetic Laser Lyas (all 5 pictures) in their gallery / story folder. Runs once.
const AKTIV_LYAS_MEDIA = [
  ["g-aktiv-zulassungsdienst-1", "aktiv-zulassungsdienst", "/assets/sponsors/gallery/aktiv-zulassungsdienst-1.webp", "Heimstraße 9a, 10965 Berlin · Hotline 030 817 97 600"],
  ["g-laser-lyas-1", "laser-lyas", "/assets/sponsors/gallery/laser-lyas-1.webp", "Gutscheine für Laser-Haarentfernung · Hediye çeki"],
  ["g-laser-lyas-2", "laser-lyas", "/assets/sponsors/gallery/laser-lyas-2.webp", "Aesthetic Laser Lyas"],
  ["g-laser-lyas-3", "laser-lyas", "/assets/sponsors/gallery/laser-lyas-3.webp", "Laser Behandlung · Tempelhofer Weg 91"],
  ["g-laser-lyas-4", "laser-lyas", "/assets/sponsors/gallery/laser-lyas-4.webp", "Kostenlose Beratung per WhatsApp · Ücretsiz danışmanlık"],
  ["g-laser-lyas-5", "laser-lyas", "/assets/sponsors/gallery/laser-lyas-5.webp", "Dioden- & Alexandritlaser · Diyot ve aleksandrit lazer"],
];
async function applyAktivLyasMediaFix(database) {
  const id = "fix:2026-11-24-aktiv-lyas";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  await ensureSponsorTables(database);
  const now = Date.now();
  const ops = AKTIV_LYAS_MEDIA.map(([mid, adId, key, caption], i) =>
    database.prepare(`INSERT OR IGNORE INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin) VALUES (?, ?, ?, 'image', ?, 'live', 0, ?, 1)`)
      .bind(mid, adId, key, caption, now + i));
  ops.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(ops);
}

// 2026-11-22 (owner): EM-Performance – 4 pictures + the 3 most-viewed Instagram reels (@emperformance60: DKrTZmWtvNn 1.775,
// DJEJlbPCxZm 1.324, DJeVumACvNF 1.318 views on 22.11.2026) in its gallery / story folder. Runs once.
const EM_MEDIA = [
  ["g-em-performance-1", "/assets/sponsors/gallery/em-performance-1.webp", "image", "Custom Software · Alle Marken · Tel. 0176 84004379"],
  ["g-em-performance-2", "/assets/sponsors/gallery/em-performance-2.webp", "image", "Mehr Leistung & Fahrspaß · Daha fazla güç"],
  ["g-em-performance-3", "/assets/sponsors/gallery/em-performance-3.webp", "image", "Motor & Getriebe · Motor ve şanzıman"],
  ["g-em-performance-4", "/assets/sponsors/gallery/em-performance-4.webp", "image", "Wir bieten an · Hizmetlerimiz"],
  ["v-em-performance-1", "/assets/sponsors/gallery/em-performance-video-1.mp4", "video", "EM-Performance"],
  ["v-em-performance-2", "/assets/sponsors/gallery/em-performance-video-2.mp4", "video", "EM-Performance"],
  ["v-em-performance-3", "/assets/sponsors/gallery/em-performance-video-3.mp4", "video", "EM-Performance"],
];
async function applyEmPerformanceMediaFix(database) {
  const id = "fix:2026-11-22-em-performance";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  await ensureSponsorTables(database);
  const now = Date.now();
  const ops = EM_MEDIA.map(([mid, key, type, caption], i) =>
    database.prepare(`INSERT OR IGNORE INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin) VALUES (?, 'em-performance', ?, ?, ?, 'live', 0, ?, 1)`)
      .bind(mid, key, type, caption, now + i));
  ops.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(ops);
}

// 2026-11-21 (owner): MAXAT – all 8 pictures + 2 videos in its gallery / story folder; Yusuf Car Rental – only the new
// number +90 532 617 05 64 (old numbers removed from the live row). Runs once.
const MAXAT_MEDIA = [
  ["g-maxat-1", "/assets/sponsors/gallery/maxat-1.webp", "image", "Eventlocation für Ihre Feiern 2026 · Kutlamalarınız için salon"],
  ["g-maxat-2", "/assets/sponsors/gallery/maxat-2.webp", "image", "Prinzenallee 86 B, 13359 Berlin · +49 163 3135709"],
  ["g-maxat-3", "/assets/sponsors/gallery/maxat-3.webp", "image", "Mitten in Berlin · Berlin'in ortasında"],
  ["g-maxat-4", "/assets/sponsors/gallery/maxat-4.webp", "image", "Bis zu 70 Personen · 70 kişiye kadar"],
  ["g-maxat-5", "/assets/sponsors/gallery/maxat-5.webp", "image", "Buchen Sie uns · Rezervasyon: +49 163 3135709"],
  ["g-maxat-6", "/assets/sponsors/gallery/maxat-6.webp", "image", "Preisliste: Mo–Do 800 €, Fr & So 1.000 €, Sa 1.300 €"],
  ["g-maxat-7", "/assets/sponsors/gallery/maxat-7.webp", "image", "MAXAT Lounge"],
  ["g-maxat-8", "/assets/sponsors/gallery/maxat-8.webp", "image", "Cocktails & Feiern · Kokteyller ve kutlamalar"],
  ["v-maxat-1", "/assets/sponsors/gallery/maxat-video-1.mp4", "video", "MAXAT Event Location"],
  ["v-maxat-2", "/assets/sponsors/gallery/maxat-video-2.mp4", "video", "MAXAT Event Location"],
];
async function applyMaxatYusufFix(database) {
  const id = "fix:2026-11-21-maxat-yusuf";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  await ensureSponsorTables(database);
  const now = Date.now();
  const ops = MAXAT_MEDIA.map(([mid, key, type, caption], i) =>
    database.prepare(`INSERT OR IGNORE INTO sponsor_media (id, ad_id, media_key, media_type, caption, status, bytes, created_at, by_admin) VALUES (?, 'maxat', ?, ?, ?, 'live', 0, ?, 1)`)
      .bind(mid, key, type, caption, now + i));
  const y = SPONSOR_SEED.find((x) => x.id === "yusuf-car-rental");
  const row = await database.prepare(`SELECT extra FROM ads WHERE id = 'yusuf-car-rental'`).first();
  if (y && row) {
    let extra = {};
    try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
    extra.description = y.extra.description;
    ops.push(database.prepare(`UPDATE ads SET link_wa = ?, link_tel = ?, extra = ?, updated_at = ? WHERE id = 'yusuf-car-rental'`)
      .bind(y.link_wa, y.link_tel, JSON.stringify(extra), now));
  }
  ops.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(ops);
}

// 2026-11-14 (owner): test story "Yeni Aziziye Camii" (Rudow, Neukölln) – the AI had chosen "tuerkei" because of the
// Turkish translation; correct folders: events, berlin, neue. Runs once.
async function applyMosqueFolderFix(database) {
  const id = "fix:2026-11-14-aziziye";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const now = Date.now();
  await database.batch([
    database.prepare(`UPDATE stories SET cats = 'events,berlin,neue' WHERE headline LIKE 'Einladung zur Eröffnung der Yeni Aziziye Camii%' AND approved_at > ?`).bind(now - 7 * 86400000),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now),
  ]);
}

// 2026-11-14 (owner approved the table): the 20 stories that were online were read one by one and put into the right folders.
const STORY_FOLDER_FIX = [
  ["Guten Abend Berlin%", "berlin"], ["Original Berliner Honig%", "angebote,essen"], ["Heute in der Geschichte%", "info,tuerkei"],
  ["Hadith des Tages%", "info"], ["Angebot: Monster Energy%", "angebote"], ["Herbststürme%", "eil,deutschland"],
  ["Eisbären Berlin%", "sport,berlin"], ["Technik-Panne%", "welt"], ["Berliner Behörden bestatten%", "berlin"],
  ["Zeit für dich%", "info"], ["ALBA Berlin%", "sport,berlin"], ["Volkstrauertag: Geschlossen%", "aemter,info"],
  ["Zugriffsprobleme bei Microsoft%", "eil,welt"], ["Einladung zur Gedenkveranstaltung%", "events,berlin"],
  ["Friseur für Damen%", "sponsoren,berlin"], ["Wettervorhersage Berlin%", "info,berlin"], ["Unser tiefes Beileid%", "tuerkei"],
  ["Berlin Handel%", "sponsoren,angebote"], ["Das Dungeon ist ein Gym%", "sport,berlin"], ["Toplu Sabah Namaz%", "info"],
];
async function applyStoryFolderFix(database) {
  const id = "fix:2026-11-14-story-folders";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const now = Date.now();
  await database.batch([
    ...STORY_FOLDER_FIX.map(([like, cats]) =>
      database.prepare(`UPDATE stories SET cats = ? WHERE headline LIKE ? AND status = 'approved' AND approved_at > ?`).bind(cats, like, now - 30 * 86400000)),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now),
  ]);
}

// 2026-11-14 (owner): "Tugra Gida" removed completely (no own photo, owner decision); "Info" stories get their own folder
// "info" (were sorted into "aemter") – stored folders of those stories are cleared, they are sorted again on reading. Runs once.
async function applyTugraInfoFix(database) {
  const id = "fix:2026-11-14-tugra-info";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  await ensureSponsorTables(database);
  const now = Date.now();
  await database.batch([
    database.prepare(`DELETE FROM sponsor_media WHERE ad_id = 'tugra-gida'`),
    database.prepare(`DELETE FROM ads WHERE id = 'tugra-gida'`),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES ('ad:tugra-gida', ?)`).bind(now), // never added again
    database.prepare(`UPDATE stories SET cats = '' WHERE LOWER(kind) = 'info' AND cats LIKE 'aemter%'`),
    database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now),
  ]);
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

// 2026-11-17 (owner): Terra Verde TEK and The Visit Coffee Roastery belong to My Kiez Berlin. They are marked "own"
// (one home place is kept for them, they still count for views and the monthly goal) and Terra Verde TEK, which was
// not online any more, is active again without an end date. Runs once.
async function applyOwnFirmsFix(database) {
  const id = "fix:2026-11-17-ownfirms";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const now = Date.now();
  const ops = [];
  for (const adId of ["terra-verde-tek", "the-visit"]) {
    const row = await database.prepare(`SELECT extra FROM ads WHERE id = ?`).bind(adId).first();
    if (!row) continue;
    let extra = {};
    try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
    extra.own = true;
    ops.push(database.prepare(`UPDATE ads SET extra = ?, updated_at = ? WHERE id = ?`).bind(JSON.stringify(extra), now, adId));
  }
  ops.push(database.prepare(`UPDATE ads SET active = 1, end_at = 0, updated_at = ? WHERE id = 'terra-verde-tek'`).bind(now));
  ops.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(ops);
}

// 2026-11-17 (owner): the Terra Verde TEK that is online is an ad made in the admin panel (own id), so "own" is set
// by name for every Terra Verde / The Visit ad. Nothing else is changed (plan, pictures, dates stay). Runs once.
async function applyOwnFirmsByNameFix(database) {
  const id = "fix:2026-11-17-ownfirms-name";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const now = Date.now();
  const { results } = await database.prepare(`SELECT id, extra FROM ads WHERE name LIKE 'Terra Verde%' OR name LIKE 'The Visit%'`).all();
  const ops = results.map((row) => {
    let extra = {};
    try { extra = JSON.parse(row.extra || "{}") || {}; } catch (e) { extra = {}; }
    extra.own = true;
    return database.prepare(`UPDATE ads SET extra = ?, updated_at = ? WHERE id = ?`).bind(JSON.stringify(extra), now, row.id);
  });
  ops.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(ops);
}

// 2026-11-17 (owner): "Büyük resimleri küçült" made 102 pictures white – the originals (JPEGs without end marker)
// could not be drawn in the browser. Every picture goes back to its original file (still in R2, nothing was deleted).
// The white -opt files stay in R2 unused. Runs once.
async function applyRestoreOptimizedFix(database) {
  const id = "fix:2026-11-17-restore-opt";
  if (await database.prepare(`SELECT id FROM seeds WHERE id = ?`).bind(id).first()) return;
  const now = Date.now();
  await database.prepare(`CREATE TABLE IF NOT EXISTS media_optimized (id TEXT, old_key TEXT, new_key TEXT, old_bytes INTEGER, new_bytes INTEGER, created_at INTEGER)`).run();
  const { results } = await database.prepare(`SELECT id, old_key, new_key, old_bytes FROM media_optimized`).all();
  const ops = results.map((r) => database
    .prepare(`UPDATE sponsor_media SET media_key = ?, bytes = ? WHERE id = ? AND media_key = ?`)
    .bind(r.old_key, Number(r.old_bytes) || 0, r.id, r.new_key));
  ops.push(database.prepare(`UPDATE media_optimized SET new_key = new_key || ' (restored)' WHERE new_key NOT LIKE '% (restored)'`));
  ops.push(database.prepare(`INSERT OR IGNORE INTO seeds (id, created_at) VALUES (?, ?)`).bind(id, now));
  await database.batch(ops);
}
