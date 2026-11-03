// "Pastel Proof" style (copied from the reference reel 8.mp4): pale sky board, black headline box,
// rainbow-rimmed proof card, karaoke captions, face in a marble-backed square at the bottom.
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

export const HEAD = loadAnton("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
export const BODY = loadPoppins("normal", { weights: ["600", "700", "800"], subsets: ["latin"] }).fontFamily;

export const P = {
  sky: "#E9EEF7",        // board
  slate: "#8C95A1",      // board for the closing section
  ink: "#17181C",
  mute: "#B9C1CC",       // caption words not yet spoken
  yellow: "#F7F44A",     // headline highlight
  blue: "#2F5BEA",       // caption box / pills
  red: "#E5294B",
  green: "#1E9E5A",
  lime: "#C8F53A",       // numbers on dark stat cards
  navy: "#121826",
  rim: ["#7EE8FA", "#A78BFA", "#F9A8D4", "#FDE68A", "#86EFAC", "#7EE8FA"],
};

export type Rect = { x: number; y: number; w: number; h: number };
export const lerpRect = (a: Rect, b: Rect, p: number): Rect => ({
  x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, w: a.w + (b.w - a.w) * p, h: a.h + (b.h - a.h) * p,
});

// Layouts, measured off the reference at 1080x1920
export const TITLE: Rect = { x: 62, y: 46, w: 956, h: 300 };
export type Layout = "title" | "card" | "face";
export const CARD: Record<Layout, Rect> = {
  title: { x: 150, y: 396, w: 780, h: 700 },
  card: { x: 64, y: 138, w: 952, h: 880 },
  face: { x: 64, y: 138, w: 952, h: 880 },  // card is hidden in face layout
};
export const FACE: Record<Layout, Rect> = {
  title: { x: 90, y: 1242, w: 900, h: 760 },
  card: { x: 90, y: 1192, w: 900, h: 810 },
  face: { x: 22, y: 640, w: 1036, h: 1360 },
};
export const CAPTION_Y: Record<Layout, number> = { title: 1166, card: 1106, face: 470 };
