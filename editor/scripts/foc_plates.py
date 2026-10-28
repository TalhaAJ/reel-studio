"""Fact-or-Cap hook plates: cut the phone reaction, mute it while their reel plays, key the face.

The phone recording hears their reel through the speakers. While the reel is on screen we use the reel's
own clean audio, so your phone audio is muted there. When you speak, your phone audio comes back.
Run sync_reel.py first to get REEL_AT (where the reel starts in the phone recording).

Writes to editor/public/: cuts.json, captions.json, voice.wav, face.webm
"""
import json, os, subprocess, sys
import numpy as np
import keyer
from keyer import key

FF = r"C:\Users\talha\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
ROOT = r"C:\AI Video Editing"
SRC = os.path.join(ROOT, "raw-footage", "Part1.MOV")
PUB = os.path.join(ROOT, "editor", "public")
W, H, FPS = 1080, 1920, 30
keyer.WALL_Y = 300   # wall + clamps end higher in this framing

REEL_AT = 0.429      # sync_reel.py: their reel starts here in the phone recording
FREEZE = 8.60        # reel time we freeze on ("…Photoshop right here.")

# (phone start, phone end, beat, muted?, what you said)
SEGS = [
    (REEL_AT, REEL_AT + FREEZE, "claim", True, None),   # their reel plays, you react silently
    (9.06, 11.74, "foc", False, "I'm going to do a fact or cap and check this, if it's true or not."),
    (22.02, 25.86, "plan", False, "I'm going to do 3 challenges just to show you if it's worth getting this or not. Let's go."),
]
words = json.load(open(os.path.join(ROOT, "analysis", "foc", "part1_words.json")))

cuts, caps, t = [], [], 0.0
for a, b, beat, mute, text in SEGS:
    cuts.append({"s": a, "e": b, "t": round(t, 3), "beat": beat, "mute": mute})
    if text:
        heard = [w for w in words if a - 0.05 <= w["s"] < b]
        script = text.split()
        # same word count -> take Whisper's timings directly; otherwise spread evenly
        if len(heard) == len(script):
            for sw, h in zip(script, heard):
                caps.append({"w": sw, "s": round(t + h["s"] - a, 3), "e": round(t + h["e"] - a, 3), "beat": beat})
        else:
            print(f"  {beat}: {len(heard)} heard vs {len(script)} script words -> even spacing")
            s0, s1 = heard[0]["s"] - a, heard[-1]["e"] - a
            for i, sw in enumerate(script):
                caps.append({"w": sw, "s": round(t + s0 + (s1 - s0) * i / len(script), 3),
                             "e": round(t + s0 + (s1 - s0) * (i + 1) / len(script), 3), "beat": beat})
    t += b - a
json.dump({"cuts": cuts, "total": round(t, 3), "reelAt": REEL_AT, "freeze": FREEZE}, open(os.path.join(PUB, "cuts.json"), "w"), indent=1)
json.dump(caps, open(os.path.join(PUB, "captions.json"), "w"), indent=1)
print(f"total {t:.2f}s; " + " ".join(f"{c['w']}@{c['s']:.2f}" for c in caps))

parts, labels = [], []
for i, c in enumerate(cuts):
    d = c["e"] - c["s"]
    parts.append(f"[0:v]trim={c['s']}:{c['e']},setpts=PTS-STARTPTS,fps={FPS},scale={W}:{H}:flags=lanczos[v{i}]")
    vol = ",volume=0" if c["mute"] else ""
    parts.append(f"[0:a]atrim={c['s']}:{c['e']},asetpts=PTS-STARTPTS{vol},afade=t=in:d=0.02,afade=t=out:st={d - 0.02:.3f}:d=0.02[a{i}]")
    labels.append(f"[v{i}][a{i}]")
parts.append("".join(labels) + f"concat=n={len(cuts)}:v=1:a=1[v][a]")
cut_mov = os.path.join(ROOT, "analysis", "foc", "cut.mov")
subprocess.run([FF, "-v", "error", "-y", "-i", SRC, "-filter_complex", ";".join(parts), "-map", "[v]", "-map", "[a]",
                "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-c:a", "pcm_s16le", cut_mov], check=True)

# voice: same gentle chain as Electric Orange v2 (no denoise, no compressor), loudness set on the spoken parts
pre = "highpass=f=80,equalizer=f=320:t=o:w=1.3:g=-3"
st = subprocess.run([FF, "-hide_banner", "-i", cut_mov, "-ss", str(cuts[1]["t"]), "-vn", "-af", f"{pre},loudnorm=I=-16:print_format=json",
                     "-f", "null", "-"], capture_output=True, text=True).stderr
gain = -16 - float(json.loads(st[st.rindex("{"):st.rindex("}") + 1])["input_i"])
gate = "agate=threshold=0.05:ratio=2:range=0.3:attack=2:release=50:knee=3:detection=rms"
subprocess.run([FF, "-v", "error", "-y", "-i", cut_mov, "-vn", "-af", f"{pre},volume={gain:.2f}dB,alimiter=limit=0.89:level=false,{gate}",
                "-ar", "48000", os.path.join(PUB, "voice.wav")], check=True)
if "--audio-only" in sys.argv:
    sys.exit(0)

dec = subprocess.Popen([FF, "-v", "error", "-i", cut_mov, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
enc = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                        "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "6M", "-deadline", "realtime", "-cpu-used", "8",
                        "-row-mt", "1", "-auto-alt-ref", "0", os.path.join(PUB, "face.webm")], stdin=subprocess.PIPE)
n, size = 0, W * H * 3
while True:
    buf = dec.stdout.read(size)
    if len(buf) < size:
        break
    enc.stdin.write(key(np.frombuffer(buf, np.uint8).reshape(H, W, 3)).tobytes())
    n += 1
enc.stdin.close(); enc.wait(); dec.wait()
print(f"face: {n} frames")
