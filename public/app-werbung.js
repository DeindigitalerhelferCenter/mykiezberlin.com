/**
 * Advertising on the web app, identical to the Android app:
 * - home: sponsor ads from /api/ads (or example places) and the S/M/L packages instead of the business list
 * - the 18 sample businesses live under "Gastronomie / Yeme & İçme"
 * - unverified businesses show no rating, carry a "not verified" label and a "claim your listing" link
 */

const AD_PACKAGES = [
  { size: "s", name: ["Klein", "Küçük"], price: 29, tag: ["Sichtbar in deinem Kiez", "Mahallende görün"], points: [["Ganz oben in deinem Kiez und deiner Kategorie", "Mahallende ve kategorinde en üstte"], ["Gelb markiert, als Anzeige gekennzeichnet", "Sarı işaretli, reklam olarak etiketli"], ["Eigener Gutschein im Bereich „Gutscheine“", "„Kuponlar“ bölümünde kendi kuponun"]] },
  { size: "m", name: ["Mittel", "Orta"], price: 49, tag: ["Mehr Kunden aus ganz Berlin", "Tüm Berlin'den müşteri"], points: [["Alles aus Klein", "Küçük paketteki her şey"], ["Zusätzlich oben in der Berlin-weiten Liste", "Ek olarak tüm Berlin listesinde üstte"]], recommended: true },
  { size: "l", name: ["Groß", "Büyük"], price: 89, tag: ["Maximale Sichtbarkeit", "En yüksek görünürlük"], points: [["Alles aus Mittel", "Orta paketteki her şey"], ["Zusätzlich als Sponsor-Karte auf der Startseite und im Listenfluss", "Ek olarak ana sayfada ve liste arasında sponsor kartı"]] },
];

let homeAds = [];

// Paused sponsors (2026-11-11): hidden for now, data kept – "Dein Finanzen Helfer" comes back in December 2026.
const PAUSED_SPONSOR_IDS = ["deinfinanzenhelfer"];
for (let i = SPONSORS.length - 1; i >= 0; i--) if (PAUSED_SPONSOR_IDS.includes(SPONSORS[i].id)) SPONSORS.splice(i, 1);
let homeAdsLoaded = false;
const trackedAds = new Set();

// Ratings of unverified sample businesses are hidden (the data itself stays unchanged).
BUSINESSES.forEach((b) => {
  if (b.verified) return;
  b.unverified = true;
  b.hiddenRating = b.rating;
  b.hiddenReviews = b.reviewsCount;
  b.rating = 0;
  b.reviewsCount = 0;
});

// Same for the sample food spots: their ratings are not verified (data unchanged).
FOOD_SPOTS.forEach((f) => {
  if (f.verified) return;
  f.unverified = true;
  f.hiddenRating = f.rating;
  f.hiddenReviews = f.reviewsCount;
  f.rating = 0;
  f.reviewsCount = 0;
});

function werbenUrl(size, claim) {
  const params = new URLSearchParams({ lang: currentLanguage === "tr" ? "tr" : currentLanguage === "en" ? "en" : "de" });
  if (size) params.set("size", size);
  if (claim) params.set("claim", claim);
  return `/werben?${params}`;
}

function adText(ad, key) {
  const lang = currentLanguage === "tr" ? "tr" : currentLanguage === "en" ? "en" : "de";
  return ad[`${key}_${lang}`] || ad[`${key}_de`] || "";
}

function trackAds(kind, ids) {
  if (!ids.length) return;
  fetch("/api/ads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, ids }), keepalive: true }).catch(() => {});
}

function adClick(id) {
  trackAds("click", [id]);
}

async function loadHomeAds() {
  try {
    const [home, slider] = await Promise.all([
      fetch("/api/ads?place=home").then((r) => (r.ok ? r.json() : { ads: [] })),
      fetch("/api/ads?place=slider").then((r) => (r.ok ? r.json() : { ads: [] })),
    ]);
    homeAds = home.ads || [];
    window.mkAdRegistry = window.mkAdRegistry || {};
    homeAds.concat(slider.ads || []).forEach((a) => { window.mkAdRegistry[a.id] = a; }); // contact sheet (sponsor-info.js)
    // Server sponsors come first in the sponsor strip; the built-in ones stay behind them.
    (slider.ads || []).slice().reverse().forEach((ad) => {
      if (SPONSORS.some((s) => s.id === ad.id)) return;
      SPONSORS.unshift({ id: ad.id, name: ad.name, drawableRes: ad.image || "assets/images/mykiez_logo.png", headlineDe: ad.headline_de || ad.name, headlineTr: ad.headline_tr || ad.headline_de || ad.name, linkWeb: ad.link_web || (ad.link_ig || "https://mykiezberlin.com"), serverAd: true });
    });
  } catch (e) {
    homeAds = [];
  }
  homeAdsLoaded = true;
  if (currentTab === "home") renderTabContent();
}

function adCardHtml(ad) {
  const link = ad.link_web || ad.link_ig || (ad.link_wa ? `https://wa.me/${ad.link_wa.replace(/[^\d]/g, "")}` : "") || (ad.link_tel ? `tel:${ad.link_tel}` : "");
  return `
    <a class="card-item ext-sponsor mkb-ad" data-ad="${esc(ad.id)}" href="${safeUrl(link || werbenUrl())}" target="_blank" rel="noopener sponsored" onclick="adClick(${jsArg(ad.id)})">
      <span class="ext-ad-label">Anzeige</span>
      ${ad.image ? `<img src="${safeUrl(ad.image)}" alt="${esc(ad.name)}" class="ext-sponsor-img">` : ""}
      <div class="card-body">
        <div class="card-title">${esc(ad.name)}</div>
        <div class="card-subtitle">${esc(adText(ad, "headline"))}</div>
        ${adText(ad, "cta") ? `<span class="chip-btn active" style="margin-top: 8px; display: inline-block;">${esc(adText(ad, "cta"))} →</span>` : ""}
      </div>
    </a>`;
}

function exampleAdHtml(index) {
  const examples = [
    [tr("Dein Betrieb hier", "İşletmen burada"), tr("Sponsor-Karte auf der Startseite – im Paket Groß enthalten.", "Ana sayfada sponsor kartı – Büyük pakete dahil."), "l"],
    [tr("Deine Anzeige im Kiez", "Mahallende reklamın"), tr("Banner mit Link, WhatsApp- oder Anruf-Button.", "Link, WhatsApp veya arama butonlu banner."), "banner"],
  ][index];
  return `
    <a class="card-item mkb-ad mkb-ad-example" href="${werbenUrl(examples[2])}">
      <span class="ext-ad-label">${esc(tr("Beispiel", "Örnek"))}</span>
      <div class="card-body">
        <div class="card-title">📣 ${esc(examples[0])}</div>
        <div class="card-subtitle">${esc(examples[1])}</div>
        <span class="chip-btn active" style="margin-top: 8px; display: inline-block;">${esc(tr("Jetzt werben", "Şimdi reklam ver"))} →</span>
      </div>
    </a>`;
}

function packagesHtml() {
  const t = (pair) => (currentLanguage === "tr" ? pair[1] : pair[0]);
  return `
    <div class="mkb-packages">
      ${AD_PACKAGES.map((p) => `
        <a class="mkb-pk ${p.recommended ? "hl" : ""}" href="${werbenUrl(p.size)}">
          ${p.recommended ? `<span class="mkb-badge">${esc(tr("Empfohlen", "Önerimiz"))}</span>` : ""}
          <b>${esc(t(p.name))}</b>
          <small>${esc(t(p.tag))}</small>
          <span class="mkb-price">${p.price} €<small>${esc(tr("/Monat", "/ay"))}</small></span>
          <span class="mkb-start"><i class="bi bi-stars" aria-hidden="true"></i> ${esc(tr("Start: 3 Monate nur 19 €/Monat", "Başlangıç: ilk 3 ay sadece 19 €/ay"))}</span>
          <ul>${p.points.map((x) => `<li>${esc(t(x))}</li>`).join("")}</ul>
          <span class="chip-btn active">${esc(tr("Paket wählen", "Paketi seç"))} →</span>
        </a>`).join("")}
    </div>`;
}

function homeAdsSectionHtml() {
  const ads = homeAds.length ? homeAds.map(adCardHtml).join("") : [0, 1].map(exampleAdHtml).join("");
  const fresh = homeAds.map((a) => a.id).filter((id) => !trackedAds.has(id));
  fresh.forEach((id) => trackedAds.add(id));
  setTimeout(() => trackAds("imp", fresh), 0);
  return `
    <div class="ext-row" style="margin-top: 16px; align-items: center;">
      <h3 class="ext-subheading" style="margin: 0;">${esc(tr("Sponsoren & Partner", "Sponsorlar & Partnerler"))}</h3>
      <a class="chip-btn" href="${werbenUrl()}">${esc(tr("Werben", "Reklam ver"))}</a>
    </div>
    ${ads}
    <h3 class="ext-subheading" style="margin-top: 16px;">${esc(tr("Pakete für Betriebe", "İşletme paketleri"))}</h3>
    ${packagesHtml()}
    <a class="btn-primary ext-cta" href="${werbenUrl()}"><i class="bi bi-send-fill" aria-hidden="true"></i> ${esc(tr("Jetzt werben – Anfrage senden", "Şimdi reklam ver – talep gönder"))}</a>`;
}

// Home: everything as before, but the business list is replaced by sponsors and packages.
renderHomeTab = function (container) {
  container.innerHTML = `
    ${mansetHtml()}
    ${renderSponsorCard()}
    ${quickButtons()}
    ${kiezScroller()}
    ${homeAdsSectionHtml()}`;
};

// "Gastronomie / Yeme & İçme": food spots plus the Kiez businesses that used to sit on the home page.
const baseFoodTabWerbung = EXTRA_TABS.food || renderFoodTab;
EXTRA_TABS.food = function (container) {
  baseFoodTabWerbung(container);
  const list = visibleBusinesses();
  const views = [["card", "bi-grid-fill", tr("Kacheln", "Kart")], ["list", "bi-list-ul", tr("Liste", "Liste")], ["map", "bi-map-fill", tr("Karte", "Harita")]];
  let content = list.map((b) => renderPlaceCard(b, "business")).join("");
  if (businessViewMode === "list") content = list.map(renderCompactBusiness).join("");
  if (businessViewMode === "map") content = `<div id="ext-map" class="ext-map"></div>`;
  container.insertAdjacentHTML("beforeend", `
    <div class="ext-row" style="margin-top: 20px; align-items: center;">
      <h3 class="ext-subheading" style="margin: 0;">🏪 ${esc(tr("Kiez-Betriebe", "Mahalle İşletmeleri"))} (${list.length})</h3>
      <button class="chip-btn active" onclick="openBusinessForm()"><i class="bi bi-plus-lg"></i> ${esc(tr("Betrieb eintragen", "İşletme ekle"))}</button>
    </div>
    ${chips([["all", tr("Alle", "Tümü")], ...[...new Set(BUSINESSES.map(businessCategory))].map((c) => [c, c])], activeBusinessCategory, "setBusinessCategory")}
    ${chips([["all", tr("Alle Kieze", "Tüm Kiezler")], ...[...new Set(BUSINESSES.map((b) => b.kiezName))].map((k) => [k, k])], filters.kiez, "setKiezFilter")}
    <div class="ext-views">${views.map(([mode, icon, label]) => `<button class="${businessViewMode === mode ? "on" : ""}" onclick="setBusinessView('${mode}')"><i class="bi ${icon}"></i> ${esc(label)}</button>`).join("")}</div>
    ${content}`);
  if (businessViewMode === "map") showMap(list);
};

function unverifiedHtml(p) {
  return `
    <div class="mkb-unverified">
      <span>ℹ️ ${esc(tr("Angaben nicht verifiziert · noch nicht bewertet", "Bilgiler doğrulanmadı · henüz değerlendirilmedi"))}</span>
      <a href="${werbenUrl("s", p.name)}">${esc(tr("Dein Betrieb? Eintrag übernehmen", "Bu senin işletmen mi? Kaydını sahiplen"))} →</a>
    </div>`;
}

const baseRenderPlaceCard = renderPlaceCard;
renderPlaceCard = function (p, kind) {
  const html = baseRenderPlaceCard(p, kind);
  if (kind !== "business" || !p.unverified) return html;
  return html.replace(/<div class="card-footer">/, `${unverifiedHtml(p)}<div class="card-footer">`);
};

const baseCompactBusiness = renderCompactBusiness;
renderCompactBusiness = function (b) {
  const html = baseCompactBusiness(b);
  if (!b.unverified) return html;
  return html.replace(`📍 ${esc(b.kiezName)} · ${esc(b.category)}</div>`, `📍 ${esc(b.kiezName)} · ${esc(b.category)} · <span class="mkb-unverified-tag">${esc(tr("nicht verifiziert", "doğrulanmadı"))}</span></div>`);
};

// Mark sponsor clicks from the strip, too.
document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a.ext-sponsor:not(.mkb-ad)");
  if (!link) return;
  const sponsor = SPONSORS.find((s) => s.serverAd && link.getAttribute("href") === safeUrl(s.linkWeb));
  if (sponsor) adClick(sponsor.id);
});

document.addEventListener("DOMContentLoaded", loadHomeAds);
