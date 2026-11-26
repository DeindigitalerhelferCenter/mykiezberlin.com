// 2026-11-26 (owner item 6 D): "Kiez-Tipp" story cards (1080x1920) for every sponsor.
// node tools/sponsor-cards/render.cjs <sponsors.json> <outDir> [season text]
// sponsors.json = [{ id, name, kiez }] ; picture = https://mykiezberlin.com/assets/sponsors/<id>.webp
const { chromium } = require("C:/Users/mckin/AppData/Roaming/npm/node_modules/rea-agents/node_modules/playwright-core");
const fs = require("fs");
(async () => {
  const [list, out, season = ""] = process.argv.slice(2);
  const sponsors = JSON.parse(fs.readFileSync(list, "utf8"));
  const logo = "file:///C:/Users/mckin/mykiezberlin.com/public/assets/images/mykiez_logo.png";
  const tpl = "file:///" + __dirname.replace(/\\/g, "/") + "/card.html";
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  for (const s of sponsors) {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    const img = s.img || `https://mykiezberlin.com/assets/sponsors/${s.id}.webp`;
    await p.goto(`${tpl}#name=${encodeURIComponent(s.name)}&kiez=${encodeURIComponent(s.kiez || "")}&img=${encodeURIComponent(img)}&logo=${encodeURIComponent(logo)}&season=${encodeURIComponent(season)}`);
    await p.waitForFunction(() => document.fonts.status === "loaded" && [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/kiez-tipp-${s.id}.png` });
    console.log("ok", s.id);
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
