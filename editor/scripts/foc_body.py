"""Fact-or-Cap body (install + 3 challenges): cut the OBS capture, your face, your voice.

Sources
  raw-footage/obs_screen.mp4   OBS: screen + webcam composited top-left (green screen behind you) + PC mic
  raw-footage/Part2.MOV        phone, recorded during challenge 1 (sharper face + better mic); synced by audio
Writes to editor/public/foc/: body_screen.mp4 (full screen, 30 fps), body_face.webm (600x600 keyed square),
body_voice.wav, plus editor/public/foc/body.json (segments on the output timeline, captions, zoom rects).
"""
import json, os, subprocess, sys
import numpy as np
import keyer
from keyer import key

FF = r"C:\Users\talha\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
ROOT = r"C:\AI Video Editing"
OBS = os.path.join(ROOT, "raw-footage", "obs_screen.mp4")
PHONE = os.path.join(ROOT, "raw-footage", "Part2.MOV")
PHONE_AT = 74.606            # sync_reel.py: Part2 starts here on the OBS clock
OUT = os.path.join(ROOT, "editor", "public", "foc")
FPS, SQ = 30, 600
CAM = (60, 10, 300)          # webcam square inside the OBS frame: x, y, size
PHONE_SQ = (280, 430, 800)   # face square inside the phone frame (1080x1920)

# Zoom rects on the 1920x1080 screen (all ~1.56:1 to fill the screen card)
Z = {
    "site": [430, 110, 1250, 800], "pc": [430, 70, 1250, 800], "fc": [430, 0, 1490, 955],
    "fcp": [600, 10, 960, 615], "ec": [470, 100, 980, 628], "ecw": [430, 0, 1490, 955],
}
# (OBS start, OBS end, speed, voice from, face from, beat, zoom, caption)  speed > 1 = sped up and muted
SEGS = [
    (4.38, 7.16, 1, "obs", "cam", "install", "site", "This is where you download this, so you click download launcher."),
    (75.58, 79.08, 1, "phone", "phone", "c1", "pc", "I've got Adobe Photoshop downloaded, which essentially is PhotoCraft."),
    (91.4, 101.9, 6, None, "phone", "c1", "pc", None),
    (102.20, 106.66, 1, "phone", "phone", "c1", "pc", "I gotta lie, the user interface looks quite similar, so that's a bonus point."),
    (114.50, 121.45, 1, "phone", "phone", "c1", "pc", "Let me do a bit colouring here. Yeah, it works."),
    (199.30, 201.72, 1, "obs", "cam", "c2", "fc", "Challenge 2. I've got Adobe Premiere here,"),
    (202.80, 206.35, 1, "obs", "cam", "c2", "fc", "and what the f*** why is it cinematic?"),
    (232.0, 313.6, 10, None, "cam", "c2", "fc", None),
    (314.18, 319.24, 1, "obs", "cam", "c2", "fc", "I couldn't edit this because I've forgot my editing skills."),
    (319.20, 321.72, 1, "obs", "cam", "c2", "fcp", "So all I'm gonna do is add a couple of effects."),
    (325.33, 328.10, 1, "obs", "cam", "c2", "fcp", "Bingo, that's working. Another one, dip colour here."),
    (329.65, 333.12, 1, "obs", "cam", "c2", "fcp", "Oh wow, amazing… chef's kiss."),
    (390.10, 395.90, 1, "obs", "cam", "c3", "ec", "So challenge number three is actually using After Effects, which is called Effect Craft."),
    (400.2, 422.2, 5, None, "cam", "c3", "ecw", None),
    (422.30, 427.05, 1, "obs", "cam", "c3", "ec", "Please follow. Now let's see… moment of truth."),
    (427.05, 431.40, 2, None, "cam", "c3", "ec", None),
    (431.40, 434.88, 1, "obs", "cam", "c3", "ec", "Wow, it works! Bingo, this is fact."),
    (434.84, 435.98, 1, "obs", "cam", "verdict", "ec", "Make sure you use this."),
    (446.0, 449.0, 1, None, "cam", "end", "ec", None),
]
BLEEP = [(203.66, 204.10)]  # "fuck" (OBS clock)

words = json.load(open(os.path.join(ROOT, "analysis", "foc", "obs_words.json")))
segs, caps, t = [], [], 0.0
for a, b, sp, vsrc, fsrc, beat, zoom, text in SEGS:
    d = (b - a) / sp
    segs.append({"s": a, "e": b, "speed": sp, "t": round(t, 3), "d": round(d, 3), "voice": vsrc, "face": fsrc, "beat": beat, "zoom": Z[zoom]})
    if text:
        heard = [w for w in words if a - 0.05 <= w["s"] < b]
        script = text.split()
        if len(heard) == len(script):
            times = [(h["s"] - a, h["e"] - a) for h in heard]
        else:
            s0 = max(0.0, heard[0]["s"] - a) if heard else 0.1
            s1 = min(b - a, heard[-1]["e"] - a) if heard else b - a - 0.1
            times = [(s0 + (s1 - s0) * i / len(script), s0 + (s1 - s0) * (i + 1) / len(script)) for i in range(len(script))]
        for sw, (s, e) in zip(script, times):
            caps.append({"w": sw, "s": round(t + max(0, s), 3), "e": round(t + min(e, b - a), 3), "beat": beat})
    t += d
for i in range(1, len(caps)):
    caps[i]["s"] = max(caps[i]["s"], caps[i - 1]["s"] + 0.04)
json.dump({"segs": segs, "total": round(t, 3), "captions": caps}, open(os.path.join(OUT, "body.json"), "w"), indent=1)
print(f"body {t:.2f}s, {len(segs)} segments")


def run(cmd):
    subprocess.run(cmd, check=True)


# 1) screen (full frame; the editor zooms per segment)
parts, lab = [], ""
for i, s in enumerate(segs):
    parts.append(f"[0:v]trim={s['s']}:{s['e']},setpts=(PTS-STARTPTS)/{s['speed']},fps={FPS}[v{i}]")
    lab += f"[v{i}]"
parts.append(f"{lab}concat=n={len(segs)}:v=1:a=0[v]")
run([FF, "-v", "error", "-y", "-i", OBS, "-filter_complex", ";".join(parts), "-map", "[v]",
     "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-pix_fmt", "yuv420p", os.path.join(OUT, "body_screen.mp4")])
print("screen done")

# 2) voice: phone mic for challenge 1, PC mic elsewhere, each levelled on its own; sped parts silent; bleeps
def grab(path, a, b, offset=0.0):
    raw = subprocess.run([FF, "-v", "error", "-ss", str(a - offset), "-to", str(b - offset), "-i", path, "-ac", "1", "-ar", "48000",
                          "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

SR = 48000
chunks = []
for s in segs:
    n = int(round(s["d"] * SR))
    if s["voice"] is None:
        x = np.zeros(n, np.float32)
    else:
        x = grab(PHONE if s["voice"] == "phone" else OBS, s["s"], s["e"], PHONE_AT if s["voice"] == "phone" else 0.0)
        x = np.pad(x, (0, max(0, n - len(x))))[:n]
        for ba, bb in BLEEP:
            if s["s"] <= ba < s["e"]:
                i0, i1 = int((ba - s["s"]) * SR), int((bb - s["s"]) * SR)
                x[i0:i1] = 0.25 * np.sin(2 * np.pi * 1000 * np.arange(i1 - i0) / SR)
        f = int(0.015 * SR)
        x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    chunks.append((s["voice"], x))

def lufs_gain(x, target=-16.0):  # rough level match per mic (RMS of the loud half)
    fr = x[: len(x) // 4800 * 4800].reshape(-1, 4800)
    r = np.sqrt((fr ** 2).mean(1)); r = r[r > np.percentile(r, 50)]
    return 10 ** ((target - 20 * np.log10(r.mean() + 1e-9) - 3) / 20)
for src in ("phone", "obs"):
    allx = np.concatenate([x for v, x in chunks if v == src])
    g = lufs_gain(allx)
    chunks = [(v, x * g if v == src else x) for v, x in chunks]
voice = np.concatenate([x for _, x in chunks])
tmp = os.path.join(ROOT, "analysis", "foc", "body_voice_raw.wav")
p = subprocess.Popen([FF, "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0", tmp], stdin=subprocess.PIPE)
p.communicate(np.clip(voice, -1, 1).astype(np.float32).tobytes())
run([FF, "-v", "error", "-y", "-i", tmp, "-af",
     "highpass=f=80,equalizer=f=320:t=o:w=1.3:g=-3,alimiter=limit=0.89:level=false,"
     "agate=threshold=0.05:ratio=2:range=0.3:attack=2:release=50:knee=3:detection=rms",
     "-ar", "48000", os.path.join(OUT, "body_voice.wav")])
print("voice done")
if "--audio-only" in sys.argv:
    sys.exit(0)

# 3) face square: phone (keyed) for challenge 1, webcam corner (keyed) elsewhere
enc = subprocess.Popen([FF, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{SQ}x{SQ}", "-r", str(FPS), "-i", "-",
                        "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "3M", "-deadline", "realtime", "-cpu-used", "8",
                        "-row-mt", "1", "-auto-alt-ref", "0", os.path.join(OUT, "body_face.webm")], stdin=subprocess.PIPE)
keyer.WALL_Y = 0
total = 0
for s in segs:
    n = int(round(s["d"] * FPS))
    if s["face"] == "phone":
        x, y, z = PHONE_SQ
        src, off = PHONE, PHONE_AT
        vf = f"scale=1080:1920,crop={z}:{z}:{x}:{y},scale={SQ}:{SQ}"
    else:
        x, y, z = CAM
        src, off = OBS, 0.0
        vf = f"crop={z}:{z}:{x}:{y},scale={SQ}:{SQ}:flags=lanczos"
    dec = subprocess.Popen([FF, "-v", "error", "-ss", str(s["s"] - off), "-to", str(s["e"] - off), "-i", src,
                            "-vf", f"setpts=(PTS-STARTPTS)/{s['speed']},fps={FPS},{vf}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                           stdout=subprocess.PIPE)
    k, last = 0, None
    while k < n:
        buf = dec.stdout.read(SQ * SQ * 3)
        if len(buf) < SQ * SQ * 3:
            break
        last = key(np.frombuffer(buf, np.uint8).reshape(SQ, SQ, 3))
        enc.stdin.write(last.tobytes()); k += 1
    dec.stdout.close(); dec.wait()
    while k < n and last is not None:  # pad a short segment with its last frame
        enc.stdin.write(last.tobytes()); k += 1
    total += k
enc.stdin.close(); enc.wait()
print(f"face done: {total} frames")
