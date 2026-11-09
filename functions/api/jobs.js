// Live Berlin job offers from the public Bundesagentur für Arbeit job search (Jobsuche API).
import { fetchText, json } from "../_lib/util.js";

const TTL_SECONDS = 3600;
const PAGE_SIZE = 40;
// Public client id of the official Jobsuche app, documented at jobsuche.api.bund.dev.
const API_KEY = "jobboerse-jobsuche";
const API_URL = `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v6/jobs?wo=Berlin&umkreis=0&angebotsart=1&size=${PAGE_SIZE}&page=1`;

function jobType(row) {
  if (row.arbeitszeitVollzeit) return "Vollzeit";
  if (Object.keys(row).some((k) => k.startsWith("arbeitszeitTeilzeit") && row[k])) return "Teilzeit";
  if (row.arbeitszeitMinijob) return "Minijob";
  return "Vollzeit";
}

async function build() {
  const text = await fetchText(API_URL, 9000, { "X-API-Key": API_KEY, Accept: "application/json" });
  const data = JSON.parse(text);
  const jobs = (data.ergebnisliste || []).filter((r) => r.referenznummer && r.stellenangebotsTitel).map((r) => {
    const address = r.stellenlokationen?.[0]?.adresse || {};
    return {
      id: `ba-${r.referenznummer}`,
      title: r.stellenangebotsTitel,
      company: r.firma || "",
      profession: r.hauptberuf || "",
      plz: address.plz || "",
      address: [address.strasse, address.hausnummer].filter(Boolean).join(" "),
      jobType: jobType(r),
      contract: r.vertragsdauer === "BEFRISTET" ? "befristet" : "unbefristet",
      startDate: r.eintrittszeitraum?.von || "",
      publishedAt: r.datumErsteVeroeffentlichung || "",
      url: `https://www.arbeitsagentur.de/jobsuche/jobdetail/${encodeURIComponent(r.referenznummer)}`,
    };
  });
  return { updatedAt: Date.now(), source: "Bundesagentur für Arbeit", total: data.maxErgebnisse || jobs.length, jobs };
}

export async function onRequestGet(context) {
  const cache = caches.default;
  const key = new Request(new URL("/api/jobs", context.request.url).toString());
  const hit = await cache.match(key);
  if (hit) return hit;
  try {
    const response = json(await build(), 200, { "cache-control": `public, max-age=${TTL_SECONDS}` });
    context.waitUntil(cache.put(key, response.clone()));
    return response;
  } catch (e) {
    return json({ error: "jobs_unavailable" }, 503);
  }
}
