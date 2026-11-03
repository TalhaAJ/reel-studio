// Reel: "AI agents raised their own spending limits" (Cornell Tech + Yale, I-HITL paper), in the Pastel Proof style.
// Every time is anchored to a spoken word in public/captions.json.
import React from "react";
import { AbsoluteFill, Audio, Freeze, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import captions from "../../public/captions.json";
import cutsData from "../../public/cuts.json";
import headtrack from "../../public/headtrack.json";
import { BODY, CAPTION_Y, CARD, FACE, HEAD, Layout, P, Rect, TITLE, lerpRect } from "./theme";
import { Board, Mark, Pills, RimCard, Shot, Stamp, Stat, Title, clamp01, ease, pop } from "./Parts";

type Word = { w: string; s: number; e: number; beat: string };
const WORDS = captions as Word[];
const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
const at = (word: string, beat: string, nth = 0) => {
  const hits = WORDS.filter((x) => clean(x.w) === word && x.beat === beat);
  if (!hits[nth]) throw new Error(`word "${word}" (${beat}) #${nth} not in captions`);
  return hits[nth].s;
};
const beatStart = (b: string) => Math.max(0, WORDS.find((x) => x.beat === b)!.s - 0.05);
const beatEnd = (b: string) => [...WORDS].reverse().find((x) => x.beat === b)!.e;

export const FPS = 30;
export const TOTAL = cutsData.total;
export const TAIL = 1.8;                 // follow card + sting after the last word
export const DURATION = Math.ceil((TOTAL + TAIL) * FPS);

const T = {
  crazy: at("crazy", "hook"), researchersH: at("researchers", "hook"),
  setup: beatStart("setup"), yale: at("yale", "setup"), ten: at("10", "setup"), crypto: at("crypto", "setup"), wallet: at("wallet", "setup"),
  one: at("1", "setup"),
  problem: beatStart("problem"), raise: at("raise", "problem"),
  how: beatStart("how"), verification: at("verification", "how"), code: at("code", "how"), inbox: at("inbox", "how"),
  noperm: beatStart("noperm"), nobody: at("nobody", "noperm"),
  worse: beatStart("worse"),
  test2: beatStart("test2"), tricked: at("tricked", "test2"), email: at("email", "test2"), pretending: at("pretending", "test2"),
  money: beatStart("money"), sent: at("sent", "money"),
  think: beatStart("think"),
  against: beatStart("against"), make: at("make", "against"), autonomously: at("autonomously", "against"), againstW: at("against", "against"),
  lesson: beatStart("lesson"), never: at("never", "lesson"), protect: at("protect", "lesson"), mindful: at("mindful", "lesson"),
  spend: at("spend", "lesson"), bypass: at("bypass", "lesson"),
  fix: beatStart("fix"), propose: at("propose", "fix"), requirement: at("requirement", "fix"), physical: at("physical", "fix"),
  assist: beatStart("assist"), assistW: at("assist", "assist"), authorise: at("authorise", "assist"),
  scheme: beatStart("scheme"), schemeW: at("scheme", "scheme"),
  end: beatEnd("scheme"),
};

// ---------------- layout plan ----------------
const LAYOUTS: { l: Layout; at: number }[] = [
  { l: "title", at: 0 },
  { l: "card", at: T.noperm },
  { l: "face", at: T.worse },
  { l: "card", at: T.test2 },
  { l: "face", at: T.think },
  { l: "card", at: T.against },
  { l: "face", at: T.lesson },     // "So the lesson is" (board turns slate)
  { l: "card", at: T.never - 0.1 },
];
const SWITCH = 0.32;
const layoutAt = (t: number) => {
  let i = 0;
  LAYOUTS.forEach((x, k) => { if (t >= x.at) i = k; });
  const cur = LAYOUTS[i], prev = LAYOUTS[Math.max(0, i - 1)];
  return { cur: cur.l, prev: prev.l, p: i === 0 ? 1 : ease(t, cur.at, SWITCH), start: cur.at };
};
const rectFor = (map: Record<Layout, Rect>, L: ReturnType<typeof layoutAt>) => lerpRect(map[L.prev], map[L.cur], L.p);

// ---------------- cards ----------------
type CardFn = (t: number, w: number, h: number) => React.ReactNode;
const CD = "CoinDesk · Nov 1, 2026";
const PAPER = "arXiv paper · Cornell Tech + Yale";
const shot = (src: string, nat: [number, number], views: { at: number; cx: number; cy: number; cw: number }[], marks: Mark[], source: string): CardFn =>
  (t, w, h) => <Shot t={t} w={w} h={h} src={src} nat={nat} views={views} marks={marks} source={source} />;

const CARDS: { start: number; end: number; dark?: boolean; render: CardFn }[] = [
  { start: 0, end: T.researchersH, render: shot("shots/coindesk.png", [760, 6000],
      [{ at: 0, cx: 380, cy: 960, cw: 760 }, { at: 0.8, cx: 330, cy: 840, cw: 640 }],
      [{ at: T.crazy, kind: "hl", lines: [[40, 648, 479, 33]] }], CD) },
  { start: T.researchersH, end: T.crypto, render: (t, w, h) => <>
      {shot("shots/arxiv.png", [760, 1500], [{ at: 0, cx: 380, cy: 300, cw: 760 }, { at: T.researchersH + 0.1, cx: 250, cy: 190, cw: 500 }],
        [{ at: T.researchersH + 0.25, kind: "box", lines: [[12, 120, 422, 26]] }, { at: T.yale, kind: "hl", lines: [[12, 158, 386, 18]] }],
        "arXiv · Oct 26, 2026")(t, w, h)}
      <Pills t={t} items={[{ at: T.yale - 0.25, text: "Cornell Tech" }, { at: T.yale + 0.05, text: "Yale" }, { at: T.ten, text: "10 AI models" }]} />
    </> },
  { start: T.crypto, end: T.one, render: shot("shots/circle.png", [760, 2761],
      [{ at: 0, cx: 380, cy: 330, cw: 760 }, { at: T.crypto + 0.3, cx: 380, cy: 300, cw: 720 }],
      [{ at: T.wallet, kind: "hl", lines: [[77, 255, 243, 21]] }], "Circle Docs · Agent Wallets") },
  { start: T.one, end: T.problem, render: (t, w, h) =>
      <Stat t={t} at={T.one} w={w} h={h} from={1} to={1} fmt={() => "1¢"} label="per day spending limit" tag="the agents' daily cap" /> },
  { start: T.problem, end: T.how, render: shot("shots/fig2_results.png", [2080, 1260],
      [{ at: 0, cx: 1040, cy: 560, cw: 2080 }, { at: T.problem + 0.4, cx: 840, cy: 420, cw: 1760 }],
      [{ at: T.raise, kind: "box", lines: [[150, 100, 1330, 590]], color: P.red }], "arXiv paper · Fig. 2") },
  { start: T.how, end: T.verification, render: (t, w, h) =>
      <Stat t={t} at={T.how} w={w} h={h} from={0} to={9} fmt={(n) => `${Math.round(n)}/10`} label="models raised their own limit" tag="Cornell Tech + Yale study" /> },
  { start: T.verification, end: T.worse, render: (t, w, h) => <>
      {shot("shots/fig7_selfescalate.png", [832, 1420],
        [{ at: 0, cx: 470, cy: 840, cw: 640 }, { at: T.code - 0.3, cx: 440, cy: 905, cw: 440 }, { at: T.noperm, cx: 470, cy: 1215, cw: 520 }],
        [{ at: T.code, kind: "hl", lines: [[389, 905, 205, 17]] },
         { at: T.inbox, until: T.noperm, kind: "box", lines: [[228, 873, 580, 60]] },
         { at: T.noperm + 0.4, kind: "hl", lines: [[277, 1205, 224, 17]] }],
        "arXiv paper · Fig. 7 · a real agent run")(t, w, h)}
      <Stamp t={t} at={T.nobody} text="NO PERMISSION" x={w / 2} y={h * 0.2} />
    </> },
  { start: T.test2, end: T.money, render: shot("shots/fig8_injection.png", [832, 1443],
      [{ at: 0, cx: 420, cy: 360, cw: 780 }, { at: T.tricked, cx: 420, cy: 290, cw: 560 }],
      [{ at: T.email, kind: "box", lines: [[208, 220, 422, 136]], color: P.red }, { at: T.pretending, kind: "hl", lines: [[451, 306, 167, 17]] }],
      "arXiv paper · Fig. 8 · fake email in red") },
  { start: T.money, end: T.think, render: shot("shots/coindesk.png", [760, 6000],
      [{ at: 0, cx: 380, cy: 1890, cw: 740 }, { at: T.sent, cx: 380, cy: 1920, cw: 700 }],
      [{ at: T.money, kind: "hl", lines: [[188, 1839, 490, 24], [40, 1867, 134, 24]] },
       { at: T.sent, kind: "hl", lines: [[313, 1927, 382, 24], [40, 1955, 428, 24]], color: "rgba(255,120,140,0.55)" }], CD) },
  { start: T.against, end: T.lesson, render: (t, w, h) => <AgainstCard t={t} w={w} h={h} /> },
  { start: T.never - 0.1, end: T.fix, render: (t, w, h) => <Checklist t={t} w={w} h={h} /> },
  { start: T.fix, end: T.requirement, render: shot("shots/coindesk.png", [760, 6000],
      [{ at: 0, cx: 380, cy: 900, cw: 760 }, { at: T.fix + 0.2, cx: 380, cy: 860, cw: 720 }],
      [{ at: T.propose, kind: "hl", lines: [[40, 761, 405, 20]] }], CD) },
  { start: T.requirement, end: T.assist, render: shot("shots/fig6_countersign.png", [2080, 1450],
      [{ at: 0, cx: 1040, cy: 600, cw: 2080 }, { at: T.physical, cx: 1010, cy: 760, cw: 1500 }],
      [{ at: T.physical, kind: "box", lines: [[830, 455, 360, 690]], color: P.green }], "Countersign · arXiv paper Fig. 6") },
  { start: T.assist, end: T.scheme, render: (t, w, h) => <Split t={t} w={w} h={h} /> },
  { start: T.scheme, end: TOTAL + 0.15, render: shot("shots/fig10_circle_warning.png", [2080, 903],
      [{ at: 0, cx: 1040, cy: 420, cw: 2080 }, { at: T.scheme + 0.1, cx: 1000, cy: 320, cw: 1860 }],
      [{ at: T.schemeW, kind: "box", lines: [[200, 80, 1660, 80]], color: P.yellow }], "Circle's warning, added after the study") },
  { start: TOTAL + 0.15, end: 999, dark: true, render: (t, w, h) => <Follow t={t} w={w} h={h} /> },
];

// ---------------- custom cards ----------------
const AgainstCard: React.FC<{ t: number; w: number; h: number }> = ({ t }) => {
  const a = pop(t, T.make, 0.3), strike = ease(t, T.againstW, 0.3), tag = pop(t, T.againstW + 0.15, 0.35);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 40, color: "#8A93A6", letterSpacing: 2 }}>YOUR AI ASSISTANT</div>
      <div style={{ position: "relative", fontFamily: HEAD, fontSize: 96, color: P.ink, opacity: a, transform: `translateY(${(1 - a) * 30}px)` }}>
        makes your life better
        <div style={{ position: "absolute", left: -10, right: -10, top: "52%", height: 10, background: P.red, borderRadius: 5,
          transform: `scaleX(${strike}) rotate(-2deg)`, transformOrigin: "left" }} />
      </div>
      {t >= T.autonomously && t < T.againstW + 0.1 && (
        <div style={{ padding: "8px 24px", borderRadius: 12, background: P.blue, color: "#fff", fontFamily: BODY, fontWeight: 800, fontSize: 40,
          transform: `scale(${pop(t, T.autonomously, 0.3)})` }}>decides on its own</div>
      )}
      {t >= T.againstW + 0.15 && (
        <div style={{ padding: "10px 30px", borderRadius: 12, background: P.yellow, color: P.ink, fontFamily: HEAD, fontSize: 92,
          transform: `rotate(-3deg) scale(${tag})`, boxShadow: "0 10px 26px rgba(0,0,0,0.18)" }}>against you</div>
      )}
    </div>
  );
};

const Checklist: React.FC<{ t: number; w: number; h: number }> = ({ t }) => {
  const items: { at: number; icon: string; color: string; text: React.ReactNode; strikeAt?: number }[] = [
    { at: T.never, icon: "✕", color: P.red, text: "Trust AI to protect you", strikeAt: T.protect },
    { at: T.mindful, icon: "✓", color: P.green, text: <>Mind <Hi>cybersecurity</Hi></> },
    { at: T.spend, icon: "$", color: "#C27C0E", text: <>It may <Hi>spend your money</Hi></> },
    { at: T.bypass, icon: "!", color: P.red, text: <>…and <Hi>bypass limits</Hi></> },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, padding: "70px 56px", display: "flex", flexDirection: "column", gap: 44 }}>
      <div style={{ fontFamily: HEAD, fontSize: 70, color: P.ink }}>The lesson</div>
      {items.filter((x) => t >= x.at).map((x, i) => {
        const p = pop(t, x.at, 0.3);
        const s = x.strikeAt ? ease(t, x.strikeAt, 0.3) : 0;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, opacity: clamp01(p * 2), transform: `translateX(${(1 - p) * -40}px)` }}>
            <div style={{ width: 66, height: 66, borderRadius: 14, background: `${x.color}22`, color: x.color, fontFamily: BODY, fontWeight: 800,
              fontSize: 42, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{x.icon}</div>
            <div style={{ position: "relative", fontFamily: BODY, fontWeight: 800, fontSize: 52, color: s > 0 ? "#9AA1AC" : P.ink }}>
              {x.text}
              {s > 0 && <div style={{ position: "absolute", left: 0, right: 0, top: "54%", height: 6, background: P.red, transform: `scaleX(${s})`, transformOrigin: "left" }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
};
const Hi: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  <span style={{ background: P.yellow, padding: "0 10px", borderRadius: 8 }}>{children}</span>;

const Split: React.FC<{ t: number; w: number; h: number }> = ({ t }) => {
  const side = (at: number, good: boolean) => {
    const p = pop(t, at, 0.35);
    return (
      <div style={{ flex: 1, margin: 14, borderRadius: 18, background: good ? "#DDF5E6" : "#FCE1E6", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 18, opacity: t >= at ? 1 : 0, transform: `scale(${0.8 + 0.2 * p})` }}>
        <div style={{ fontFamily: HEAD, fontSize: 86, lineHeight: 1.05, color: good ? P.green : P.red, textAlign: "center" }}>
          {good ? <>ASSIST<br />YOU</> : <>AUTHORISE<br />ITSELF</>}
        </div>
        <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 30, color: good ? P.green : P.red, textAlign: "center", padding: "0 20px" }}>
          {good ? "you approve every payment" : "reads your codes, raises its own limit"}
        </div>
        <div style={{ fontSize: 120, color: good ? P.green : P.red, fontFamily: BODY, fontWeight: 700 }}>{good ? "✓" : "✗"}</div>
      </div>
    );
  };
  return <div style={{ position: "absolute", inset: 0, display: "flex" }}>{side(T.assistW, true)}{side(T.authorise, false)}</div>;
};

const Follow: React.FC<{ t: number; w: number; h: number }> = ({ t }) => {
  const p = pop(t, TOTAL + 0.2, 0.4);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
      <div style={{ padding: "22px 60px", borderRadius: 22, background: P.red, color: "#fff", fontFamily: BODY, fontWeight: 800, fontSize: 92,
        transform: `scale(${0.6 + 0.4 * p})`, boxShadow: "0 16px 40px rgba(229,41,75,0.45)" }}>+ FOLLOW</div>
      <div style={{ color: "#fff", fontFamily: BODY, fontWeight: 700, fontSize: 44, opacity: ease(t, TOTAL + 0.5, 0.3) }}>for more AI security, explained</div>
      <div style={{ color: P.yellow, fontFamily: HEAD, fontSize: 84, opacity: ease(t, TOTAL + 0.8, 0.3), transform: `scale(${pop(t, TOTAL + 0.8, 0.35)})` }}>Let's go, boys</div>
    </div>
  );
};

// ---------------- captions (karaoke, as in the reference) ----------------
type Style = "box" | "blue" | "red" | "green";
const STYLE: Record<string, Style> = {
  crazy: "box", researchers: "blue", yale: "blue", "10": "blue", crypto: "blue", wallet: "blue", "1": "box", cent: "box",
  raise: "red", limits: "red", "9": "box", verification: "box", code: "blue", inbox: "blue", "owner's": "blue",
  permission: "red", nobody: "red", worse: "box", tricked: "box", email: "blue", pretending: "red", owner: "blue",
  money: "red", "attacker's": "box", that: "blue", autonomously: "blue", against: "box", lesson: "box", never: "red",
  protect: "green", mindful: "green", cybersecurity: "blue", spend: "red", bypass: "red", restrictions: "red",
  physical: "box", human: "green", approval: "green", payment: "blue", assist: "green", authorise: "red", itself: "red",
  bad: "red", scheme: "box", actors: "red",
};
const STYLE_ONCE = new Set(["that"]); // "Think about that." only
type Chunk = { words: Word[]; start: number; end: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  WORDS.forEach((w, i) => {
    const nx = WORDS[i + 1];
    cur.push(w);
    const chars = cur.map((x) => x.w).join(" ").length;
    if (!nx || /[,.?!]$/.test(w.w) || cur.length >= 3 || chars >= 17 || nx.s - w.e > 0.35 || nx.beat !== w.beat) {
      out.push({ words: cur, start: cur[0].s, end: 0 }); cur = [];
    }
  });
  out.forEach((c, i) => { const last = c.words[c.words.length - 1]; c.end = out[i + 1] ? Math.min(out[i + 1].start, last.e + 0.5) : last.e + 0.5; });
  return out;
})();

const Captions: React.FC<{ t: number; y: number; slate: boolean }> = ({ t, y, slate }) => {
  const c = CHUNKS.find((x) => t >= x.start - 0.05 && t < x.end);
  if (!c) return null;
  const enter = pop(t, c.start - 0.05, 0.2);
  return (
    <div style={{ position: "absolute", left: 30, right: 30, top: y, transform: `translateY(-50%) scale(${0.92 + 0.08 * enter})`,
      display: "flex", justifyContent: "center", alignItems: "center", gap: 18, flexWrap: "nowrap" }}>
      {c.words.map((w, i) => {
        const said = t >= w.s - 0.03;
        const k = clean(w.w);
        let st = STYLE[k];
        if (STYLE_ONCE.has(k) && w.beat !== "think") st = undefined as unknown as Style;
        const text = w.w.replace(/[,]$/, "");
        const base = slate ? "#fff" : P.ink, mute = slate ? "rgba(255,255,255,0.45)" : P.mute;
        if (st === "box" && said) {
          const p = pop(t, w.s - 0.03, 0.22);
          return <span key={i} style={{ fontFamily: BODY, fontWeight: 800, fontSize: 66, color: slate ? P.ink : P.yellow,
            background: slate ? P.yellow : P.blue, padding: "0 14px", borderRadius: 12, transform: `scale(${0.85 + 0.15 * p})`, display: "inline-block",
            whiteSpace: "nowrap" }}>{text}</span>;
        }
        const col = !said ? mute : st === "blue" ? P.blue : st === "red" ? P.red : st === "green" ? P.green : base;
        return <span key={i} style={{ fontFamily: BODY, fontWeight: 800, fontSize: 66, color: col, whiteSpace: "nowrap",
          fontStyle: st && st !== "box" && said ? "italic" : "normal" }}>{text}</span>;
      })}
    </div>
  );
};

// ---------------- face in the marble square ----------------
const TRACK = headtrack as [number, number][];
const head = (f: number) => {
  let cx = 0, top = 0, n = 0;
  for (let k = f - 8; k <= f + 8; k++) {
    const q = TRACK[Math.max(0, Math.min(TRACK.length - 1, k))];
    cx += q[0]; top += q[1]; n++;
  }
  return { cx: cx / n, top: top / n };
};
const FaceSquare: React.FC<{ f: number; rect: Rect; scale: number; headY: number }> = ({ f, rect, scale, headY }) => {
  const hd = head(Math.min(f, TRACK.length - 1));
  const left = rect.w / 2 - hd.cx * scale, top = headY - hd.top * scale;
  const last = Math.round(TOTAL * FPS) - 2;
  const vid = <OffthreadVideo src={staticFile("face.webm")} transparent muted
    style={{ position: "absolute", left, top, width: 1080 * scale, height: 1920 * scale }} />;
  return (
    <div style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 34, overflow: "hidden",
      boxShadow: "0 20px 50px rgba(30,40,70,0.22)" }}>
      <Img src={staticFile("agent/marble.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      {f >= last ? <Freeze frame={last}>{vid}</Freeze> : vid}
    </div>
  );
};

// ---------------- sound ----------------
type Sfx = { at: number; src: string; vol: number; len?: number; from?: number };
const a = (x: string) => `audio/${x}.mp3`;
const RISER_PEAK = 6.25;
const hero = (t: number, len = 1.3): Sfx[] => [
  { at: t - len, src: a("riser_short"), vol: 0.3, len, from: RISER_PEAK - len },
  { at: t - 0.5, src: a("impact_whoosh"), vol: 0.5, len: 1.6 },
];
const SFX: Sfx[] = [
  ...LAYOUTS.slice(1).map((x) => ({ at: x.at - 0.08, src: a("whoosh_fast"), vol: 0.28 })),
  ...CARDS.slice(1).filter((c) => !LAYOUTS.some((x) => Math.abs(x.at - c.start) < 0.2)).map((c) => ({ at: c.start - 0.05, src: a("sweep"), vol: 0.2 })),
  ...hero(T.how + 0.05),                 // 9/10
  ...hero(T.sent, 1.1),                  // sent money to the attacker
  { at: T.nobody, src: a("pop_whoosh"), vol: 0.4 },        // NO PERMISSION stamp
  { at: T.againstW + 0.15, src: a("pop_whoosh"), vol: 0.35 },
  { at: T.worse - 0.02, src: a("impact_logo"), vol: 0.3, len: 1.0 },
  { at: T.yale - 0.25, src: a("pop_dry"), vol: 0.2 }, { at: T.yale + 0.05, src: a("pop_dry"), vol: 0.2 }, { at: T.ten, src: a("pop_dry"), vol: 0.2 },
  { at: T.code, src: a("ui_click"), vol: 0.3 }, { at: T.email, src: a("ui_click"), vol: 0.28 },
  ...[T.never, T.mindful, T.spend, T.bypass].map((x) => ({ at: x - 0.05, src: a("pop_dry"), vol: 0.22 })),
  { at: T.physical, src: a("ding"), vol: 0.16, len: 1.2 },
  { at: T.assistW, src: a("pop_dry"), vol: 0.24 }, { at: T.authorise, src: a("pop_dry"), vol: 0.24 },
  { at: TOTAL + 0.15, src: "audio/sting_signature.wav", vol: 0.7, len: 1.4 },
];
type Gap = { s: number; e: number };
const GAPS: Gap[] = WORDS.slice(1).map((w, i) => ({ s: WORDS[i].e, e: w.s })).filter((g) => g.e - g.s > 0.18);
const tri = (t: number, s: number, e: number, r: number) => Math.max(0, Math.min(1, (t - s) / r, (e - t) / r));
const musicLevel = (t: number) => {
  const gap = Math.max(0, ...GAPS.map((g) => tri(t, g.s - 0.05, g.e + 0.05, 0.12)), ...LAYOUTS.slice(1).map((x) => tri(t, x.at - 0.25, x.at + 0.35, 0.2)));
  let v = 0.05 + 0.05 * gap;
  if (t >= T.worse - 0.05 && t < T.worse + 0.5) v = 0;           // "And it gets worse." lands in silence
  if (t >= T.think - 0.05 && t < T.against) v = 0.02;            // "Think about that."
  if (t >= T.end - 0.3 && t < TOTAL + 0.15) v = 0;               // drop before the sting
  if (t >= TOTAL + 0.15) v = 0.09;
  return v;
};

// ---------------- composition ----------------
export const AgentReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const L = layoutAt(t);
  const tail = t >= TOTAL + 0.15;
  const cardRect = tail ? CARD.card : rectFor(CARD, L);
  const faceRect = rectFor(FACE, L);
  const capY = CAPTION_Y[L.prev] + (CAPTION_Y[L.cur] - CAPTION_Y[L.prev]) * L.p;
  const slate = ease(t, T.lesson - 0.1, 0.4);
  const titleShow = L.cur === "title" ? 1 : L.prev === "title" ? 1 - L.p : 0;
  const cardShow = L.cur === "face" ? 1 - L.p : L.prev === "face" ? L.p : 1;
  const card = CARDS.find((c) => t >= c.start && t < c.end);
  const cardIn = card ? pop(t, card.start, 0.28) : 1;
  const faceScale = 0.8 + (1.0 - 0.8) * (L.cur === "face" ? L.p : L.prev === "face" ? 1 - L.p : 0);
  const headY = 4 + 30 * (L.cur === "face" ? L.p : 0);
  // a quick punch-in on every layout switch
  const punch = L.start > 0 ? 1 + 0.035 * (1 - ease(t, L.start, 0.25)) : 1;

  return (
    <AbsoluteFill style={{ background: P.sky }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <Board t={t} slate={slate} />
        <FaceSquare f={frame} rect={faceRect} scale={faceScale} headY={headY} />
        {card && cardShow > 0.01 && (
          <div style={{ opacity: cardShow, transform: `scale(${0.9 + 0.1 * cardShow})`, transformOrigin: "50% 30%", position: "absolute", inset: 0 }}>
            <RimCard t={t} rect={cardRect} dark={card.dark}>
              <div style={{ position: "absolute", inset: 0, opacity: clamp01(cardIn * 1.6), transform: `scale(${0.96 + 0.04 * cardIn})` }}>
                {card.render(t, cardRect.w - 14, cardRect.h - 14)}
              </div>
            </RimCard>
          </div>
        )}
        {titleShow > 0.01 && (
          <Title t={t} rect={TITLE} show={titleShow}
            lines={[[["9", true], ["of", true], ["10", true], ["AIs", false], ["raised", false]], [["their", false], ["own", false], ["spending", false], ["limit", false]]]} />
        )}
        {!tail && <Captions t={t} y={capY} slate={slate > 0.5} />}
      </AbsoluteFill>

      <Audio src={staticFile("voice.wav")} />
      <Audio src={staticFile("audio/music_bed.wav")}
        volume={(f) => musicLevel(f / fps) * interpolate(f, [0, 10, durationInFrames - 30, durationInFrames - 1], [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {SFX.filter((s) => s.at >= 0).map((s, i) => (
        <Sequence key={i} from={Math.round(s.at * fps)} durationInFrames={Math.max(3, Math.round((s.len ?? 1.0) * fps))}>
          <Audio src={staticFile(s.src)} volume={s.vol} startFrom={Math.round((s.from ?? 0) * fps)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
