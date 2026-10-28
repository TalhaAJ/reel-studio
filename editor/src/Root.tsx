import React from "react";
import { Composition } from "remotion";
import { FocHook } from "./FocHook";
import cutsData from "../public/cuts.json";

export const FPS = 30;

// Branch reel/fact-or-cap: the Fact or Cap hook. (The Electric Orange v2 "Reel" composition lives on master.)
export const Root: React.FC = () => (
  <Composition id="FocHook" component={FocHook} durationInFrames={Math.ceil(cutsData.total * FPS)} fps={FPS} width={1080} height={1920} />
);
