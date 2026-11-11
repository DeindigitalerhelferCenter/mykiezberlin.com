// Automatic replies (2026-11-11), German / Turkish / English. Sent from info@ or support@ (never a private address).
// Change the wording here; {name}, {company}, {package} … are filled in by fill().
const T = {
  werben: {
    de: {
      subject: "Willkommen bei My Kiez Berlin – Ihre Anfrage ist da",
      text: "Hallo {name},\n\nherzlich willkommen bei My Kiez Berlin und vielen Dank für Ihre Anfrage für {company}!\n\nGewähltes Paket: {package}\n\nSo geht es weiter:\n1. Wir prüfen Ihre Angaben.\n2. Wir melden uns innerhalb von 24 Stunden bei Ihnen.\n3. Nach der Zahlung schalten wir Ihre Anzeige in App und Webseite frei.\n\n{pay}Bei Fragen antworten Sie einfach auf diese E-Mail.\n\nViele Grüße\nIhr My Kiez Berlin Team",
      pay: "Falls Sie noch nicht bezahlt haben: Den sicheren Zahlungslink (Stripe) finden Sie auf der Seite nach dem Absenden.\n\n",
    },
    tr: {
      subject: "My Kiez Berlin'e hoş geldiniz – talebiniz bize ulaştı",
      text: "Merhaba {name},\n\nMy Kiez Berlin'e hoş geldiniz! {company} için gönderdiğiniz talep için teşekkür ederiz.\n\nSeçilen paket: {package}\n\nSonraki adımlar:\n1. Bilgilerinizi kontrol ediyoruz.\n2. 24 saat içinde size dönüş yapıyoruz.\n3. Ödemeden sonra reklamınızı uygulamada ve web sitesinde yayına alıyoruz.\n\n{pay}Sorularınız için bu e-postayı yanıtlamanız yeterli.\n\nSaygılarımızla\nMy Kiez Berlin Ekibi",
      pay: "Henüz ödeme yapmadıysanız: Güvenli ödeme linkini (Stripe) gönderdikten sonra açılan sayfada bulabilirsiniz.\n\n",
    },
    en: {
      subject: "Welcome to My Kiez Berlin – we received your request",
      text: "Hello {name},\n\nwelcome to My Kiez Berlin and thank you for your request for {company}!\n\nChosen package: {package}\n\nNext steps:\n1. We check your details.\n2. We get back to you within 24 hours.\n3. After payment your ad goes live in the app and on the website.\n\n{pay}If you have questions, simply reply to this e-mail.\n\nBest regards\nYour My Kiez Berlin team",
      pay: "If you have not paid yet: the secure payment link (Stripe) is shown on the page after sending.\n\n",
    },
  },
  support: {
    app: {
      de: ["Danke für Ihre Meldung – wir kümmern uns", "Hallo,\n\nvielen Dank für Ihre Meldung zu App oder Webseite. Wir haben sie erhalten und prüfen das Problem.\nSie bekommen so bald wie möglich eine Antwort.\n\nIhre Nachricht:\n{message}\n\nViele Grüße\nMy Kiez Berlin Support"],
      tr: ["Bildiriminiz için teşekkürler – ilgileniyoruz", "Merhaba,\n\nuygulama veya web sitesiyle ilgili bildiriminiz için teşekkür ederiz. Bildiriminiz bize ulaştı, sorunu inceliyoruz.\nEn kısa zamanda size cevap vereceğiz.\n\nMesajınız:\n{message}\n\nSaygılarımızla\nMy Kiez Berlin Destek"],
      en: ["Thank you for your report – we are on it", "Hello,\n\nthank you for your report about the app or website. We received it and are looking into the problem.\nYou will get an answer as soon as possible.\n\nYour message:\n{message}\n\nBest regards\nMy Kiez Berlin Support"],
    },
    sponsor: {
      de: ["Danke – wir prüfen die Angaben des Betriebs", "Hallo,\n\nvielen Dank für Ihren Hinweis zu {sponsor}. Wir prüfen Telefonnummer, Links und Angaben und korrigieren sie schnell.\n\nIhre Nachricht:\n{message}\n\nViele Grüße\nMy Kiez Berlin Support"],
      tr: ["Teşekkürler – işletme bilgilerini kontrol ediyoruz", "Merhaba,\n\n{sponsor} hakkındaki bildiriminiz için teşekkür ederiz. Telefon numarası, linkler ve bilgileri kontrol edip hızlıca düzelteceğiz.\n\nMesajınız:\n{message}\n\nSaygılarımızla\nMy Kiez Berlin Destek"],
      en: ["Thank you – we are checking the business details", "Hello,\n\nthank you for your note about {sponsor}. We will check phone number, links and details and correct them quickly.\n\nYour message:\n{message}\n\nBest regards\nMy Kiez Berlin Support"],
    },
    other: {
      de: ["Danke für Ihre Nachricht", "Hallo,\n\nvielen Dank für Ihre Nachricht. Wir haben sie erhalten und antworten Ihnen so bald wie möglich.\n\nIhre Nachricht:\n{message}\n\nViele Grüße\nMy Kiez Berlin"],
      tr: ["Mesajınız için teşekkürler", "Merhaba,\n\nmesajınız için teşekkür ederiz. Mesajınız bize ulaştı, en kısa zamanda size cevap vereceğiz.\n\nMesajınız:\n{message}\n\nSaygılarımızla\nMy Kiez Berlin"],
      en: ["Thank you for your message", "Hello,\n\nthank you for your message. We received it and will reply as soon as possible.\n\nYour message:\n{message}\n\nBest regards\nMy Kiez Berlin"],
    },
  },
  paid: {
    de: ["Zahlung erhalten – Ihr Paket ist aktiv", "Hallo {name},\n\nvielen Dank! Ihre Zahlung für {package} ist eingegangen.\nWir schalten Ihre Anzeige für {company} jetzt frei; sie erscheint in Kürze in App und Webseite.\n\nViele Grüße\nIhr My Kiez Berlin Team"],
    tr: ["Ödeme alındı – paketiniz aktif", "Merhaba {name},\n\nteşekkür ederiz! {package} için ödemeniz bize ulaştı.\n{company} reklamınızı şimdi yayına alıyoruz; kısa süre içinde uygulamada ve web sitesinde görünecek.\n\nSaygılarımızla\nMy Kiez Berlin Ekibi"],
    en: ["Payment received – your package is active", "Hello {name},\n\nthank you! We received your payment for {package}.\nWe are now activating the ad for {company}; it will appear in the app and on the website shortly.\n\nBest regards\nYour My Kiez Berlin team"],
  },
};

export const PACKAGE_NAMES = { s: "Kiez Basic (29 €)", m: "Kiez Plus (49 €)", l: "Kiez Premium (89 €)", banner: "Banner", gp: "Gründungspartner" };

export function lang(value) {
  const l = String(value || "").slice(0, 2).toLowerCase();
  return l === "tr" || l === "en" ? l : "de";
}

function fill(text, vars) {
  return String(text).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "").toString());
}

export function werbenReply(l, vars) {
  const t = T.werben[lang(l)];
  return { subject: t.subject, text: fill(t.text, { ...vars, pay: vars.payable ? t.pay : "" }) };
}

export function supportReply(l, topic, vars) {
  const t = (T.support[topic] || T.support.other)[lang(l)];
  return { subject: t[0], text: fill(t[1], vars) };
}

export function paidReply(l, vars) {
  const t = T.paid[lang(l)];
  return { subject: t[0], text: fill(t[1], vars) };
}
