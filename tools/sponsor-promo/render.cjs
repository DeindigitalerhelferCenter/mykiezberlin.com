// 2026-11-27 (owner): sponsor promo cards 9:16 (partner + follow). node tools/sponsor-promo/render.cjs <cards.json> <outDir>
const { chromium } = require("C:/Users/mckin/AppData/Roaming/npm/node_modules/rea-agents/node_modules/playwright-core");
const fs = require("fs");
(async () => {
  const [list, out] = process.argv.slice(2);
  const cards = JSON.parse(fs.readFileSync(list, "utf8"));
  const tpl = "file:///" + __dirname.split(String.fromCharCode(92)).join("/") + "/card.html";
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  for (const c of cards) {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    await p.goto(`${tpl}#d=${encodeURIComponent(JSON.stringify(c))}`);
    await p.waitForFunction(() => document.fonts.status === "loaded" && [...document.images].every((i) => i.complete) && document.querySelector("#q canvas, #q img"), null, { timeout: 30000 });
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${out}/${c.file}.png` });
    console.log("ok", c.file);
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
