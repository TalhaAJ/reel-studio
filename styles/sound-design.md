# Sound-design playbook: how editors use audio to hold attention

Researched 2026-10-28. Most published advice comes from editors, sound-pack makers and music-production blogs, not
controlled retention studies, so treat it as craft rather than science. The techniques below show up across
many independent sources and are standard in film, trailers and short-form.

Sources: [Epidemic Sound: J- and L-cuts](https://www.epidemicsound.com/blog/j-cuts-and-l-cuts/) ·
[Soundstripe: cinematic risers](https://www.soundstripe.com/blogs/what-are-cinematic-riser-sound-effects) ·
[Sonilo: transition sound effects](https://sonilo.com/blog/guides/transition-effect-sound-video-edits) ·
[MusicRadar: build-up and fill tricks](https://musicradar.com/how-to/6-essential-build-up-edit-and-fill-tricks) ·
[MusicRadar: recipes for a drop](https://www.musicradar.com/how-to/8-classic-recipes-for-a-perfect-drop) ·
[Splice: drop timing in edits](https://spliceapp.com/blog/what-video-editors-optimize-drop-timing-edits) ·
[SFX Engine: Reels audio tips](https://sfxengine.com/blog/reels-audio-editing-tips) ·
[Reap: 2026 editing tips](https://reap.video/blog/video-editing-tips) ·
[AIR Media-Tech: retention editing](https://air.io/en/youtube-hacks/advanced-retention-editing-cutting-patterns-that-keep-viewers-past-minute-8) ·
[A-MNEMONIC: sonic logos](https://a-mnemonic.com/why-we-remember-sonic-logos-more-than-visual-ones/)

---

## Music: give it an energy curve (your "build up slowly, go down slowly" instinct is right)

| Technique | What it is | How we use it in your reels |
|---|---|---|
| **Energy curve** | Music isn't one flat level. Quiet passages make loud ones hit harder | Bed sits low under explanations and **swells in the gaps** between beats (layout switches, after the hook, into each STEP) |
| **Ducking** | Music drops whenever the voice needs space, then comes back | Music is automated around the voice: about 6–8 dB lower while you're mid-sentence, back up in the 0.2–0.5 s breaths |
| **Build-up → drop** | Tension rises (louder, a riser underneath) then releases on a hit | One build per video, into the **payoff**: the stat reveal, or the CTA |
| **Silence before the drop** | Cutting the music for a beat right before the payoff | Music and effects **drop out about 0.3 s before "comment"**, then the CTA lands on an impact |
| **Filtered intro** | Music starts "muffled" (low-pass) and opens up | Hook plays muffled, then opens to full brightness on the first layout switch: a free "now it starts" moment |
| **Cut on the beat** | Visual changes land on the music's beats | Next step: pick the music start offset so the big switches land on downbeats |

## Sound effects: a hierarchy, not confetti

Several sources warn that an effect on every caption or cut becomes noise, and viewers tire of it. Use three tiers:

| Tier | Use for | How many per reel | Examples |
|---|---|---|---|
| **Hero** | The 3–4 moments you want remembered (reveal, stat, CTA) | 3–4 | riser → impact, silence → hit |
| **Support** | Structural changes: layout switches, cards landing | one per change | short whoosh / sweep, starting 2–3 frames **before** the cut (a J-cut for sound) |
| **Texture** | Things that are "happening" on screen | quiet, under everything | typing, soft clicks |

- **Risers** build anticipation before a payoff. The riser should *end exactly* on the reveal frame, followed by an impact.
- **J-cut the sound:** let the whoosh start a few frames before the picture changes so the cut feels motivated.
- Effects go on their own layer, never louder than the voice. The voice is always the anchor.

## Signature sound (sonic branding)

- A short sound that's only yours, repeated in the same places every video, becomes recognisable. Most of the world's top brands now have one, according to amp's audio brands report.
- Honest caveat: academic evidence on sound logos is thin and mixed. It works through *repetition and consistency* rather than magic.
- **Yours (draft):** `sting_signature.wav`, a two-note rising pluck (a fifth up) with a short echo. It plays on every STEP change and on your sign-off. **You need to hear it and approve it**, because I can't listen.
- **Catchphrase:** "**Boys, let's go**" as the spoken sign-off, landing on the sting and a branded end card. Same words, same sound, same visual every time.

## Levels (targets)

| Layer | Target |
|---|---|
| Voice | the anchor; whole mix mastered to **-14 LUFS** |
| Music under speech | about 20–25 dB below the voice, swelling to about 12–15 dB below in gaps |
| Hero effects | can peak close to the voice, but never over it |
| Texture effects | barely noticeable: you'd miss them if they were gone, but not notice them while they're there |

## Applied in the v5 experiment

1. The music bed is driven by an **energy curve**: low under speech, swelling in gaps, building under the last STEP, then dropping out entirely 0.3 s before the CTA.
2. Hook music is **muffled → opens up** on the first layout switch.
3. Effects are pruned to the **3-tier system**: no more tick on every key word, and whooshes only on layout switches.
4. **Hero moments:** riser → impact on the "68k" stat, the "1,085 frames" stat and the CTA.
5. **Signature sting** on every STEP change and the sign-off.
