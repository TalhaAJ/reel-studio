// Separate entry for design previews (stills), so experiments never touch the main Reel composition.
//   npx remotion still src/preview.tsx VerdictPreview out.png
import React from "react";
import { Composition, registerRoot } from "remotion";
import { VerdictPreview } from "./Verdict";
import { Thumbnail } from "./Thumbnail";

const Previews: React.FC = () => (
  <>
    <Composition id="VerdictPreview" component={VerdictPreview} durationInFrames={30} fps={30} width={1080} height={1920} />
    <Composition id="Thumbnail" component={Thumbnail} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);

registerRoot(Previews);
