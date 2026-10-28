---
name: user-brand-identity
description: "User's own reel identity is \"electric orange\" so they don't look like a copy of the creator they admire; audio preferences too"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e04e02be-77ba-45bd-add8-5db7e51921ab
  modified: 2026-10-28T17:44:51.857Z
---

The user wants their reels to keep the reference creator's structure (split layout, head pop-out, word-by-word captions, neon cards) but with their own identity so nobody says they're copying. They picked **electric orange** on 2026-10-28:
- accent #FF6A1A, warm paper background with a dot grid, charcoal face card with an orange rim light
- the key word gets an orange marker box (not the creator's blue serif italic), Inter throughout
- a "STEP 1/3" counter as a signature element, a punch-in on every layout switch, an orange neon CTA

Sign-off catchphrase: **"Let's go, boys"** (changed from "Boys, let's go" on 2026-10-28). Verdict lines are always the user's own words; never invent them.

Audio: they want a background music bed and plenty of sound effects (v2 felt bare). They disliked heavy voice processing: denoise and compression made their voice sound "stuffed", so keep the iPhone voice nearly raw (high-pass plus a linear loudness change only).

**Why:** Feedback on reel v2 ("it's an exact copy and paste... I want to add my own uniqueness"; "my voice sounds really stuffed").
**How to apply:** Keep the theme tokens in editor/src/theme.ts as the brand source. Never re-add afftdn or a compressor to the voice. Always check takes for false starts with the medium.en model, because small.en glosses over them. Related: [[reel-style-project]]
