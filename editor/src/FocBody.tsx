// "Fact or Cap" body: install + 3 challenges + verdict. Screen on top in a neon card (zoomed per moment),
// your face live in a rounded square underneath, a challenge header + 3-box tally, and FACT/CAP stamps.
import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import body from "../public/foc/body.json";
import { CHROME_H, FaceBg, NeonCard } from "./Layers";
import { C, MONO, SANS, ease, lerp, pop } from "./theme";
import { CAP, FACT } from "./FocHook";

type Seg = { s: number; e: number; speed: number; t: number; d: number; voice: string | null; face: string; beat: string; zoom: number[] };
type Word = { w: string; s: number; e: number; beat: string };
const SEGS = body.segs as Seg[];
const WORDS = body.captions as Word[];
export const BODY_TOTAL = body.total;
const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
const wordAt = (w: string, beat: string) => WORDS.find((x) => clean(x.w) === w && x.beat === beat)!.s;
const beatStart = (b: string) => SEGS.find((s) => s.beat === b)!.t;
const beatEnd = (b: string) => { const l = [...SEGS].reverse().find((s) => s.beat === b)!; return l.t + l.d; };

// verdict moments: each challenge gets its stamp when you call it
export const STAMPS: { at: number; ok: boolean }[] = [
  { at: wordAt("works", "c1"), ok: true },        // PhotoCraft: "yeah, it works"
  { at: wordAt("chef's", "c2"), ok: true },       // FilmCraft: effects work, "chef's kiss"
  { at: wordAt("fact", "c3"), ok: true },         // EffectCraft: "Bingo, this is fact"
];
// the last FACT stamp gets its moment before the verdict lands
const T = { verdict: Math.max(beatStart("verdict"), STAMPS[STAMPS.length - 1].at + 1.4), end: beatStart("end") };

const APPS: Record<string, { n: string; name: string; like: string }> = {
  install: { n: "", name: "getartcraft.com", like: "the download" },
  c1: { n: "1", name: "PhotoCraft", like: "the “Photoshop”" },
  c2: { n: "2", name: "FilmCraft", like: "the “Premiere Pro”" },
  c3: { n: "3", name: "EffectCraft", like: "the “After Effects”" },
};

const CARD = { x: 40, y: 250, w: 1000, h: 640 + 6 + CHROME_H };
const VIEW = { w: CARD.w - 6, h: CARD.h - 6 - CHROME_H };
const FACE = { x: 300, y: 1000, s: 480 };

const segAt = (t: number) => SEGS.find((s) => t >= s.t && t < s.t + s.d) ?? SEGS[SEGS.length - 1];

const Screen: React.FC<{ t: number }> = ({ t }) => {
  const i = SEGS.indexOf(segAt(t));
  const cur = SEGS[i], prev = SEGS[Math.max(0, i - 1)];
  const p = i === 0 ? 1 : ease(t, cur.t, 0.45);
  const r = cur.zoom.map((v, k) => lerp(prev.zoom[k], v, p));
  const s = VIEW.w / r[2];
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#111" }}>
      <OffthreadVideo src={staticFile("foc/body_screen.mp4")} muted
        style={{ position: "absolute", left: -r[0] * s, top: -r[1] * s, width: 1920 * s, height: 1080 * s }} />
    </AbsoluteFill>
  );
};

const SpeedBadge: React.FC<{ t: number }> = ({ t }) => {
  const s = segAt(t);
  if (s.speed <= 1) return null;
  const p = pop(t, s.t, 0.25);
  return (
    <div style={{
      position: "absolute", right: 1080 - CARD.x - CARD.w + 22, top: CARD.y + CHROME_H + 18, padding: "8px 18px", borderRadius: 12, background: C.accent,
      fontFamily: MONO, fontWeight: 700, fontSize: 34, color: "#fff", transform: `scale(${lerp(0.5, 1, p)})`,
    }}>⏩ x{s.speed}</div>
  );
};

// "skill issue" sticker over the sped-up trimming struggle in challenge 2
const Sticker: React.FC<{ t: number }> = ({ t }) => {
  const s = SEGS.find((x) => x.beat === "c2" && x.speed >= 8);
  if (!s || t < s.t || t >= s.t + s.d) return null;
  const p = pop(t, s.t + 0.3, 0.35);
  return (
    <div style={{
      position: "absolute", left: CARD.x + 60, top: CARD.y + CARD.h - 150, transform: `rotate(-8deg) scale(${lerp(0.3, 1, p)})`,
      padding: "14px 26px", borderRadius: 16, background: "#FFE14D", color: "#141210", border: "4px solid #141210",
      fontFamily: SANS, fontWeight: 900, fontSize: 54, letterSpacing: -1, boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
    }}>SKILL ISSUE 😅</div>
  );
};

const Stamp: React.FC<{ t: number }> = ({ t }) => {
  const st = [...STAMPS].reverse().find((x) => t >= x.at && t < x.at + 2.2);
  if (!st || t >= T.verdict) return null;
  const until = Math.min(st.at + 2.2, beatEnd(segAt(st.at).beat), T.verdict); // never spill into the next challenge
  if (t >= until) return null;
  const p = pop(t, st.at, 0.28);
  const out = 1 - ease(t, until - 0.3, 0.3);
  const col = st.ok ? FACT : CAP;
  const shake = t - st.at < 0.25 ? Math.sin((t - st.at) * 90) * (0.25 - (t - st.at)) * 30 : 0;
  return (
    <div style={{
      position: "absolute", left: CARD.x + CARD.w / 2 + shake, top: CARD.y + CARD.h / 2 + 20, opacity: Math.min(1, p * 2) * out,
      transform: `translate(-50%, -50%) rotate(-10deg) scale(${lerp(2.2, 1, p)})`,
      border: `12px solid ${col}`, borderRadius: 28, padding: "6px 50px 14px", background: "rgba(20,18,16,0.72)",
      fontFamily: SANS, fontWeight: 900, fontSize: 190, letterSpacing: -6, color: col, lineHeight: 1,
      boxShadow: `0 0 60px ${col}88`,
    }}>{st.ok ? "FACT" : "CAP"}</div>
  );
};

const Header: React.FC<{ t: number }> = ({ t }) => {
  const s = segAt(t);
  if (t >= T.verdict) return null;
  const app = APPS[s.beat];
  const first = SEGS.find((x) => x.beat === s.beat)!.t;
  const p = pop(t, first, 0.35);
  return (
    <div style={{ position: "absolute", left: 44, top: 70, opacity: Math.min(1, p * 2), transform: `translateX(${(1 - p) * -40}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{
          padding: "8px 18px", borderRadius: 999, background: "#141210", border: `3px solid ${C.accent}`,
          fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 2, color: "#fff",
        }}>{app.n ? <>CHALLENGE <span style={{ color: C.accentHot }}>{app.n}</span>/3</> : "INSTALL"}</span>
      </div>
      <div style={{ marginTop: 14, fontFamily: SANS, fontWeight: 900, fontSize: 64, letterSpacing: -2, color: "#fff", lineHeight: 1 }}>
        {app.name} <span style={{ fontWeight: 700, fontSize: 38, color: "#b7aca2", letterSpacing: -0.5 }}>{app.like}</span>
      </div>
    </div>
  );
};

// 3-box tally, top right: fills green/red as each challenge is called
const Tally: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: "absolute", right: 44, top: 132, display: "flex", gap: 10 }}>
    {STAMPS.map((st, i) => {
      const done = t >= st.at + 0.2;
      const p = done ? pop(t, st.at + 0.2, 0.3) : 0;
      const col = st.ok ? FACT : CAP;
      return (
        <div key={i} style={{
          width: 64, height: 64, borderRadius: 14, border: `3px solid ${done ? col : "#5b524b"}`, background: done ? col : "rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 900, fontSize: 38,
          color: done ? "#141210" : "#6d645c", transform: `scale(${done ? lerp(1.4, 1, p) : 1})`,
        }}>{done ? (st.ok ? "✓" : "✗") : i + 1}</div>
      );
    })}
  </div>
);

const FaceSquare: React.FC<{ t: number }> = ({ t }) => {
  const live = Math.floor(t * 1.5) % 2 === 0;
  return (
    <div style={{
      position: "absolute", left: FACE.x, top: FACE.y, width: FACE.s, height: FACE.s, borderRadius: 40, overflow: "hidden",
      border: `4px solid ${C.accent}`, background: "linear-gradient(180deg, #3b332e 0%, #1c1816 100%)",
      boxShadow: `0 0 40px rgba(${C.accentGlow},0.35), 0 24px 50px rgba(0,0,0,0.5)`,
    }}>
      <OffthreadVideo src={staticFile("foc/body_face.webm")} transparent muted style={{ width: FACE.s, height: FACE.s }} />
      <div style={{
        position: "absolute", left: 16, top: 16, display: "flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 8,
        background: "rgba(20,18,16,0.75)", fontFamily: MONO, fontWeight: 700, fontSize: 20, color: "#fff", letterSpacing: 2,
      }}><span style={{ width: 12, height: 12, borderRadius: 6, background: "#ff3b3b", opacity: live ? 1 : 0.3 }} />LIVE</div>
    </div>
  );
};

const EndCard: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  if (t < start) return null;
  const p = pop(t, start, 0.35);
  const box = ease(t, start + 0.1, 0.22);
  return (
    <div style={{ position: "absolute", top: 1560, width: 1080, textAlign: "center" }}>
      <div style={{ position: "relative", display: "inline-block", padding: "10px 40px 18px", transform: `scale(${lerp(0.6, 1, p)}) rotate(-3deg)` }}>
        <div style={{ position: "absolute", inset: 0, background: C.accent, borderRadius: 18, transform: `scaleX(${box})`, transformOrigin: "left",
          boxShadow: `0 0 50px rgba(${C.accentGlow},0.7)` }} />
        <span style={{ position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 110, color: "#fff", letterSpacing: -4, opacity: Math.min(1, p * 2), whiteSpace: "nowrap" }}>
          Let's go, boys
        </span>
      </div>
    </div>
  );
};

// verdict: FACT*, with the honest asterisk
const Verdict: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.verdict) return null;
  const p = pop(t, T.verdict + 0.1, 0.3);
  const q = pop(t, T.verdict + 0.9, 0.35);
  return (
    <>
      <div style={{
        position: "absolute", left: 540, top: 420, transform: `translate(-50%, -50%) rotate(-6deg) scale(${lerp(2, 1, p)})`, opacity: Math.min(1, p * 2),
        textAlign: "center", border: `12px solid ${FACT}`, borderRadius: 30, padding: "10px 56px 22px", background: "rgba(20,18,16,0.8)",
        boxShadow: `0 0 70px ${FACT}88`,
      }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 32, letterSpacing: 10, color: "#fff" }}>VERDICT</div>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 200, letterSpacing: -6, color: FACT, lineHeight: 1 }}>FACT<span style={{ color: "#fff" }}>*</span></div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 40, color: "#fff" }}>3 / 3 challenges passed</div>
      </div>
      <div style={{
        position: "absolute", left: 90, right: 90, top: 700, opacity: Math.min(1, q * 2), transform: `translateY(${(1 - q) * 30}px) rotate(1deg)`,
        background: "#fff", borderRadius: 22, padding: "22px 30px", boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
      }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 46, lineHeight: 1.1, color: C.ink }}>
          <span style={{ color: C.accent }}>*</span> The apps are real, free and they work.
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, lineHeight: 1.2, color: "#6b625a", marginTop: 8 }}>
          But Adobe didn't open-source anything. They're free look-alikes by another dev.
        </div>
      </div>
    </>
  );
};

const KEY = new Set(["photocraft", "similar", "bonus", "works", "cinematic", "skills", "effects", "bingo", "chef's", "effect", "truth", "fact", "launcher", "use"]);
const chunks = (() => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  WORDS.forEach((w, i) => {
    cur.push(w);
    const n = WORDS[i + 1];
    if (!n || cur.length >= 3 || /[,.?!…]$/.test(w.w) || n.beat !== w.beat || n.s - w.e > 0.35) { out.push(cur); cur = []; }
  });
  return out;
})();
const Captions: React.FC<{ t: number; y: number }> = ({ t, y }) => {
  const i = chunks.findIndex((c, k) => t >= c[0].s - 0.04 && (!chunks[k + 1] || t < chunks[k + 1][0].s - 0.04));
  if (i < 0 || t > chunks[i][chunks[i].length - 1].e + 0.5) return null;
  const c = chunks[i];
  const em = c.findIndex((w) => KEY.has(clean(w.w)));
  return (
    <div style={{ position: "absolute", top: y, left: 40, right: 40, transform: "translateY(-50%)", display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
      {c.map((w, k) => {
        if (t < w.s - 0.04) return null;
        const p = pop(t, w.s - 0.04, 0.2);
        const text = w.w.replace(/[,.…]$/, "");
        if (k === em) {
          const wipe = ease(t, w.s - 0.02, 0.16);
          return (
            <span key={k} style={{ position: "relative", display: "inline-block", padding: "0 14px 6px", transform: `translateY(${(1 - p) * 20}px) rotate(-1.5deg) scale(${lerp(0.85, 1, p)})` }}>
              <span style={{ position: "absolute", inset: "4px 0 0 0", borderRadius: 12, transform: `scaleX(${wipe})`, transformOrigin: "left",
                background: clean(w.w) === "fact" ? FACT : C.accent }} />
              <span style={{ position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 72, letterSpacing: -2, color: "#fff" }}>{text}</span>
            </span>
          );
        }
        return (
          <span key={k} style={{
            fontFamily: SANS, fontWeight: 800, fontSize: 66, letterSpacing: -1.5, color: "#fff", display: "inline-block",
            opacity: Math.min(1, p * 2.5), transform: `translateY(${(1 - p) * 18}px)`, textShadow: "0 4px 18px rgba(0,0,0,0.6)",
          }}>{text}</span>
        );
      })}
    </div>
  );
};

const Badge: React.FC = () => (
  <div style={{
    position: "absolute", right: 44, top: 60, display: "flex", gap: 8, alignItems: "center", padding: "6px 16px", borderRadius: 999,
    background: "#141210", border: `3px solid ${C.accent}`, fontFamily: SANS, fontWeight: 900, fontSize: 28, color: "#fff",
  }}><span style={{ color: FACT }}>FACT</span><span style={{ color: "#8a8178", fontSize: 20 }}>or</span><span style={{ color: CAP }}>CAP?</span></div>
);

export const FocBody: React.FC<{ musicFrom: number }> = ({ musicFrom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const s = segAt(t);
  const segStart = s.t;
  const beatChange = SEGS.findIndex((x) => x === s) > 0 && SEGS[SEGS.indexOf(s) - 1].beat !== s.beat;
  const punch = beatChange ? 1 + 0.05 * (1 - ease(t, segStart, 0.22)) : 1;
  const showScreen = t < T.verdict;
  const sfx = (at: number, src: string, vol: number, len = 1.2, from = 0) => (
    <Sequence key={src + at} from={Math.max(0, Math.round(at * fps))} durationInFrames={Math.round(len * fps)}>
      <Audio src={staticFile(src)} volume={vol} startFrom={Math.round(from * fps)} />
    </Sequence>
  );
  const beatStarts = SEGS.filter((x, i) => i > 0 && SEGS[i - 1].beat !== x.beat).map((x) => x.t);
  // music: ducked under your voice, up under the sped-up silent parts, out for the verdict slam
  const musicVol = (f: number) => {
    const tt = f / fps;
    const g = segAt(tt);
    let v = g.voice ? 0.05 : 0.12;
    if (tt >= T.verdict - 0.05 && tt < T.verdict + 0.6) v = 0;
    return v;
  };

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <FaceBg />
        {showScreen && (
          <NeonCard rect={CARD} local={t} url={`${APPS[s.beat]?.name ?? ""}  ·  recorded live on my PC`} dark>
            <Screen t={t} />
          </NeonCard>
        )}
        {showScreen && <SpeedBadge t={t} />}
        <Sticker t={t} />
        <FaceSquare t={t} />
        <Header t={t} />
        {t < T.verdict && <Tally t={t} />}
        <Badge />
        <Stamp t={t} />
        <Verdict t={t} />
        {t < T.end && <Captions t={t} y={1620} />}
        <EndCard t={t} start={T.end} />
      </AbsoluteFill>

      <Audio src={staticFile("foc/body_voice.wav")} />
      <Audio src={staticFile("audio/music_digital_clouds.mp3")} startFrom={Math.round(musicFrom * fps)} volume={musicVol} />
      {beatStarts.map((b) => sfx(b - 0.08, "audio/whoosh_fast.mp3", 0.3))}
      {SEGS.filter((x) => x.speed > 1).map((x) => sfx(x.t, "audio/rewind_fast.mp3", 0.12, Math.min(1.2, x.d)))}
      {STAMPS.map((st) => sfx(st.at - 0.5, "audio/impact_whoosh.mp3", 0.45, 1.6))}
      {STAMPS.map((st) => sfx(st.at + 0.2, "audio/ding.mp3", 0.25, 1.2))}
      {sfx(T.verdict - 1.2, "audio/riser_short.mp3", 0.3, 1.25, 6.25 - 1.2)}
      {sfx(T.verdict - 0.4, "audio/impact_logo.mp3", 0.4, 1.4)}
      {sfx(T.verdict + 0.9, "audio/pop_whoosh.mp3", 0.3)}
      {sfx(T.end + 0.1, "audio/sting_signature.wav", 0.7, 1.2)}
    </AbsoluteFill>
  );
};
