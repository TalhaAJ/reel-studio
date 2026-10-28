# Reel Style Guide — "Tech Tool Explainer" format

Built from 5 reference reels in `references/` (ref1–ref5, 35–47 s each, 720×1280, 30 fps).
Frame evidence lives in `analysis/ref*/sheets/` (2 fps contact sheets, 9 s per sheet) and `analysis/detail/`.

---

## 1. The format in one sentence
A fast-talking, 35–45 s explainer of one tech tool (or a list of 3–4), where the screen recording is the star and the creator's face is the anchor, with word-by-word captions, a blue/neon visual identity, and a "comment WORD" call to action.

## 2. Script formula (same in all 5 reels)
| Beat | Time | Pattern | Example |
|---|---|---|---|
| Hook | 0–3 s | "**[You / People] can now [big result]** …" with a fear/benefit twist | "You can now test your startup idea on thousands of fake customers before you build a single thing." |
| Name + proof | 3–8 s | "It's called **X**, and it's … already crossed **N stars on GitHub**." | |
| How it works | 8–30 s | "**First** … **Then** … **And finally** …" (or "The first is / Second is / The third is") | |
| Bonus | ~30 s | "**Plus**, you can …" | |
| CTA | last 4 s | "So if you want to try it, just **comment [WORD]** down below and I'll send you the link directly." | |

- Delivery: **245–280 words per minute**, about 150–190 words per reel.
- No gap between words is longer than **0.5 s**. Every breath and pause is cut out (jump cuts).

## 3. Three layout modes (the editor switches between them every 3–5 s)

### Mode A: Split ("headspace" layout), the default
- **Background:** pale off-white/ice blue (`#D9ECF6` → `#E4E7F2`) with a soft **palm-leaf shadow** in the top-left and light film grain.
- **Top half:** a **screen card** about 78% of the frame width (x 78→642 at 720 px), y about 160→620, 12 px rounded corners, macOS browser chrome (traffic lights + URL bar).
- **Middle:** the caption line at y ≈ 660.
- **Bottom:** the creator. A **rounded-rectangle card** (his real wall, warm grey `#B6A8A9`) that bleeds off the bottom edge, x 52→668, top at y ≈ 895. **His head is a background-removed cutout that breaks out above the top of the card.** That's the "face pop-out" look.
- Camera: centred, chest-up, black hoodie, mic visible at the bottom.

### Mode B: Dark screen focus
- No face. The background is a **dark charcoal gradient** (looks like a heavily blurred, darkened copy of the screen recording, so faint coloured blobs show through).
- The screen card sits centred/upper with the caption just below it in **white with a soft drop shadow**.
- Used for the "money shots": the product reveal, GitHub stars, the big UI moments.

### Mode C: Full-frame face
- Full 9:16 talking head, punched in (about 110–120%, tighter on the face).
- White bold caption at about 57% of the height, over his chest.
- Used for emphasis lines and **always for the CTA**.

### Bonus: Chapter card (list videos)
- Plain white/light background, centred: "**Plugin Number**" (black sans) + "**Two**" (white serif italic on a blue box), then the screen card for that item.

## 4. Neon / glow treatment
- Screen cards have a **2–3 px electric-blue border** (`#0A84FF`-ish) with an **outer glow** (blur about 12–20 px, 50–70% opacity).
- The glow is **not even all the way round**. A brighter streak of light sits on one corner/edge (e.g. top-right plus bottom-left) and **travels around the border**, like a neon light running along the frame.
- Focus elements inside the recording get the same treatment: blue rounded **highlight rectangles** around inputs and buttons, **blue text-highlight** over key lines, and occasionally an **orange rounded outline** around a tag.
- CTA keyword: **cyan neon text** (`#A0FCFF` core, cyan bloom) e.g. “Startup”, with "comment" in small white serif italic above it.

## 5. Typography
| Use | Look | Free match |
|---|---|---|
| Normal caption words | Bold geometric sans, about 44–48 px at 720 w, black on light / white on dark | **Inter Bold** / SF Pro Display Bold |
| Emphasis words (1 per line) | **Serif italic in blue** (`#0A84FF` on light, lighter blue on dark), slight glow | **Instrument Serif Italic** or **DM Serif Display Italic** |
| Hook title, line 1 | Same bold sans, black, about 46 px, top of frame | Inter Bold |
| Hook title, line 2 | White serif italic **inside a solid blue box** `#0083FF` | Instrument Serif Italic |
| Stat callout | Huge blue sans number + small black label on a white rounded card with shadow ("**81.3k** stars on GitHub") | Inter Bold/Medium |

Emphasis words are the nouns and value words: *startup, fake customers, MiroFish, MVP, digital world, AI people, personality, Twitter, model number, bloatware, internet, email, clean list, agency, 200*.

## 6. Caption behaviour
- **1–4 words on screen at a time.** The line builds word by word in sync with speech, then clears.
- **New words fade in from light grey to full colour** (about 3–4 frames). The word about to be spoken often shows up faint grey first.
- Emphasis words get extra motion: a quick blur-to-sharp or slide/scale-up, plus colour.
- Numbers **count up** ("80,000" grows as it's said).
- Captions are centred on the screen card's axis in Mode A and B.

## 7. Motion / animation
| Element | Animation (from 30 fps frame study) |
|---|---|
| Hook title | Words type on one by one; the **blue box wipes in left→right first**, then the italic text fills it |
| Screen card entrance | Starts as a **blurred grey/dark rectangle → sharpens and scales up** over about 4–6 frames (blur-in) |
| Screen content | The real recording plays inside: **typing animations**, a **moving cursor** with clicks, scrolling, pages loading |
| Stat card | Pops in over the recording; the **digits roll/odometer** to the final value |
| Highlights | Blue boxes draw in around the thing being talked about, timed to the word |
| Mode switches | Hard cuts on a word boundary; the screen card often persists across the cut while the background or face changes |
| Face | Subtle push-in on full-frame shots; jump cuts hidden by the layout changes |

## 8. Pacing (measured)
| Reel | Length | Visual changes detected | Avg per segment |
|---|---|---|---|
| ref1 | 37.3 s | 10 | ~3.4 s |
| ref2 | 38.5 s | 9 | ~3.8 s |
| ref3 | 37.1 s | 8 | ~4.1 s |
| ref4 | 35.2 s | 9 | ~3.5 s |
| ref5 | 46.9 s | 13 | ~3.4 s |

*Layout* changes every about 3.5 s, but something changes **every 0.5–1 s** (new caption word, highlight, cursor action, card pop), so the eye never rests.

## 9. Audio
- Every reel is mastered to exactly **-14 LUFS** (Instagram/TikTok target), loudness range only about 2 LU (heavily compressed voice).
- **No silence anywhere.** There's a constant low **music bed** under the voice.
- Likely SFX (inferred from the visuals, **not confirmed by ear**): whoosh on card entrances, keyboard clicks on typing, pop/ding on stat cards, mouse clicks. Your input needed on what you actually hear.

## 10. Colour palette
| Token | Hex |
|---|---|
| Light bg top | `#D9ECF6` |
| Light bg mid | `#E4E7F2` |
| Brand blue (box, borders) | `#0083FF` / `#0A84FF` |
| Emphasis blue on light | `#3F88C5`-ish |
| Text black | `#010602` |
| CTA neon cyan | `#A0FCFF` |
| Face card wall | `#B6A8A9` |

## 11. What you need to film to match this
1. **A-roll:** you, centred, chest-up, plain light wall, mic in shot, good soft key light. Talk fast and keep going; pauses get cut anyway.
2. **Screen recordings** (macOS-style browser or app window, 16:10 or so) of every step you mention, at least 1080p.
3. **A source for stats** (GitHub page, tweet, etc.) to screenshot for the proof beat.
