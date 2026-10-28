import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { Easing, interpolate } from "remotion";

export const SANS = loadInter("normal", { weights: ["500", "600", "700", "800", "900"], subsets: ["latin"] }).fontFamily;
export const MONO = loadMono("normal", { weights: ["400", "600"], subsets: ["latin"] }).fontFamily;

// "Electric orange" identity
export const C = {
  accent: "#FF6A1A",        // brand orange: borders, marker, numbers
  accentHot: "#FF8A3D",     // lighter orange for text on dark
  accentGlow: "255,106,26", // rgb for rgba() glows
  ring: "rgba(255,214,170,1)", // travelling light on card borders
  ink: "#141210",
  paper: "#F6F1EA",         // warm off-white background
  paperDeep: "#EFE7DC",
  dot: "#D8CCBD",
  charcoal: "#1B1816",
  grey: "#9AA0A6",
};

/** 0→1 over [start, start+dur] seconds with ease-out. */
export const ease = (t: number, start: number, dur: number) =>
  interpolate(t, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

/** Ease-out with a little overshoot, for things that "land". */
export const pop = (t: number, start: number, dur: number) =>
  interpolate(t, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.7)),
  });

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
