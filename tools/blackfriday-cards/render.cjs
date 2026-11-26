const { chromium } = require("C:/Users/mckin/AppData/Roaming/npm/node_modules/rea-agents/node_modules/playwright-core");
(async () => {
  const dir = process.argv[2], left = process.argv[3];
  const logo = "file:///C:/Users/mckin/mykiezberlin.com/public/assets/images/mykiez_logo.png";
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  const jobs = [["post", 1080, 1080], ["story", 1080, 1920], ["wide", 1200, 630]];
  for (const [name, w, h] of jobs) for (const lang of ["de", "tr"]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(`file:///${dir}/card.html#w=${w}&h=${h}&lang=${lang}&left=${left}${process.argv[4] ? "&noleft=1" : ""}&logo=${encodeURIComponent(logo)}`);
    await p.waitForFunction(() => document.querySelector("#qr img, #qr canvas") && document.fonts.status === "loaded", null, { timeout: 20000 });
    await p.waitForTimeout(800);
    const over = await p.evaluate(() => { const c = document.querySelector(".card > div:last-child"); return c.scrollHeight - c.clientHeight; });
    await p.screenshot({ path: `${dir}/MyKiez-BlackFriday-${name}-${lang}${process.argv[4] ? "-daily" : ""}.png` });
    console.log(name, lang, w + "x" + h, "overflow:", over);
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
