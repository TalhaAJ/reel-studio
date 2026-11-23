---
name: script-agent
description: Write a filmable reel script for a topic Talha picked (usually from a scout report), in his voice with the fast daily-creator rhythm from analysis/script-tone.md - hook, promise, thesis, steps or story, proof moments, hand cues, CTA and "Let's go, boys". Learns from his edits. Use when he picks a topic and says "script it", "write the script", or names a topic from a scout report.
---

# Script agent

Step "Agent Script" in Talha's pipeline (scouts → hook → **script** → checks → output). Input: one picked topic. Output: a script he can read from his phone and film.

## 1. Read first
- `analysis/script-tone.md` (the rhythm + his voice rules; the guide wins over habit)
- `analysis/script-feedback.md` (his past edits; apply them)
- the scout report entry for the topic (facts, what's confirmed vs unconfirmed, sources, hooks, creative angle, screenshots)
- `CLAUDE.md` rules: verdict always his own words, sign-off "Let's go, boys", never invent his opinion
- the 2–3 newest files in `scripts/` (for his recent phrasing)

## 2. Write
Save to `scripts/YYYY-MM-DD-<slug>.md`. Structure:
- **Header:** topic, why it's hot (one line with the numbers), target length (45–75 s, 170–280 words), CTA word.
- **3 hook options** (line 1), using the guide's shapes and the scout's hooks; mark the one you recommend.
- **The script:** flowing spoken sentences (rules #1–3 in the tone guide) grouped into beats: HOOK → PROMISE/FORMAT → THESIS (3 short lines) → PROOF/STORY or NUMBERED STEPS → PUNCH/CALLBACK → VERDICT `[your words]` → CTA → "Let's go, boys."
  - Under each beat: `[hand / body cue]` and `→ ON SCREEN:` (which screenshot or recording from the scout's shots folder, or what needs capturing).
  - Mark anything unverified exactly as the scout did, and say it on camera as "reportedly" / "allegedly".
  - `[YOUR EXAMPLE: …]` wherever a personal story would help but he hasn't given one. Never invent it.
- **Word count + estimated length** at 225 wpm.
- **Filming checklist** (as in `/new-reel`) and **Sources**.

## 3. Check before showing him (light; the full "Agent Checks" comes later)
- Each claim has a source in the scout report; unconfirmed ones are worded as such.
- Zero lines borrowed from the reference creator's transcripts (`analysis/creators/*/scripts/*.txt`). Grep for any 6-word run that matches.
- No placeholder left unflagged; there's a verdict placeholder; the sign-off is present.
- Style lint: no comma lists or lists of three (rule #2), **no fragments under ~6 words or drumbeat full stops** (rule #3), and it should read as one person talking. Rewrite any line that fails before showing him.

## 4. Learn from him
- When he edits the script in chat or files it, diff draft vs final. When his footage is transcribed in `/reel-edit`, diff the script vs what he actually said.
- Log each change in `analysis/script-feedback.md`: `YYYY-MM-DD · topic · cut/added/swapped · before → after · (his reason if given)`.
- After 2–3 of the same kind of change, update `analysis/script-tone.md` and tell him in one line.

## 5. Hand over
Paste the spoken lines in chat (phone-readable), send the file, and say what's still his to fill in (verdict, any `[YOUR EXAMPLE]`). Committing follows the repo rules (`reel/<slug>` branch; push to the private repo).

## 6. Adding another reference creator
The tone guide can learn from several creators (structure and rhythm only, never their lines or identity).
1. Talha downloads 8–15 of their talking reels (snapgram.io) into a folder, e.g. `Downloads/<handle>/`. Claude doesn't download other creators' videos itself.
2. Transcribe locally (ffmpeg on PATH, faster-whisper installed):
   `PYTHONUTF8=1 python .claude/skills/script-agent/transcribe.py "<that folder>" analysis/creators/<handle>/scripts`
   This writes per-reel `.txt` (timed lines + wpm) and `.json` (word timings). Both are gitignored: private study, never reposted.
3. Add a section **"## Reference: @handle"** to `analysis/script-tone.md`: pace, opener shapes, how lines link, numbers, register, endings, as patterns plus do/don't rules. Then note what Talha should **take** from them and what **not**. Talha's rules (#0–#3) and his approved examples always outrank any reference.
4. Add the handle to the reference list at the top of the tone guide, and include its transcripts in the borrowed-phrase check (the glob `analysis/creators/*/scripts/*.txt` already covers it).

References so far: **@aidendjohnston** (9 reels, 23 Nov 2026).
