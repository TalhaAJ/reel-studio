import React from "react";
import { OffthreadVideo, Sequence, staticFile } from "remotion";
import { C, MONO, SANS, ease, lerp, pop } from "./theme";
import { ScribbleCircle } from "./Layers";
import { CARDS, T } from "./timeline";

type CardProps = { t: number; local: number; w: number; h: number };

// Deterministic "voice" waveform: bars that breathe while `live`.
const Wave: React.FC<{ t: number; n: number; w: number; h: number; color: string; seed: number; live?: number }> =
  ({ t, n, w, h, color, seed, live = 1 }) => (
    <svg width={w} height={h}>
      {Array.from({ length: n }, (_, i) => {
        const base = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.61 + seed) * Math.cos(i * 0.23 + seed * 2));
        const wob = 0.75 + 0.25 * Math.sin(t * 9 + i * 0.8 + seed);
        const bh = Math.max(6, base * lerp(1, wob, live) * h * 0.9);
        const bw = w / n;
        return <rect key={i} x={i * bw + 1} y={(h - bh) / 2} width={Math.max(2, bw - 3)} height={bh} rx={2} fill={color} />;
      })}
    </svg>
  );

const Strike: React.FC<{ t: number; at: number; label: string }> = ({ t, at, label }) => {
  if (t < at - 0.05) return null;
  const p = pop(t, at - 0.05, 0.25);
  const line = ease(t, at + 0.15, 0.2);
  return (
    <div style={{
      position: "relative", display: "inline-block", padding: "12px 26px", borderRadius: 14, background: "#fff",
      border: "3px solid #e4ddd3", fontFamily: SANS, fontWeight: 800, fontSize: 44, color: "#8a8178",
      transform: `scale(${lerp(0.6, 1, p)}) rotate(${(1 - p) * -6}deg)`, opacity: Math.min(1, p * 2),
    }}>
      {label}
      <div style={{
        position: "absolute", left: 10, right: 10, top: "52%", height: 7, borderRadius: 4, background: C.accent,
        transform: `scaleX(${line}) rotate(-4deg)`, transformOrigin: "left",
      }} />
    </div>
  );
};

// ---------------- hook: your voice -> AI clone, no ElevenLabs, no subscription ----------------
export const HookCard: React.FC<CardProps> = ({ t, w }) => {
  const row = (label: string, color: string, p: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ width: 210, fontFamily: MONO, fontSize: 24, color: "#6b7280" }}>{label}</div>
      <Wave t={t} n={34} w={w - 330} h={92} color={color} seed={1.3} />
    </div>
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fbfaf8", padding: "34px 40px" }}>
      {row("your_voice.wav", "#9aa1a9", ease(t, 0.2, 0.3))}
      <div style={{ height: 22 }} />
      {row("AI clone", C.accent, ease(t, 0.9, 0.4))}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", justifyContent: "center", gap: 26 }}>
        <Strike t={t} at={T.elevenlabs} label="ElevenLabs" />
        <Strike t={t} at={T.subscription} label="Subscription" />
      </div>
    </div>
  );
};

// ---------------- STEP 1: short clip -> cloned on your computer, nothing uploaded ----------------
export const ClipCard: React.FC<CardProps> = ({ t, w }) => {
  const rec = ease(t, T.clip - 0.1, 0.3);
  const prog = ease(t, T.clones, 1.1);
  const done = ease(t, T.clones + 1.1, 0.25);
  const lock = pop(t, T.nothing, 0.35);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fbfaf8", padding: "30px 40px", fontFamily: SANS }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, color: "#6b7280" }}>
        <span>Voice Clone</span><span>runs on this PC</span>
      </div>
      <div style={{
        marginTop: 20, padding: "18px 24px", borderRadius: 18, background: "#fff", border: `3px solid ${rec > 0 ? C.accent : "#e4ddd3"}`,
        opacity: lerp(0.4, 1, rec), display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, background: "#e5484d", opacity: Math.floor(t * 3) % 2 ? 1 : 0.35 }} />
        <span style={{ fontFamily: MONO, fontSize: 26, color: "#1f2328" }}>sample.wav · 0:11</span>
        <Wave t={t} n={20} w={w - 470} h={60} color={C.accent} seed={2.2} live={1 - prog} />
      </div>
      <div style={{ marginTop: 34, fontSize: 34, fontWeight: 700, color: "#1f2328", opacity: ease(t, T.clones - 0.1, 0.2) }}>
        {done < 0.5 ? "Cloning your voice…" : "✓ Voice “Talha” ready"}
      </div>
      <div style={{ marginTop: 14, height: 18, borderRadius: 9, background: "#ece6de", overflow: "hidden", opacity: ease(t, T.clones - 0.1, 0.2) }}>
        <div style={{ width: `${prog * 100}%`, height: "100%", background: C.accent }} />
      </div>
      {t >= T.nothing && (
        <div style={{
          position: "absolute", left: "50%", bottom: 40, transform: `translateX(-50%) scale(${lerp(0.5, 1, lock)}) rotate(${(1 - lock) * 8}deg)`,
          opacity: Math.min(1, lock * 2), display: "flex", alignItems: "center", gap: 16, padding: "16px 30px", borderRadius: 999,
          background: "#141210", color: "#fff", fontWeight: 800, fontSize: 38, whiteSpace: "nowrap",
          boxShadow: `0 0 0 3px ${C.accent}, 0 12px 30px rgba(${C.accentGlow},0.35)`,
        }}>
          <span style={{ fontSize: 34 }}>🔒</span> Uploaded: <span style={{ color: C.accentHot }}>nothing</span>
        </div>
      )}
    </div>
  );
};

// ---------------- STEP 2: type anything -> it reads it back in your voice ----------------
const LINE = "This isn't me talking. This is my AI clone.";
export const TypeCard: React.FC<CardProps> = ({ t, w }) => {
  const typed = LINE.slice(0, Math.floor(Math.max(0, t - T.type) * 26));
  const press = t >= T.reads - 0.15 ? pop(t, T.reads - 0.15, 0.25) : 1;
  const cursorOn = Math.floor(t * 2.5) % 2 === 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fbfaf8", padding: "30px 40px", fontFamily: SANS }}>
      <div style={{ fontFamily: MONO, fontSize: 22, color: "#6b7280" }}>Voice: Talha (clone)</div>
      <div style={{
        marginTop: 16, height: 190, padding: "20px 24px", borderRadius: 18, background: "#fff", border: "3px solid #e4ddd3",
        fontSize: 40, fontWeight: 600, lineHeight: 1.3, color: "#1f2328",
      }}>
        {typed}{typed.length < LINE.length && cursorOn && <span style={{ color: C.accent }}>|</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 26, marginTop: 26 }}>
        <div style={{
          padding: "16px 36px", borderRadius: 14, background: C.accent, color: "#fff", fontWeight: 900, fontSize: 36,
          transform: `scale(${lerp(0.88, 1, press)})`, boxShadow: `0 8px 22px rgba(${C.accentGlow},0.45)`,
        }}>▶ Generate</div>
        <div style={{ opacity: ease(t, T.reads, 0.2) }}>
          <Wave t={t} n={22} w={w - 400} h={70} color={C.accent} seed={4.1} />
        </div>
      </div>
    </div>
  );
};

// ---------------- PROOF: the real clone plays ----------------
export const ProofCard: React.FC<CardProps> = ({ t, w }) => {
  const speak = ease(t, T.proof1 + 0.3, 0.15) * (1 - ease(t, T.proof1 + 0.3 + 2.46, 0.2));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#14110f", padding: "36px 40px", fontFamily: SANS, textAlign: "center" }}>
      <div style={{ fontFamily: MONO, fontSize: 26, color: "#9a8f85", textAlign: "left" }}>Voice: Talha (AI clone) · generated on this PC</div>
      <div style={{
        display: "inline-block", marginTop: 70, padding: "10px 26px", borderRadius: 999, background: C.accent, color: "#fff",
        fontWeight: 900, fontSize: 40, letterSpacing: 2, opacity: Math.floor(t * 4) % 2 || speak > 0.1 ? 1 : 0.5,
      }}>🔊 SOUND ON</div>
      <div style={{ marginTop: 70, display: "flex", justifyContent: "center" }}>
        <Wave t={t} n={30} w={w - 80} h={300} color={C.accentHot} seed={3.3} live={1} />
      </div>
      <div style={{ marginTop: 40, fontWeight: 800, fontSize: 40, color: "#fff", opacity: lerp(0.4, 1, speak) }}>
        {speak > 0.05 ? "▶ Playing my AI clone…" : "▶ Generate"}
      </div>
    </div>
  );
};

// ---------------- STEP 3: dub into 646 languages ----------------
const LANGS = ["English", "日本語", "Español", "Français", "हिन्दी", "العربية", "Deutsch", "Português", "한국어", "Türkçe", "Italiano", "اردو", "Polski", "Kiswahili", "Tiếng Việt", "Русский"];
export const DubCard: React.FC<CardProps> = ({ t }) => {
  const start = T.dub - 0.1;
  const n = Math.round(646 * ease(t, T.languages - 0.3, 1.2));
  const hotIdx = Math.min(LANGS.length - 1, Math.floor((t - start) / 0.13));
  return (
    <div style={{ position: "absolute", inset: 0, background: "#14110f", padding: "34px 40px", fontFamily: SANS }}>
      <div style={{ fontFamily: MONO, fontSize: 24, color: "#9a8f85" }}>Video dubbing · my_reel.mp4</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 28 }}>
        {LANGS.map((l, i) => {
          const at = start + i * 0.13;
          if (t < at) return null;
          const p = pop(t, at, 0.22);
          const hot = i === hotIdx;
          return (
            <span key={l} style={{
              padding: "12px 24px", borderRadius: 999, fontSize: 36, fontWeight: 700,
              color: "#fff", background: hot ? C.accent : "rgba(255,255,255,0.07)",
              border: `2px solid ${hot ? C.accent : "rgba(255,255,255,0.14)"}`,
              transform: `scale(${lerp(0.6, 1, p)})`, opacity: Math.min(1, p * 2),
            }}>{l}</span>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center", opacity: ease(t, T.languages - 0.3, 0.2) }}>
        <div style={{ fontWeight: 900, fontSize: 190, lineHeight: 1, letterSpacing: -6, color: C.accentHot, textShadow: `0 0 40px rgba(${C.accentGlow},0.6)` }}>{n}</div>
        <div style={{ fontWeight: 800, fontSize: 44, color: "#fff", marginTop: 4 }}>languages</div>
      </div>
    </div>
  );
};

// ---------------- plus: no account, no API key, Windows / Mac / Linux ----------------
export const PlusCard: React.FC<CardProps> = ({ t }) => {
  const rows: [number, string, boolean][] = [
    [T.account, "No account", false],
    [T.api, "No API key", false],
    [T.windows, "Windows", true],
    [T.mac, "Mac", true],
    [T.linux, "Linux", true],
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fbfaf8", padding: "22px 44px", fontFamily: SANS }}>
      {rows.map(([at, label, yes]) => {
        if (t < at - 0.1) return null;
        const p = pop(t, at - 0.1, 0.25);
        return (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 24, marginTop: 14, opacity: Math.min(1, p * 2),
            transform: `translateX(${(1 - p) * -40}px)`,
          }}>
            <span style={{
              width: 62, height: 62, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40, fontWeight: 900, color: "#fff", background: yes ? C.accent : "#141210",
            }}>{yes ? "✓" : "✕"}</span>
            <span style={{ fontSize: 48, fontWeight: 800, color: "#1f2328" }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------- real screen recordings (scripts/capture.mjs) ----------------
const REC_CSS_W = 760; // recordings are 760 css px wide at 2x
const recording = (file: string, startFrom: number, cardId: string): React.FC<CardProps> => ({ w }) => {
  const card = CARDS.find((c) => c.id === cardId)!;
  return (
    <Sequence from={Math.round(card.start * 30)} layout="none">
      <OffthreadVideo src={staticFile(`rec/${file}`)} startFrom={Math.round(startFrom * 30)} muted
        style={{ position: "absolute", left: 0, top: 0, width: w, height: (w / REC_CSS_W) * 830 }} />
    </Sequence>
  );
};

export const SiteRecCard = recording("vs_site.mp4", 0.3, "site");
const GITHUB_FROM = 0.4;
const GithubRec = recording("vs_github.mp4", GITHUB_FROM, "github");
export const GithubRecCard: React.FC<CardProps> = (props) => {
  const k = props.w / REC_CSS_W; // css px -> card px
  const card = CARDS.find((c) => c.id === "github")!;
  const landed = card.start + (1.3 - GITHUB_FROM);  // cursor reaches the star count
  const scrolls = card.start + (2.5 - GITHUB_FROM); // page starts scrolling
  return (
    <>
      <GithubRec {...props} />
      {/* circle the real star count ("92.7k stars" sits at css 15..107 x 685 before scrolling) */}
      <ScribbleCircle t={props.t} start={landed} end={scrolls} cx={61 * k} cy={685 * k} w={150 * k} h={46 * k} seed={2} />
    </>
  );
};

// ---------------- the clone answers: "Bomboclatt!" ----------------
export const CloneReply: React.FC<{ t: number; start: number }> = ({ t, start }) => {
  if (t < start) return null;
  const p = pop(t, start + 0.1, 0.35);
  return (
    <div style={{ position: "absolute", top: 1150, width: 1080, textAlign: "center", opacity: Math.min(1, p * 2) }}>
      <div style={{
        display: "inline-block", padding: "10px 24px", borderRadius: 999, background: "rgba(20,18,16,0.85)",
        border: `2px solid ${C.accent}`, fontFamily: MONO, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: "#fff",
      }}>MY AI CLONE · JAPANESE MODE</div>
      <div style={{
        marginTop: 10, fontFamily: SANS, fontWeight: 900, fontSize: 140, color: "#fff", letterSpacing: -4,
        transform: `scale(${lerp(0.5, 1, p)}) rotate(-4deg)`,
        textShadow: `0 0 20px rgba(${C.accentGlow},1), 0 0 60px rgba(${C.accentGlow},0.7)`,
      }}>Bomboclatt!</div>
    </div>
  );
};

// ---------------- sign-off end card ----------------
export const EndCard: React.FC<{ t: number; start: number; end: number }> = ({ t, start, end }) => {
  if (t < start || t >= end) return null;
  const p = pop(t, start, 0.35);
  const box = ease(t, start + 0.1, 0.22);
  return (
    <div style={{ position: "absolute", top: 1240, width: 1080, textAlign: "center" }}>
      <div style={{ position: "relative", display: "inline-block", padding: "10px 40px 18px", transform: `scale(${lerp(0.6, 1, p)}) rotate(-3deg)` }}>
        <div style={{
          position: "absolute", inset: 0, background: C.accent, borderRadius: 18, transform: `scaleX(${box})`, transformOrigin: "left",
          boxShadow: `0 0 50px rgba(${C.accentGlow},0.7)`,
        }} />
        <span style={{ position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 120, color: "#fff", letterSpacing: -4, opacity: Math.min(1, p * 2), whiteSpace: "nowrap" }}>
          Let's go, boys
        </span>
      </div>
    </div>
  );
};
