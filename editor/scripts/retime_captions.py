"""Re-time public/captions.json against the *cut* dialogue (voice.wav + the clone clips), after render_plates.

build_cuts.py times words from the raw footage, where Whisper tends to start a word early when it follows
a pause (it swallows the silence). Here we transcribe the finished dialogue track, re-align the script words
to it, then snap every word that follows a pause onto the real audio onset. Run after render_plates.py.
"""
import difflib, json, os, re, subprocess
import numpy as np
from faster_whisper import WhisperModel

FF = r"C:\Users\talha\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
PUB = r"C:\AI Video Editing\editor\public"
SR = 16000
ONSET_THR = 0.03   # RMS (full scale) that counts as "speaking" on the loudness-normalised voice
SNAP_WIN = (-0.12, 0.45)

decode = lambda path: np.frombuffer(subprocess.run([FF, "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                                   capture_output=True).stdout, np.float32)
cuts = json.load(open(os.path.join(PUB, "cuts.json")))
caps = json.load(open(os.path.join(PUB, "captions.json")))

# dialogue = your voice + the clone clips where they play
dia = decode(os.path.join(PUB, "voice.wav")).copy()
for c in cuts["cuts"]:
    if c.get("gap"):
        clip = decode(os.path.join(PUB, "audio", c["wav"]))
        i = int((c["t"] + c["lead"]) * SR)
        dia = np.pad(dia, (0, max(0, i + len(clip) - len(dia))))
        dia[i:i + len(clip)] += clip

m = WhisperModel("medium.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(dia, word_timestamps=True, language="en", condition_on_previous_text=False)
heard = [dict(w=w.word.strip(), s=w.start, e=w.end) for s in segs for w in s.words]

clean = lambda w: re.sub(r"[^a-z0-9']", "", w.lower())
sm = difflib.SequenceMatcher(None, [clean(c["w"]) for c in caps], [clean(h["w"]) for h in heard], autojunk=False)
new = [None] * len(caps)
for b in sm.get_matching_blocks():
    for k in range(b.size):
        h = heard[b.b + k]
        new[b.a + k] = [h["s"], h["e"]]
matched = sum(x is not None for x in new)
# clone lines Whisper can't read ("Bomboclatt" -> "one more clap"): keep build_cuts' timing (clip start)
for i, c in enumerate(caps):
    if new[i] is None and c["beat"].startswith("proof"):
        new[i] = [c["s"], c["e"]]
# interpolate unmatched words between matched neighbours (within the same beat timing range)
for i in range(len(caps)):
    if new[i]:
        continue
    lo = next((j for j in range(i - 1, -1, -1) if new[j]), None)
    hi = next((j for j in range(i + 1, len(caps)) if new[j]), None)
    t0 = new[lo][1] if lo is not None else caps[i]["s"]
    t1 = new[hi][0] if hi is not None else caps[i]["e"]
    n = (hi if hi is not None else len(caps)) - (lo if lo is not None else -1)
    j = i - (lo if lo is not None else -1)
    new[i] = [t0 + (t1 - t0) * (j - 1) / n, t0 + (t1 - t0) * j / n]

# snap words that follow a pause onto the first frame that's actually loud
hop = int(0.01 * SR)
rms = np.sqrt(np.convolve(dia ** 2, np.ones(hop * 2) / (hop * 2), mode="same"))[::hop]
snapped = 0
for i, (s, e) in enumerate(new):
    after_pause = i == 0 or s - new[i - 1][1] > 0.08 or caps[i]["beat"] != caps[i - 1]["beat"]
    if not after_pause:
        continue
    a, b = int(max(0, s + SNAP_WIN[0]) * 100), int((s + SNAP_WIN[1]) * 100)
    loud = np.nonzero(rms[a:b] > ONSET_THR)[0]
    if len(loud):
        on = (a + loud[0]) / 100
        if abs(on - s) > 0.03:
            new[i][0] = on
            snapped += 1

out = []
for c, (s, e) in zip(caps, new):
    out.append({**c, "s": round(s, 3), "e": round(max(e, s + 0.08), 3)})
for i in range(1, len(out)):
    out[i]["s"] = max(out[i]["s"], out[i - 1]["s"] + 0.04)
moves = [(c["w"], round(o["s"] - c["s"], 2)) for c, o in zip(caps, out) if abs(o["s"] - c["s"]) > 0.1]
json.dump(out, open(os.path.join(PUB, "captions.json"), "w"), indent=1)
print(f"{matched}/{len(caps)} words matched, {snapped} snapped to onsets; moved >0.1s: {moves}")
