// Frame-by-frame "screen recording" of real websites, driven through the installed Edge.
// Every frame is a 2x screenshot, so scrolling and cursor moves are perfectly smooth and sharp
// (unlike a live screen capture). The cursor is drawn into the page.
//
//   node scripts/capture.mjs <shot-name|all>
//
// Shots are defined in SHOTS below. Output: public/rec/<name>.mp4
import { chromium } from "playwright-core";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const FF = "C:\\Users\\talha\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const FPS = 30;
const OUT = path.resolve("public/rec");

// Steps: {wait}, {move: selector|[x,y], dur, dx?, dy?}, {scroll: px|selector, dur, offset?, relative?}, {click}
export const SHOTS = {
  remotion_home: {
    url: "https://www.remotion.dev/", w: 760, h: 830,
    steps: [
      { wait: 0.4 },
      { move: [600, 420], dur: 0.01 },
      { move: "a[href*='github.com/remotion-dev/remotion']", dur: 0.9 },
      { wait: 0.5 }, { click: true }, { wait: 0.6 },
      { scroll: 520, dur: 1.2 },
      { move: [380, 520], dur: 0.8 },
      { wait: 1.2 },
    ],
  },
  github_repo: {
    url: "https://github.com/remotion-dev/remotion", w: 760, h: 830,
    steps: [
      { wait: 0.4 },
      { move: [380, 600], dur: 0.01 },
      { move: "span:text-matches('^[0-9.]+k stars$')", dur: 0.9, dx: 58, dy: 10 }, // sit just past the number, not on it
      { wait: 0.8 }, { click: true }, { wait: 0.5 },
      { scroll: "article", dur: 1.6, offset: -60 },
      { move: [420, 500], dur: 0.8 },
      { scroll: 1400, dur: 2.0, relative: true },
      { wait: 0.6 },
    ],
  },
  vs_github: {
    url: "https://github.com/debpalash/VoiceStudio", w: 760, h: 830,
    steps: [
      { wait: 2.6 }, // hold on the repo header while you say the name
      { move: [380, 600], dur: 0.01 },
      { move: "span:text-matches('^[0-9.]+k stars$')", dur: 0.9, dx: 58, dy: 10 },
      { wait: 1.2 },
      { scroll: "article", dur: 1.6, offset: -60 },
      { move: [420, 500], dur: 0.8 },
      { scroll: 1100, dur: 2.0, relative: true },
      { wait: 0.6 },
    ],
  },
  vs_site: {
    url: "https://voicestudio.sh/", w: 760, h: 830,
    steps: [
      { wait: 0.8 },
      { move: [600, 300], dur: 0.01 },
      { move: [380, 520], dur: 0.9 },
      { scroll: 900, dur: 1.8, relative: true },
      { wait: 0.5 },
      { scroll: 900, dur: 1.8, relative: true },
      { wait: 0.8 },
    ],
  },
};

const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

const CURSOR_JS = `
  (() => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div');
    c.id = '__cur';
    c.innerHTML = '<div id="__ring"></div><svg width="30" height="38" viewBox="0 0 30 38"><path d="M3 2 L3 30 L10 23 L15 35 L20 33 L15 21 L25 21 Z" fill="#111" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0px', top: '0px', zIndex: 2147483647, pointerEvents: 'none', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.35))' });
    const r = c.querySelector('#__ring');
    Object.assign(r.style, { position: 'absolute', left: '-18px', top: '-18px', width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #FF6A1A', opacity: 0 });
    document.body.appendChild(c);
    window.__setCursor = (x, y, ring) => {
      c.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      r.style.opacity = ring > 0 ? String(1 - ring) : '0';
      r.style.transform = 'scale(' + (0.6 + ring * 1.2) + ')';
    };
  })();`;

async function capture(name, shot, browser) {
  const ctx = await browser.newContext({ viewport: { width: shot.w, height: shot.h }, deviceScaleFactor: 2, colorScheme: "light", locale: "en-GB", bypassCSP: true });
  const page = await ctx.newPage();
  await page.goto(shot.url, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important} ::-webkit-scrollbar{display:none}" });
  await page.evaluate(CURSOR_JS);

  const dir = path.join(OUT, `_${name}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  let n = 0, cx = shot.w / 2, cy = shot.h / 2, ring = 0;
  const snap = async () => {
    await page.evaluate(([x, y, r]) => window.__setCursor(x, y, r), [cx, cy, ring]);
    await page.screenshot({ path: path.join(dir, `f${String(n++).padStart(5, "0")}.png`) });
  };
  const target = async (sel) => {
    const loc = page.locator(`${sel} >> visible=true`).first();
    await loc.scrollIntoViewIfNeeded({ timeout: 1 }).catch(() => {}); // no-op if already visible; keeps scroll steps in control
    const box = await loc.boundingBox();
    if (!box) throw new Error(`${name}: selector not found: ${sel}`);
    return box;
  };

  for (const st of shot.steps) {
    if (st.wait) for (let i = 0; i < Math.round(st.wait * FPS); i++) await snap();
    if (st.move) {
      const [tx, ty] = Array.isArray(st.move) ? st.move
        : await target(st.move).then((b) => [b.x + b.width / 2 + (st.dx ?? 0), b.y + b.height / 2 + (st.dy ?? 0)]);
      const [sx, sy] = [cx, cy];
      const frames = Math.max(1, Math.round(st.dur * FPS));
      for (let i = 1; i <= frames; i++) {
        const p = easeInOut(i / frames);
        cx = sx + (tx - sx) * p;
        cy = sy + (ty - sy) * p - Math.sin(p * Math.PI) * 40; // slight arc, like a real hand
        await snap();
      }
    }
    if (st.click) for (let i = 0; i <= 9; i++) { ring = i / 9; await snap(); }
    ring = 0;
    if (st.scroll !== undefined) {
      const from = await page.evaluate(() => window.scrollY);
      let to;
      if (typeof st.scroll === "number") to = st.relative ? from + st.scroll : st.scroll;
      else to = from + (await target(st.scroll)).y + (st.offset ?? 0);
      const frames = Math.max(1, Math.round(st.dur * FPS));
      for (let i = 1; i <= frames; i++) {
        await page.evaluate((y) => window.scrollTo(0, y), from + (to - from) * easeInOut(i / frames));
        await snap();
      }
    }
  }
  await ctx.close();

  fs.mkdirSync(OUT, { recursive: true });
  const mp4 = path.join(OUT, `${name}.mp4`);
  const r = spawnSync(FF, ["-v", "error", "-y", "-framerate", String(FPS), "-i", path.join(dir, "f%05d.png"),
    "-c:v", "libx264", "-crf", "14", "-preset", "slow", "-pix_fmt", "yuv420p", mp4], { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${name}: ffmpeg failed`);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`${name}: ${n} frames (${(n / FPS).toFixed(2)}s) -> ${mp4}`);
}

const which = process.argv[2] ?? "all";
const browser = await chromium.launch({ executablePath: EDGE, headless: true });
try {
  for (const [name, shot] of Object.entries(SHOTS)) if (which === "all" || which === name) await capture(name, shot, browser);
} finally {
  await browser.close();
}
