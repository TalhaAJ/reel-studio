"""Cut the raw footage per cuts.json, then key it.

Writes to editor/public/:
  voice.wav     cut + loudness-normalised voice (-14 LUFS)
  face.webm     keyed talking head, VP9 with alpha, 1080x1920 @30
"""
import json, os, subprocess, sys
import numpy as np
from keyer import key

FF = r"C:\Users\talha\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
ROOT = r"C:\AI Video Editing"
SRC = os.path.join(ROOT, r"raw-footage\IMG_2294.MOV")
PUB = os.path.join(ROOT, r"editor\public")
W, H, FPS = 1080, 1920, 30

cuts = json.load(open(os.path.join(PUB, "cuts.json")))["cuts"]

# 1) one filter graph: trim each interval, tiny audio fades to avoid clicks, concat
parts, labels = [], []
for i, c in enumerate(cuts):
    d = c["e"] - c["s"]
    parts.append(f"[0:v]trim={c['s']}:{c['e']},setpts=PTS-STARTPTS,fps={FPS},scale={W}:{H}:flags=lanczos[v{i}]")
    mute = ",volume=0" if c.get("gap") else ""  # proof inserts: picture only, the clone clip plays in Remotion
    parts.append(f"[0:a]atrim={c['s']}:{c['e']},asetpts=PTS-STARTPTS{mute},"
                 f"afade=t=in:d=0.012,afade=t=out:st={d - 0.012:.3f}:d=0.012[a{i}]")
    labels.append(f"[v{i}][a{i}]")
parts.append("".join(labels) + f"concat=n={len(cuts)}:v=1:a=1[v][a]")
cut_mov = os.path.join(ROOT, r"analysis\mine\cut.mov")  # intermediate; kept out of public/ so the render bundle stays small
subprocess.run([FF, "-v", "error", "-y", "-i", SRC, "-filter_complex", ";".join(parts),
                "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "14", "-preset", "fast",
                "-c:a", "pcm_s16le", cut_mov], check=True)

# 2) voice: keep the iPhone recording as-is (denoise + compression made it sound stuffed).
#    Only cut sub-60 Hz rumble and set loudness with two-pass *linear* loudnorm (a clean gain change).
#    Final -14 LUFS is applied to the full mix after rendering (see scripts/master.py).
def loudnorm_linear(src, dst, pre="highpass=f=60", target=-16):
    stats = subprocess.run([FF, "-hide_banner", "-i", src, "-vn", "-af", f"{pre},loudnorm=I={target}:TP=-1.5:LRA=11:print_format=json",
                            "-f", "null", "-"], capture_output=True, text=True).stderr
    m = json.loads(stats[stats.rindex("{"):stats.rindex("}") + 1])
    af = (f"{pre},loudnorm=I={target}:TP=-1.5:LRA=11:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
          f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
    subprocess.run([FF, "-v", "error", "-y", "-i", src, "-vn", "-af", af, "-ar", "48000", dst], check=True)

# Room echo: a gentle low-mid dip (the boxy "room" band) plus a soft downward expander that pulls the
# reverb tail down ~9 dB between words. No denoise, no compressor: the voice itself is untouched.
ROOM_EQ = "highpass=f=80,equalizer=f=320:t=o:w=1.3:g=-3"
GATE = "agate=threshold=0.05:ratio=2:range=0.3:attack=2:release=50:knee=3:detection=rms"  # echo tails below about -32 dBFS drop 10 dB; speech untouched
raw_voice = os.path.join(ROOT, "analysis", "mine", "voice_raw.wav")
loudnorm_linear(cut_mov, raw_voice, pre=ROOM_EQ)
subprocess.run([FF, "-v", "error", "-y", "-i", raw_voice, "-af", GATE, "-ar", "48000", os.path.join(PUB, "voice.wav")], check=True)
if "--audio-only" in sys.argv:
    sys.exit(0)

# 3) key every frame -> VP9 with alpha
dec = subprocess.Popen([FF, "-v", "error", "-i", cut_mov, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                       stdout=subprocess.PIPE)
enc = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}",
                        "-r", str(FPS), "-i", "-", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                        "-b:v", "6M", "-deadline", "realtime", "-cpu-used", "8", "-row-mt", "1",
                        "-auto-alt-ref", "0", os.path.join(PUB, "face.webm")], stdin=subprocess.PIPE)
n, size = 0, W * H * 3
while True:
    buf = dec.stdout.read(size)
    if len(buf) < size:
        break
    enc.stdin.write(key(np.frombuffer(buf, np.uint8).reshape(H, W, 3)).tobytes())
    n += 1
    if n % 150 == 0:
        print(f"keyed {n} frames", flush=True)
enc.stdin.close()
enc.wait()
dec.wait()
print(f"done: {n} frames ({n / FPS:.2f}s)")
