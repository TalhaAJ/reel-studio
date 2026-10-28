import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { FaceBg } from "./Layers";
import { C, MONO, SANS } from "./theme";

// Reel cover, 1080x1920. Everything that matters sits inside the 3:4 grid crop (y 240..1680).
export const Thumbnail: React.FC = () => (
  <AbsoluteFill>
    <FaceBg />
    {/* you, eyebrow raised, mouth shut */}
    <Img src={staticFile("thumb_face.png")} style={{
      position: "absolute", left: "50%", top: 110, width: 1080 * 1.18,
      transform: "translateX(-50%)", filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.55))",
    }} />
    {/* headline */}
    <div style={{ position: "absolute", top: 250, width: 1080, textAlign: "center" }}>
      <div style={{
        fontFamily: SANS, fontWeight: 900, fontSize: 124, lineHeight: 1, letterSpacing: -5, color: "#fff",
        textShadow: "0 6px 0 rgba(0,0,0,0.35), 0 10px 40px rgba(0,0,0,0.6)",
      }}>I CLONED MY<br />OWN VOICE</div>
      <div style={{ position: "relative", display: "inline-block", marginTop: 22, padding: "8px 44px 18px", transform: "rotate(-3deg)" }}>
        <div style={{ position: "absolute", inset: 0, background: C.accent, borderRadius: 20, boxShadow: `0 0 60px rgba(${C.accentGlow},0.75)` }} />
        <span style={{ position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 150, color: "#fff", letterSpacing: -6 }}>FOR FREE</span>
      </div>
    </div>
    {/* proof chips */}
    <div style={{
      position: "absolute", left: 30, top: 1150, transform: "rotate(-6deg)", padding: "14px 26px", borderRadius: 16,
      background: "#fff", fontFamily: SANS, fontWeight: 900, fontSize: 52, color: "#8a8178",
      boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
    }}>
      ElevenLabs
      <div style={{ position: "absolute", left: 14, right: 14, top: "50%", height: 9, borderRadius: 5, background: C.accent, transform: "rotate(-5deg)" }} />
    </div>
    <div style={{
      position: "absolute", right: 30, top: 1330, transform: "rotate(5deg)", padding: "14px 26px", borderRadius: 16,
      background: "#141210", border: `4px solid ${C.accent}`, boxShadow: `0 0 40px rgba(${C.accentGlow},0.5)`, textAlign: "center",
    }}>
      <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 64, color: C.accentHot, lineHeight: 1 }}>92.7k ★</div>
      <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 26, color: "#fff", marginTop: 4 }}>on GitHub</div>
    </div>
  </AbsoluteFill>
);
