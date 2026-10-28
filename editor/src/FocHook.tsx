// "Fact or Cap" format, built on Electric Orange v2. This is the hook: their reel plays on top while you
// react underneath, it freezes on the claim (tape stop), and you call it: "fact or cap?"
import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import cutsData from "../public/cuts.json";
import captions from "../public/captions.json";
import { DarkBg, Face, FaceBg } from "./Layers";
import { C, MONO, SANS, ease, lerp, pop } from "./theme";

type Word = { w: string; s: number; e: number; beat: string };
const WORDS = captions as Word[];
const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
const at = (w: string, nth = 0) => WORDS.filter((x) => clean(x.w) === w)[nth].s;

export const FACT = "#2BD67B";
export const CAP = "#FF4D4D";
// Part1.MOV framing. Full face sits smaller and lower than usual so the overlays live above your head.
const FACE = { faceTop: 610, faceCx: 530, cScale: [1.0, 1.05] as [number, number], cHeadY: 760 };
const CAPTION_Y = 1600; // on your chest, clear of your mouth

const FREEZE = cutsData.freeze;            // reel time = output time (the reel starts at 0)
const T = {
  freeze: FREEZE,
  fact: at("fact"),
  cap: at("cap"),
  three: at("3"),
  challenges: at("challenges"),
  letsgo: at("let's"),
};
const TOTAL = cutsData.total;

// reel card while it plays (portrait, centred above your face card)
const REEL = { x: 300, y: 196, w: 480, h: 853 };
// after the freeze it becomes a tilted piece of "evidence" in the top-left
const EVID = { x: 70, y: 150, w: 300, h: 533, rot: -6 };

// Series title. While their reel plays it's a big header above the reel; after the freeze it lives in the corner.
const Badge: React.FC<{ t: number }> = ({ t }) => {
  const p = pop(t, 0.1, 0.35);
  const small = ease(t, T.freeze + 1.5, 0.35);          // shrink into the corner once the slam has gone
  const hide = t >= T.freeze && t < T.freeze + 1.5;     // the slam is the title for that moment
  if (hide) return null;
  const big = t < T.freeze;
  const fs = big ? 84 : lerp(84, 30, small);
  return (
    <div style={{
      position: "absolute", left: big ? 540 : lerp(540, 1080 - 46 - 150, small), top: big ? 92 : lerp(92, 74, small),
      transform: `translate(-50%, -50%) scale(${lerp(0.6, 1, p)}) rotate(${big ? -2 : 0}deg)`, opacity: Math.min(1, p * 2),
      display: "flex", alignItems: "center", gap: fs * 0.3, padding: `${fs * 0.22}px ${fs * 0.55}px`, borderRadius: 999,
      background: "#141210", border: `${big ? 5 : 3}px solid ${C.accent}`, whiteSpace: "nowrap",
      boxShadow: big ? `0 0 40px rgba(${C.accentGlow},0.5)` : "none",
      fontFamily: SANS, fontWeight: 900, fontSize: fs, letterSpacing: -1, color: "#fff", lineHeight: 1,
    }}>
      <span style={{ color: FACT }}>FACT</span><span style={{ color: "#8a8178", fontSize: fs * 0.7 }}>or</span><span style={{ color: CAP }}>CAP?</span>
    </div>
  );
};

const ReelCard: React.FC<{ t: number }> = ({ t }) => {
  const frozen = t >= T.freeze;
  const move = ease(t, T.freeze + 0.45, 0.45); // fly to the evidence spot after the stamp lands
  const r = {
    x: lerp(REEL.x, EVID.x, move), y: lerp(REEL.y, EVID.y, move), w: lerp(REEL.w, EVID.w, move), h: lerp(REEL.h, EVID.h, move),
    rot: lerp(0, EVID.rot, move),
  };
  const grey = frozen ? ease(t, T.freeze, 0.25) : 0;
  const shake = frozen && t - T.freeze < 0.3 ? Math.sin((t - T.freeze) * 80) * (0.3 - (t - T.freeze)) * 26 : 0;
  const enter = pop(t, 0, 0.4);
  return (
    <div style={{
      position: "absolute", left: r.x + shake, top: r.y, width: r.w, height: r.h, borderRadius: 26, overflow: "hidden",
      transform: `rotate(${r.rot}deg) scale(${lerp(0.9, 1, enter)})`, opacity: Math.min(1, enter * 2) * (1 - ease(t, T.three - 0.25, 0.25)),
      border: `4px solid ${frozen ? "#8a8178" : C.accent}`,
      boxShadow: frozen ? "0 30px 60px rgba(0,0,0,0.6)" : `0 0 0 3px rgba(${C.accentGlow},0.25), 0 0 40px rgba(${C.accentGlow},0.45)`,
      background: "#000",
    }}>
      {!frozen ? (
        <OffthreadVideo src={staticFile("foc/claim_reel.mp4")} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Img src={staticFile("foc/freeze.png")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `grayscale(${grey}) brightness(${lerp(1, 0.75, grey)})` }} />
      )}
      {/* label */}
      <div style={{
        position: "absolute", left: 14, top: 14, padding: "6px 14px", borderRadius: 8, background: frozen ? CAP : C.accent,
        fontFamily: MONO, fontWeight: 700, fontSize: lerp(24, 18, move), color: "#fff", letterSpacing: 2,
      }}>{frozen ? "⏸ THE CLAIM" : "▶ THE CLAIM"}</div>
    </div>
  );
};

// big "FACT or CAP?" slam on the freeze: centred, huge, on a dimmed frame
const Slam: React.FC<{ t: number }> = ({ t }) => {
  const s = T.freeze + 0.05;
  if (t < s || t > T.freeze + 1.75) return null;
  const p = pop(t, s, 0.3);
  const out = 1 - ease(t, T.freeze + 1.45, 0.3);
  const shake = t - s < 0.25 ? Math.sin((t - s) * 90) * (0.25 - (t - s)) * 40 : 0;
  return (
    <AbsoluteFill style={{ background: `rgba(10,8,7,${0.55 * Math.min(1, p * 2) * out})` }}>
      <div style={{
        position: "absolute", top: 960, left: 540, opacity: Math.min(1, p * 2) * out,
        transform: `translate(-50%, -50%) translate(${shake}px, ${shake * 0.5}px) scale(${lerp(2.2, 1, p)}) rotate(-4deg)`,
        fontFamily: SANS, fontWeight: 900, textAlign: "center", lineHeight: 0.86, whiteSpace: "nowrap",
        textShadow: "0 14px 50px rgba(0,0,0,0.75)",
      }}>
        <div style={{ fontSize: 330, letterSpacing: -14, color: FACT }}>FACT</div>
        <div style={{ fontSize: 140, letterSpacing: -4, color: "#fff", margin: "6px 0 2px" }}>or</div>
        <div style={{ fontSize: 330, letterSpacing: -14, color: CAP }}>CAP?</div>
      </div>
    </AbsoluteFill>
  );
};

// the claim, pulled out of their reel
const ClaimQuote: React.FC<{ t: number }> = ({ t }) => {
  const s = T.freeze + 1.5;
  if (t < s || t >= T.three - 0.1) return null;
  const p = pop(t, s, 0.35);
  return (
    <div style={{
      position: "absolute", left: 400, right: 60, top: 230, transform: `rotate(2deg) scale(${lerp(0.7, 1, p)})`, opacity: Math.min(1, p * 2),
      background: "#fff", borderRadius: 22, padding: "24px 28px", boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
    }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: CAP }}>THEY CLAIM</div>
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 50, lineHeight: 1.05, color: C.ink, marginTop: 8, letterSpacing: -1.5 }}>
        “Adobe products are essentially <span style={{ background: C.accent, color: "#fff", padding: "0 8px", borderRadius: 8 }}>open source</span>”
      </div>
    </div>
  );
};

// "3 challenges": three empty receipts, filled in later in the video
const Challenges: React.FC<{ t: number }> = ({ t }) => {
  if (t < T.three - 0.1) return null;
  return (
    <div style={{ position: "absolute", top: 360, width: 1080, display: "flex", justifyContent: "center", gap: 22 }}>
      {[0, 1, 2].map((i) => {
        const p = pop(t, T.three - 0.1 + i * 0.16, 0.3);
        return (
          <div key={i} style={{
            width: 280, padding: "20px 0 22px", borderRadius: 22, background: "#141210", border: `3px solid ${C.accent}`, textAlign: "center",
            transform: `translateY(${(1 - p) * 60}px) rotate(${(i - 1) * 3}deg)`, opacity: Math.min(1, p * 2),
            boxShadow: `0 0 30px rgba(${C.accentGlow},0.35)`,
          }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: C.accentHot }}>CHALLENGE</div>
            <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 96, color: "#fff", lineHeight: 1 }}>{i + 1}</div>
            <div style={{ margin: "10px auto 0", width: 64, height: 64, borderRadius: 14, border: "4px dashed #6d645c",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: "#6d645c", fontWeight: 900 }}>?</div>
          </div>
        );
      })}
    </div>
  );
};

// captions (Electric Orange v2 look): up to 3 words, one key word on the orange marker
const KEY = new Set(["fact", "cap", "true", "3", "challenges", "worth", "go"]);
const chunks = (() => {
  const out: Word[][] = [];
  let cur: Word[] = [];
  WORDS.forEach((w, i) => {
    cur.push(w);
    const n = WORDS[i + 1];
    if (!n || cur.length >= 3 || /[,.?!]$/.test(w.w) || n.beat !== w.beat || n.s - w.e > 0.35) { out.push(cur); cur = []; }
  });
  return out;
})();
const Captions: React.FC<{ t: number; y: number }> = ({ t, y }) => {
  const i = chunks.findIndex((c, k) => t >= c[0].s - 0.04 && (!chunks[k + 1] || t < chunks[k + 1][0].s - 0.04));
  if (i < 0 || t > chunks[i][chunks[i].length - 1].e + 0.6) return null;
  const c = chunks[i];
  const em = c.findIndex((w) => KEY.has(clean(w.w)));
  return (
    <div style={{ position: "absolute", top: y, left: 50, right: 50, transform: "translateY(-50%)", display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
      {c.map((w, k) => {
        if (t < w.s - 0.04) return null;
        const p = pop(t, w.s - 0.04, 0.2);
        const text = w.w.replace(/[,.]$/, "");
        const isCap = clean(w.w) === "cap", isFact = clean(w.w) === "fact";
        if (k === em) {
          const wipe = ease(t, w.s - 0.02, 0.16);
          return (
            <span key={k} style={{ position: "relative", display: "inline-block", padding: "0 16px 6px", transform: `translateY(${(1 - p) * 20}px) rotate(-1.5deg) scale(${lerp(0.85, 1, p)})` }}>
              <span style={{ position: "absolute", inset: "4px 0 0 0", borderRadius: 12, transform: `scaleX(${wipe})`, transformOrigin: "left",
                background: isCap ? CAP : isFact ? FACT : C.accent }} />
              <span style={{ position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 80, letterSpacing: -2, color: "#fff" }}>{text}</span>
            </span>
          );
        }
        return (
          <span key={k} style={{
            fontFamily: SANS, fontWeight: 800, fontSize: 72, letterSpacing: -1.5, color: "#fff", display: "inline-block",
            opacity: Math.min(1, p * 2.5), transform: `translateY(${(1 - p) * 18}px)`, textShadow: "0 4px 18px rgba(0,0,0,0.6)",
          }}>{text}</span>
        );
      })}
    </div>
  );
};

export const FocHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const split = t < T.freeze + 0.45;                        // reel on top, you underneath
  const punch = t >= T.freeze && t < T.freeze + 0.3 ? 1 + 0.06 * (1 - ease(t, T.freeze, 0.3))
    : t >= T.letsgo ? 1 + 0.08 * (1 - ease(t, T.letsgo, 0.3)) : 1;
  const sfx = (at: number, src: string, vol: number, len = 1.2, from = 0) => (
    <Sequence key={src + at} from={Math.max(0, Math.round(at * fps))} durationInFrames={Math.round(len * fps)}>
      <Audio src={staticFile(src)} volume={vol} startFrom={Math.round(from * fps)} />
    </Sequence>
  );

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        {split ? <DarkBg /> : <FaceBg />}
        <Face mode={split ? "A" : "C"} t={t} modeStart={split ? 0 : T.freeze + 0.45} {...FACE} />
        <ReelCard t={t} />
        <Slam t={t} />
        <ClaimQuote t={t} />
        <Challenges t={t} />
        <Badge t={t} />
        <Captions t={t} y={CAPTION_Y} />
      </AbsoluteFill>

      {/* their reel's own clean audio while it plays; your phone audio is muted under it */}
      <Sequence durationInFrames={Math.round(T.freeze * fps)}>
        <Audio src={staticFile("foc/claim_reel.mp4")} volume={0.9} />
      </Sequence>
      <Audio src={staticFile("voice.wav")} />
      {sfx(T.freeze, "audio/tapestop.wav", 0.8, 0.6)}
      {sfx(T.freeze + 0.05 - 0.55, "audio/impact_whoosh.mp3", 0.5, 1.6)}
      {sfx(T.freeze + 1.5, "audio/pop_whoosh.mp3", 0.3)}
      {[0, 1, 2].map((i) => sfx(T.three - 0.1 + i * 0.16, "audio/pop_dry.mp3", 0.3, 0.6))}
      {sfx(T.letsgo - 0.08, "audio/whoosh_fast.mp3", 0.35)}
      {sfx(T.letsgo + 0.1, "audio/sting_signature.wav", 0.6, 1.0)}
      {/* music only after the freeze (their reel has its own), ducked under your voice */}
      <Sequence from={Math.round((T.freeze + 0.5) * fps)}>
        <Audio src={staticFile("audio/music_digital_clouds.mp3")} startFrom={Math.round(28.5 * fps)}
          volume={(f) => 0.06 * interpolate(f, [0, 15], [0, 1], { extrapolateRight: "clamp" })
            * interpolate(f + Math.round((T.freeze + 0.5) * fps), [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const FOC_TOTAL = TOTAL;
