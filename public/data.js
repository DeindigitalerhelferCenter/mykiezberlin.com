/**
 * My Kiez Berlin - Core Data and Application Logic
 * Exact replica of Android SampleData, ViewModel & Features
 */

// Berlin Kieze Database (24+ Bezirke & All Districts)
const BERLIN_KIEZE = [
  { id: "mitte", name: "Mitte", subtitle: "Regierung, Kunst & Alexanderplatz", population: "ca. 385.000", image: "assets/images/kiez_mitte.jpg", vibe: "Urban & Lebendig" },
  { id: "kreuzberg", name: "Kreuzberg", subtitle: "Kult-Kiez, Paul-Lincke-Ufer & Streetfood", population: "ca. 155.000", image: "assets/images/kiez_kreuzberg.jpg", vibe: "Bunt & Kreativ" },
  { id: "prenzlauerberg", name: "Prenzlauer Berg", subtitle: "Kollwitzplatz, Altbau & Cafékultur", population: "ca. 165.000", image: "assets/images/kiez_prenzlauerberg.jpg", vibe: "Gemütlich & Familiär" },
  { id: "friedrichshain", name: "Friedrichshain", subtitle: "Boxhagener Platz, RAW & Spree", population: "ca. 140.000", image: "assets/images/kiez_friedrichshain.jpg", vibe: "Szene & Ausgehen" },
  { id: "neukoelln", name: "Neukölln", subtitle: "Weserstraße, Tempelhofer Feld & Vielfalt", population: "ca. 330.000", image: "assets/images/kiez_neukoelln.jpg", vibe: "Dynamisch & Multikulti" },
  { id: "charlottenburg", name: "Charlottenburg", subtitle: "Ku'damm, Schloss & Savignyplatz", population: "ca. 130.000", image: "assets/images/kiez_charlottenburg.jpg", vibe: "Elegant & Klassisch" },
  { id: "wilmersdorf", name: "Wilmersdorf", subtitle: "Preußenpark, Fasanenplatz & Ruhe", population: "ca. 100.000", image: "assets/images/kiez_wilmersdorf.jpg", vibe: "Gediegen & Grün" },
  { id: "schoeneberg", name: "Schöneberg", subtitle: "Winterfeldtplatz, Regenbogenkiez & Akazienkiez", population: "ca. 125.000", image: "assets/images/kiez_schoeneberg.jpg", vibe: "Offen & Traditionsreich" },
  { id: "tempelhof", name: "Tempelhof", subtitle: "Freiheit Tempelhofer Feld & Hafen", population: "ca. 65.000", image: "assets/images/kiez_tempelhof.jpg", vibe: "Weite & Erholung" },
  { id: "wedding", name: "Wedding", subtitle: "Pankeufer, Sprengelkiez & Authentizität", population: "ca. 85.000", image: "assets/images/kiez_wedding.jpg", vibe: "Echt & Unverfälscht" },
  { id: "moabit", name: "Moabit", subtitle: "Arminiusmarkthalle, Spreebogen & Insel", population: "ca. 80.000", image: "assets/images/kiez_moabit.jpg", vibe: "Kiezig & Zentral" },
  { id: "tiergarten", name: "Tiergarten", subtitle: "Großer Tiergarten, Philharmonie & Zoo", population: "ca. 15.000", image: "assets/images/kiez_tiergarten.jpg", vibe: "Grüne Lunge" },
  { id: "tegel", name: "Tegel", subtitle: "Tegeler See, Greenwichpromenade & Wald", population: "ca. 37.000", image: "assets/images/hero_berlin.jpg", vibe: "Am Wasser" },
  { id: "spandau", name: "Spandau", subtitle: "Zitadelle, Havel & Altstadt Spandau", population: "ca. 245.000", image: "assets/images/hero_berlin.jpg", vibe: "Historisch & Wasser" },
  { id: "reinickendorf", name: "Reinickendorf", subtitle: "Schäfersee, Humboldt-Bibliothek & Kieze", population: "ca. 265.000", image: "assets/images/hero_berlin.jpg", vibe: "Wohnlich & Grün" },
  { id: "pankow", name: "Pankow", subtitle: "Schloss Schönhausen, Bürgerpark & Florakiez", population: "ca. 410.000", image: "assets/images/hero_berlin.jpg", vibe: "Grün & Kulturell" },
  { id: "treptow", name: "Treptow", subtitle: "Treptower Park, Insel der Jugend & Spree", population: "ca. 280.000", image: "assets/images/hero_berlin.jpg", vibe: "Entspannt am Wasser" },
  { id: "koepenick", name: "Köpenick", subtitle: "Müggelsee, Schloss & Hauptmann", population: "ca. 68.000", image: "assets/images/hero_berlin.jpg", vibe: "Maritime Idylle" },
  { id: "steglitz", name: "Steglitz", subtitle: "Schloßstraße, Botanischer Garten & Stadtpark", population: "ca. 75.000", image: "assets/images/hero_berlin.jpg", vibe: "Einkaufen & Natur" },
  { id: "zehlendorf", name: "Zehlendorf", subtitle: "Wannsee, Krumme Lanke & Villen", population: "ca. 60.000", image: "assets/images/hero_berlin.jpg", vibe: "Badeseen & Wald" },
  { id: "marzahn", name: "Marzahn", subtitle: "Gärten der Welt, Seilbahn & Wuhletal", population: "ca. 110.000", image: "assets/images/hero_berlin.jpg", vibe: "Weite & Parks" }
];

// Initial Real Stories
const DEFAULT_STORIES = [
  {
    id: "story_1",
    author: "Kiez-Team",
    kiez: "Kreuzberg",
    headline: "Neuer Wochenmarkt am Maybachufer",
    subtext: "Ab morgen startet der erweiterte Bauernmarkt mit regionalen Bioprodukten aus Brandenburg direkt am Kanal.",
    image: "assets/images/kiez_kreuzberg.jpg",
    isVideo: false,
    durationHours: 48,
    status: "approved",
    link: "https://www.berlin.de/events/volksfeste/"
  },
  {
    id: "story_2",
    author: "Kiez-Reporter",
    kiez: "Neukölln",
    headline: "Tempelhofer Feld Sonnenuntergang",
    subtext: "Tausende Berliner genießen den milden Herbstabend auf der Landebahn mit Musik und Rollschuhen.",
    image: "assets/images/kiez_neukoelln.jpg",
    isVideo: false,
    durationHours: 24,
    status: "approved",
    link: "https://www.berlin.de/events/volksfeste/"
  },
  {
    id: "story_3",
    author: "Mauerpark Verein",
    kiez: "Prenzlauer Berg",
    headline: "Kult-Flohmarkt am Mauerpark",
    subtext: "Jeden Sonntag Flohmarkt, Streetfood und das legendäre Amphitheater-Karaoke im Mauerpark.",
    image: "assets/images/event_mauerpark.jpg",
    isVideo: false,
    durationHours: 48,
    status: "approved",
    link: "https://www.berlin.de/events/volksfeste/"
  },
  {
    id: "story_4",
    author: "Berlin Event",
    kiez: "Mitte",
    headline: "Festival of Lights 2026",
    subtext: "Die weltberühmten Lichtprojektionen am Brandenburger Tor und Fernsehturm verzaubern die Hauptstadt.",
    image: "assets/images/quiz_brandenburg.jpg",
    isVideo: false,
    durationHours: 72,
    status: "approved",
    link: "https://www.berlin.de/events/volksfeste/"
  },
  {
    id: "story_5",
    author: "Kiez-Gastro",
    kiez: "Friedrichshain",
    headline: "Street Food Night Markthalle Neun",
    subtext: "Jeden Donnerstag Street Food Thursday mit Spezialitäten aus aller Welt und Craft Beer.",
    image: "assets/images/event_markthalle.jpg",
    isVideo: false,
    durationHours: 48,
    status: "approved",
    link: "https://www.berlin.de/events/volksfeste/"
  }
];

// Current Events (Updated from Berlin.de Volksfeste, Cleaned September)
const BERLIN_EVENTS = [
  {
    id: "event_lights",
    title: "Festival of Lights Berlin",
    dayLabel: "OKT",
    dateNum: "16",
    time: "19:00 - 00:00 Uhr",
    kiezName: "Mitte",
    price: "Kostenlos",
    isFree: true,
    category: "Lichtkunst & Spektakel",
    description: "Internationale Lichtkünstler verwandeln die Wahrzeichen Berlins wie Brandenburger Tor und TV-Turm in spektakuläre Kunstwerke.",
    image: "assets/images/quiz_brandenburg.jpg",
    link: "https://www.berlin.de/events/volksfeste/"
  },
  {
    id: "event_herbst",
    title: "Berliner Herbst-Rummel & Volksfest",
    dayLabel: "OKT",
    dateNum: "18",
    time: "14:00 - 22:00 Uhr",
    kiezName: "Reinickendorf / Wedding",
    price: "Eintritt frei",
    isFree: true,
    category: "Volksfest & Rummel",
    description: "Riesenrad, Autoscooter, Zuckerwatte und Spaß für die ganze Familie auf dem zentralen Festplatz Kurt-Schumacher-Damm.",
    image: "assets/images/hero_berlin.jpg",
    link: "https://www.berlin.de/events/volksfeste/"
  },
  {
    id: "event_jazz",
    title: "Jazzfest Berlin 2026",
    dayLabel: "NOV",
    dateNum: "05",
    time: "18:00 - 23:30 Uhr",
    kiezName: "Tiergarten / Charlottenburg",
    price: "ab 18 €",
    isFree: false,
    category: "Musik & Konzerte",
    description: "Eines der traditionsreichsten Jazzfestivals Europas mit Weltklasse-Musikern und intimen Kiez-Sessions.",
    image: "assets/images/event_jazz.jpg",
    link: "https://www.berlin.de/events/volksfeste/"
  },
  {
    id: "event_mauerpark",
    title: "Kult-Flohmarkt & Karaoke Mauerpark",
    dayLabel: "SO",
    dateNum: "Herbst",
    time: "10:00 - 18:00 Uhr",
    kiezName: "Prenzlauer Berg",
    price: "Kostenlos",
    isFree: true,
    category: "Markt & Live-Musik",
    description: "Der legendäre Berliner Sonntagsflohmarkt mit Vintage-Schätzen, Kiez-Gastro und Bearpit-Karaoke.",
    image: "assets/images/event_mauerpark.jpg",
    link: "https://www.berlin.de/events/volksfeste/"
  },
  {
    id: "event_weihnachten",
    title: "Berliner Weihnachtszauber & Kiezmärkte",
    dayLabel: "NOV",
    dateNum: "23",
    time: "11:00 - 22:00 Uhr",
    kiezName: "Mitte / Friedrichshain",
    price: "Kostenlos",
    isFree: true,
    category: "Winter- & Festzeit",
    description: "Glühwein, traditionelles Kunsthandwerk und Lichterglanz auf den schönsten Berliner Plätzen.",
    image: "assets/images/hero_berlin.jpg",
    link: "https://www.berlin.de/events/volksfeste/"
  }
];

// Quiz Questions
const QUIZ_QUESTIONS = [
  {
    id: "q1",
    question: "Welches Berliner Bauwerk ist mit 368 Metern das höchste Gebäude Deutschlands?",
    options: ["Berliner Dom", "Berliner Fernsehturm", "Funkturm Berlin", "Potsdamer Platz Tower"],
    correctIndex: 1,
    image: "assets/images/quiz_fernsehturm.jpg",
    explanation: "Der Berliner Fernsehturm am Alexanderplatz wurde 1969 eröffnet und ist mit 368 Metern das höchste Bauwerk Deutschlands."
  },
  {
    id: "q2",
    question: "Welcher Kiez ist berühmt für den Admiralbrücke-Sonnenuntergang und die Markthalle Neun?",
    options: ["Kreuzberg", "Charlottenburg", "Spandau", "Pankow"],
    correctIndex: 0,
    image: "assets/images/kiez_kreuzberg.jpg",
    explanation: "Kreuzberg (SO36 und Kreuzberg 61) ist weltberühmt für das bunte Treiben am Landwehrkanal und die Markthalle Neun."
  },
  {
    id: "q3",
    question: "Durch welches weltberühmte Berliner Tor zogen Napoleon und 1989 die Bürger beim Mauerfall?",
    options: ["Kottbusser Tor", "Brandenburger Tor", "Schlesisches Tor", "Frankfurter Tor"],
    correctIndex: 1,
    image: "assets/images/quiz_brandenburg.jpg",
    explanation: "Das Brandenburger Tor am Pariser Platz ist das Nationalsymbol für Freiheit und die Einheit Berlins."
  },
  {
    id: "q4",
    question: "Auf welchem ehemaligen Flughafen befindet sich heute Berlins größter innerstädtischer Volkspark?",
    options: ["Flughafen Tegel", "Flughafen Tempelhof", "Flughafen Schönefeld", "Flughafen Gatow"],
    correctIndex: 1,
    image: "assets/images/kiez_tempelhof.jpg",
    explanation: "Das Tempelhofer Feld umfasst über 300 Hektar Freifläche mitten in der Stadt für Sport, Grillen und Erholung."
  },
  {
    id: "q5",
    question: "Welcher Kiez hat das Schloss Charlottenburg und den traditionsreichen Kurfürstendamm?",
    options: ["Charlottenburg", "Wedding", "Marzahn", "Treptow"],
    correctIndex: 0,
    image: "assets/images/kiez_charlottenburg.jpg",
    explanation: "Charlottenburg ist der Inbegriff der City West mit dem prachtvollen Barockschloss der Hohenzollern."
  }
];

// Emergency Numbers & Official Police / Transit Portals
const EMERGENCY_DATA = [
  { name: "Polizei Notruf", number: "110", desc: "Bei akuter Gefahr, Verbrechen & Unfällen", icon: "bi-shield-fill-exclamation" },
  { name: "Feuerwehr & Rettungsdienst", number: "112", desc: "Bei Brand, medizinischen Notfällen & Lebensgefahr", icon: "bi-fire" },
  { name: "Ärztlicher Bereitschaftsdienst", number: "116 117", desc: "Kostenlose medizinische Hilfe bei Nacht & Wochenende", icon: "bi-heart-pulse-fill" },
  { name: "Giftnotruf Berlin", number: "030 19240", desc: "24h Giftnotruf Charité Berlin", icon: "bi-capsule" },
  { name: "BVG Kundenservice & Leitstelle", number: "030 19449", desc: "U-Bahn, Bus & Tram Auskunft", link: "https://www.bvg.de", icon: "bi-bus-front-fill" },
  { name: "S-Bahn Berlin Kundendialog", number: "030 29743333", desc: "S-Bahn Berlin Fahrplan & Infos", link: "https://sbahn.berlin", icon: "bi-train-front-fill" },
  { name: "Internetwache Polizei Berlin", number: "Online", desc: "Offizielle Online-Anzeige erstatten", link: "https://www.internetwache-polizei-berlin.de/", icon: "bi-globe" },
  { name: "Service-Portal Berlin (Bürgeramt)", number: "Online", desc: "Termine & Dienstleistungen", link: "https://service.berlin.de/standorte/buergeraemter/", icon: "bi-building" }
];
