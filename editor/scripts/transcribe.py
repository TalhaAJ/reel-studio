"""Word-level transcript of the raw footage (medium.en: catches false starts the small model glosses over)."""
import json, os, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

FF = r"C:\Users\talha\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
src = sys.argv[1] if len(sys.argv) > 1 else r"C:\AI Video Editing\raw-footage\IMG_2292.MOV"
out = sys.argv[2] if len(sys.argv) > 2 else r"C:\AI Video Editing\analysis\mine\words_medium.json"

raw = subprocess.run([FF, "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
m = WhisperModel("medium.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(np.frombuffer(raw, np.float32), word_timestamps=True, language="en", condition_on_previous_text=False)
words = [dict(w=w.word.strip(), s=round(w.start, 2), e=round(w.end, 2), p=round(w.probability, 2)) for s in segs for w in s.words]
json.dump(words, open(out, "w"), indent=0)
for w in words:
    print(f'{w["s"]:7.2f}-{w["e"]:7.2f} {w["p"]:.2f} {w["w"]}')
