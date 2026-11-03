// Still screenshots of real source pages (installed Edge, 2x), plus the exact on-page box of each phrase
// we want to highlight, so marks in Cards land on the real words.
//
//   node scripts/shots.mjs <name|all>
//
// Output: public/shots/<name>.png (full page, 2x) and public/shots/<name>.json ({w, h, boxes: {phrase: [x, y, w, h]}}) in CSS px.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT = path.resolve("public/shots");

export const SHOTS = {
  // the paper's own figures (arXiv HTML), one PNG per figure; boxes are relative to the figure
  paper: {
    url: "https://arxiv.org/html/2610.35835", w: 900, figures: {
      "S1.F1": "fig1_hitl", "S3.F2": "fig2_results", "S7.F6": "fig6_countersign", "A3.F7": "fig7_selfescalate",
      "A3.F8": "fig8_injection", "A4.F10": "fig10_circle_warning",
    },
    find: ["Your verification code DMM-167850", "submit_otp", "raise_limit(per_tx", "I had to raise the wallet’s spending limits", "I had to raise the wallet's spending limits", "daily cap", "Payment agent, No attack", "error 400: spend limit exceeded",
      "Payments handover", "We already changed the email", "All invoices have been successfully paid"],
  },
  arxiv: {
    url: "https://arxiv.org/abs/2610.35835", w: 760, maxH: 1500,
    find: ["I-HITL: Inalienable Human-in-the-Loop", "Samuel Breckenridge", "harvesting OTPs", "Countersign", "trusted computing device"],
  },
  coindesk: {
    url: "https://www.coindesk.com/tech/2026/11/01/ai-agents-bypassed-crypto-spending-limits-without-human-approval-researchers-find-in-a-new-test",
    w: 760, maxH: 6000,
    find: ["AI agents bypassed crypto spending limits", "Nine of 10 AI models raised their own spending caps", "five of the 10 models raised their spending limits and sent money to the simulated attacker at least once",
      "impersonating the owner to request a payment to an attacker-controlled wallet", "an app tying approval to a physical action", "Cornell Tech and Yale", "spending limit of 1 cent"],
  },
  alphasignal: {
    url: "https://alphasignal.ai/news/cornell-and-yale-show-9-ai-models-can-bypass-their-own-spending-limits",
    w: 760, maxH: 5000,
    find: ["Cornell and Yale", "9 AI Models", "passcode", "one-time", "Circle"],
  },
  circle: {
    url: "https://developers.circle.com/agent-stack/agent-wallets", w: 760, maxH: 6000,
    find: ["Agent Wallets", "with built-in spending controls", "AI assistants with budgets"],
  },
};

// hide cookie / consent / newsletter overlays without answering them
const HIDE = `[id*="consent" i],[class*="consent" i],[id*="cookie" i],[class*="cookie" i],[id*="onetrust" i],
  [class*="newsletter" i][class*="modal" i],[aria-modal="true"],#credential_picker_container{display:none!important}
  html,body{overflow:auto!important}`;

async function figures(browser, s) {
  const page = await browser.newPage({ viewport: { width: s.w, height: 900 }, deviceScaleFactor: 2.5 });
  await page.goto(s.url, { waitUntil: "load", timeout: 60000 });
  for (const [id, name] of Object.entries(s.figures)) {
    const fig = page.locator(`[id="${id}"]`);
    await fig.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
    await fig.screenshot({ path: path.join(OUT, `${name}.png`) });
    const info = await fig.evaluate((el, phrases) => {
      const fb = el.getBoundingClientRect(), boxes = {};
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const ph of phrases) for (const n of nodes) {
        const i = n.textContent.indexOf(ph); if (i < 0) continue;
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ph.length);
        boxes[ph] = [...r.getClientRects()].filter((q) => q.width > 2).map((q) => [q.x - fb.x, q.y - fb.y, q.width, q.height].map(Math.round));
      }
      return { w: Math.round(fb.width), h: Math.round(fb.height), boxes };
    }, s.find);
    fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(info, null, 1));
    console.log(name, info.w, info.h, Object.keys(info.boxes));
  }
  await page.close();
}

async function shoot(browser, name) {
  const s = SHOTS[name];
  if (s.figures) return figures(browser, s);
  const page = await browser.newPage({ viewport: { width: s.w, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(s.url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.addStyleTag({ content: HIDE });
  // lazy images: scroll through once
  await page.evaluate(async (max) => { for (let y = 0; y < max; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); }, s.maxH);
  await page.waitForTimeout(1200);
  const info = await page.evaluate((phrases) => {
    const boxes = {};
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const ph of phrases) {
      boxes[ph] = [];
      for (const n of nodes) {
        const i = n.textContent.toLowerCase().indexOf(ph.toLowerCase());
        if (i < 0) continue;
        const r = document.createRange();
        r.setStart(n, i); r.setEnd(n, Math.min(n.textContent.length, i + ph.length));
        const rects = [...r.getClientRects()].filter((q) => q.width > 2 && q.height > 2);
        if (!rects.length) continue;
        const q = rects[0];
        boxes[ph].push({ box: [q.x + scrollX, q.y + scrollY, q.width, q.height].map((v) => Math.round(v)),
          lines: rects.map((l) => [l.x + scrollX, l.y + scrollY, l.width, l.height].map((v) => Math.round(v))), ctx: n.textContent.trim().slice(0, 160) });
      }
    }
    return { w: innerWidth, h: document.documentElement.scrollHeight, boxes };
  }, s.find);
  const h = Math.min(info.h, s.maxH);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), clip: { x: 0, y: 0, width: s.w, height: h }, fullPage: true });
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({ url: s.url, w: s.w, h, boxes: info.boxes }, null, 1));
  console.log(name, s.w, h, Object.fromEntries(Object.entries(info.boxes).map(([k, v]) => [k, v.length])));
  await page.close();
}

const want = process.argv[2] || "all";
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
for (const n of want === "all" ? Object.keys(SHOTS) : want.split(",")) {
  try { await shoot(browser, n); } catch (e) { console.log(n, "FAILED", e.message); }
}
await browser.close();
