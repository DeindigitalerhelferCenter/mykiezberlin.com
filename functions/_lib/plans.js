// Advertising packages: what each paid plan gets. Web and app read the result from /api/ads,
// so a booked package is placed the same way everywhere, without manual work.
//   l (Kiez Premium 89 €) – large card: home page, every page change, inside lists; shown 3× as often
//   m (Kiez Plus 49 €)    – medium banner: every page change, sponsor strip, inside lists; 2× as often
//   s (Kiez Basic 29 €)   – small strip: every page change, top of its own Kiez; 1×
//   banner          – banner: sponsor strip and page changes; 2×
//   gp (Gründungspartner) – like Mittel during the free months
export const PLAN_RULES = {
  l: { size: "large", weight: 3, places: ["home", "slider", "page", "list"] },
  m: { size: "medium", weight: 2, places: ["slider", "page", "list"] },
  gp: { size: "medium", weight: 2, places: ["slider", "page", "list"] },
  s: { size: "small", weight: 1, places: ["page", "kiez"] },
  banner: { size: "banner", weight: 2, places: ["slider", "page"] },
};

export const AD_PLACE_KEYS = ["slider", "home", "quiz", "page", "list", "kiez"];

export function planRule(plan) {
  return PLAN_RULES[String(plan || "").toLowerCase()] || null;
}

// Places chosen by the admin plus everything the plan includes.
export function effectivePlaces(ad) {
  const own = String(ad.places || "").split(",").map((p) => p.trim()).filter(Boolean);
  const rule = planRule(ad.plan);
  return [...new Set([...own, ...(rule ? rule.places : [])])];
}

export function parseExtra(value) {
  try {
    const o = JSON.parse(value || "{}");
    return o && typeof o === "object" ? o : {};
  } catch (e) {
    return {};
  }
}

// 2026-11-13: own pictures/videos of a sponsor (sponsor panel). The sponsor chooses the period
// ("day" = last 24 hours, "week" = last 7 days). Values: [pictures, videos]. Keep in sync with public/package-info.js.
export const MEDIA_QUOTA = {
  s: { day: [3, 1], week: [15, 5] },
  m: { day: [5, 2], week: [25, 8] },
  gp: { day: [5, 2], week: [25, 8] },
  banner: { day: [5, 2], week: [25, 8] },
  l: { day: [10, 3], week: [50, 15] },
};

export function mediaQuota(plan, period) {
  const q = MEDIA_QUOTA[String(plan || "").toLowerCase()] || MEDIA_QUOTA.s;
  const p = period === "day" ? "day" : "week";
  return { period: p, images: q[p][0], videos: q[p][1], windowMs: p === "day" ? 86400000 : 7 * 86400000 };
}
