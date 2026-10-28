# Style preset: Electric Orange v1

**Status:** locked baseline, saved 2026-10-28 (reel v4, the "Edit videos by talking to Claude Code" reel).
**Code snapshot:** git tag `style/electric-orange-v1` in `C:\AI Video Editing`. Restore with
`git checkout style/electric-orange-v1 -- editor/src editor/scripts`.

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
- **Voice:** keep it nearly raw. High-pass at 60 Hz plus a two-pass *linear* loudnorm only. **Never** add denoise or compression: it made the voice sound stuffed.
- **Music:** Mixkit "Digital Clouds" (Alejandro Magaña), starting at 28.5 s into the track, volume **0.07**, 0.3 s fade-in and 1.2 s fade-out.
- **SFX (Mixkit, in `editor/public/audio/`):**

  | Moment | Effect |
  |---|---|
  | Layout switch | `whoosh_fast` |
  | Card in | `sweep` |
  | Stat / CTA | `pop_whoosh` |
  | Checkmarks, list rows, file drop | `pop_dry` |
  | Zooms | `zoom_air` |
  | Step change | `select_click` |
  | "Done" moments | `ding` |
  | Terminal / transcript filling | `typing` / `typing_soft` |
  | Every key word | quiet `ui_click` |

- **Master:** the whole mix at **-14 LUFS** (`scripts/master.py`).

## 4. Filming checklist
- Green screen, centred, chest-up, and leave space above your head.
- Say every line in full on each take, then pause about 0.5 s before the next attempt.
- Record screen recordings of everything the script mentions (real recordings beat designed cards).
