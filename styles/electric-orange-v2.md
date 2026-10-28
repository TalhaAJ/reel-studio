# Style preset: Electric Orange v2

**Status:** locked, saved 2026-10-28. This is exactly the look of the posted **VoiceStudio** reel (`output/voicestudio_v2.mp4`).
It's v1 plus everything added on `exp/v5` and in the VoiceStudio edit (section 5).
**Code snapshot:** git tag `style/electric-orange-v2`. Restore with
`git checkout style/electric-orange-v2 -- editor/src editor/scripts`.
The previous look is `styles/electric-orange-v1.md` (tag `style/electric-orange-v1`).

This is *your* look. It keeps the structure of the reference creator (see `analysis/STYLE_GUIDE.md`)
but replaces the identity layer so it doesn't read as a copy.

---

## 1. Structure (inherited from the reference)
- 35–45 s explainer. Script formula: **Hook ("You can now…") → "It's called X" + proof → First / Then / And finally → Plus → "Comment WORD"**.
- Three layouts, switching every 3–5 s:
  - **A, split:** neon screen card on top, caption in the middle, you at the bottom (head breaks out above a rounded card)
  - **B, dark focus:** big card, no face
  - **C, full face:** used for emphasis lines and the CTA
- Captions: 1–3 words at a time, built word by word, one key word per line highlighted.
- Every pause over about 0.15 s is cut. Only complete takes are used (no false starts).

## 2. Identity (yours)
| Element | Electric Orange v1 |
|---|---|
| Accent colour | `#FF6A1A` (lighter `#FF8A3D` on dark), glow `rgba(255,106,26,…)` |
| Light background | warm paper `#F6F1EA → #EFE7DC`, **drifting dot grid**, orange haze top-right, grain |
| Dark background | warm charcoal `#2b2522 → #0c0a09`, faint dot grid, orange haze behind the card |
| Full-face background | charcoal with an **orange rim glow behind your head** |
| Face card (layout A) | charcoal gradient, thin orange line along the top edge, orange light behind the shoulders |
| Cards | white (or `#14110f` dark), **3 px orange border**, warm light travelling round the border, border **flares as the card lands** |
| Card entrance | slides up 90 px + scales 0.94→1 with a slight overshoot (no blur-in) |
| Layout switch | **punch-in**: whole frame 1.05→1 in about 0.2 s |
| Caption font | Inter 800, 72 px; ink `#141210` on light, white with shadow on dark |
| Key word | **Inter 900 white on an orange marker box**, wipes in left→right, tilted -1.5° |
| Hook title | line 1 Inter 800 ink, line 2 **white Inter 900 on a tilted orange box** that wipes in |
| Signature element | **"STEP 1/3" pill** with a 3-segment progress bar during First/Then/Finally |
| Stat cards | white, orange outline, huge orange Inter 900 number that counts up, slight rotation as it pops |
| CTA | "comment" in white + **“WORD” in orange neon that flickers on** |
| UI font | JetBrains Mono for file names, timestamps, terminal |

## 3. Sound
- **Voice:** keep it nearly raw: a high-pass at 80 Hz, a -3 dB dip at 320 Hz (the boxy room band), a two-pass *linear* loudnorm, and a soft expander that drops room-echo tails about 10 dB between words (speech untouched). **Never** add denoise or compression: it made the voice sound stuffed.
- **Music:** Mixkit "Digital Clouds" (Alejandro Magaña), starting at 28.5 s into the track. It runs on an **energy curve** (`musicLevel()` in Reel.tsx): ducked to 0.05 under speech, swelling to 0.1 in gaps and on layout switches, building to 0.11 before the CTA, then **silent** 0.3 s before "comment". It's also silent under proof clips and on punchline moments ("Damn"). The hook is muffled (700 Hz low-pass) until the first layout switch.
- **SFX: three tiers** (see `styles/sound-design.md`):
  - **HERO** (max 3 per reel): `hero()` = `riser_short` into `impact_whoosh`, on the big stat, the second stat and the CTA.
  - **SUPPORT:** `whoosh_fast` 0.08 s before each layout switch (J-cut), and `sweep` for cards that land mid-layout.
  - **TEXTURE** (quiet): `pop_dry` on chips, checkmarks and list rows; `typing_soft` while text types; `ui_click` on button presses; `ding` on "done".
  - **Signature sting** (`audio/sting_signature.wav`, a two-note rising pluck) on every STEP change and on the sign-off.
  - `impact_logo` for punchline moments and the closing reply.
- **Master:** the whole mix at **-14 LUFS** (`scripts/master.py`).

## 4. Filming checklist
- Green screen, centred, chest-up, and leave space above your head.
- Say every line in full on each take, then pause about 0.5 s before the next attempt.
- Record screen recordings of everything the script mentions (real recordings beat designed cards).

## 5. Added in v2 (VoiceStudio reel)
- **Sign-off:** "Let's go, boys" as an orange-box **end card** (`EndCard`), landing on the sting. An optional AI-clone reply can follow (`CloneReply`).
- **Verdict stamp** (`VerdictStamp`): an orange-bordered stamp that slams in with a shake, using his own word (e.g. "SICK"). A **£0-style stat card** can follow for the payoff.
- **Real screen recordings** (`scripts/capture.mjs`: frame-by-frame Edge capture with a drawn cursor) of the tool's website and GitHub repo, held on screen for about 5 s. **Hand-drawn orange circles** (`ScribbleCircle`) mark real numbers, such as the GitHub star count.
- **Proof inserts** (`INSERTS` in build_cuts.py): a silent gap after a line where a real clip plays (e.g. his AI voice clone) over a dark "🔊 SOUND ON" card with a live waveform.
- **Punchline moment:** a one-word ad-lib ("Damn") gets full-face, a 14% punch-in, music cut and an `impact_logo` hit.
- **Hook card pattern:** "what it replaces" chips that get struck through in orange as they're said.
- **Captions** re-timed to the finished dialogue (`retime_captions.py`), so words after pauses never appear early.
- **Thumbnail** (`src/Thumbnail.tsx`, 1080x1920): charcoal + orange rim, big white headline with an orange-box line, his face cut out with mouth shut, and two proof chips. Everything sits inside the 3:4 grid crop (y 240–1680).

## 6. Filming notes (learned)
- He frames closer now (4K, 30 fps): keep hand gestures at chest height so they stay in frame.
- Say the CTA keyword clearly ("comment **WORD** down below").
- Proof clips need recording *before* uninstalling the tool.
