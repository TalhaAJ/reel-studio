// Scene plan for this reel. Every time is anchored to a spoken word in public/captions.json,
// so re-cutting takes never knocks the animations out of sync.
import captions from "../public/captions.json";

type Word = { w: string; s: number; e: number; beat: string };
const WORDS = captions as Word[];
const clean = (w: string) => w.toLowerCase().replace(/[^a-z']/g, "");

/** Start time of the nth occurrence of `word` (within `beat`). */
export const at = (word: string, beat?: string, nth = 0): number => {
  const hits = WORDS.filter((x) => clean(x.w) === word && (!beat || x.beat === beat));
  if (!hits[nth]) throw new Error(`timeline: word "${word}" (${beat ?? "any"}) #${nth} not in captions`);
  return hits[nth].s;
};
const beatStart = (beat: string) => Math.max(0, WORDS.find((x) => x.beat === beat)!.s - 0.05);

export const T = {
  name: beatStart("name"),
  remotion: at("remotion", "name"),
  free: at("free", "name"),
  turns: at("turns", "name"),
  literally: at("literally", "name"),
  first: beatStart("first"),
  drop: at("drop", "first"),
  cut: at("cut", "first"),
  automatically: at("automatically", "first"),
  then: beatStart("then"),
  animated: at("animated", "then"),
  finally: beatStart("finally"),
  screen: at("screen", "finally"),
  zooms: at("zooms", "finally"),
  glowing: at("glowing", "finally"),
  even: at("even", "finally"),
  plus: beatStart("plus"),
  reel: at("reel", "plus"),
  study: at("study", "plus"),
  frame: at("frame", "plus"),
  recreate: at("recreate", "plus"),
  cta: beatStart("cta"),
  comment: at("comment", "cta"),
};

export type Mode = "A" | "B" | "C"; // A = split (card + face cutout), B = dark screen focus, C = full face

export const MODES: { mode: Mode; start: number }[] = [
  { mode: "A", start: 0 },           // hook
  { mode: "B", start: T.name },      // "It's called Remotion"
  { mode: "C", start: T.literally }, // "literally write the entire video for you"
  { mode: "A", start: T.first },     // "First, you drop in your raw footage"
  { mode: "C", start: T.animated },  // "animated captions that pop exactly as you speak"
  { mode: "B", start: T.finally },   // "And finally, motion graphics"
  { mode: "A", start: T.plus },      // "Plus, show a reel you love"
  { mode: "C", start: T.cta },       // CTA
];

export type CardId = "terminal" | "remotion" | "github" | "drop" | "transcript" | "motion" | "style" | "frames";

export const CARDS: { id: CardId; start: number; end: number }[] = [
  { id: "terminal", start: 0.05, end: T.name },
  { id: "remotion", start: T.remotion - 0.15, end: T.free },  // real recording: cursor heads for "GitHub" and clicks…
  { id: "github", start: T.free, end: T.literally },          // …which "opens" the real repo page
  { id: "drop", start: T.first, end: T.then },
  { id: "transcript", start: T.then, end: T.animated },
  { id: "motion", start: T.finally, end: T.plus },
  { id: "style", start: T.plus, end: T.frame },
  { id: "frames", start: T.frame, end: T.cta },
];

export const modeAt = (t: number): Mode => {
  let m: Mode = "A";
  for (const s of MODES) if (t >= s.start) m = s.mode;
  return m;
};

export const HOOK_END = T.name;
export const CTA_START = T.comment;
export const STEPS = [T.first, T.then, T.finally]; // "STEP 1/3" counter
export const STEPS_END = T.plus;

// Words that get the orange marker (first match per caption chunk)
export const EMPHASIS = new Set([
  "talking", "claude", "premiere", "capcut", "remotion", "free", "video", "entire",
  "footage", "pause", "mistake", "transcribes", "word", "animated", "captions", "pop",
  "motion", "graphics", "zooms", "glowing", "borders", "count", "reel", "style",
  "frame", "recreate", "setup",
]);
