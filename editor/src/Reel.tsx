import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import cutsData from "../public/cuts.json";
import captions from "../public/captions.json";
import { Captions } from "./Captions";
import { DropCard, FramesCard, GithubRecCard, MotionCard, RemotionRecCard, StyleCard, TerminalCard, TranscriptCard } from "./Cards";
import {
  CARD_A, CARD_B, CARD_HOOK, CHROME_H, Cta, DarkBg, Face, FaceBg, HookTitle, LightBg, NeonCard, StatCard, StepCounter,
} from "./Layers";
import { ease } from "./theme";
import { CARDS, CTA_START, CardId, HOOK_END, MODES, STEPS, STEPS_END, T, modeAt } from "./timeline";

const CARD_VIEW: Record<CardId, { comp: React.FC<any>; url?: string; dark?: boolean }> = {
  terminal: { comp: TerminalCard, url: "claude — ~/videos", dark: true },
  remotion: { comp: RemotionRecCard, url: "remotion.dev" },
  github: { comp: GithubRecCard, url: "github.com/remotion-dev/remotion" },
  drop: { comp: DropCard, url: "claude — edit IMG_2292.MOV" },
  transcript: { comp: TranscriptCard, url: "transcript.json" },
  motion: { comp: MotionCard, url: "remotion studio", dark: true },
  style: { comp: StyleCard, url: "style_guide.md" },
  frames: { comp: FramesCard, url: "frames / IMG_2292.MOV" },
};

const TOTAL = cutsData.total;
const TOTAL_FRAMES_RENDERED = Math.ceil(TOTAL * 30);
const STAT1 = { start: T.free + 0.85, end: T.literally - 0.05 }; // after the cursor lands on the real star count
const STAT2 = { start: T.even + 0.2, end: T.plus };

// ---------------- sound design (styles/sound-design.md) ----------------
// Three tiers: HERO (riser -> impact, 3 per reel), SUPPORT (one whoosh per layout switch), TEXTURE (quiet).
type Sfx = { at: number; src: string; vol: number; len?: number; from?: number };
const a = (f: string) => `audio/${f}.mp3`;
const nearAny = (x: number, list: number[], tol = 0.12) => list.some((y) => Math.abs(x - y) < tol);
const modeStarts = MODES.slice(1).map((m) => m.start);
const RISER_PEAK = 6.25; // riser_short reaches its top at 6.25 s
const hero = (at: number, riserLen = 1.4): Sfx[] => [
  { at: at - riserLen, src: a("riser_short"), vol: 0.32, len: riserLen, from: RISER_PEAK - riserLen },
  { at: at - 0.5, src: a("impact_whoosh"), vol: 0.55, len: 1.6 }, // impact peaks 0.55 s into the file
];
const SFX: Sfx[] = [
  // SUPPORT: layout switches (J-cut: sound starts just before the picture) + cards that land mid-layout
  ...modeStarts.filter((x) => x !== T.cta).map((at) => ({ at: at - 0.08, src: a("whoosh_fast"), vol: 0.3 })),
  ...CARDS.filter((c) => !nearAny(c.start, modeStarts) && c.id !== "github").map((c) => ({ at: c.start, src: a("sweep"), vol: 0.24 })),
  { at: T.free - 0.05, src: a("ui_click"), vol: 0.4 }, // the "click" that opens GitHub
  // SIGNATURE: your sting on every STEP
  ...STEPS.map((x) => ({ at: x, src: "audio/sting_signature.wav", vol: 0.55, len: 0.8 })),
  // HERO moments: 68.5k stars, the frame counter, the CTA
  ...hero(STAT1.start),
  ...hero(STAT2.start),
  ...hero(CTA_START + 0.22, 1.6),
  // TEXTURE (quiet)
  { at: 0.35, src: a("typing"), vol: 0.2, len: 2.3, from: 1.0 },
  ...[3.15, 3.75, 4.55].map((x) => ({ at: x + 0.05, src: a("pop_dry"), vol: 0.22 })),
  { at: T.drop, src: a("pop_dry"), vol: 0.3 },
  { at: T.automatically, src: a("ding"), vol: 0.2, len: 1.2 },
  { at: T.then + 0.1, src: a("typing_soft"), vol: 0.12, len: T.animated - T.then - 0.2, from: 2.0 },
  { at: T.zooms - 0.05, src: a("zoom_air"), vol: 0.2 },
  ...[T.plus + 0.3, T.reel + 0.2, T.study, T.study + 0.55].map((x) => ({ at: x, src: a("pop_dry"), vol: 0.18 })),
];

// ---------------- music energy curve ----------------
// Ducked under speech, swells in the breaths and on layout switches, builds into the CTA,
// cuts to silence just before "comment", then comes back under the payoff.
const MUSIC = { duck: 0.05, swell: 0.1, build: 0.11, after: 0.075 };
type W = { s: number; e: number };
const GAPS: W[] = (captions as W[]).slice(1).map((w, i) => ({ s: (captions as W[])[i].e, e: w.s })).filter((g) => g.e - g.s > 0.18);
const tri = (t: number, s: number, e: number, ramp: number) =>
  Math.max(0, Math.min(1, (t - s) / ramp, (e - t) / ramp));
const musicLevel = (t: number) => {
  const gap = Math.max(0, ...GAPS.map((g) => tri(t, g.s - 0.05, g.e + 0.05, 0.12)), ...modeStarts.map((m) => tri(t, m - 0.25, m + 0.35, 0.2)));
  let v = MUSIC.duck + (MUSIC.swell - MUSIC.duck) * gap;
  const buildStart = T.cta - 1.5, dropAt = CTA_START - 0.3;
  if (t >= buildStart && t < dropAt) v = Math.max(v, MUSIC.duck + (MUSIC.build - MUSIC.duck) * ((t - buildStart) / (dropAt - buildStart)));
  if (t >= dropAt && t < CTA_START + 0.2) v = 0; // silence before the drop
  if (t >= CTA_START + 0.2) v = MUSIC.after;
  return v;
};

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const mode = modeAt(t);
  const modeStart = [...MODES].reverse().find((m) => t >= m.start)!.start;
  const hook = t < HOOK_END;
  const card = mode !== "C" ? CARDS.find((c) => t >= c.start && t < c.end) : undefined;
  const rect = hook ? CARD_HOOK : mode === "B" ? CARD_B : CARD_A;
  const glow = t >= T.glowing - 0.05 && t < T.even ? 1.9 : 1; // "glowing borders"
  // signature transition: a quick punch-in every time the layout switches
  const punch = modeStart > 0 ? 1 + 0.05 * (1 - ease(t, modeStart, 0.22)) : 1;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        {mode === "A" && <LightBg />}
        {mode === "B" && <DarkBg />}
        {mode === "C" && <FaceBg />}

        <Face mode={mode} t={t} modeStart={modeStart} />

        {card && (() => {
          const v = CARD_VIEW[card.id];
          const Comp = v.comp;
          return (
            <NeonCard rect={rect} local={t - card.start} url={v.url} dark={v.dark} glow={glow}>
              <Comp t={t} local={t - card.start} w={rect.w - 6} h={rect.h - 6 - CHROME_H} />
            </NeonCard>
          );
        })()}

        {hook && <HookTitle t={t} />}
        <StepCounter t={t} steps={STEPS} end={STEPS_END} onDark={mode !== "A"} />

        <StatCard t={t} start={STAT1.start} end={STAT1.end} value={68.5} format={(n) => `${n.toFixed(1)}k`}
          label="stars on GitHub" x={540} y={CARD_B.y + 330} /* above the hand-drawn circle */ />
        <StatCard t={t} start={STAT2.start} end={STAT2.end} value={TOTAL_FRAMES_RENDERED}
          format={(n) => Math.round(n).toLocaleString("en-GB")} label="frames, all made with code"
          x={540} y={CARD_B.y + CARD_B.h - 260} />

        {t < CTA_START && <Captions t={t} mode={mode} />}
        <Cta t={t} start={CTA_START} />
      </AbsoluteFill>

      <Audio src={staticFile("voice.wav")} />
      <Audio src={staticFile("audio/music_bed.wav")}
        volume={(f) => musicLevel(f / fps) * interpolate(f, [0, 10, durationInFrames - 36, durationInFrames - 1], [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {SFX.filter((s) => s.at >= 0 && s.at < TOTAL).map((s, i) => (
        <Sequence key={i} from={Math.round(s.at * fps)} durationInFrames={Math.max(3, Math.round((s.len ?? 1.0) * fps))}>
          <Audio src={staticFile(s.src)} volume={s.vol} startFrom={Math.round((s.from ?? 0) * fps)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
