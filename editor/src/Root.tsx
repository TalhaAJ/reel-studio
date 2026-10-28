import React from "react";
import { Composition, Sequence } from "remotion";
import { FocHook } from "./FocHook";
import { BODY_TOTAL, FocBody } from "./FocBody";
import cutsData from "../public/cuts.json";

export const FPS = 30;
const HOOK_F = Math.ceil(cutsData.total * FPS);
// the hook's music starts 0.5 s after the freeze at 28.5 s into the track; the body carries on from there
const MUSIC_FROM = 28.5 + (cutsData.total - (cutsData.freeze + 0.5));

const FocFull: React.FC = () => (
  <>
    <Sequence durationInFrames={HOOK_F}><FocHook /></Sequence>
    <Sequence from={HOOK_F}><FocBody musicFrom={MUSIC_FROM} /></Sequence>
  </>
);

// Branch reel/fact-or-cap. (The Electric Orange v2 "Reel" composition lives on master.)
export const Root: React.FC = () => (
  <>
    <Composition id="FocFull" component={FocFull} durationInFrames={HOOK_F + Math.ceil(BODY_TOTAL * FPS)} fps={FPS} width={1080} height={1920} />
    <Composition id="FocHook" component={FocHook} durationInFrames={HOOK_F} fps={FPS} width={1080} height={1920} />
  </>
);
