// 2026-11-26 (owner "UYGULA"): renders the permanent invite cards into public/assets/davet/<key>-story|post|wide.jpg
// node tools/invite-cards/render.cjs   (background photos from Downloads/"MyKiezBerlin - Bos Vorlagen")
const { chromium } = require("C:/Users/mckin/AppData/Roaming/npm/node_modules/rea-agents/node_modules/playwright-core");
const fs = require("fs");
const path = require("path");
(async () => {
  const mod = await import("file:///" + path.resolve(__dirname, "../../functions/_lib/invite-cards.js").replace(/\\/g, "/"));
  const PICS = "file:///C:/Users/mckin/Downloads/MyKiezBerlin - Bos Vorlagen/";
  const out = path.resolve(__dirname, "../../public/assets/davet");
  fs.mkdirSync(out, { recursive: true });
  const tpl = "file:///" + __dirname.replace(/\\/g, "/") + "/card.html";
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
  for (const c of mod.INVITE_CARDS) for (const [name, w, h] of [["story", 1080, 1920], ["post", 1080, 1080], ["wide", 1200, 630]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const qs = { w, h, key: c.key, kind: c.kind, pic: encodeURI(PICS + c.pic), t_de: c.title_de, t_tr: c.title_tr, s_de: c.sub_de, s_tr: c.sub_tr, c_de: c.cta_de, c_tr: c.cta_tr };
    await p.goto(tpl + "#" + new URLSearchParams(qs).toString());
    await p.waitForFunction(() => document.fonts.status === "loaded" && (!document.getElementById("qr") || document.querySelector("#qr img,#qr canvas")), null, { timeout: 20000 });
    await p.waitForTimeout(600);
    const buf = await p.screenshot({ type: "jpeg", quality: 86 });
    fs.writeFileSync(`${out}/${c.key}-${name}.jpg`, buf);
    console.log("ok", c.key, name);
    await p.close();
  }
  await b.close();
})().catch((e) => { console.error("FAIL", e.message); process.exit(1); });
