import React from "react";
import captions from "../public/captions.json";
import { C, SANS, ease, lerp, pop } from "./theme";
import { CTA_START, EMPHASIS, Mode } from "./timeline";

type Word = { w: string; s: number; e: number; beat: string };
type Chunk = { words: Word[]; start: number; end: number; emph: number };

const MAX_WORDS = 3;
const MAX_CHARS = 20;

const clean = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

const buildChunks = (ws: Word[]): Chunk[] => {
  const chunks: Chunk[] = [];
  let cur: Word[] = [];
  ws.forEach((w, i) => {
    const next = ws[i + 1];
    cur.push(w);
    const chars = cur.map((x) => x.w).join(" ").length;
    const brk = !next || /[,.?!]$/.test(w.w) || cur.length >= MAX_WORDS || chars >= MAX_CHARS
      || next.s - w.e > 0.35 || next.beat !== w.beat;
    if (brk) {
      const emph = cur.findIndex((x) => EMPHASIS.has(clean(x.w)));
      chunks.push({ words: cur, start: cur[0].s, end: 0, emph });
      cur = [];
    }
  });
  chunks.forEach((c, i) => {
    const last = c.words[c.words.length - 1];
    c.end = chunks[i + 1] ? Math.min(chunks[i + 1].start, last.e + 0.6) : last.e + 0.6;
  });
  return chunks;
};

export const CHUNKS = buildChunks((captions as Word[]).filter((w) => w.s < CTA_START - 0.01));
/** Times at which an emphasis word appears (used to place sound effects). */
export const EMPHASIS_TIMES = CHUNKS.filter((c) => c.emph >= 0).map((c) => c.words[c.emph].s);

export const Captions: React.FC<{ t: number; mode: Mode }> = ({ t, mode }) => {
  const chunk = CHUNKS.find((c) => t >= c.start - 0.04 && t < c.end);
  if (!chunk) return null;
  const onDark = mode !== "A";
  const y = mode === "A" ? 1000 : mode === "B" ? 1380 : 1330;
  return (
    <div style={{
      position: "absolute", top: y, left: 50, right: 50, transform: "translateY(-50%)",
      display: "flex", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "wrap",
    }}>
      {chunk.words.map((w, i) => {
        if (t < w.s - 0.04) return null;
        const p = pop(t, w.s - 0.04, 0.2);
        const em = i === chunk.emph;
        const text = w.w.replace(/[,.]$/, "");
        if (em) {
          const wipe = ease(t, w.s - 0.02, 0.16);
          return (
            <span key={i} style={{
              position: "relative", display: "inline-block", padding: "0 16px 6px",
              transform: `translateY(${(1 - p) * 20}px) rotate(-1.5deg) scale(${lerp(0.85, 1, p)})`,
            }}>
              <span style={{
                position: "absolute", inset: "4px 0 0 0", background: C.accent, borderRadius: 12,
                transform: `scaleX(${wipe})`, transformOrigin: "left",
                boxShadow: `0 8px 24px rgba(${C.accentGlow},0.45)`,
              }} />
              <span style={{
                position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 80, letterSpacing: -2, color: "#fff",
              }}>{text}</span>
            </span>
          );
        }
        return (
          <span key={i} style={{
            fontFamily: SANS, fontWeight: 800, fontSize: 72, letterSpacing: -1.5,
            color: onDark ? "#fff" : C.ink, display: "inline-block",
            opacity: Math.min(1, p * 2.5), transform: `translateY(${(1 - p) * 18}px)`,
            textShadow: onDark ? "0 4px 18px rgba(0,0,0,0.6)" : "none",
          }}>{text}</span>
        );
      })}
    </div>
  );
};
