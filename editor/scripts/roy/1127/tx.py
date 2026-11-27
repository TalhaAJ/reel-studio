import subprocess, json, os, sys
import numpy as np
from faster_whisper import WhisperModel
S = os.path.dirname(os.path.abspath(__file__))
m = WhisperModel("medium.en", device="cpu", compute_type="int8")
out = {}
for n in ["2940", "2941", "2942", "2944"]:
    src = rf"C:\Users\talha\Downloads\IMG_{n}.MOV"
    raw = np.frombuffer(subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", src, "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
    segs, _ = m.transcribe(raw, word_timestamps=True, vad_filter=False, language="en", condition_on_previous_text=False,
                           initial_prompt="Shopify, /products.json, JSON, Black Friday, Best Buy, Lenovo, Foot Locker, New Balance, Gymshark, larp, gaslight, cooked, diabolical. Let's go, boys.")
    W = []
    print("==", n, flush=True)
    for s in segs:
        print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}", flush=True)
        W += [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 2)} for w in s.words]
    out[n] = W
json.dump(out, open(os.path.join(S, "words.json"), "w", encoding="utf-8"), indent=0)
print("done")
