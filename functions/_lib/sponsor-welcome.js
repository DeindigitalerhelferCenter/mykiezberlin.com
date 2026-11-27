// 2026-11-25 (owner "metin tamam, UYGULA"): welcome for every new sponsor in 2 messages (DE + TR in one text).
// Message 1 = welcome to the family, message 2 = short guide (panel link, upload, days, share, support).
// E-mail is sent by the server; WhatsApp is opened ready-written in the admin (owner presses "send" himself –
// fully automatic WhatsApp would need the paid WhatsApp Business API).
import { PACKAGE_NAMES } from "./mail-templates.js";
import { BF_END, BF_FREE_MONTHS } from "./blackfriday.js";

// 2026-11-25 (owner): the package line must also say the campaign – 3 months free, then the normal monthly price
const PRICE = { s: 29, m: 49, l: 89 };
// owner 2026-11-25 (B): 3 months intro price after the free months – Basic/Plus 19 €, Premium 49 €
const INTRO = { s: 19, m: 19, l: 49 };
function offerLines(ad) {
  const p = PRICE[ad.plan];
  if (!p) return { de: "", tr: "" };
  if (Date.now() <= BF_END || ad.plan_offer === "bf") return {
    de: `
🎁 Black-Friday-Aktion: Die ersten ${BF_FREE_MONTHS} Monate sind für Sie KOSTENLOS.
Danach 3 Monate Aktionspreis ${INTRO[ad.plan]} € pro Monat, dann ${p} € pro Monat – jederzeit monatlich kündbar.`,
    tr: `
🎁 Black Friday kampanyası: İlk ${BF_FREE_MONTHS} ay sizin için ÜCRETSİZ.
Sonraki 3 ay kampanya fiyatı aylık ${INTRO[ad.plan]} €, ardından aylık ${p} € – her ay iptal edilebilir.`,
  };
  return { de: `
Startpreis: 3 Monate ${INTRO[ad.plan]} € pro Monat, danach ${p} € pro Monat – monatlich kündbar.`, tr: `
Başlangıç fiyatı: 3 ay aylık ${INTRO[ad.plan]} €, sonra aylık ${p} € – her ay iptal edilebilir.` };
}

export const SUPPORT_MAIL = "support@mykiezberlin.com";
export const SUPPORT_WA = "+49 176 40556109";
const SITE = "https://mykiezberlin.com";

function day(ts, loc) {
  if (!ts) return "";
  try { return new Date(Number(ts)).toLocaleDateString(loc, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Berlin" }); } catch (e) { return ""; }
}

/** Returns { subject1, text1, subject2, text2 } for an ad row (ads table) and its panel link. */
export function welcomeTexts(ad, link, contactName = "") {
  const firm = ad.name || "";
  const pack = PACKAGE_NAMES[ad.plan] || ad.plan || "";
  const untilDe = day(ad.end_at, "de-DE"), untilTr = day(ad.end_at, "tr-TR");
  const hiDe = contactName ? `Liebe/r ${contactName},` : "Liebes Team von " + firm + ",";
  const hiTr = contactName ? `Sayın ${contactName},` : "Değerli " + firm + " ekibi,";
  const page = `${SITE}/s/${encodeURIComponent(ad.id)}`;
  const offer = offerLines(ad);

  const text1 =
`🇩🇪 Willkommen in der My Kiez Berlin Familie, ${firm}!

${hiDe}

wir freuen uns sehr, Sie als Partner von My Kiez Berlin zu begrüßen. Ab sofort ist ${firm} für tausende Menschen in Berlin sichtbar – in unserer App, auf mykiezberlin.com und in unseren Kiez-Kanälen.

Ihr Paket: ${pack.replace(/ \(\d+ €\)/, "")}${untilDe ? " · aktiv bis " + untilDe : ""}${offer.de}
Ihre Seite: ${page}

Unser Ziel ist einfach: Gemeinsam wachsen. Je mehr Ihr Kiez Sie kennt, desto stärker wird unsere Gemeinschaft – und umgekehrt.

In wenigen Minuten erhalten Sie eine zweite Nachricht mit Ihrem persönlichen Zugang und einer kurzen Anleitung.

Herzliche Grüße aus dem Kiez
Ihr My Kiez Berlin Team

————————————

🇹🇷 My Kiez Berlin ailesine hoş geldiniz, ${firm}!

${hiTr}

sizi My Kiez Berlin'in iş ortağı olarak aramızda görmekten büyük mutluluk duyuyoruz. ${firm} bugünden itibaren uygulamamızda, mykiezberlin.com'da ve Kiez kanallarımızda Berlin'deki binlerce kişiye görünür durumda.

Paketiniz: ${pack.replace(/ \(\d+ €\)/, "")}${untilTr ? " · " + untilTr + " tarihine kadar aktif" : ""}${offer.tr}
Sayfanız: ${page}

Hedefimiz basit: Birlikte büyümek. Mahalleniz sizi ne kadar tanırsa topluluğumuz da o kadar güçlenir.

Birkaç dakika içinde kişisel giriş linkinizi ve kısa kullanım kılavuzunu içeren ikinci mesajımız gelecek.

Kiez'den sevgiyle,
My Kiez Berlin Ekibi`;

  const text2 =
`🇩🇪 Ihr persönlicher Zugang – so einfach geht's

🔑 Ihr Sponsor-Panel (nur für Sie, bitte nicht weitergeben):
${link}

In 3 Schritten:
1️⃣ Bilder & Videos hochladen – "📁 Bilder / Videos auswählen" (auch mehrere oder einen ganzen Ordner auf einmal)
2️⃣ Tage wählen – wie lange Ihr Beitrag in den Sponsor-Stories bleibt
3️⃣ Teilen – "📤 Teilen" schickt Bild/Video + Link direkt an Ihre Kunden (WhatsApp, Instagram, Telegram …)

🖼️ Titelbild & Logo: im Panel unter "Hauptbilder" – "🔄 Ändern". Die Änderung ist sofort online.
✏️ Texte, Adresse, Öffnungszeiten, Telefon & Links ändern Sie ebenfalls im Panel.

🎬 Kurze Video-Anleitung (45 Sek.): ${SITE}/anleitung/?lang=de

💡 Unser Tipp: Teilen Sie Ihre My Kiez Seite mit Ihren Kunden und hängen Sie unser QR-Plakat in Ihrem Geschäft auf – so wachsen wir gemeinsam, und Sie erscheinen öfter vorne auf der Startseite.

🆘 Hilfe: ${SUPPORT_MAIL} · WhatsApp ${SUPPORT_WA}

————————————

🇹🇷 Kişisel girişiniz – işte bu kadar kolay

🔑 Sponsor paneliniz (sadece size özel, lütfen paylaşmayın):
${link}

3 adımda:
1️⃣ Resim ve video yükleyin – "📁 Resim / video seç" (birden fazla dosya veya tüm klasör tek seferde)
2️⃣ Gün seçin – paylaşımınız sponsor story'lerinde kaç gün kalsın
3️⃣ Paylaşın – "📤 Paylaş" butonu resmi/videoyu linkle birlikte doğrudan müşterilerinize gönderir (WhatsApp, Instagram, Telegram …)

🖼️ Kapak resmi ve logo: panelde "Ana tanıtım resimleri" – "🔄 Değiştir". Değişiklik hemen sitede görünür.
✏️ Metinleri, adresi, çalışma saatlerini, telefonu ve linkleri de panelden değiştirebilirsiniz.

🎬 Kısa video kılavuz (45 sn.): ${SITE}/anleitung/?lang=tr

💡 Önerimiz: My Kiez sayfanızı müşterilerinizle paylaşın ve QR afişimizi dükkânınıza asın – böylece birlikte büyürüz ve ana sayfada daha sık öne çıkarsınız.

🆘 Destek: ${SUPPORT_MAIL} · WhatsApp ${SUPPORT_WA}

My Kiez Berlin`;

  return {
    subject1: `Willkommen in der My Kiez Berlin Familie · Ailemize hoş geldiniz – ${firm}`,
    text1,
    subject2: `Ihr Sponsor-Zugang & Anleitung · Sponsor girişiniz ve kılavuz – ${firm}`,
    text2,
  };
}

// ---- 2026-11-27 (owner "UYGULA 1-7, b evet"): message 3 = share kit for WhatsApp & social media (every sponsor) ----
// Sponsor page link first (WhatsApp shows the big preview picture), ready share text DE + TR, one-tap share links
// (WhatsApp, Facebook, Telegram), Instagram/TikTok: save the picture + "link in bio", QR poster, monthly report.
/** Ready text a sponsor sends to customers / posts in a WhatsApp Status, Instagram, Facebook … (link first). */
export function shareTextOf(ad) {
  const firm = ad.name || "";
  const page = `${SITE}/s/${encodeURIComponent(ad.id)}`;
  return `👉 ${page}\n${firm} – jetzt auf My Kiez Berlin · artık My Kiez Berlin'de!\n\n🇩🇪 Alle Infos, Angebote & Kontakt auf unserer Seite – kostenlos in der App My Kiez Berlin.\n🇹🇷 Tüm bilgiler, fırsatlar ve iletişim sayfamızda – My Kiez Berlin uygulamasında ücretsiz.\n\n📍 My Kiez Berlin · mykiezberlin.com`;
}

/** Message 3. pic = picture URL to share (Kiez-Tipp card) or "" (then the page link preview shows the picture). */
export function shareKitText(ad, pic = "") {
  const firm = ad.name || "";
  const page = `${SITE}/s/${encodeURIComponent(ad.id)}`;
  const share = shareTextOf(ad);
  const wa = `https://wa.me/?text=${encodeURIComponent(share)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(page)}`;
  const tg = `https://t.me/share/url?url=${encodeURIComponent(page)}&text=${encodeURIComponent(firm + " – My Kiez Berlin")}`;
  const qr = `${SITE}/qr-plakat.html?s=${encodeURIComponent(ad.id)}`;
  const text3 =
`🇩🇪 Ihr Paket zum Teilen – WhatsApp & Social Media

Je mehr Ihre Kunden Ihre My Kiez Seite sehen, desto mehr bringt Ihnen Ihr Paket. Alles ist fertig – nur noch teilen:

📍 Ihre Seite: ${page}
${pic ? `🖼️ Ihr Bild zum Teilen (speichern & posten): ${pic}\n` : ""}
📤 Mit einem Tipp teilen:
💬 WhatsApp (Chat, Gruppe oder Status): ${wa}
📘 Facebook: ${fb}
✈️ Telegram: ${tg}
📸 Instagram & TikTok: Bild speichern, als Story/Beitrag posten und den Link ${page} in die Bio oder als Link-Sticker setzen.

✍️ Fertiger Text zum Kopieren (Link steht vorne, dann ist er im WhatsApp-Status anklickbar):
————
${share}
————

🪧 QR-Plakat zum Ausdrucken (für Ihr Schaufenster / Ihre Kasse): ${qr}
📊 Monatsbericht: Am Monatsende bekommen Sie von uns einen Bericht mit Ihren Aufrufen und Klicks.

🆘 Hilfe: ${SUPPORT_MAIL} · WhatsApp ${SUPPORT_WA}

————————————

🇹🇷 Paylaşım paketiniz – WhatsApp ve sosyal medya

Müşterileriniz My Kiez sayfanızı ne kadar çok görürse paketiniz size o kadar çok kazandırır. Her şey hazır – sadece paylaşın:

📍 Sayfanız: ${page}
${pic ? `🖼️ Paylaşım resminiz (kaydedip paylaşın): ${pic}\n` : ""}
📤 Tek dokunuşla paylaşın:
💬 WhatsApp (sohbet, grup veya durum): ${wa}
📘 Facebook: ${fb}
✈️ Telegram: ${tg}
📸 Instagram ve TikTok: resmi kaydedin, hikâye/gönderi olarak paylaşın ve ${page} linkini biyografinize veya link çıkartmasına ekleyin.

✍️ Kopyalamak için hazır metin (link başta – böylece WhatsApp durumunda tıklanabilir):
————
${share}
————

🪧 Yazdırmak için QR afişi (vitrininize / kasanıza): ${qr}
📊 Aylık rapor: Her ay sonunda görüntülenme ve tıklamalarınızı gösteren bir rapor gönderiyoruz.

🆘 Destek: ${SUPPORT_MAIL} · WhatsApp ${SUPPORT_WA}

My Kiez Berlin`;
  return { subject3: `Ihr Paket zum Teilen · Paylaşım paketiniz – ${firm}`, text3, share };
}
