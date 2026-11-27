// Real capture of a live Shopify store's /products.json (raw, as the browser shows it): one full-page 2x screenshot
// plus the exact on-page boxes of the store name (to blur) and of the price fields (to highlight).
const { chromium } = require("C:/AI Video Editing/editor/node_modules/playwright-core");
const fs = require("fs");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
(async () => {
  const br = await chromium.launch({ executablePath: EDGE, headless: true, args: ["--headless=new", "--disable-blink-features=AutomationControlled"] });
  const ctx = await br.newContext({ viewport: { width: 480, height: 800 }, deviceScaleFactor: 2.25 });
  const pg = await ctx.newPage();
  await pg.goto("https://www.allbirds.com/products.json?limit=1", { waitUntil: "load", timeout: 40000 });
  await pg.waitForTimeout(1200);
  await pg.addStyleTag({ content: "body{margin:0 10px!important}" });
  await pg.evaluate(() => { const c = document.querySelector("div,form"); });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: __dirname + "/json_full.png", fullPage: true });
  const boxes = await pg.evaluate(() => {
    const pre = document.querySelector("pre"); const t = pre.firstChild; const s = t.data; const out = { brand: [], price: [], compare: [], bfcm: [] };
    const add = (key, re) => { let m; while ((m = re.exec(s))) { const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length);
      for (const b of r.getClientRects()) out[key].push([b.x, b.y + scrollY, b.width, b.height]); } };
    add("brand", /allbirds/gi); add("brand", /wool[ -]runner/gi); add("brand", /tree[ -]runner/gi); add("price", /"price":"[0-9.]+"/g); add("compare", /"compare_at_price":"[0-9.]+"/g); add("bfcm", /"bfcm-mens"/g);
    const pp = document.body.firstElementChild; out.preTop = pre.getBoundingClientRect().top + scrollY; out.H = document.documentElement.scrollHeight;
    return out;
  });
  fs.writeFileSync(__dirname + "/json_boxes.json", JSON.stringify(boxes));
  console.log("brand", boxes.brand.length, "price", boxes.price.length, "compare", boxes.compare.length, "H", boxes.H, "first compare", JSON.stringify(boxes.compare.slice(0, 3)), "first price", JSON.stringify(boxes.price.slice(0, 2)));
  await br.close();
})();
