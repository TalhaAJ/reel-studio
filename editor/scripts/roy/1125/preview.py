import os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan import *

BASE = os.path.join(S, "base_v2.mp4")
FONT = ImageFont.truetype(CAP_FONT, CAP_PX)


def cap_img(text):
    w = int(FONT.getlength(text)) + 60; im = Image.new("RGBA", (w, 150), (0, 0, 0, 0))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).text((w / 2, 77), text, font=FONT, fill=(0, 0, 0, 200), anchor="mm")
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(5))); ImageDraw.Draw(im).text((w / 2, 75), text, font=FONT, fill="white", anchor="mm")
    return im


CAPS = {c["text"]: cap_img(c["text"]) for c in caps}
OVI = {}
for n in LAY:
    fn, im, w, h, yc = place(n); im = im.resize((round(w), round(h)), Image.LANCZOS); OVI[n] = (im, round((W - im.width) / 2), round(yc * H - im.height / 2))


def draw(fr, z, o):
    if z != 1:
        dw, dh = W / z, H / z; fr = fr.resize((W, H), Image.LANCZOS, box=((W - dw) / 2, (H - dh) / 2, (W + dw) / 2, (H + dh) / 2))
    else:
        fr = fr.copy()
    for n, (a, b) in OV.items():
        if a <= o < b: fr.paste(OVI[n][0], OVI[n][1:], OVI[n][0])
    c = next((c for c in caps if c["s"] <= o < c["e"]), None)
    if c: im = CAPS[c["text"]]; fr.paste(im, (round((W - im.width) / 2), round(c["y"] * H - 75)), im)
    return fr


def run(dst, scale=1):
    need = {}
    for s in shots:
        for j in range(s["n"]): need[s["src"] + j] = (s["z"], s["out"] + j)
    p = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-i", BASE, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    parts = ";".join(f"[0:a]atrim={s['src'] / FPS:.5f}:{(s['src'] + s['n']) / FPS:.5f},asetpts=PTS-STARTPTS,afade=t=in:d=0.006,afade=t=out:st={s['n'] / FPS - .006:.5f}:d=0.006[a{i}]" for i, s in enumerate(shots))
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", os.path.join(S, "voice_v2.wav"), "-filter_complex", parts + ";" + "".join(f"[a{i}]" for i in range(len(shots))) + f"concat=n={len(shots)}:v=0:a=1[a]", "-map", "[a]", os.path.join(S, "cut.wav")], check=True)
    enc = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", os.path.join(S, "cut.wav"), "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-pix_fmt", "yuv420p",
                            "-vf", "scale=out_color_matrix=bt709", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", dst], stdin=subprocess.PIPE)
    i = n = 0
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        if i in need:
            z, o = need[i]; enc.stdin.write(draw(Image.frombuffer("RGB", (W, H), b), z, o).tobytes()); n += 1
        i += 1
    enc.stdin.close(); enc.wait(); print("frames", n, "of", TOTAL)


def stills(ts, dst):
    ims = []
    for t in ts:
        o = round(t * FPS); s = next(x for x in shots if x["out"] <= o < x["out"] + x["n"]); b = s["src"] + o - s["out"]
        raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{(b + .5) / FPS:.4f}", "-i", BASE, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
        ims.append(draw(Image.frombuffer("RGB", (W, H), raw), s["z"], o).resize((405, 720), Image.LANCZOS))
    g = Image.new("RGB", (405 * len(ims), 720))
    for k, im in enumerate(ims): g.paste(im, (405 * k, 0))
    g.save(dst)


if __name__ == "__main__":
    if sys.argv[1] == "stills": stills([float(x) for x in sys.argv[2:]], os.path.join(S, "pv.png"))
    else: run(sys.argv[1])
