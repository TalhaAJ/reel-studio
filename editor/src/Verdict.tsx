import React from "react";
import { AbsoluteFill } from "remotion";
import { FaceBg } from "./Layers";
import { C, MONO, SANS, ease, lerp, pop } from "./theme";

/**
 * "Verdict" stamp: your honest take, slammed onto the screen before the CTA.
 * Drop it in Reel.tsx over a full-face (mode C) section once the verdict line is recorded.
 */
export const VerdictStamp: React.FC<{ t: number; start: number; verdict: string; sub?: string }> = ({ t, start, verdict, sub }) => {
  if (t < start) return null;
  const p = pop(t, start, 0.28);
  const land = t - start;
  const shake = land > 0.18 && land < 0.42 ? Math.sin(land * 90) * (0.42 - land) * 30 : 0; // impact shake
  const subP = ease(t, start + 0.35, 0.25);
  return (
    <div style={{
      position: "absolute", left: "50%", top: 330,
      transform: `translate(-50%, 0) translate(${shake}px, ${shake * 0.4}px) rotate(-6deg) scale(${lerp(1.7, 1, p)})`,
      opacity: Math.min(1, p * 3),
    }}>
      <div style={{
        border: `8px solid ${C.accent}`, borderRadius: 26, padding: "18px 46px 26px", background: "rgba(20,18,16,0.55)",
        boxShadow: `0 0 0 4px rgba(20,18,16,0.6), 0 0 40px rgba(${C.accentGlow},0.55), inset 0 0 30px rgba(${C.accentGlow},0.25)`,
        textAlign: "center",
      }}>
        <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 34, letterSpacing: 10, color: C.accentHot }}>VERDICT</div>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 120, lineHeight: 1, letterSpacing: -4, color: "#fff", marginTop: 6, whiteSpace: "nowrap" }}>
          {verdict}
        </div>
      </div>
      {sub && (
        <div style={{
          marginTop: 22, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 40, color: "#fff",
          opacity: subP, transform: `rotate(6deg) translateY(${(1 - subP) * 12}px)`, textShadow: "0 4px 16px rgba(0,0,0,0.6)",
        }}>{sub}</div>
      )}
    </div>
  );
};

/** Still preview of the stamp (example wording only; the real verdict comes from your recording). */
export const VerdictPreview: React.FC = () => (
  <AbsoluteFill>
    <FaceBg />
    <VerdictStamp t={1} start={0} verdict="WORTH IT" sub="(example text: your real verdict goes here)" />
  </AbsoluteFill>
);
