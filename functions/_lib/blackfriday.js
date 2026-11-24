// 2026-11-22 (owner): Black Friday campaign – the first 100 sponsors get 3 months free, then the normal package
// price (Kiez Basic 29 / Plus 49 / Premium 89 € per month), cancel every month. Runs from now until 30.11.2026.
// The 20 "Gründungspartner" places count as taken (owner: "20 doldu, kalan 80").
export const BF_TOTAL = 100;
export const BF_BASE_TAKEN = 20;
export const BF_END = Date.UTC(2026, 10, 30, 22, 59, 59); // 30.11.2026 23:59:59 Berlin time (CET = UTC+1)
export const BF_FREE_MONTHS = 3;

let ready = false;
export async function ensureBf(database) {
  if (ready) return;
  await database.prepare(`ALTER TABLE ad_requests ADD COLUMN campaign TEXT DEFAULT ''`).run().catch(() => {});
  ready = true;
}

export async function bfStatus(database) {
  await ensureBf(database);
  // 2026-11-24 (owner): every sponsor on the site counts (today 32, also own firms + Türkiye sponsors); each new
  // sponsor is taken from the 100 automatically. Open Black Friday requests (not yet a sponsor) count too; a request
  // marked "done" is already a sponsor (counted in ads), so it is not counted twice.
  const ads = await database.prepare(`SELECT COUNT(*) AS n FROM ads WHERE active = 1 AND (end_at = 0 OR end_at > ?)`).bind(Date.now()).first().catch(() => null);
  const open = await database.prepare(`SELECT COUNT(*) AS n FROM ad_requests WHERE campaign = 'bf' AND status IN ('new', 'contacted', 'paid')`).first().catch(() => ({ n: 0 }));
  const base = ads && ads.n ? ads.n : BF_BASE_TAKEN;
  const taken = Math.min(BF_TOTAL, base + (open?.n || 0));
  const left = BF_TOTAL - taken;
  return { active: Date.now() <= BF_END && left > 0, end: BF_END, total: BF_TOTAL, taken, left, freeMonths: BF_FREE_MONTHS, prices: { s: 29, m: 49, l: 89 } };
}
