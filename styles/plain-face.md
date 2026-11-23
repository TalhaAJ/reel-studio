# Plain Face (DRAFT, first used on "My king: the Claude canary", 2026-10-31)

Modelled on `references/snapgram.io_sj8ib3cswx5r.mp4` (structure and look only, never identity).
Not a saved preset until Talha approves a render; then tag `style/plain-face`.

## Footage
- Raw selfie footage fills the frame. No green screen, no key, no background swap.
- Several clips are fine: `editor/scripts/plain_cut.py` takes `(clip, in, out, beat, words-as-said)` per take,
  strips internal silences (> 0.15 s) and concatenates.
- iPhone front camera saves mirrored: `FLIP = True` so text on clothes reads the right way.
- 4K/30 sources are scaled to 1080x1920 @30.
- Jump cuts are hidden with a 6 % punch-in on alternate beats (no zoom inside a beat).

## Layout (1080x1920)
- **Card band** above the head: y 40–370, one card at a time, centred, ~800 px wide.
  Cards pop in (scale 0.82 → 1 with overshoot, 0.22 s) and dip out in 0.1 s.
- **Caption**: one word at a time, centre y ≈ 425 (just above the hair). Inter 800, 96 px, white,
  soft black shadow, quick 0.88 → 1 pop. Commas kept, full stops dropped.
- **Sticker pills** on the chest (y ≈ 1430): white rounded pill, black Inter 800, slight tilt.
- Measure the head on a cut contact sheet first; move `BAND`/`CAP_Y` if the hair line changes.

## Cards
- Hook: black-on-white rounded **title box** with an emoji.
- Real screenshots (headless Edge, 2x) on a white rounded sheet: people, repos, posts.
- Built cards for ideas: chart, checklist, chat bubbles, CLAUDE.md file, buttons with a drawn cursor.
  Claude-related cards use Claude orange `#D97757`; good/bad = green `#30A46C` / red `#E5484D`.
- CTA: the same white title box ("Follow for more sauce 🔥").

## Sound
- Voice: the usual nearly-raw chain (`voice_chain.py`): no denoise, no compressor.
- Very quiet music bed (~0.045), fades in/out.
- `pop_dry` on every card, `pop_whoosh` on stickers, small UI sounds where the card shows an action.
- Master to -14 LUFS with `master.py`.
