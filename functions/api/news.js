// Berlin headlines in the format the Kiez-Quiz page expects.
import { fetchJson, json } from "../_lib/util.js";

export async function onRequestGet() {
  const data = await fetchJson("https://www.tagesschau.de/api2u/news/?regions=3");
  const news = (data.news || []).filter((n) => n.title && n.shareURL).slice(0, 12).map((n) => ({
    title: n.title,
    firstSentence: "",
    topline: n.topline || "Berlin",
    date: n.date,
    shareURL: n.shareURL,
  }));
  return json({ news }, 200, { "cache-control": "public, max-age=600" });
}
