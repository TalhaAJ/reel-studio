import React from "react";
import { Composition } from "remotion";
import { Reel } from "./Reel";
import cutsData from "../public/cuts.json";

export const FPS = 30;

export const Root: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    durationInFrames={Math.ceil(cutsData.total * FPS)}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
