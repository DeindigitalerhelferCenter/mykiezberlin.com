// Domains that must never be opened from My Kiez Berlin (2026-11-11).
// jet-gas.de / jetgas.de redirected users to adult pages (e.g. *.sexyflirt.top, *.lovemeto.org).
// Used for sponsor links (/api/ads, admin saveAd) and story links.
const BLOCKED = [
  /(^|\.)jet-?gas\.de$/i,
  /(^|\.)sexyflirt\.[a-z]+$/i,
  /(^|\.)lovemeto\.[a-z]+$/i,
];

export function isBlockedUrl(url) {
  try {
    const host = new URL(String(url || "").trim().replace(/^(?!https?:\/\/)/i, "https://")).hostname;
    return BLOCKED.some((re) => re.test(host));
  } catch (e) {
    return false;
  }
}

/** Returns the url, or "" when it points to a blocked domain. */
export function safeLink(url) {
  return url && isBlockedUrl(url) ? "" : url || "";
}
