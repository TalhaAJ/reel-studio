---
name: reel-edit
description: Edit a new talking-head reel in the user's saved house style (default "Electric Orange v1") with the Remotion template in editor/. Use when the user drops new footage in raw-footage/, asks to edit/cut/make a reel, or says "use my style" / names a style preset.
---

# Edit a reel in the saved house style

The user films vertical green-screen talking heads on an iPhone and wants them edited into fast tech-explainer reels.
Their **style presets** live in `styles/`. Unless they name another, use `styles/electric-orange-v1.md`.
Read it first: it is the spec for colours, captions, layouts, sound and loudness.
`analysis/STYLE_GUIDE.md` describes the reference creator the structure came from. Use it for structure only, never for identity.

To restore the exact template code of a preset: `git checkout style/<preset> -- editor/src editor/scripts` (run from `C:\AI Video Editing`).
When the user asks to experiment, work on a git branch (`exp/<idea>`) so the preset tag stays intact.

## Pipeline (all paths relative to `C:\AI Video Editing`)

ffmpeg is not on Git Bash PATH; scripts use the full winget path. Python scripts must run from `editor/scripts` (not with `-I`: they import each other).

1. **Probe** the new clip in `raw-footage/` (ffprobe). iPhone .MOV is 1080x1920 @60 after rotation. Make an overview contact sheet and look at it: green-screen coverage, where the wall starts (`WALL_Y` in `scripts/keyer.py`), and head position (`SRC_FACE_TOP` in `src/Layers.tsx`).
2. **Transcribe** with `python scripts/transcribe.py <clip> analysis/mine/words_medium.json` (medium.en). Also keep a small.en pass at `analysis/mine/words.json` as a fallback for words the medium model drops. Then run silencedetect (-38 dB, d=0.15) into `analysis/mine/silences.txt`.
3. **Pick takes** in `scripts/build_cuts.py` → `TAKES` (source start, end, beat, exact script line).
   - Choose the last **complete** attempt of each line. **Check for false starts** ("First you drop in your—… First you drop in your raw footage"). small.en glosses over them, so look at the medium transcript and the silences.
   - The script text in TAKES becomes the captions, so write it as actually said, with names spelled right (Claude Code, CapCut).
   - Run `python build_cuts.py` and read the per-beat word timings it prints.
4. **Plates:** `python render_plates.py` makes `public/voice.wav` (nearly raw voice; never add denoise or compression) and `public/face.webm` (custom green keyer, VP9 alpha). Takes about 4 min.
5. **Scene plan** in `src/timeline.ts`: anchor everything to spoken words with `at("word", "beat")`, plus `MODES`, `CARDS`, `STEPS`, `EMPHASIS`. Card contents live in `src/Cards.tsx`. Build new cards there for each new topic. Prefer **real screen recordings** from the user. Otherwise use public pages captured with headless Edge (`msedge --headless=new --screenshot=… --window-size=760,900 --force-device-scale-factor=2`).
   **Real screen recordings of websites:** add a shot to `SHOTS` in `scripts/capture.mjs` (url, cursor moves to selectors, clicks, scrolls), then run `node scripts/capture.mjs <name>`. It drives installed Edge frame by frame at 2x with a drawn cursor and writes `public/rec/<name>.mp4`. Use it via `recording(file, startFrom, cardId)` in `Cards.tsx`. Pages that need a login: the user signs in themselves. Never type their passwords.
   **Hand-drawn marks:** `ScribbleCircle` (Layers.tsx) circles real details (numbers, results) as they're mentioned.
6. **Sound** follows `styles/sound-design.md`:
   - Run `python scripts/music_bed.py` (track offset plus muffled hook) after build_cuts.
   - In `Reel.tsx`, `musicLevel()` sets the energy curve: duck under speech, swell in gaps, build, silence before the CTA.
   - Three effect tiers: HERO = `hero(at)` riser → impact, max 3. SUPPORT = whoosh per layout switch. TEXTURE = quiet.
   - The signature sting (`audio/sting_signature.wav`) plays on every STEP and on the sign-off.
7. **Render:** `npx tsc -p .`, then `npx remotion render src/index.ts Reel ../output/_vN_raw.mp4 --log=error` (about 7 min, so run it in the background), then `python scripts/master.py ../output/_vN_raw.mp4 ../output/reel_vN.mp4` (-14 LUFS).
8. **Verify before handing over:**
   - Make a 16-frame contact sheet and look at it: clipping, overlaps, readability.
   - Run `ebur128` and confirm I is about -14.0.
   - Re-transcribe the final mp4 with `scripts/transcribe.py` and confirm no repeated or missing lines.
   - Files over 30 MB can't reach the user's phone, so mention that or make a compressed copy.

## Identity bits the user asked for
- Sign-off catchphrase: **"Boys, let's go"**, on the sting plus an end card (they'll say it in future recordings).
- **Verdict** before the CTA: `VerdictStamp` in `src/Verdict.tsx` over a full-face section, using the user's own spoken verdict. Never invent their opinion.
- They'll gesture with their hands more: check the key doesn't clip hands at the frame edges.

## Working with the user
- They want to see progress and the process. Give short updates while long renders run.
- Ask before changing the identity (colours, fonts, signature elements). Change sound levels and timing fixes directly.
- After a version the user approves, offer to save it as a new preset: copy the style doc to `styles/<name>.md`, then commit and `git tag style/<name>`.
