// Sends exported phone stories to the moderation queue.
// Usage: node tools/import_stories.mjs <exportFolder> [baseUrl]   (password in env ADMIN_PASSWORD)
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";

const [folder, base = "https://mykiezberlin.com"] = process.argv.slice(2);
const password = process.env.ADMIN_PASSWORD;
const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm" };

if (!folder || !password) {
  console.error("Klasör veya şifre eksik.");
  process.exit(1);
}

const stories = JSON.parse(readFileSync(join(folder, "stories.json"), "utf8"));
let failed = 0;

for (const story of stories) {
  const form = new FormData();
  form.append("sourceId", story.id);
  for (const key of ["headline", "subtext", "kiez", "kind", "author"]) form.append(key, story[key] ?? "");
  form.append("durationHours", String(story.durationHours ?? 24));
  if (story.file) {
    const type = TYPES[extname(story.file).toLowerCase()];
    form.append("file", new Blob([readFileSync(join(folder, "media", story.file))], { type }), story.file);
  }
  const res = await fetch(`${base}/api/admin-import`, { method: "POST", headers: { "x-admin-token": password }, body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) failed += 1;
  console.log(res.status, body.status || body.error || "", story.headline);
  if (res.status === 401) {
    console.error("Şifre yanlış.");
    process.exit(1);
  }
}

console.log(failed ? `${failed} hikâye aktarılamadı.` : "Bitti. Admin panelinde Bekleyen sekmesini kontrol et.");
process.exit(failed ? 1 : 0);
