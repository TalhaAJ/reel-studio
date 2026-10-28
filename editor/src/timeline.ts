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
const beatEnd = (beat: string) => [...WORDS].reverse().find((x) => x.beat === beat)!.e;

export const T = {
  elevenlabs: at("elevenlabs", "hook"),
  subscription: at("subscription", "hook"),
  name: beatStart("name"),
  voicestudio: at("voicestudio", "name"),
  github: at("github", "name"),
  over: at("over", "name"),
  stars: at("stars", "name"),
  first: beatStart("first"),
  clip: at("clip", "first"),
  clones: at("clones", "first"),
  nothing: at("nothing", "first"),
  then: beatStart("then"),
  type: at("type", "then"),
  reads: at("reads", "then"),
  clone: beatStart("clone"),
  accent: at("accent", "clone"),
  listen: at("listen", "clone"),
  cloneEnd: beatEnd("clone"),
  proof1: beatStart("proof1") - 0.25,   // insert starts 0.3 s before the clone speaks
  finally: beatStart("finally"),
  dub: at("dub", "finally"),
  languages: at("languages", "finally"),
  damn: beatStart("damn"),
  plus: beatStart("plus"),
  account: at("account", "plus"),
  api: at("api", "plus"),
  windows: at("windows", "plus"),
  mac: at("mac", "plus"),
  linux: at("linux", "plus"),
  verdict: beatStart("verdict"),
  sick: at("sick", "verdict"),
  free: at("free", "verdict"),
  pocket: beatStart("pocket"),
  pocketWord: at("pocket", "pocket"),
  cta: beatStart("cta"),
  comment: at("comment", "cta"),
  signoff: beatStart("signoff"),
  proof2: beatStart("proof2") - 0.1,
};

export type Mode = "A" | "B" | "C"; // A = split (card + face cutout), B = dark screen focus, C = full face

export const MODES: { mode: Mode; start: number }[] = [
  { mode: "A", start: 0 },           // hook
  { mode: "B", start: T.name },      // "It's called VoiceStudio" -> site, then GitHub
  { mode: "A", start: T.first },     // STEP 1: clip -> clone
  { mode: "C", start: T.clone },     // "I cloned mine, England accent and all"
  { mode: "B", start: T.proof1 },    // PROOF: the clone speaks
  { mode: "B", start: T.finally },   // STEP 3: dub into 640+ languages
  { mode: "C", start: T.damn },      // "Damn."
  { mode: "A", start: T.plus },      // no account / no API key / Win Mac Linux
  { mode: "C", start: T.verdict },   // verdict + CTA + sign-off
];

export type CardId = "hook" | "site" | "github" | "clip" | "type" | "proof" | "dub" | "plus";

export const CARDS: { id: CardId; start: number; end: number }[] = [
  { id: "hook", start: 0.05, end: T.name },
  { id: "site", start: T.voicestudio - 0.15, end: T.github - 0.2 },
  { id: "github", start: T.github - 0.2, end: T.first },
  { id: "clip", start: T.first, end: T.then },
  { id: "type", start: T.then, end: T.clone },
  { id: "proof", start: T.proof1, end: T.finally },
  { id: "dub", start: T.finally, end: T.damn },
  { id: "plus", start: T.plus, end: T.verdict },
];

export const modeAt = (t: number): Mode => {
  let m: Mode = "A";
  for (const s of MODES) if (t >= s.start) m = s.mode;
  return m;
};

export const HOOK_END = T.name;
export const CTA_START = T.comment;
export const STEPS = [T.first, T.then, T.finally]; // "STEP 1/3" counter
export const STEPS_END = T.damn;

// Words that get the orange marker (first match per caption chunk)
export const EMPHASIS = new Set([
  "clone", "free", "elevenlabs", "subscription", "voicestudio", "open", "github", "stars",
  "clip", "clones", "computer", "nothing", "anything", "voice", "england", "accent", "listen",
  "dub", "languages", "damn", "account", "api", "windows", "mac", "linux",
  "sick", "worth", "pocket", "link", "talking", "bomboclatt",
]);
