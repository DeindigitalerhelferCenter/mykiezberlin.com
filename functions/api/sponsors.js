// Sponsors for the Kiez-Quiz page.
import { json } from "../_lib/util.js";
import sponsors from "../_lib/sponsors.json";

export function onRequestGet() {
  return json(sponsors, 200, { "cache-control": "public, max-age=3600" });
}
