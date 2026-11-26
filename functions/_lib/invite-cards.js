// 2026-11-26 (owner "UYGULA"): permanent invite cards – WhatsApp groups, WhatsApp channel, app, "work with us".
// Every card has a short link https://mykiezberlin.com/davet/<key> (picture preview in WhatsApp, then straight to the
// group / channel / app), pictures in /assets/davet/<key>-story.jpg, -post.jpg, -wide.jpg and a text DE + TR.
// Used by functions/davet/[key].js (redirect + preview) and /api/davet (list for the share page /davet/).
// WhatsApp never lets anybody join by itself: the link opens the group and the person taps "Join" once.
export const SITE = "https://mykiezberlin.com";
export const APK = "https://pub-2416186352064f76ad404097041588ba.r2.dev/MyKiezBerlin.com.apk";
export const WA_CHANNEL = "https://whatsapp.com/channel/0029VbADtpj5a241JELaiq0O";

const group = (key, kiez, url, pic) => ({
  key, kind: "group", target: url, pic,
  title_de: `WhatsApp-Gruppe ${kiez}`, title_tr: `${kiez} WhatsApp grubu`,
  sub_de: `News, Tipps & Angebote aus ${kiez === "Ganz Berlin" ? "ganz Berlin" : kiez} – kostenlos`,
  sub_tr: `${kiez === "Ganz Berlin" ? "Tüm Berlin'den" : kiez + "'den"} haberler, ipuçları ve fırsatlar – ücretsiz`,
  cta_de: "Jetzt beitreten", cta_tr: "Hemen katıl",
});

export const INVITE_CARDS = [
  group("berlin", "Ganz Berlin", "https://chat.whatsapp.com/GCPuN7MEzEVLjutfKIYRqb", "file_1795564632787.png"),
  group("neukoelln", "Neukölln", "https://chat.whatsapp.com/EiCUYfwfQYr9eve4WT5STZ", "file_1795564489135.png"),
  group("kreuzberg", "Kreuzberg", "https://chat.whatsapp.com/JDUKCyyyyY6HsxclTEhdDP", "file_1795566583349.png"),
  group("wedding", "Wedding", "https://chat.whatsapp.com/G0yav64xcdyFd5rLztmsiV", "file_1795567123943.png"),
  group("moabit", "Moabit", "https://chat.whatsapp.com/Be6LDHBHC6K5YqM8acT3Cs", "file_1795567012786.png"),
  group("spandau", "Spandau", "https://chat.whatsapp.com/IO6E8If42yWKPgoPsPdV8z", "file_1795564746147.png"),
  {
    key: "kanal", kind: "channel", target: WA_CHANNEL, pic: "file_1795567120078.png",
    title_de: "Unser WhatsApp-Kanal", title_tr: "WhatsApp kanalımız",
    sub_de: "Berlin-News jeden Tag – auf Deutsch & Türkisch", sub_tr: "Her gün Berlin haberleri – Almanca ve Türkçe",
    cta_de: "Kanal folgen", cta_tr: "Kanalı takip et",
  },
  {
    key: "app", kind: "app", target: APK, targetOther: SITE + "/", pic: "file_1795565920921.png",
    title_de: "Die App My Kiez Berlin", title_tr: "My Kiez Berlin uygulaması",
    sub_de: "Kostenlos · Stories, News, Kiez-Angebote & Notrufe", sub_tr: "Ücretsiz · Hikâyeler, haberler, mahalle fırsatları ve acil numaralar",
    cta_de: "App laden", cta_tr: "Uygulamayı indir",
  },
  {
    key: "werben", kind: "business", target: SITE + "/werben", pic: "file_1795565099840.png",
    title_de: "Ihr Betrieb bei My Kiez Berlin", title_tr: "İşletmeniz My Kiez Berlin'de",
    sub_de: "Sichtbar im Kiez: Web, App, Stories & Social Media", sub_tr: "Mahallede görünür olun: web, uygulama, hikâyeler ve sosyal medya",
    cta_de: "Partner werden", cta_tr: "Ortağımız olun",
  },
  // 2026-11-26 (owner: "ayrı ayrı – muhabir veya gönüllü arayan bir kart da olsun")
  {
    key: "muhabir", kind: "reporter", target: SITE + "/?tab=reporter", pic: "file_1795567115125.png",
    title_de: "Werde Kiez-Reporter", title_tr: "Mahalle muhabiri ol",
    sub_de: "Was passiert in deinem Kiez? Schreib es – ganz Berlin liest mit", sub_tr: "Mahallende ne oluyor? Yaz – tüm Berlin okusun",
    cta_de: "Jetzt schreiben", cta_tr: "Hemen yaz",
  },
  {
    key: "gonullu", kind: "volunteer", pic: "file_1795564834618.png",
    target: "https://wa.me/4917640556109?text=" + encodeURIComponent("Hallo My Kiez Berlin, ich möchte ehrenamtlich mitmachen. · Merhaba My Kiez Berlin, gönüllü olarak katılmak istiyorum."),
    title_de: "Mach mit – ehrenamtlich", title_tr: "Gönüllü ol – bize katıl",
    sub_de: "Fotos, Texte, Übersetzen, Verteilen – jede Hilfe zählt", sub_tr: "Fotoğraf, yazı, çeviri, dağıtım – her yardım değerli",
    cta_de: "Melde dich", cta_tr: "Bize yaz",
  },
];

export function inviteCard(key) {
  return INVITE_CARDS.find((c) => c.key === key) || null;
}

/** Ready text (DE + TR) to send with the picture.
 *  2026-11-26 (owner "UYGULA 1-5"): the link comes FIRST – WhatsApp Status / Instagram hide the rest behind "mehr".
 *  Instagram + TikTok never make links in a caption clickable -> the "Link in Bio" line. */
export function inviteText(c) {
  const link = `${SITE}/davet/${c.key}`;
  return `👉 ${link}\n${c.title_de} · ${c.title_tr}\n\n🇩🇪 ${c.sub_de}. ${c.cta_de}: ${link}\n🇹🇷 ${c.sub_tr}. ${c.cta_tr}: ${link}\n\n🔗 Link in Bio · Link profilde: mykiezberlin.com/davet\n📍 My Kiez Berlin`;
}

/** 2026-11-26 (owner "UYGULA 1"): text for a WhatsApp Status with the LINK ONLY – WhatsApp shows the card picture as
 *  a big preview and that preview is clickable (a link inside a picture caption is not). */
export function statusText(c) {
  return `👉 ${SITE}/davet/${c.key}\n${c.title_tr} · ${c.title_de}`;
}

/** 2026-11-26 (owner "UYGULA 4"): one-time welcome before the group / channel / app opens. */
export function welcomeOf(c) {
  const hint = {
    group: ["Gleich öffnet sich WhatsApp – tippe einmal auf „Gruppe beitreten“.", "Birazdan WhatsApp açılıyor – bir kez „Gruba katıl“a dokun."],
    channel: ["Gleich öffnet sich der Kanal – tippe auf „Folgen“.", "Birazdan kanal açılıyor – „Takip et“e dokun."],
    app: ["Der Download startet gleich (Android). Danach die Datei öffnen und installieren.", "İndirme birazdan başlıyor (Android). Sonra dosyayı açıp yükle."],
    business: ["Gleich siehst du unsere Pakete für Betriebe.", "Birazdan işletmeler için paketlerimizi göreceksin."],
    reporter: ["Gleich öffnet sich der Reporter-Bereich – schreib los!", "Birazdan muhabir bölümü açılıyor – yazmaya başla!"],
    volunteer: ["Gleich öffnet sich WhatsApp mit einer fertigen Nachricht an uns – einfach senden.", "Birazdan WhatsApp bize hazır bir mesajla açılıyor – sadece gönder."],
  }[c.kind] || ["", ""];
  return {
    title_de: "Willkommen bei My Kiez Berlin!", title_tr: "My Kiez Berlin'e hoş geldin!",
    line_de: `${c.title_de} – ${c.sub_de}.`, line_tr: `${c.title_tr} – ${c.sub_tr}.`, hint_de: hint[0], hint_tr: hint[1],
  };
}

export function publicCard(c) {
  return {
    key: c.key, kind: c.kind, title_de: c.title_de, title_tr: c.title_tr, sub_de: c.sub_de, sub_tr: c.sub_tr,
    cta_de: c.cta_de, cta_tr: c.cta_tr, link: `${SITE}/davet/${c.key}`, text: inviteText(c), status: statusText(c),
    story: `/assets/davet/${c.key}-story.jpg`, post: `/assets/davet/${c.key}-post.jpg`, wide: `/assets/davet/${c.key}-wide.jpg`,
  };
}
