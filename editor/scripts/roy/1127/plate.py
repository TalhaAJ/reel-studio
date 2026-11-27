"""Key the four green-screen takes into the same rendered room as the 1125 reel and cut out the dead space.
Output: base.mp4 (cut timeline, 30 fps) + voice.wav (raw voice, cut) + segs.json (output timing of every kept piece)."""
import json, os, subprocess, sys
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, r"C:\AI Video Editing\editor\scripts")
from keyer import key

S = os.path.dirname(os.path.abspath(__file__))
DL = r"C:\Users\talha\Downloads"
W, H, FPS = 1080, 1920, 30
# per take: crop window in the rotated 2160x3840 source (scale s, left x0, top y0, as fractions) so the head sits
# in the same place in every take. 2944 was filmed further back, so it is cropped tighter.
FRAME = {"2940": (1.10, .074, .075), "2941": (1.10, .086, .088), "2942": (1.15, .102, .130), "2944": (1.29, .102, .105)}
# kept speech (source seconds). Dead air, the false start in 2942 and the repeated "$60" in 2944 are left out.
SEGS = [
    ("2940", 1.57, 5.90), ("2940", 6.11, 10.50),
    ("2941", 0.88, 7.57), ("2941", 7.88, 11.70), ("2941", 12.10, 13.48),
    ("2942", 8.18, 14.02),
    ("2944", 1.60, 8.96), ("2944", 9.38, 11.78), ("2944", 12.18, 12.99), ("2944", 14.50, 18.56), ("2944", 19.33, 23.72),
    ("2944", 23.89, 27.82), ("2944", 28.09, 29.78), ("2944", 30.29, 30.74), ("2944", 31.15, 38.94), ("2944", 39.27, 40.62),
]
ROOM = None


def gblur(a, r):
    return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255


def room():
    global ROOM
    if ROOM is None:
        im = Image.open(os.path.join(S, "room_v.png")).convert("RGB").filter(ImageFilter.GaussianBlur(5))
        ROOM = np.asarray(im, np.float32) / 255 * .95
    return ROOM


def comp(rgb):
    """Same look as the 1125 reel: keyed, a touch of contrast and warmth, warm/cool rim light, light wrap from the room."""
    k = key(rgb).astype(np.float32)
    a = k[..., 3]
    a[:470] = 0                                           # above the head is wall / clamp, never him
    a[470:520] *= np.linspace(0, 1, 50)[:, None]
    dark = k[..., :3].max(-1) < 105
    k[..., 1] = np.where(dark, np.minimum(k[..., 1], (k[..., 0] + k[..., 2]) / 2 + 1), k[..., 1])
    A = a / 255
    fg = k[..., :3] / 255
    rm = room()
    fg = np.clip((fg - .5) * 1.06 + .485, 0, 1) * np.array((1.02, .995, .965), np.float32)
    xx = np.arange(W, dtype=np.float32)[None, :]
    yy = np.arange(H, dtype=np.float32)[:, None]
    warm = np.clip((xx - 540) / 330, 0, 1) * np.clip(1 - np.abs(yy - 1050) / 800, 0, 1)
    cool = np.clip((540 - xx) / 300, 0, 1) * np.clip(1 - np.abs(yy - 900) / 900, 0, 1)
    inner = np.clip(A - gblur(A, 12), 0, 1) * 1.6
    fg = fg + (inner * warm)[..., None] * np.array((1, .6, .28), np.float32) * .42 + (inner * cool)[..., None] * np.array((.25, .45, 1), np.float32) * .42
    wr = (np.clip(A - gblur(A, 5), 0, 1) * .5)[..., None]
    fg = fg * (1 - wr) + rm * wr
    out = rm * (1 - A[..., None]) + np.clip(fg, 0, 1) * A[..., None]
    return (np.clip(out, 0, 1) * 255).astype(np.uint8)


def vf(take):
    s, x0, y0 = FRAME[take]
    return f"crop=iw/{s}:ih/{s}:iw*{x0}:ih*{y0},scale={W}:{H}:flags=lanczos,fps={FPS}"


def read(take, t, n):
    p = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{t:.4f}", "-i", os.path.join(DL, f"IMG_{take}.MOV"), "-frames:v", str(n), "-vf", vf(take),
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    last = None
    for _ in range(n):
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3:
            b = last
        last = b
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)
    p.stdout.close()
    p.wait()


def frames_of():
    """snap every kept piece to whole frames; returns (take, src_start, n_frames, out_frame)"""
    out, t = [], 0
    for take, a, b in SEGS:
        n = round((b - a) * FPS)
        out.append((take, a, n, t))
        t += n
    return out


def job(arg):
    i, (take, a, n, o) = arg
    path = os.path.join(S, f"pl{i:02d}.mp4")
    enc = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "14",
                            "-preset", "medium", "-pix_fmt", "yuv420p", "-vf", "scale=out_color_matrix=bt709", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", path], stdin=subprocess.PIPE)
    for rgb in read(take, a, n):
        enc.stdin.write(comp(rgb).tobytes())
    enc.stdin.close()
    enc.wait()
    return path


if __name__ == "__main__":
    fr = frames_of()
    if "--still" in sys.argv:
        ims = []
        for take, t in [x.split("@") for x in sys.argv[sys.argv.index("--still") + 1:]]:
            ims.append(comp(next(read(take, float(t), 1))))
        Image.fromarray(np.hstack(ims)).resize((432 * len(ims), 768), Image.LANCZOS).save(os.path.join(S, "stills.png"))
        sys.exit()
    with Pool(8) as p:
        paths = p.map(job, list(enumerate(fr)), chunksize=1)
    open(os.path.join(S, "pl.txt"), "w").write("\n".join("file '" + x.replace("\\", "/") + "'" for x in paths))
    # voice: raw, only cut (6 ms fades at every join so the cuts don't click)
    ins, parts, labels = [], [], ""
    takes = sorted({t for t, *_ in fr})
    for tk in takes:
        ins += ["-i", os.path.join(DL, f"IMG_{tk}.MOV")]
    for i, (take, a, n, o) in enumerate(fr):
        d = n / FPS
        parts.append(f"[{takes.index(take)}:a]atrim={a:.5f}:{a + d:.5f},asetpts=PTS-STARTPTS,afade=t=in:d=0.006,afade=t=out:st={d - .006:.5f}:d=0.006[a{i}]")
        labels += f"[a{i}]"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", *ins, "-filter_complex", ";".join(parts) + f";{labels}concat=n={len(fr)}:v=0:a=1[a]", "-map", "[a]", "-ar", "48000", "-ac", "1",
                    "-c:a", "pcm_s16le", os.path.join(S, "voice.wav")], check=True)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", os.path.join(S, "pl.txt"), "-i", os.path.join(S, "voice.wav"), "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
                    "-shortest", "-movflags", "+faststart", os.path.join(S, "base.mp4")], check=True)
    json.dump([dict(take=t, src=a, n=n, out=o) for t, a, n, o in fr], open(os.path.join(S, "segs.json"), "w"), indent=1)
    print("base frames", fr[-1][2] + fr[-1][3], "=", round((fr[-1][2] + fr[-1][3]) / FPS, 2), "s")
