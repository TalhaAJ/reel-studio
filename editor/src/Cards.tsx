import React from "react";
import { Img, staticFile } from "remotion";
import captions from "../public/captions.json";
import cutsData from "../public/cuts.json";
import envelope from "../public/envelope.json";
import { C, MONO, SANS, ease, lerp } from "./theme";
import { T } from "./timeline";

type Box = { x: number; y: number; w: number; h: number };
type CardProps = { t: number; local: number; w: number; h: number };

// Pan/zoom an image so `rect` (image px) fills the viewport; animate between keyed focus rects.
const focusTransform = (rect: Box, vw: number, vh: number) => {
  const s = Math.min(vw / rect.w, vh / rect.h);
  return { s, x: vw / 2 - (rect.x + rect.w / 2) * s, y: vh / 2 - (rect.y + rect.h / 2) * s };
};
const animatedFocus = (t: number, keys: { at: number; rect: Box }[], vw: number, vh: number) => {
  let i = 0;
  while (i + 1 < keys.length && t >= keys[i + 1].at) i++;
  const a = focusTransform(keys[Math.max(0, i - 1)].rect, vw, vh);
  const b = focusTransform(keys[i].rect, vw, vh);
  const p = i === 0 ? 1 : ease(t, keys[i].at, 0.45);
  return { s: lerp(a.s, b.s, p), x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) };
};

// ---------------- hook: Claude Code terminal ----------------
const PROMPT = "edit my raw footage in the style of my favourite reel";
export const TerminalCard: React.FC<CardProps> = ({ local }) => {
  const typed = PROMPT.slice(0, Math.floor(Math.max(0, local - 0.3) * 24));
  const steps: [number, string][] = [
    [3.15, "Picked the best take of every line"],
    [3.75, "Cut out every pause"],
    [4.55, "Added captions + motion graphics"],
  ];
  const cursorOn = Math.floor(local * 2.5) % 2 === 0;
  return (
    <div style={{ padding: "30px 34px", fontFamily: MONO, fontSize: 31, lineHeight: 1.5, color: "#e6edf3" }}>
      <div style={{ color: "#d2a8ff", fontSize: 24, marginBottom: 18 }}>✻ Claude Code</div>
      <div>
        <span style={{ color: C.accentHot }}>&gt; </span>{typed}
        {typed.length < PROMPT.length && cursorOn && <span style={{ background: "#e6edf3" }}>&nbsp;</span>}
      </div>
      <div style={{ marginTop: 22 }}>
        {steps.map(([at, label]) => {
          if (local < at) return null;
          const p = ease(local, at, 0.2);
          return (
            <div key={label} style={{ opacity: p, transform: `translateX(${(1 - p) * -20}px)`, marginTop: 10 }}>
              <span style={{ color: "#3fb950" }}>✓ </span>{label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------- remotion.dev with zooms + GitHub highlight ----------------
const SHOT_W = 1520;
const GH_BTN: Box = { x: 855, y: 1208, w: 363, h: 92 };
export const RemotionCard: React.FC<CardProps> = ({ t, w, h }) => {
  const keys = [
    { at: 0, rect: { x: 0, y: 0, w: SHOT_W, h: (SHOT_W * h) / w } },
    { at: T.free - 0.1, rect: { x: 760, y: 1080, w: 560, h: 340 } },   // "free" -> GitHub button
    { at: T.turns - 0.05, rect: { x: 280, y: 560, w: 960, h: 520 } },   // "turns code into video" -> editor
  ];
  const f = animatedFocus(t, keys, w, h);
  const hl = ease(t, T.free + 0.15, 0.3) * (1 - ease(t, T.turns - 0.1, 0.15));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff" }}>
      <div style={{ position: "absolute", left: f.x, top: f.y, transform: `scale(${f.s})`, transformOrigin: "0 0" }}>
        <Img src={staticFile("shots/remotion_narrow.png")} style={{ width: SHOT_W, display: "block" }} />
        <div style={{
          position: "absolute", left: GH_BTN.x - 10, top: GH_BTN.y - 10, width: GH_BTN.w + 20, height: GH_BTN.h + 20,
          border: `5px solid ${C.accent}`, borderRadius: 18, opacity: hl,
          boxShadow: "0 0 24px rgba(255,106,26,0.6)",
        }} />
      </div>
    </div>
  );
};

// ---------------- drop footage -> cut pauses ----------------
const cuts = cutsData.cuts as { s: number; e: number; t: number }[];
const env = envelope.env as number[];
const SRC_DUR = envelope.duration as number;
const fmt = (sec: number) => {
  const r = Math.round(sec);
  return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, "0")}`;
};

export const DropCard: React.FC<CardProps> = ({ t, w }) => {
  const dropped = ease(t, T.drop, 0.35);
  const tl = ease(t, T.cut - 0.5, 0.3);
  const collapse = ease(t, T.cut, 1.5);
  const done = ease(t, T.automatically, 0.3);
  const pad = 40;
  const barW = w - pad * 2;
  const total = cutsData.total;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fbfbfc", fontFamily: SANS }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "26px 40px 0", fontFamily: MONO, fontSize: 22, color: "#6b7280" }}>
        <span>01 / Raw footage</span><span>Formats: MOV, MP4</span>
      </div>
      {/* drop zone */}
      <div style={{
        position: "absolute", left: pad, top: 76, width: barW, height: 220, borderRadius: 18,
        border: dropped > 0 ? `4px solid ${C.accent}` : "3px dashed #c6ccd4",
        boxShadow: dropped > 0 ? "0 0 22px rgba(255,106,26,0.35)" : undefined,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff",
      }}>
        {dropped === 0 ? (
          <>
            <div style={{ width: 70, height: 70, border: "2px solid #d4d8de", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, color: "#9aa1a9" }}>↑</div>
            <div style={{ fontSize: 34, fontWeight: 600, marginTop: 16, color: "#1f2328" }}>Drag your raw footage here</div>
          </>
        ) : (
          <div style={{
            transform: `translateY(${(1 - dropped) * -160}px)`, opacity: dropped,
            display: "flex", alignItems: "center", gap: 20, padding: "22px 30px", borderRadius: 14,
            background: "#fff4ec", border: "2px solid #ffd2b5", fontSize: 34, fontWeight: 600, color: "#1f2328",
          }}>
            <span style={{ fontSize: 30, color: C.accent }}>▶</span> IMG_2292.MOV
            <span style={{ fontFamily: MONO, fontSize: 26, color: "#6b7280", fontWeight: 400 }}>{fmt(SRC_DUR)} · 1080×1920</span>
          </div>
        )}
      </div>
      {/* timeline: real audio envelope; kept pieces (blue) slide together as the pauses (grey) vanish */}
      <div style={{ position: "absolute", left: pad, top: 324, width: barW, opacity: tl }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: "#6b7280", marginBottom: 12 }}>
          {collapse < 1 ? "Removing pauses + bad takes…" : "Best takes only"}
        </div>
        <svg width={barW} height={104}>
          {env.map((v, i) => {
            const ts = i * envelope.bin;
            const c = cuts.find((k) => ts >= k.s && ts < k.e);
            const x0 = (ts / SRC_DUR) * barW;
            const x1 = c ? ((c.t + (ts - c.s)) / SRC_DUR) * barW : x0;
            const x = lerp(x0, x1, collapse);
            const bh = Math.max(4, v * 96);
            return (
              <rect key={i} x={x} y={52 - bh / 2} width={Math.max(1.2, barW / env.length - 0.6)} height={bh} rx={1}
                fill={c ? C.accent : "#c3c9d1"} opacity={c ? 1 : 1 - collapse} />
            );
          })}
        </svg>
        <div style={{
          marginTop: 18, display: "flex", alignItems: "baseline", gap: 18, opacity: done,
          transform: `translateY(${(1 - done) * 12}px)`,
        }}>
          <span style={{ fontSize: 44, fontWeight: 700, color: "#1f2328" }}>{fmt(SRC_DUR)}</span>
          <span style={{ fontSize: 40, color: "#9aa1a9" }}>→</span>
          <span style={{ fontSize: 56, fontWeight: 800, color: C.accent }}>{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
};

// ---------------- transcript, word by word ----------------
type Cap = { w: string; s: number; e: number; beat: string };
const TRANSCRIPT = (captions as Cap[]).filter((c) => c.beat === "then" && c.s < T.animated - 0.05);
export const TranscriptCard: React.FC<CardProps> = ({ t }) => {
  const shown = TRANSCRIPT.filter((c) => t >= c.s - 0.03);
  const visible = shown.slice(-10);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", padding: "22px 40px", fontFamily: MONO }}>
      <div style={{ fontSize: 22, color: "#6b7280", marginBottom: 14 }}>transcript.json · word timings</div>
      {visible.map((c, i) => {
        const latest = i === visible.length - 1;
        const p = ease(t, c.s - 0.03, 0.12);
        return (
          <div key={c.s} style={{ display: "flex", gap: 34, fontSize: 32, lineHeight: "52px", opacity: lerp(0.3, 1, p) }}>
            <span style={{ color: "#9aa1a9" }}>00:{c.s.toFixed(2).padStart(5, "0")}</span>
            <span style={{
              color: latest ? "#fff" : "#1f2328", background: latest ? C.accent : "transparent",
              borderRadius: 8, padding: "0 12px", fontWeight: 600,
            }}>{c.w.replace(/[,.]$/, "")}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------- motion graphics: zooms + glow ----------------
export const MotionCard: React.FC<CardProps> = ({ t, w, h }) => {
  const keys = [
    { at: 0, rect: { x: 280, y: 560, w: 960, h: 520 } },     // editor overview
    { at: T.screen - 0.05, rect: { x: 316, y: 600, w: 440, h: 260 } }, // "screen recordings" -> preview
    { at: T.zooms - 0.05, rect: { x: 316, y: 880, w: 440, h: 190 } }, // "zooms" -> timeline
    { at: T.even - 0.1, rect: { x: 280, y: 560, w: 960, h: 520 } },  // back out for the counter
  ];
  const f = animatedFocus(t, keys, w, h);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#111318" }}>
      <div style={{ position: "absolute", left: f.x, top: f.y, transform: `scale(${f.s})`, transformOrigin: "0 0" }}>
        <Img src={staticFile("shots/remotion_narrow.png")} style={{ width: SHOT_W, display: "block" }} />
      </div>
    </div>
  );
};

// ---------------- style guide report ----------------
const ROWS = (): [number, string, string, string][] => [
  [T.plus + 0.3, "Split layout + face cut-out", "card on top, you on the bottom", "#ffd9c2"],
  [T.reel + 0.2, "Word-by-word captions", "synced to every word you say", "#ffe7a8"],
  [T.study, "Marker on the key word", "one word per line gets the orange", "#ffcfb0"],
  [T.study + 0.55, "Neon glowing borders", "light travels round the frame", "#ffe0cc"],
];
export const StyleCard: React.FC<CardProps> = ({ t }) => (
  <div style={{ position: "absolute", inset: 0, background: "#fff", padding: "30px 40px", fontFamily: SANS }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{ background: "#111", color: "#fff", fontSize: 18, fontWeight: 800, letterSpacing: 1, padding: "6px 12px", borderRadius: 4 }}>STYLE GUIDE</span>
      <span style={{ fontFamily: MONO, fontSize: 20, color: "#9aa1a9" }}>ID: reel_you_love</span>
    </div>
    <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 56, letterSpacing: -1.5, color: "#111", marginTop: 18, lineHeight: 1.05 }}>
      How the reel is built
    </div>
    {ROWS().map(([at, label, sub, hl], i) => {
      if (t < at - 0.2) return null;
      const p = ease(t, at, 0.25);
      return (
        <div key={label} style={{ marginTop: 22, opacity: lerp(0.2, 1, p) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: MONO, fontSize: 22, color: "#b0b6bd" }}>0{i + 1}</span>
            <span style={{ fontSize: 34, fontWeight: 700, color: "#111", background: `linear-gradient(90deg, ${hl} ${p * 100}%, transparent ${p * 100}%)`, padding: "2px 8px", borderRadius: 4 }}>{label}</span>
          </div>
          <div style={{ fontSize: 24, color: "#7a828b", marginLeft: 54, marginTop: 4, fontStyle: "italic" }}>“{sub}”</div>
        </div>
      );
    })}
  </div>
);

// ---------------- frame-by-frame grid ----------------
const TILE_W = 216, TILE_H = 384, GAP = 4, COLS = 8, ROWS_N = 3;
const SHEET_W = COLS * TILE_W + (COLS - 1) * GAP;
export const FramesCard: React.FC<CardProps> = ({ local, w, h }) => {
  const s = w / SHEET_W;
  const idx = Math.floor(Math.max(0, local - 0.2) / 0.11) % (COLS * ROWS_N);
  const col = idx % COLS, row = Math.floor(idx / COLS);
  const top = (h - (ROWS_N * TILE_H + (ROWS_N - 1) * GAP) * s) / 2;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff" }}>
      <div style={{ position: "absolute", left: 0, top, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <Img src={staticFile("shots/frames.jpg")} style={{ display: "block" }} />
        <div style={{
          position: "absolute", left: col * (TILE_W + GAP) - 6, top: row * (TILE_H + GAP) - 6,
          width: TILE_W + 12, height: TILE_H + 12, border: `8px solid ${C.accent}`, borderRadius: 10,
          boxShadow: "0 0 30px rgba(255,106,26,0.8)",
        }} />
      </div>
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 18, textAlign: "center", fontFamily: MONO, fontSize: 24, color: "#5f6670",
      }}>analysing frame {String(idx + 1).padStart(2, "0")} / 24</div>
    </div>
  );
};
