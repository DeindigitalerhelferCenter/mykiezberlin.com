// 2026-11-25 (owner "metin tamam, UYGULA"): welcome for every new sponsor in 2 messages (DE + TR in one text).
// Message 1 = welcome to the family, message 2 = short guide (panel link, upload, days, share, support).
// E-mail is sent by the server; WhatsApp is opened ready-written in the admin (owner presses "send" himself –
// fully automatic WhatsApp would need the paid WhatsApp Business API).
import { PACKAGE_NAMES } from "./mail-templates.js";

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

  const text1 =
`🇩🇪 Willkommen in der My Kiez Berlin Familie, ${firm}!

${hiDe}

wir freuen uns sehr, Sie als Partner von My Kiez Berlin zu begrüßen. Ab sofort ist ${firm} für tausende Menschen in Berlin sichtbar – in unserer App, auf mykiezberlin.com und in unseren Kiez-Kanälen.

Ihr Paket: ${pack}${untilDe ? " · aktiv bis " + untilDe : ""}
Ihre Seite: ${page}

Unser Ziel ist einfach: Gemeinsam wachsen. Je mehr Ihr Kiez Sie kennt, desto stärker wird unsere Gemeinschaft – und umgekehrt.

In wenigen Minuten erhalten Sie eine zweite Nachricht mit Ihrem persönlichen Zugang und einer kurzen Anleitung.

Herzliche Grüße aus dem Kiez
Ihr My Kiez Berlin Team

————————————

🇹🇷 My Kiez Berlin ailesine hoş geldiniz, ${firm}!

${hiTr}

sizi My Kiez Berlin'in iş ortağı olarak aramızda görmekten büyük mutluluk duyuyoruz. ${firm} bugünden itibaren uygulamamızda, mykiezberlin.com'da ve Kiez kanallarımızda Berlin'deki binlerce kişiye görünür durumda.

Paketiniz: ${pack}${untilTr ? " · " + untilTr + " tarihine kadar aktif" : ""}
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
