"""Key the CapCut rough cut of IMG_2919 into Talha's own rendered room (vertical). Output: base.mp4 (same 53.3 s timeline)."""
import json, os, subprocess, sys
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, r"C:\AI Video Editing\editor\scripts")
from keyer import key

S = os.path.dirname(os.path.abspath(__file__))
SRC = r"C:\Users\talha\Downloads\IMG_2919.MOV"
DRAFT = r"C:\Users\talha\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft\1125\draft_content.json"
W, H, FPS = 1080, 1920, 30
ROOM = None


def segs():
    d = json.load(open(DRAFT, encoding="utf-8-sig"))
    out = []
    for s in d["tracks"][0]["segments"]:
        a, b = s["target_timerange"]["start"] / 1e6, (s["target_timerange"]["start"] + s["target_timerange"]["duration"]) / 1e6
        out.append((s["source_timerange"]["start"] / 1e6, round(a * FPS), round(b * FPS)))
    return out


def gblur(a, r):
    return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255


def room():
    global ROOM
    if ROOM is None:
        im = Image.open(os.path.join(S, "room_v.png")).convert("RGB").filter(ImageFilter.GaussianBlur(5))
        ROOM = np.asarray(im, np.float32) / 255 * .95
    return ROOM


def comp(rgb):
    k = key(rgb).astype(np.float32)
    a = k[..., 3]
    a[:560] = 0
    a[560:600] *= np.linspace(0, 1, 40)[:, None]
    a[:1380, 1052:] = 0                                   # bare wall strip beside the cloth
    a[:1380, 1040:1052] *= np.linspace(1, 0, 12)[None, :]
    lum = k[1380:, 1030:, :3].max(-1)                     # lower down only the bright wall goes, the dark sleeve stays
    a[1380:, 1030:] *= 1 - np.clip((lum - 70) / 40, 0, 1)
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


def read(t, n):
    p = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{t:.4f}", "-i", SRC, "-frames:v", str(n), "-vf", f"scale={W}:{H}:flags=area,fps={FPS}",
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


def job(a):
    i, (src, f0, f1) = a
    path = os.path.join(S, f"pl{i:02d}.mp4")
    enc = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "14",
                            "-preset", "medium", "-pix_fmt", "yuv420p", "-vf", "scale=out_color_matrix=bt709", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", path], stdin=subprocess.PIPE)
    for rgb in read(src, f1 - f0):
        enc.stdin.write(comp(rgb).tobytes())
    enc.stdin.close()
    enc.wait()
    return path


if __name__ == "__main__":
    sg = segs()
    if "--still" in sys.argv:
        ims = []
        for t in map(float, sys.argv[sys.argv.index("--still") + 1:]):
            s = next(x for x in sg if x[1] / FPS <= t < x[2] / FPS)
            ims.append(comp(next(read(s[0] + t - s[1] / FPS, 1))))
        Image.fromarray(np.hstack(ims)).resize((432 * len(ims), 768), Image.LANCZOS).save(os.path.join(S, "stills.png"))
        sys.exit()
    with Pool(8) as p:
        paths = p.map(job, list(enumerate(sg)), chunksize=1)
    open(os.path.join(S, "pl.txt"), "w").write("\n".join("file '" + x.replace("\\", "/") + "'" for x in paths))
    parts, labels = [], ""
    for i, (src, f0, f1) in enumerate(sg):
        parts.append(f"[0:a]atrim={src:.5f}:{src + (f1 - f0) / FPS:.5f},asetpts=PTS-STARTPTS,afade=t=in:d=0.006,afade=t=out:st={(f1 - f0) / FPS - .006:.5f}:d=0.006[a{i}]")
        labels += f"[a{i}]"
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", SRC, "-filter_complex", ";".join(parts) + f";{labels}concat=n={len(sg)}:v=0:a=1[a]", "-map", "[a]", "-ar", "48000", "-c:a", "pcm_s16le", os.path.join(S, "voice.wav")], check=True)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", os.path.join(S, "pl.txt"), "-i", os.path.join(S, "voice.wav"), "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
                    "-shortest", "-movflags", "+faststart", os.path.join(S, "base.mp4")], check=True)
    print("base frames", sg[-1][2])
