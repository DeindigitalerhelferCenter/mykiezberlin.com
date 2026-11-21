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
  const row = await database.prepare(`SELECT COUNT(*) AS n FROM ad_requests WHERE campaign = 'bf' AND status != 'canceled'`).first().catch(() => ({ n: 0 }));
  const taken = Math.min(BF_TOTAL, BF_BASE_TAKEN + (row?.n || 0));
  const left = BF_TOTAL - taken;
  return { active: Date.now() <= BF_END && left > 0, end: BF_END, total: BF_TOTAL, taken, left, freeMonths: BF_FREE_MONTHS, prices: { s: 29, m: 49, l: 89 } };
}
