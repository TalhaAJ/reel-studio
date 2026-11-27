---
name: script-agent
description: Write a filmable reel script for a topic Talha picked (usually from a scout report), in his voice with the fast daily-creator rhythm from analysis/script-tone.md - his take first, one of four blueprints (take, story, news, demo), title box, proof moments, hand cues, CTA and "Let's go, boys". Learns from his edits. Use when he picks a topic and says "script it", "write the script", or names a topic from a scout report.
---

# Script agent

Step "Agent Script" in Talha's pipeline (scouts → hook → **script** → checks → output). Input: one picked topic. Output: a script he can read from his phone and film.

## 1. Read first
- `analysis/script-tone.md` (the rhythm + his voice rules; the guide wins over habit)
- `analysis/script-feedback.md` (his past edits; apply them)
- the scout report entry for the topic (facts, what's confirmed vs unconfirmed, sources, hooks, creative angle, screenshots)
- `CLAUDE.md` rules: verdict always his own words, sign-off "Let's go, boys", never invent his opinion
- the 2–3 newest files in `scripts/` (for his recent phrasing)

## 2. Get his take, then pick one blueprint
**Take first.** The script is built around his opinion, so get it before writing. Offer 3 possible takes from the scout entry **as questions** and ask him to pick one, change it or give his own (a voice note is fine). Never invent it. If he isn't there to answer, put `[TAKE: your words]` in the line where the blueprint needs it (line 1 or 2, or straight after the twist), mark the draft **NOT READY TO FILM**, and don't write around the hole.

**Pick one blueprint, name it in the header, and don't blend two.** Beats are an order, not headings to fill: drop any beat that has nothing to say.

| Blueprint | Use for | Beats |
|---|---|---|
| **A. Take** | opinion, careers, true vs BS, psychology | CLAIM (his take) → BECAUSE → SPECIFIC EXAMPLE with one acted line → WHAT THE OTHER SIDE SAYS → ANSWER + one honest concession → BACK TO THE CLAIM |
| **B. Story** | something that happened to him, or keeps happening to "you" | THE MOMENT → what happens next → it gets worse → what it means → callback or a real question |
| **C. News** | breaking news, drama, sequels | WHAT HAPPENED → TWIST → RECEIPT on screen → **HIS REACTION, straight after the fact** → what's still open |
| **D. Demo** | tools, models, builds | THE RESULT FIRST → what it is → each step with one line of why → proof on screen → his verdict |

A and B come from @im_roy_lee and Talha's own reels. C comes from Talha's own Jensen reels, and D from his tool reels and @aidendjohnston's numbered steps.

## 3. Write
Save to `scripts/YYYY-MM-DD-<slug>.md`. Structure:
- **Header:** topic, why it's hot (one line with the numbers), **blueprint**, **his take in his own words**, target length (45–75 s, 170–280 words), CTA word.
- **Title box:** 8 words or fewer, on screen for the first 4–5 s. **The promise lives here. Don't say it out loud.**
- **3 hook options** (line 1) in **three different shapes**, using the guide's shapes and the scout's hooks; mark the one you recommend. Don't recommend the shape the last script used.
- **The script:** flowing spoken sentences (rules #1–3 in the tone guide) in the blueprint's order. Line 2 must add a new fact or raise the stakes; it never announces the format. Then **one** closing line: CTA plus "Let's go, boys."
- **Time words:** he often films the next day, so avoid "today" and "N days ago". Use "this week" or "just", or mark `[CHECK DAY]`.
  - Under each beat: `[hand / body cue]` and `→ ON SCREEN:` (which screenshot or recording from the scout's shots folder, or what needs capturing).
  - Mark anything unverified exactly as the scout did, and say it on camera as "reportedly" / "allegedly".
  - `[YOUR EXAMPLE: …]` wherever a personal story would help but he hasn't given one. Never invent it.
- **Word count + estimated length** at 225 wpm.
- **Filming checklist** (as in `/new-reel`) and **Sources**.

## 4. Check before showing him (light; the full "Agent Checks" comes later)
- Each claim has a source in the scout report; unconfirmed ones are worded as such.
- Zero lines borrowed from the reference creator's transcripts (`analysis/creators/*/scripts/*.txt`). Grep for any 6-word run that matches. The transcripts are gitignored, so **count them first: if a reference has none on this PC, say "not checked against @handle"** instead of passing it.
- No placeholder left unflagged; his take is in (or the draft says NOT READY TO FILM); the sign-off is present.
- Style lint: no comma lists or lists of three (rule #2), **no fragments under ~6 words or drumbeat full stops** (rule #3), **nothing over 30 words**, and it should read as one person talking. Rewrite any line that fails before showing him.
- **Boredom check** (fix before showing him):
  1. **Take:** is his opinion in the first two sentences (A, B), straight after the twist (C), or on the result (D)?
  2. **Line 2:** does it add something new? If it restates line 1 or announces the video, cut it.
  3. **Delete test:** take each sentence out. If nothing is lost, leave it out.
  4. **Swap test:** could any other tech creator say this line unchanged? Add a name, a number or his own detail, or cut it.
  5. **Acted line:** at least one line he performs as someone else (A and B), or a reaction in his own voice (C).
  6. **Sameness:** compare line 1 and the sentence openers with the last 3 scripts. If the skeleton matches, rewrite the hook.

## 5. Learn from him
- When he edits the script in chat or files it, diff draft vs final. When his footage is transcribed in `/reel-edit`, diff the script vs what he actually said, **including beats he never filmed**.
- Log each change in `analysis/script-feedback.md`: `YYYY-MM-DD · topic · cut/added/swapped · before → after · (his reason if given)`.
- After 2–3 of the same kind of change, update `analysis/script-tone.md` and tell him in one line.

## 6. Hand over
Paste the spoken lines in chat (phone-readable), send the file, and say what's still his to fill in (his take, any `[YOUR EXAMPLE]`). Committing follows the repo rules (`reel/<slug>` branch; push to the private repo).

## 7. Adding another reference creator
The tone guide can learn from several creators (structure and rhythm only, never their lines or identity).
1. Talha downloads 8–15 of their talking reels (snapgram.io) into a folder, e.g. `Downloads/<handle>/`. Claude doesn't download other creators' videos itself.
2. Transcribe locally (ffmpeg on PATH, faster-whisper installed):
   `PYTHONUTF8=1 python .claude/skills/script-agent/transcribe.py "<that folder>" analysis/creators/<handle>/scripts`
   This writes per-reel `.txt` (timed lines + wpm) and `.json` (word timings). Both are gitignored: private study, never reposted.
3. Add a section **"## Reference: @handle"** to `analysis/script-tone.md`: pace, opener shapes, how lines link, numbers, register, endings, as patterns plus do/don't rules. Then note what Talha should **take** from them and what **not**. Talha's rules (#0–#3) and his approved examples always outrank any reference.
4. Add the handle to the reference list at the top of the tone guide, and include its transcripts in the borrowed-phrase check (the glob `analysis/creators/*/scripts/*.txt` already covers it).

References so far: **@aidendjohnston** (9 reels, 23 Nov 2026), **@im_roy_lee** (9 reels, 25 Nov 2026).
