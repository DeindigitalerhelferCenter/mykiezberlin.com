// 2026-11-27 (owner): two helpers for every new story (normal user, sponsor or admin):
//  1. polishStory  – fixed writing rules (capital letter at the start, spaces, commas, full stop, no doubled "!!!")
//     for the headline and the text, per language part (German / Turkish), without AI (see text-polish.js tidy).
//  2. offerOf      – a story that is an offer ("Angebot", "Kampanya", "Rabatt", "İndirim", Black Friday …) is shown
//     in "Güncel indirimler · Aktuelle Angebote" automatically, with its picture – also when no price was found.
//     The admin can change the offer text / price, take it out ("none") or delete the story (admin-deals.js).
import { tidy } from "./text-polish.js";
import { dealFromText } from "./story-cats.js";
import { parseDeal } from "./util.js";

const TR_CHARS = /[çğışöüÇĞİŞÖÜ]/;
const TR_WORDS = /(?<![\p{L}])(ve|bir|bu|için|ile|indirim|kampanya|fırsat|ücretsiz|hemen|şimdi|sipariş|her|gün|yeni)(?![\p{L}])/iu;
const KEEP = /^(\s*(kaynak|quelle|source)\b|https?:\/\/|www\.|#|📍|☎️|📞|✉️|🔗)/i;

function langOf(s) {
  const t = String(s || "");
  if (/🇹🇷/u.test(t)) return "tr";
  if (/🇩🇪/u.test(t)) return "de";
  return TR_CHARS.test(t) || TR_WORDS.test(t) ? "tr" : "de";
}

/** Headline: every part between " · " / " | " / " / " gets the rules of its own language (no end mark). */
export function polishHeadline(h) {
  const s = String(h || "").trim();
  if (!s) return s;
  try {
    return s.split(/(\s+[·|]\s+)/).map((part, i) => (i % 2 ? part : tidy(part, langOf(part), "headline") || part)).join("");
  } catch (e) {
    return s;
  }
}

/** Text: every paragraph in its own language; source lines, links, hashtags and contact lines stay as they are. */
export function polishText(t) {
  const s = String(t || "");
  if (!s.trim()) return s;
  try {
    return s.split(/\n{2,}/).map((par) => {
      if (KEEP.test(par)) return par;
      const out = tidy(par, langOf(par), "text");
      return out || par;
    }).join("\n\n");
  } catch (e) {
    return s;
  }
}

export const OFFER_WORDS = /(angebot|sonderangebot|aktion|rabatt|gutschein|kampanya|indirim|i̇ndirim|fırsat|teklif|black\s*(friday|week)|cyber\s*monday|\d+\s*%\s*(rabatt|off|indirim)|%\s*\d+\s*indirim|gratis|kostenlos dazu|ücretsiz hediye|€\s*statt\s*\d|\d\s*€\s*yerine|statt\s*\d+[.,]?\d*\s*€)/iu;

/**
 * Offer of a story row for the lists. deal column: JSON {what, price, old} (given or found), "none" = the admin took
 * it out, "" = not decided -> offer when the folders say "angebote" or the text has an offer word.
 */
export function offerOf(row, cats) {
  const raw = String(row.deal || "");
  if (raw === "none") return null;
  const given = parseDeal(raw);
  if (given) return given;
  if (/^news-/.test(String(row.id || ""))) return null; // automatic news are no offers
  const c = Array.isArray(cats) ? cats : String(cats || "").split(",");
  if (c.includes("jobs") || c.includes("wohnen")) return null;
  const head = String(row.headline || "");
  // own app / invite promotion is no offer of a business
  if (/^invite-/.test(String(row.id || "")) || /my\s*kiez\s*berlin/i.test(head)) return null;
  // urgent / world news ("Polizeiaktion" …) only when the headline itself says offer
  if ((c.includes("eil") || c.includes("welt")) && !OFFER_WORDS.test(head)) return null;
  const found = parseDeal(dealFromText(row.headline, row.subtext));
  // offer folder chosen, offer word in the headline, or offer word + price in the text
  const ok = c.includes("angebote") || OFFER_WORDS.test(head) || (found && OFFER_WORDS.test(String(row.subtext || "")));
  if (!ok) return null;
  if (found) return found;
  const what = String(row.headline || "").replace(/\s+/g, " ").trim().slice(0, 80);
  return what ? { what, price: "Angebot · Kampanya", old: "" } : null;
}
