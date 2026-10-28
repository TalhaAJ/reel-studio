import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { C, MONO, SANS, ease, lerp, pop } from "./theme";
import { Mode } from "./timeline";

// ---------- geometry (1080x1920) ----------
export type Rect = { x: number; y: number; w: number; h: number };
export const CARD_A: Rect = { x: 117, y: 258, w: 846, h: 666 };
export const CARD_HOOK: Rect = { x: 117, y: 350, w: 846, h: 580 };
export const CARD_B: Rect = { x: 99, y: 250, w: 882, h: 1024 };
export const FACE_CARD: Rect = { x: 78, y: 1341, w: 924, h: 640 };
export const CHROME_H = 64;

// ---------- backgrounds ----------
const Grain: React.FC<{ opacity: number }> = ({ opacity }) => (
  <svg width="1080" height="1920" style={{ position: "absolute", inset: 0, opacity, mixBlendMode: "multiply" }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="1080" height="1920" filter="url(#grain)" />
  </svg>
);

/** Warm paper with a slowly drifting dot grid. */
export const LightBg: React.FC = () => {
  const f = useCurrentFrame();
  const drift = (f * 0.4) % 40;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.paper} 0%, ${C.paperDeep} 100%)` }}>
      <AbsoluteFill style={{
        backgroundImage: `radial-gradient(${C.dot} 2.4px, transparent 2.6px)`,
        backgroundSize: "40px 40px", backgroundPosition: `${drift}px ${drift}px`,
        maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.35))",
      }} />
      <div style={{
        position: "absolute", right: -220, top: -180, width: 700, height: 700, borderRadius: "50%",
        background: C.accent, opacity: 0.1, filter: "blur(120px)",
      }} />
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};

export const DarkBg: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #2b2522 0%, #171412 55%, #0c0a09 100%)" }}>
    <AbsoluteFill style={{
      backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 2px, transparent 2.2px)", backgroundSize: "40px 40px",
    }} />
    <div style={{
      position: "absolute", left: 160, top: 460, width: 760, height: 640, borderRadius: "50%",
      background: C.accent, opacity: 0.17, filter: "blur(150px)",
    }} />
    <Grain opacity={0.05} />
  </AbsoluteFill>
);

/** Full-face background: charcoal with an orange rim glow behind the head. */
export const FaceBg: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, #3a302b 0%, #1d1917 55%, #0e0c0b 100%)" }}>
    <div style={{
      position: "absolute", left: 140, top: 180, width: 800, height: 900, borderRadius: "50%",
      background: `radial-gradient(circle, rgba(${C.accentGlow},0.55) 0%, rgba(${C.accentGlow},0) 65%)`,
      filter: "blur(40px)",
    }} />
    <Grain opacity={0.06} />
  </AbsoluteFill>
);

// ---------- face ----------
const SRC_FACE_TOP = 525; // y of the top of the head in the source frame

export const Face: React.FC<{ mode: Mode; t: number; modeStart: number }> = ({ mode, t, modeStart }) => {
  if (mode === "B") {
    // keep the decoder warm but invisible
    return (
      <AbsoluteFill style={{ opacity: 0 }}>
        <OffthreadVideo src={staticFile("face.webm")} transparent muted style={{ width: 1, height: 1 }} />
      </AbsoluteFill>
    );
  }
  let s: number, left: number, top: number, clip: string | undefined;
  if (mode === "A") {
    s = 0.92;
    left = (1080 - 1080 * s) / 2;
    top = 1062 - SRC_FACE_TOP * s;
    const { x, y, w } = FACE_CARD;
    // head may break out above the card; below the card top, stay inside the card's width
    clip = `polygon(0 0, 1080px 0, 1080px ${y}px, ${x + w}px ${y}px, ${x + w}px 1920px, ${x}px 1920px, ${x}px ${y}px, 0 ${y}px)`;
  } else {
    // full face, slow push-in
    s = lerp(1.32, 1.4, Math.min(1, (t - modeStart) / 6));
    left = 540 - 575 * s;
    top = 770 - 1000 * s;
  }
  return (
    <AbsoluteFill style={{ clipPath: clip }}>
      {mode === "A" && (
        <div style={{
          position: "absolute", left: FACE_CARD.x, top: FACE_CARD.y, width: FACE_CARD.w, height: FACE_CARD.h,
          borderRadius: 46, overflow: "hidden",
          background: "linear-gradient(180deg, #3b332e 0%, #231e1b 100%)",
          boxShadow: "0 24px 60px rgba(40,25,10,0.28)",
        }}>
          {/* orange rim light behind the shoulders + top edge line */}
          <div style={{
            position: "absolute", left: 160, top: -120, width: 600, height: 420, borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${C.accentGlow},0.5) 0%, rgba(${C.accentGlow},0) 70%)`,
          }} />
          <div style={{ position: "absolute", left: 46, right: 46, top: 0, height: 3, background: C.accent, opacity: 0.8 }} />
        </div>
      )}
      <OffthreadVideo src={staticFile("face.webm")} transparent muted
        style={{ position: "absolute", left, top, width: 1080 * s, height: 1920 * s }} />
    </AbsoluteFill>
  );
};

// ---------- neon card ----------
export const NeonCard: React.FC<{
  rect: Rect; local: number; url?: string; dark?: boolean; glow?: number; children: React.ReactNode;
}> = ({ rect, local, url, dark, glow = 1, children }) => {
  const f = useCurrentFrame();
  const p = pop(local, 0, 0.32);
  const fade = ease(local, 0, 0.12);
  const flash = Math.max(0, 1 - Math.abs(local - 0.22) / 0.18); // border flares as the card lands
  const g = glow + flash * 0.8;
  const angle = (f * 4) % 360;
  const ring = `conic-gradient(from ${angle}deg, transparent 0deg, ${C.ring} 28deg, transparent 75deg, transparent 180deg, ${C.ring} 208deg, transparent 255deg)`;
  const mask = {
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
  } as React.CSSProperties;
  return (
    <div style={{
      position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h,
      opacity: fade, transform: `translateY(${(1 - p) * 90}px) scale(${lerp(0.94, 1, p)})`,
    }}>
      {/* outer glow */}
      <div style={{
        position: "absolute", inset: -2, borderRadius: 26,
        boxShadow: `0 0 ${22 * g}px ${4 * g}px rgba(${C.accentGlow},${0.42 * Math.min(g, 1.7)}), 0 30px 80px rgba(30,15,5,0.25)`,
      }} />
      <div style={{
        position: "absolute", inset: 0, borderRadius: 24, overflow: "hidden",
        border: `3px solid ${C.accent}`, background: dark ? "#14110f" : "#fff",
      }}>
        <div style={{
          height: CHROME_H, display: "flex", alignItems: "center", gap: 12, padding: "0 22px",
          background: dark ? "#1e1a17" : "#f7f4f0", borderBottom: `1px solid ${dark ? "#2e2824" : "#ebe5dd"}`,
        }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />
          ))}
          {url && (
            <div style={{
              marginLeft: 24, flex: 1, height: 38, borderRadius: 10, background: dark ? "#14110f" : "#ece7e0",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: SANS, fontSize: 22, fontWeight: 500, color: dark ? "#9a918a" : "#6a625b",
            }}>{url}</div>
          )}
        </div>
        <div style={{ position: "relative", width: rect.w - 6, height: rect.h - 6 - CHROME_H, overflow: "hidden" }}>
          {children}
        </div>
      </div>
      {/* travelling light on the border, plus its bloom */}
      {[0, 10].map((blur) => (
        <div key={blur} style={{
          position: "absolute", inset: -3, borderRadius: 27, padding: 5, background: ring,
          filter: blur ? `blur(${blur}px)` : undefined, opacity: blur ? Math.min(1, 0.85 * g) : 1, ...mask,
        }} />
      ))}
    </div>
  );
};

// ---------- stat card ----------
export const StatCard: React.FC<{ t: number; start: number; end: number; value: number; format: (n: number) => string; label: string; x: number; y: number }> =
  ({ t, start, end, value, format, label, x, y }) => {
    if (t < start || t > end) return null;
    const p = pop(t, start, 0.35);
    const out = 1 - ease(t, end - 0.15, 0.15);
    const n = value * ease(t, start, 0.7);
    return (
      <div style={{
        position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${lerp(0.5, 1, p)}) rotate(${(1 - p) * -4}deg)`,
        opacity: Math.min(1, p * 2) * out, background: "#fff", borderRadius: 28, padding: "24px 52px 30px",
        boxShadow: `0 24px 60px rgba(0,0,0,0.3), 0 0 0 3px rgba(${C.accentGlow},0.9)`, textAlign: "center",
      }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 128, lineHeight: 1, color: C.accent, letterSpacing: -4 }}>
          {format(n)}
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, color: C.ink, marginTop: 8 }}>{label}</div>
      </div>
    );
  };

// ---------- hook title ----------
export const HookTitle: React.FC<{ t: number; l1: string[]; l2: string[] }> = ({ t, l1, l2 }) => {
  const wordStyle = (start: number): React.CSSProperties => {
    const p = pop(t, start, 0.22);
    return { opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 26}px)`, display: "inline-block", marginRight: 18 };
  };
  const box = ease(t, 0.42, 0.22);
  return (
    <div style={{ position: "absolute", top: 120, width: 1080, textAlign: "center" }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 72, color: C.ink, letterSpacing: -2 }}>
        {l1.map((w, i) => t >= i * 0.14 && <span key={w} style={wordStyle(i * 0.14)}>{w}</span>)}
      </div>
      <div style={{ position: "relative", display: "inline-block", marginTop: 10, padding: "6px 30px 12px" }}>
        <div style={{
          position: "absolute", inset: 0, background: C.accent, borderRadius: 14,
          transform: `scaleX(${box}) rotate(-1.2deg)`, transformOrigin: "left",
          boxShadow: `0 10px 30px rgba(${C.accentGlow},0.35)`,
        }} />
        <span style={{ position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 84, color: "#fff", letterSpacing: -2 }}>
          {l2.map((w, i) => t >= 0.62 + i * 0.12 && <span key={w} style={wordStyle(0.62 + i * 0.12)}>{w}</span>)}
        </span>
      </div>
    </div>
  );
};

// ---------- step counter (signature element) ----------
export const StepCounter: React.FC<{ t: number; steps: number[]; end: number; onDark: boolean }> = ({ t, steps, end, onDark }) => {
  if (t < steps[0] || t >= end) return null;
  const idx = steps.filter((s) => t >= s).length; // 1-based
  const p = pop(t, steps[0], 0.3) * (1 - ease(t, end - 0.15, 0.15));
  const fill = ease(t, steps[idx - 1], 0.35);
  return (
    <div style={{
      position: "absolute", top: 150, left: "50%", transform: `translateX(-50%) scale(${lerp(0.7, 1, p)})`, opacity: p,
      display: "flex", alignItems: "center", gap: 18, padding: "12px 26px", borderRadius: 999,
      background: onDark ? "rgba(255,255,255,0.08)" : "#fff", border: `2px solid rgba(${C.accentGlow},0.6)`,
      boxShadow: `0 8px 26px rgba(${C.accentGlow},0.18)`,
    }}>
      <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 28, letterSpacing: 2, color: onDark ? "#fff" : C.ink }}>
        STEP <span style={{ color: C.accent }}>{idx}</span>/{steps.length}
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: 46, height: 12, borderRadius: 6, background: onDark ? "rgba(255,255,255,0.18)" : "#e8e1d8", overflow: "hidden" }}>
            <div style={{ height: "100%", background: C.accent, width: `${i < idx - 1 ? 100 : i === idx - 1 ? fill * 100 : 0}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- CTA ----------
export const Cta: React.FC<{ t: number; start: number; word: string; end?: number }> = ({ t, start, word, end = 1e9 }) => {
  if (t < start || t >= end) return null;
  const p = ease(t, start, 0.3);
  const q = pop(t, start + 0.22, 0.4);
  const flicker = t - start < 0.6 ? (Math.floor((t - start) * 30) % 3 === 0 ? 0.55 : 1) : 1; // neon sign flicker on
  return (
    <div style={{ position: "absolute", top: 1240, width: 1080, textAlign: "center" }}>
      <div style={{
        fontFamily: SANS, fontWeight: 700, fontSize: 64, color: "#fff", lineHeight: 1, letterSpacing: -1,
        opacity: p, textShadow: "0 4px 18px rgba(0,0,0,0.5)",
      }}>comment</div>
      <div style={{
        fontFamily: SANS, fontWeight: 900, fontSize: 176, color: "#FFE2CC", lineHeight: 1.05, letterSpacing: -4,
        opacity: Math.min(1, q * 2) * flicker, transform: `scale(${lerp(0.6, 1, q)})`,
        textShadow: `0 0 14px rgba(${C.accentGlow},1), 0 0 40px rgba(${C.accentGlow},0.9), 0 0 90px rgba(${C.accentGlow},0.6)`,
      }}>“{word}”</div>
    </div>
  );
};

// ---------- hand-drawn marks (drawn on stroke by stroke) ----------
const wobble = (i: number, seed: number) => Math.sin(i * 1.7 + seed) * 0.5 + Math.sin(i * 0.63 + seed * 2.3) * 0.5;

/** A marker-pen ellipse that overshoots its start, like circling something by hand. */
export const ScribbleCircle: React.FC<{ t: number; start: number; end: number; cx: number; cy: number; w: number; h: number; seed?: number }> =
  ({ t, start, end, cx, cy, w, h, seed = 1 }) => {
    if (t < start || t > end) return null;
    const p = ease(t, start, 0.45);
    const out = 1 - ease(t, end - 0.15, 0.15);
    const pts: string[] = [];
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const a = -2.4 + (i / N) * Math.PI * 2 * 1.12; // 1.12 turns: the end passes the start
      const r = 1 + wobble(i, seed) * 0.06 + (i / N) * 0.08;
      pts.push(`${i ? "L" : "M"}${(cx + Math.cos(a) * (w / 2) * r).toFixed(1)},${(cy + Math.sin(a) * (h / 2) * r).toFixed(1)}`);
    }
    return (
      <svg style={{ position: "absolute", inset: 0, overflow: "visible", opacity: out, pointerEvents: "none" }} width="100%" height="100%">
        <path d={pts.join(" ")} pathLength={1} fill="none" stroke={C.accent} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={1} strokeDashoffset={1 - p} style={{ filter: `drop-shadow(0 2px 6px rgba(${C.accentGlow},0.45))` }} />
      </svg>
    );
  };
