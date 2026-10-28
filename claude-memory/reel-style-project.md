---
name: reel-style-project
description: "User edits their own Instagram reels with Claude, copying a specific tech-explainer creator's style; style guide at analysis/STYLE_GUIDE.md, Remotion template in editor/"
metadata:
  node_type: memory
  type: project
  originSessionId: e04e02be-77ba-45bd-add8-5db7e51921ab
  modified: 2026-10-28T14:58:05.777Z
---

The user wants to edit their own videos in the exact style of a creator they love (fast tech-tool explainer reels: split layout with screen card on top and a background-removed face cutout below, blue neon borders, word-by-word captions with blue serif-italic emphasis, "comment WORD" CTA). Started 2026-10-28.

Folders in C:\AI Video Editing: references/ (5 reference reels), raw-footage/ (user's clips), analysis/ (frames, transcripts, STYLE_GUIDE.md), output/ (renders), editor/ (Remotion project).

The user records on an iPhone (vertical 1080x1920 @60, .MOV) in front of a green screen, from a Manchester-accented script. They prefer that Claude edits directly (Remotion + ffmpeg), not edit plans for CapCut.

Pipeline (editor/): scripts/build_cuts.py (pick takes, strip silences, remap captions) → scripts/render_plates.py (cut, -14 LUFS voice, custom green keyer → public/face.webm) → src/timeline.ts (scene/mode plan per video) → `npx remotion render src/index.ts Reel ../output/x.mp4` (~7 min).

**Why:** The whole workflow is about replicating that style, so STYLE_GUIDE.md is the spec for every edit.
**How to apply:** Read analysis/STYLE_GUIDE.md before planning any edit. The per-video bits are TAKES in build_cuts.py, timeline.ts and the card contents in Cards.tsx. Pending: a clarity check of the user's speech (Whisper confidence plus word timing), which they asked for. See [[video-tooling-setup]].

**2026-10-28:** the first production reel (VoiceStudio, `output/voicestudio_v2.mp4`, git branch `reel/voicestudio`) was posted. The user accepted designed STEP screens instead of real app footage. Next time, plan real app captures *before* uninstalling anything; the official site screenshots are the fallback.
