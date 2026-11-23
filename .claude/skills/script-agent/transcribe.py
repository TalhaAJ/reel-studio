import json, subprocess, sys, glob, os
import numpy as np
from faster_whisper import WhisperModel

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
model = WhisperModel("medium.en", device="cpu", compute_type="int8")
for f in sorted(glob.glob(os.path.join(src, "*.mp4"))):
    name = os.path.splitext(os.path.basename(f))[0].replace("snapgram.io_", "")
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, np.float32)
    segs, _ = model.transcribe(audio, word_timestamps=True, vad_filter=False, language="en")
    words, lines = [], []
    for s in segs:
        lines.append(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}")
        words += [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for w in (s.words or [])]
    dur = len(audio) / 16000
    with open(os.path.join(out, name + ".json"), "w", encoding="utf-8") as fh:
        json.dump({"file": os.path.basename(f), "duration": round(dur, 1), "words": words}, fh)
    with open(os.path.join(out, name + ".txt"), "w", encoding="utf-8") as fh:
        fh.write(f"# {os.path.basename(f)} · {dur:.1f}s · {len(words)} words · {len(words)/max(dur,1)*60:.0f} wpm\n" + "\n".join(lines) + "\n")
    print(name, f"{dur:.0f}s", len(words), "words", flush=True)
print("done")
