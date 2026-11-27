// Same live page, with the browser's own "Pretty-print" box ticked and the page zoomed so the fields read on a phone.
const { chromium } = require("C:/AI Video Editing/editor/node_modules/playwright-core");
const fs = require("fs");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
(async () => {
  const br = await chromium.launch({ executablePath: EDGE, headless: true, args: ["--headless=new", "--disable-blink-features=AutomationControlled"] });
  const ctx = await br.newContext({ viewport: { width: 480, height: 800 }, deviceScaleFactor: 2.25 });
  const pg = await ctx.newPage();
  await pg.goto("https://www.allbirds.com/products.json?limit=1", { waitUntil: "load", timeout: 40000 });
  await pg.waitForTimeout(1000);
  await pg.evaluate(() => { const pre = document.querySelector("pre"); pre.textContent = JSON.stringify(JSON.parse(pre.textContent), null, 3); });
  await pg.waitForTimeout(300);
  await pg.addStyleTag({ content: "body{zoom:1.25;margin:0 4px!important}" });
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: __dirname + "/pretty_full.png", fullPage: true });
  const boxes = await pg.evaluate(() => {
    const pre = [...document.querySelectorAll("pre")].find(p => p.offsetHeight > 0 && p.innerText.length > 100);
    const tw = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT); const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
    const out = { brand: [], price: [], compare: [], pretty: !!pre };
    const add = (key, re) => { for (const t of nodes) { let m; re.lastIndex = 0; while ((m = re.exec(t.data))) { const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length);
      for (const b of r.getClientRects()) out[key].push([b.x, b.y + scrollY, b.width, b.height]); } } };
    add("brand", /allbirds/gi); add("brand", /wool[ -]runner/gi); add("price", /"price": "[0-9.]+"/g); add("compare", /"compare_at_price": "[0-9.]+"/g);
    out.H = document.documentElement.scrollHeight; out.sample = pre.innerText.slice(0, 300);
    return out;
  });
  fs.writeFileSync(__dirname + "/pretty_boxes.json", JSON.stringify(boxes));
  console.log("brand", boxes.brand.length, "price", boxes.price.length, "compare", boxes.compare.length, "H", boxes.H, JSON.stringify(boxes.price.slice(0, 2)), JSON.stringify(boxes.compare.slice(0, 2)));
  console.log(boxes.sample);
  await br.close();
})();
