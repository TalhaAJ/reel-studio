import React from "react";
import { Easing, Img, interpolate, staticFile } from "remotion";
import { BODY, HEAD, P, Rect } from "./theme";

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (t: number, s: number, d: number) =>
  interpolate(t, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
export const pop = (t: number, s: number, d: number) =>
  interpolate(t, [s, s + d], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.8)) });

// ---------- board ----------
const TRIS = Array.from({ length: 16 }, (_, i) => {
  const r = (k: number) => ((Math.sin(i * 91.7 + k * 13.3) + 1) / 2);
  return { x: r(1) * 1180 - 50, y: r(2) * 2000 - 40, s: 90 + r(3) * 220, rot: r(4) * 360, o: 0.3 + r(5) * 0.35, dr: (r(6) - 0.5) * 6 };
});
export const Board: React.FC<{ t: number; slate: number }> = ({ t, slate }) => {
  const bg = interpolate(slate, [0, 1], [0, 1]);
  const mix = (a: number[], b: number[]) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * bg)).join(",")})`;
  return (
    <div style={{ position: "absolute", inset: 0, background: mix([233, 238, 247], [140, 149, 161]) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {TRIS.map((q, i) => (
          <polygon key={i} points="0,-1 0.87,0.5 -0.87,0.5"
            transform={`translate(${q.x} ${q.y + Math.sin(t * 0.4 + i) * 8}) rotate(${q.rot + t * q.dr}) scale(${q.s})`}
            fill={slate > 0.5 ? "#A3ABB6" : "#FFFFFF"} opacity={q.o} />
        ))}
      </svg>
    </div>
  );
};

// ---------- headline box ----------
export const Title: React.FC<{ t: number; rect: Rect; show: number; lines: [string, boolean][][] }> = ({ t, rect, show, lines }) => {
  const p = pop(t, 0.05, 0.4);
  return (
    <div style={{
      position: "absolute", left: rect.x, top: rect.y - (1 - show) * 380, width: rect.w, height: rect.h, opacity: show,
      background: "#0B0B0C", borderRadius: 22, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      transform: `scale(${0.85 + 0.15 * p})`, boxShadow: "0 18px 40px rgba(20,30,60,0.22)",
    }}>
      {lines.map((ln, i) => (
        <div key={i} style={{ fontFamily: HEAD, fontSize: 92, lineHeight: 1.14, letterSpacing: -0.5, whiteSpace: "nowrap" }}>
          {ln.map(([w, hi], j) => <span key={j} style={{ color: hi ? P.yellow : "#fff" }}>{(j ? " " : "") + w}</span>)}
        </div>
      ))}
    </div>
  );
};

// ---------- rainbow-rimmed card ----------
export const RimCard: React.FC<{ t: number; rect: Rect; dark?: boolean; children: React.ReactNode }> = ({ t, rect, dark, children }) => (
  <div style={{
    position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h, borderRadius: 26, padding: 7,
    background: `conic-gradient(from ${t * 40}deg, ${P.rim.join(",")})`,
    boxShadow: "0 0 34px rgba(167,139,250,0.35), 0 22px 50px rgba(30,40,80,0.18)",
  }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 20, overflow: "hidden", background: dark ? P.navy : "#fff" }}>
      {children}
    </div>
  </div>
);

// ---------- screenshot with marks placed on the real words ----------
export type View = { at: number; cx: number; cy: number; cw: number };
export type Mark = { at: number; until?: number; kind: "hl" | "box" | "ring"; lines: number[][]; color?: string };

const viewAt = (views: View[], t: number) => {
  let v = views[0];
  for (let i = 1; i < views.length; i++) {
    const p = ease(t, views[i].at, 0.7);
    if (p <= 0) break;
    v = { at: 0, cx: v.cx + (views[i].cx - v.cx) * p, cy: v.cy + (views[i].cy - v.cy) * p, cw: v.cw + (views[i].cw - v.cw) * p };
  }
  return v;
};

export const Shot: React.FC<{
  t: number; w: number; h: number; src: string; nat: [number, number]; views: View[]; marks?: Mark[]; source?: string;
}> = ({ t, w, h, src, nat, views, marks = [], source }) => {
  const v = viewAt(views, t);
  const s = w / v.cw;
  let cy = v.cy;
  if (nat[1] * s > h) cy = Math.max(h / 2 / s, Math.min(nat[1] - h / 2 / s, cy)); // never show past the page edges
  const ox = w / 2 - v.cx * s, oy = h / 2 - cy * s;
  const X = (x: number) => ox + x * s, Y = (y: number) => oy + y * s;
  return (
    <>
      <Img src={staticFile(src)} style={{ position: "absolute", left: ox, top: oy, width: nat[0] * s, height: nat[1] * s }} />
      {marks.map((m, i) => {
        if (t < m.at || (m.until !== undefined && t >= m.until)) return null;
        if (m.kind === "hl") {
          return m.lines.map(([x, y, lw, lh], k) => {
            const p = ease(t, m.at + k * 0.18, 0.28);
            return <div key={`${i}-${k}`} style={{
              position: "absolute", left: X(x) - 4, top: Y(y) - 2, width: (lw * s + 8) * p, height: lh * s + 4,
              background: m.color ?? "rgba(255,226,0,0.5)", mixBlendMode: "multiply", borderRadius: 4,
            }} />;
          });
        }
        const [x, y, lw, lh] = m.lines[0];
        const p = pop(t, m.at, 0.35);
        if (m.kind === "box") {
          return <div key={i} style={{
            position: "absolute", left: X(x) - 10, top: Y(y) - 8, width: lw * s + 20, height: lh * s + 16,
            border: `5px solid ${m.color ?? P.blue}`, borderRadius: 12, opacity: clamp01(p * 2),
            transform: `scale(${1.25 - 0.25 * p})`, boxShadow: `0 0 18px ${m.color ?? P.blue}55`,
          }} />;
        }
        // hand-drawn ring
        const d = ease(t, m.at, 0.45);
        const rx = lw * s / 2 + 26, ry = lh * s / 2 + 22, cx = X(x) + lw * s / 2, cyy = Y(y) + lh * s / 2;
        const L = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2) * 1.15;
        return (
          <svg key={i} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={w} height={h}>
            <path d={`M ${cx - rx * 0.2} ${cyy - ry} A ${rx} ${ry} -3 1 1 ${cx - rx} ${cyy + ry * 0.1} A ${rx * 1.03} ${ry * 0.98} 4 0 1 ${cx + rx * 0.1} ${cyy - ry * 1.08}`}
              fill="none" stroke={m.color ?? P.red} strokeWidth={7} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - d)} />
          </svg>
        );
      })}
      {source && <SourceTag text={source} />}
    </>
  );
};

export const SourceTag: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    position: "absolute", left: 18, bottom: 18, padding: "8px 16px", borderRadius: 10, background: "rgba(40,42,48,0.88)",
    color: "#fff", fontFamily: BODY, fontWeight: 700, fontSize: 24,
  }}>{text}</div>
);

export const Pills: React.FC<{ t: number; items: { at: number; text: string }[] }> = ({ t, items }) => (
  <div style={{ position: "absolute", right: 18, top: 18, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
    {items.filter((x) => t >= x.at).map((x, i) => {
      const p = pop(t, x.at, 0.3);
      return <div key={i} style={{
        padding: "8px 20px", borderRadius: 12, background: P.blue, color: "#fff", fontFamily: BODY, fontWeight: 800, fontSize: 30,
        transform: `translateX(${(1 - p) * 60}px) scale(${0.8 + 0.2 * p})`, opacity: clamp01(p * 2), boxShadow: "0 6px 18px rgba(47,91,234,0.35)",
      }}>{x.text}</div>;
    })}
  </div>
);

export const Stamp: React.FC<{ t: number; at: number; text: string; color?: string; x: number; y: number }> = ({ t, at, text, color = P.red, x, y }) => {
  if (t < at) return null;
  const p = pop(t, at, 0.3);
  return (
    <div style={{
      position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(-9deg) scale(${2.2 - 1.2 * p})`, opacity: clamp01(p * 3),
      padding: "8px 26px", border: `7px solid ${color}`, borderRadius: 14, background: "rgba(255,255,255,0.92)",
      color, fontFamily: HEAD, fontSize: 76, letterSpacing: 1, whiteSpace: "nowrap", boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    }}>{text}</div>
  );
};

// ---------- dark stat panel, as in the reference ("958 pieces of content per day") ----------
export const Stat: React.FC<{ t: number; at: number; w: number; h: number; from: number; to: number; fmt: (n: number) => string; label: string; tag?: string }> =
  ({ t, at, w, h, from, to, fmt, label, tag }) => {
    const p = pop(t, at, 0.35);
    const n = from + (to - from) * ease(t, at + 0.1, 0.9);
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F7F8FB" }}>
        <div style={{
          width: w * 0.78, padding: "26px 0 34px", borderRadius: 26, background: P.navy, textAlign: "center",
          transform: `scale(${0.7 + 0.3 * p})`, boxShadow: "0 24px 50px rgba(10,15,30,0.35)",
        }}>
          <div style={{ color: "#8A93A6", fontSize: 30, letterSpacing: 18, fontFamily: BODY }}>▶ ▣ ♪ ◎</div>
          <div style={{ color: P.lime, fontFamily: BODY, fontWeight: 800, fontSize: 170, lineHeight: 1.1 }}>{fmt(n)}</div>
          <div style={{ color: "#fff", fontFamily: BODY, fontWeight: 700, fontSize: 40 }}>{label}</div>
        </div>
        {tag && t > at + 0.9 && (
          <div style={{
            marginTop: 26, padding: "8px 20px", borderRadius: 10, background: "#111", color: "#fff", fontFamily: BODY, fontWeight: 800, fontSize: 30,
            transform: `scale(${pop(t, at + 0.9, 0.3)})`,
          }}>{tag}</div>
        )}
      </div>
    );
  };
