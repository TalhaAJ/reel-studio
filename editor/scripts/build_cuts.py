"""Pick takes, strip silences, and write the cut list + caption words on the cut timeline.

Captions come from the *script* (what was actually said in each take), aligned to word timings
from two Whisper passes (medium.en first, small.en to fill gaps). That way an accent-driven
mishearing ("Claude Cote", "pose") never reaches the screen, and no word goes missing.

Outputs (in editor/public/):
  cuts.json      kept source intervals in order
  captions.json  words with timings on the new (cut) timeline
"""
import difflib, json, os, re

ROOT = r"C:\AI Video Editing"
A = os.path.join(ROOT, r"analysis\vs")
medium = json.load(open(os.path.join(A, "words_medium.json")))
small = json.load(open(os.path.join(A, "words.json")))
silences = [tuple(map(float, l.split())) for l in open(os.path.join(A, "silences.txt")) if l.strip()]

# (source start, source end, beat, what was said) -- best *complete* take of each line.
# "first" and "plus" start at the last restart: earlier attempts in those takes were false starts.
TAKES = [
    (0.00, 5.40, "hook", "You can now clone your own voice for free on your own laptop. No ElevenLabs, no subscription."),
    (5.40, 12.40, "name", "It's called VoiceStudio, it's completely open source and it just blew up on GitHub with over 90,000 stars."),
    (12.42, 19.20, "first", "First, you give it a short clip of your own voice and it clones it right on your computer. Nothing gets uploaded."),
    (27.38, 31.47, "then", "Then you type anything you want and it reads it back in your own voice."),       # 2nd take (1st ran on)
    (43.34, 46.05, "clone", "I cloned my own voice, and listen to this."),
    (53.30, 58.10, "finally", "Finally, it can dub your own videos into 640+ languages."),                    # "And" is under the noise floor
    (58.33, 58.95, "damn", "Damn."),
    (60.70, 65.80, "plus", "Plus there's no account and no API key and it runs on Windows, Mac and Linux."),
    (67.00, 70.40, "verdict", "My verdict? This is sick and it's free, so it's worth trying."),
    (76.95, 79.50, "pocket", "If you don't like it, nothing comes out of your own pocket."),                  # 2nd take (1st fluffed)
    (82.50, 86.20, "cta", "So if you want the link, just comment VOICE below and I'll send it to you directly."),
    (86.14, 87.60, "signoff", "Let's go, boys."),
]
PAD_IN, PAD_OUT = 0.06, 0.10   # breathing room around each take
SIL_KEEP = 0.05                # silence kept on each side of an internal cut
MIN_SIL = 0.15                 # only cut silences longer than this

clean = lambda w: re.sub(r"[^a-z']", "", w.lower())


def split_by_silence(a, b):
    out, cur = [], a
    for s, e in silences:
        if e - s < MIN_SIL or e <= a or s >= b:
            continue
        cs, ce = max(s, a) + SIL_KEEP, min(e, b) - SIL_KEEP
        if ce - cs <= 0.05:
            continue
        if cs > cur:
            out.append([cur, cs])
        cur = max(cur, ce)
    if b > cur:
        out.append([cur, b])
    return [iv for iv in out if iv[1] - iv[0] > 0.08]


def align(script, a, b):
    """Give each script word a (start, end) from the transcripts; interpolate any leftovers."""
    sw = script.split()
    times = [None] * len(sw)
    for src in (medium, small):
        heard = [w for w in src if w["s"] >= a - 0.1 and w["s"] <= b + 0.1]
        sm = difflib.SequenceMatcher(None, [clean(x) for x in sw], [clean(w["w"]) for w in heard], autojunk=False)
        for blk in sm.get_matching_blocks():
            for k in range(blk.size):
                if times[blk.a + k] is None:
                    h = heard[blk.b + k]
                    times[blk.a + k] = (max(h["s"], a), min(h["e"], b))
    # fill gaps linearly between known neighbours
    known = [i for i, x in enumerate(times) if x]
    for i, x in enumerate(times):
        if x:
            continue
        lo = max([k for k in known if k < i], default=None)
        hi = min([k for k in known if k > i], default=None)
        t0 = times[lo][1] if lo is not None else a
        t1 = times[hi][0] if hi is not None else b
        n = (hi if hi is not None else len(sw)) - (lo if lo is not None else -1)
        j = i - (lo if lo is not None else -1)
        s = t0 + (t1 - t0) * (j - 1) / n
        times[i] = (s, t0 + (t1 - t0) * j / n)
    filled = len(sw) - len(known)
    return list(zip(sw, times)), filled


# Proof inserts: after a beat, hold for the voice-clone clip (raw-footage/*.wav) to play.
# The picture underneath is a silent stretch of the same footage (you listening), with the mic muted.
GAP_SRC = 46.2  # 46.0-52.5 s of IMG_2294 is silence
INSERTS = {
    "clone": ("proof1", "voiceclone_en_this-isnt-me.wav", 2.46, 0.3, 0.45, "This isn't me talking. This is my AI clone."),
    "signoff": ("proof2", "voiceclone_ja_bomboclatt.wav", 1.38, 0.15, 1.1, "Bomboclatt!"),
}
cuts, beats = [], []
for a, b, name, _ in TAKES:
    ivs = split_by_silence(a - PAD_IN, b + PAD_OUT)
    beats.append({"name": name, "first": len(cuts), "count": len(ivs)})
    cuts.extend({"s": round(s, 3), "e": round(e, 3), "beat": name} for s, e in ivs)
    if name in INSERTS:
        pname, wav, dur, lead, tail, _ = INSERTS[name]
        cuts.append({"s": GAP_SRC, "e": round(GAP_SRC + lead + dur + tail, 3), "beat": pname, "gap": True,
                     "wav": wav, "lead": lead})

t = 0.0
for c in cuts:
    c["t"] = round(t, 3)
    t += c["e"] - c["s"]
total = t


def remap(x):
    for c in [c for c in cuts if not c.get("gap")]:
        if c["s"] <= x <= c["e"]:
            return c["t"] + (x - c["s"])
    nxt = [c for c in cuts if c["s"] > x]  # inside a removed silence: snap to next kept interval
    return nxt[0]["t"] if nxt else total


caps = []
for a, b, name, script in TAKES:
    words, filled = align(script, a, b)
    if filled:
        print(f"  {name}: {filled} word(s) timed by interpolation")
    for w, (s, e) in words:
        s2, e2 = remap(s), remap(e)
        caps.append({"w": w, "s": round(s2, 3), "e": round(max(e2, s2 + 0.08), 3), "beat": name})
# the clone's lines, spread evenly over its clip (shown as "AI" captions)
for c in [c for c in cuts if c.get("gap")]:
    _, _, dur, lead, _, text = next(v for v in INSERTS.values() if v[0] == c["beat"])
    ws = text.split()
    for i, w in enumerate(ws):
        s0 = c["t"] + lead + dur * i / len(ws)
        caps.append({"w": w, "s": round(s0, 3), "e": round(s0 + dur / len(ws), 3), "beat": c["beat"]})
caps.sort(key=lambda x: x["s"])
# keep start times strictly increasing
for i in range(1, len(caps)):
    caps[i]["s"] = max(caps[i]["s"], caps[i - 1]["s"] + 0.04)

pub = os.path.join(ROOT, r"editor\public")
json.dump({"cuts": cuts, "beats": beats, "total": round(total, 3)}, open(os.path.join(pub, "cuts.json"), "w"), indent=1)
json.dump(caps, open(os.path.join(pub, "captions.json"), "w"), indent=1)
print(f"{len(cuts)} intervals, total {total:.2f}s (from {sum(b - a for a, b, _, _ in TAKES):.2f}s of takes)")
for name in [t[2] for t in TAKES] + [v[0] for v in INSERTS.values()]:
    print(f"  {name:8s} " + " ".join(f"{c['w']}@{c['s']:.2f}" for c in caps if c["beat"] == name))
