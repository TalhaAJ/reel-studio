# Roy Lee (DRAFT: "1125 Anthropic cockblocking" v1–v3, 2026-11-25; "1127 products.json" v1–v2, 2026-11-27)

Modelled on @im_roy_lee's talking reels (structure and look only, never identity). The study is in `analysis/creators/im_roy_lee.md`.
It isn't a saved preset yet. Once Talha approves a render, tag `style/roy-lee`.

## Footage
- Green-screen iPhone takes (4K .MOV, rotation 90) keyed with `editor/scripts/keyer.py` into the rendered 3D room
  `editor/public/roy/room_v.png` (blurred at radius 5, ×0.95). Slight contrast and warmth on him, a warm rim on the right and a cool rim on the left,
  and a light wrap from the room.
- For several takes, crop each one (scale, x0, y0) so the top of his head sits at about 0.33–0.37 H, centred. A take filmed further back
  gets a tighter crop. Garbage matte above y 470 px.
- Cut dead air at real pauses (> ~0.25 s below -45 dB), leaving ~0.1 s between words. Cut false starts and repeated words too.
- Every jump cut swaps between 100 % and 110 % (a hard cut, centred, no drift). Shots last about 2.1–2.6 s.

## Layout (1080x1920)
- **Hook**: Roy's black rounded box. CapCut `en.ttf` at 92 px, two centred lines, lower case with one CAPS word, top at y 168.
  It clears on the first cut (~4 s). A prop can sit under it (1127: an address bar typing `/products.json`).
- **Captions**: CapCut Sans Text Bold at 112 px, white with a 10 px black border and a soft shadow, 1–4 words, sentence case.
  Centred on the ink, horizontally, at a fixed centre of y = 0.705 H, including over b-roll. Shrinks if wider than 980 px.
- **Tags** (prices etc.): Segoe UI Bold on red or white rounded pills at y 0.40 H. **Banners** go at the top (y ≈ 340),
  clear of the face and captions. Everything pops in (0.82 → 1 with a small overshoot, 5 frames).

## B-roll
- Only where it helps, about one per 10 s, 1.5–3 s each, as full-screen cutaways. Stock gets a slow 7 % push-in.
- Real footage first: live captures of the actual page (Playwright + Edge at 2.25x, `cap/*.cjs`) with the exact text boxes,
  for blurs and highlights. Blur the brand when the line accuses it. Otherwise use licensed Pexels portrait clips.
- Proof highlight: a yellow marker swipe (0.22 s) that ends with a red outline on the exact field.

## Sound
- **Voice**: raw, +8 dB into a peak limiter (`alimiter` limit 0.89, attack 1 ms, release 80 ms). No denoise, no compressor.
  The mix lands at about -15 LUFS.
- **SFX**: each b-roll gets its own entry sound, never the same one on every b-roll. J-cut them so the whoosh peaks on the cut.
  1127 set: pop + typing / whoosh_fast + select_click / zoom_air / sweep + ding / pop_whoosh + impact_whoosh /
  riser + ui_click ticks + rewind_fast.
- **Music** (when Talha brings a track): open on the track's own hit and sit ~10–11 dB under the voice while he talks
  (a ceiling tied to the voice RMS). Dry drop-outs on punchlines, then slam back in +3.5 dB. Tape-stop on "reset" moments, fade at the end.

## Files
- `editor/scripts/roy/1125/`: the first version, which also writes a CapCut timeline (`draft.py`, `draft_v2.py`).
- `editor/scripts/roy/1127/`: Python + ffmpeg only. `plate.py` (key, crop, cut → base.mp4 + voice.wav) → `plan.py` (shots, b-roll,
  overlays, captions, SFX) → `gfx.py` → `render.py` (compose + mix) → `music.py` (v2 music bed).
- These ran from a scratch folder, so point their absolute paths (footage in Downloads, scratchpad, CapCut fonts) at the new place before reusing them.
