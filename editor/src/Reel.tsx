import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import cutsData from "../public/cuts.json";
import captions from "../public/captions.json";
import { Captions } from "./Captions";
import { ClipCard, CloneReply, DubCard, EndCard, GithubRecCard, HookCard, PlusCard, ProofCard, SiteRecCard, TypeCard } from "./Cards";
import { VerdictStamp } from "./Verdict";
import {
  CARD_A, CARD_B, CARD_HOOK, CHROME_H, Cta, DarkBg, Face, FaceBg, HookTitle, LightBg, NeonCard, StatCard, StepCounter,
} from "./Layers";
import { ease } from "./theme";
import { CARDS, CTA_START, CardId, HOOK_END, MODES, STEPS, STEPS_END, T, modeAt } from "./timeline";

const CARD_VIEW: Record<CardId, { comp: React.FC<any>; url?: string; dark?: boolean }> = {
  hook: { comp: HookCard, url: "voice clone · free" },
  site: { comp: SiteRecCard, url: "voicestudio.sh" },
  github: { comp: GithubRecCard, url: "github.com/debpalash/VoiceStudio" },
  clip: { comp: ClipCard, url: "VoiceStudio · Voice Clone" },
  type: { comp: TypeCard, url: "VoiceStudio · Generate" },
  proof: { comp: ProofCard, url: "VoiceStudio · my AI clone", dark: true },
  dub: { comp: DubCard, url: "VoiceStudio · Dubbing", dark: true },
  plus: { comp: PlusCard, url: "what you need" },
};

const TOTAL = cutsData.total;
const STAT1 = { start: T.stars - 0.2, end: T.first - 0.05 };    // 92.7k stars, after the circle on the real count
const STAT_POCKET = { start: T.pocketWord - 0.1, end: T.comment - 0.1 };   // "nothing comes out of your own pocket"
const VERDICT = { start: T.sick - 0.05, end: T.pocket };

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
  ...modeStarts.filter((x) => x !== T.damn).map((at) => ({ at: at - 0.08, src: a("whoosh_fast"), vol: 0.3 })),
  ...CARDS.filter((c) => !nearAny(c.start, modeStarts) && c.id !== "github").map((c) => ({ at: c.start, src: a("sweep"), vol: 0.24 })),
  // SIGNATURE: your sting on every STEP and on the sign-off
  ...STEPS.map((x) => ({ at: x, src: "audio/sting_signature.wav", vol: 0.55, len: 0.8 })),
  { at: T.signoff + 0.15, src: "audio/sting_signature.wav", vol: 0.7, len: 1.2 },
  { at: T.proof2 + 0.05, src: a("impact_logo"), vol: 0.3, len: 1.2 },
  // HERO moments: 92.7k stars, 646 languages, the CTA
  ...hero(STAT1.start),
  ...hero(T.languages - 0.3),
  ...hero(CTA_START + 0.22, 1.6),
  // "Damn." -- everything drops out, one hit
  { at: T.damn - 0.02, src: a("impact_logo"), vol: 0.35, len: 1.0 },
  // verdict stamp slam
  { at: VERDICT.start + 0.12, src: a("pop_whoosh"), vol: 0.4 },
  // TEXTURE (quiet)
  { at: T.elevenlabs + 0.1, src: a("pop_dry"), vol: 0.22 }, { at: T.subscription + 0.1, src: a("pop_dry"), vol: 0.22 },
  { at: T.clip, src: a("pop_dry"), vol: 0.2 },
  { at: T.clones + 1.1, src: a("ding"), vol: 0.18, len: 1.2 },
  { at: T.nothing, src: a("pop_dry"), vol: 0.26 },
  { at: T.type, src: a("typing_soft"), vol: 0.14, len: T.reads - T.type - 0.2, from: 2.0 },
  { at: T.reads - 0.15, src: a("ui_click"), vol: 0.4 },
  ...[T.account, T.api, T.windows, T.mac, T.linux].map((x) => ({ at: x - 0.1, src: a("pop_dry"), vol: 0.18 })),
  { at: STAT_POCKET.start, src: a("pop_whoosh"), vol: 0.3 },
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
  if (t >= T.damn - 0.05 && t < T.plus) v = 0;     // "Damn." lands in silence
  if ((t >= T.proof1 && t < T.finally - 0.1) || t >= T.proof2) v = 0; // nothing over the clone
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
  const glow = 1;
  // signature transition: a quick punch-in every time the layout switches ("Damn." gets a bigger one)
  const amp = modeStart === T.damn ? 0.14 : 0.05;
  const punch = modeStart > 0 ? 1 + amp * (1 - ease(t, modeStart, modeStart === T.damn ? 0.35 : 0.22)) : 1;

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

        {hook && <HookTitle t={t} l1={["Clone", "Your", "Voice"]} l2={["For", "Free"]} />}
        <StepCounter t={t} steps={STEPS} end={STEPS_END} onDark={mode !== "A"} />

        <StatCard t={t} start={STAT1.start} end={STAT1.end} value={92.7} format={(n) => `${n.toFixed(1)}k`}
          label="stars on GitHub" x={540} y={CARD_B.y + 330} />
        {t >= VERDICT.start && t < VERDICT.end && <VerdictStamp t={t} start={VERDICT.start} verdict="SICK" sub="and it's free" />}
        <StatCard t={t} start={STAT_POCKET.start} end={STAT_POCKET.end} value={0} format={() => "£0"}
          label="out of your pocket" x={540} y={560} />

        {t < CTA_START && <Captions t={t} mode={mode} />}
        <CloneReply t={t} start={T.proof2} />
        <Cta t={t} start={CTA_START} word="VOICE" end={T.signoff} />
        <EndCard t={t} start={T.signoff} end={T.proof2} />
      </AbsoluteFill>

      <Audio src={staticFile("voice.wav")} />
      {(cutsData.cuts as { t: number; gap?: boolean; wav?: string; lead?: number }[]).filter((c) => c.gap).map((c) => (
        <Sequence key={c.wav} from={Math.round((c.t + c.lead!) * fps)}>
          <Audio src={staticFile(`audio/${c.wav}`)} volume={1.1} />
        </Sequence>
      ))}
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
