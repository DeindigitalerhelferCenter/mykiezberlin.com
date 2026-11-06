// Checked Kiez data shared by the website and the Android app.
import { json } from "../_lib/util.js";
import kieze from "../_lib/kieze.json";

export function onRequestGet() {
  return json(kieze, 200, { "cache-control": "public, max-age=3600" });
}
