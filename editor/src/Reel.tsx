import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import cutsData from "../public/cuts.json";
import { Captions, EMPHASIS_TIMES } from "./Captions";
import { DropCard, FramesCard, MotionCard, RemotionCard, StyleCard, TerminalCard, TranscriptCard } from "./Cards";
import {
  CARD_A, CARD_B, CARD_HOOK, CHROME_H, Cta, DarkBg, Face, FaceBg, HookTitle, LightBg, NeonCard, StatCard, StepCounter,
} from "./Layers";
import { ease } from "./theme";
import { CARDS, CTA_START, CardId, HOOK_END, MODES, STEPS, STEPS_END, T, modeAt } from "./timeline";

const CARD_VIEW: Record<CardId, { comp: React.FC<any>; url?: string; dark?: boolean }> = {
  terminal: { comp: TerminalCard, url: "claude — ~/videos", dark: true },
  remotion: { comp: RemotionCard, url: "remotion.dev" },
  drop: { comp: DropCard, url: "claude — edit IMG_2292.MOV" },
  transcript: { comp: TranscriptCard, url: "transcript.json" },
  motion: { comp: MotionCard, url: "remotion studio", dark: true },
  style: { comp: StyleCard, url: "style_guide.md" },
  frames: { comp: FramesCard, url: "frames / IMG_2292.MOV" },
};

const TOTAL = cutsData.total;
const TOTAL_FRAMES_RENDERED = Math.ceil(TOTAL * 30);
const STAT1 = { start: T.free - 0.05, end: T.turns + 0.15 };
const STAT2 = { start: T.even + 0.2, end: T.plus };

// ---------------- sound design ----------------
type Sfx = { at: number; src: string; vol: number; len?: number; from?: number };
const a = (f: string) => `audio/${f}.mp3`;
const nearAny = (x: number, list: number[], tol = 0.12) => list.some((y) => Math.abs(x - y) < tol);
const modeStarts = MODES.slice(1).map((m) => m.start);
const SFX: Sfx[] = [
  // layout switches + card entrances
  ...modeStarts.map((at) => ({ at: at - 0.08, src: a("whoosh_fast"), vol: 0.32 })),
  ...CARDS.filter((c) => !nearAny(c.start, modeStarts)).map((c) => ({ at: c.start, src: a("sweep"), vol: 0.3 })),
  // hook
  { at: 0.0, src: a("pop_whoosh"), vol: 0.35 },
  { at: 0.42, src: a("sweep"), vol: 0.22 },
  { at: 0.35, src: a("typing"), vol: 0.3, len: 2.3, from: 1.0 },
  ...[3.15, 3.75, 4.55].map((x) => ({ at: x + 0.05, src: a("pop_dry"), vol: 0.4 })),
  // Remotion: GitHub highlight, stat, zoom to editor
  { at: STAT1.start, src: a("pop_whoosh"), vol: 0.45 },
  { at: T.free + 0.15, src: a("ui_click"), vol: 0.35 },
  { at: T.turns - 0.05, src: a("zoom_air"), vol: 0.28 },
  // step 1: drop + cut
  ...STEPS.map((x) => ({ at: x + 0.02, src: a("select_click"), vol: 0.3, len: 0.4 })),
  { at: T.drop, src: a("pop_dry"), vol: 0.45 },
  { at: T.cut, src: a("sweep"), vol: 0.28 },
  { at: T.automatically, src: a("ding"), vol: 0.25, len: 1.2 },
  // step 2: transcript typing
  { at: T.then + 0.1, src: a("typing_soft"), vol: 0.18, len: T.animated - T.then - 0.2, from: 2.0 },
  // step 3: zooms, glow, counter
  { at: T.screen - 0.05, src: a("zoom_air"), vol: 0.25 },
  { at: T.zooms - 0.05, src: a("zoom_air"), vol: 0.3 },
  { at: T.glowing - 0.05, src: a("sweep"), vol: 0.22 },
  { at: STAT2.start, src: a("pop_whoosh"), vol: 0.45 },
  // style guide rows
  ...[T.plus + 0.3, T.reel + 0.2, T.study, T.study + 0.55].map((x) => ({ at: x, src: a("pop_dry"), vol: 0.32 })),
  // CTA
  { at: CTA_START + 0.22, src: a("pop_whoosh"), vol: 0.5 },
  { at: CTA_START + 0.3, src: a("ding"), vol: 0.28, len: 1.5 },
  // a soft tick on every orange-marker word
  ...EMPHASIS_TIMES.filter((x) => x < CTA_START && !nearAny(x, modeStarts, 0.2)).map((x) => ({ at: x, src: a("ui_click"), vol: 0.12 })),
];

const MUSIC_FROM = 28.5; // seconds into the track: skips the intro, lands on the fuller section
const MUSIC_VOL = 0.07; // v3 used 0.16: too loud under the voice (now about 7 dB lower)

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

        <StatCard t={t} start={STAT1.start} end={STAT1.end} value={68} format={(n) => `${Math.round(n)}k`}
          label="stars on GitHub" x={540} y={CARD_B.y + CARD_B.h - 230} />
        <StatCard t={t} start={STAT2.start} end={STAT2.end} value={TOTAL_FRAMES_RENDERED}
          format={(n) => Math.round(n).toLocaleString("en-GB")} label="frames, all made with code"
          x={540} y={CARD_B.y + CARD_B.h - 260} />

        {t < CTA_START && <Captions t={t} mode={mode} />}
        <Cta t={t} start={CTA_START} />
      </AbsoluteFill>

      <Audio src={staticFile("voice.wav")} />
      <Audio src={staticFile(a("music_digital_clouds"))} startFrom={Math.round(MUSIC_FROM * fps)}
        volume={(f) => MUSIC_VOL * interpolate(f, [0, 10, durationInFrames - 36, durationInFrames - 1], [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {SFX.filter((s) => s.at >= 0 && s.at < TOTAL).map((s, i) => (
        <Sequence key={i} from={Math.round(s.at * fps)} durationInFrames={Math.max(3, Math.round((s.len ?? 1.0) * fps))}>
          <Audio src={staticFile(s.src)} volume={s.vol} startFrom={Math.round((s.from ?? 0) * fps)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
