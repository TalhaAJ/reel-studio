import React from "react";
import { Composition } from "remotion";
import { AgentReel, DURATION as AGENT_DUR } from "./pastel/AgentReel";

export const FPS = 30;

// Branch reel/agent-spending-limit (Pastel Proof style). Earlier reels' compositions live on their own branches.
export const Root: React.FC = () => (
  <Composition id="AgentReel" component={AgentReel} durationInFrames={AGENT_DUR} fps={FPS} width={1080} height={1920} />
);
