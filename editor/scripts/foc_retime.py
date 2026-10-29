"""Re-time the Fact-or-Cap body captions against the finished body_voice.wav (run after foc_body.py).

Transcribes the cut voice track, aligns the script words to what Whisper heard, fills the gaps by
interpolation, and snaps every word that follows a pause onto the real audio onset.
"""
import difflib, json, os, re, subprocess
import numpy as np
from faster_whisper import WhisperModel

FF = r"C:\\Users\\talha\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe"
FOC = r"C:\\AI Video Editing\\editor\\public\\foc"
SR = 16000
body = json.load(open(os.path.join(FOC, "body.json")))
caps = body["captions"]
audio = np.frombuffer(subprocess.run([FF, "-v", "error", "-i", os.path.join(FOC, "body_voice.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                     capture_output=True).stdout, np.float32)
m = WhisperModel("medium.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(audio, word_timestamps=True, language="en", condition_on_previous_text=False)
heard = [dict(w=w.word.strip(), s=w.start, e=w.end) for s in segs for w in s.words]

clean = lambda w: re.sub(r"[^a-z0-9']", "", w.lower().replace("*", "u"))
sm = difflib.SequenceMatcher(None, [clean(c["w"]) for c in caps], [clean(h["w"]) for h in heard], autojunk=False)
new = [None] * len(caps)
for b in sm.get_matching_blocks():
    for k in range(b.size):
        h = heard[b.b + k]
        new[b.a + k] = [h["s"], h["e"]]
matched = sum(x is not None for x in new)
# sentence ids: interpolation never reaches across a sentence (or a sped-up silent stretch between them)
sent, k = [], 0
for c in caps:
    sent.append(k)
    if re.search(r"[.?!]$", c["w"]):
        k += 1
for i in range(len(caps)):  # interpolate leftovers between matched neighbours of the same sentence
    if new[i]:
        continue
    lo = next((j for j in range(i - 1, -1, -1) if new[j] and sent[j] == sent[i]), None)
    hi = next((j for j in range(i + 1, len(caps)) if new[j] and sent[j] == sent[i]), None)
    t0 = new[lo][1] if lo is not None else caps[i]["s"]
    t1 = new[hi][0] if hi is not None else caps[i]["e"]
    n = (hi if hi is not None else i + 1) - (lo if lo is not None else i - 1)
    j = i - (lo if lo is not None else i - 1)
    new[i] = [t0 + (t1 - t0) * (j - 1) / max(1, n), t0 + (t1 - t0) * j / max(1, n)]

hop = SR // 100
rms = np.sqrt(np.convolve(audio.astype(np.float64) ** 2, np.ones(hop * 2) / (hop * 2), mode="same"))[::hop]
snapped = 0
for i, (s, e) in enumerate(new):
    if i and s - new[i - 1][1] < 0.08 and caps[i]["beat"] == caps[i - 1]["beat"]:
        continue
    a, b = int(max(0, s - 0.12) * 100), int((s + 0.45) * 100)
    loud = np.nonzero(rms[a:b] > 0.03)[0]
    if len(loud) and abs((a + loud[0]) / 100 - s) > 0.03:
        new[i][0] = (a + loud[0]) / 100; snapped += 1
for c, (s, e) in zip(caps, new):
    c["s"], c["e"] = round(s, 3), round(max(e, s + 0.08), 3)
for i in range(1, len(caps)):
    caps[i]["s"] = max(caps[i]["s"], caps[i - 1]["s"] + 0.04)
json.dump(body, open(os.path.join(FOC, "body.json"), "w"), indent=1)
print(f"{matched}/{len(caps)} words matched, {snapped} snapped")
