"""Render the reel: base plate (punch-ins) + full-screen b-roll + overlays + captions, and the sound mix.
   python render.py out.mp4          full render
   python render.py --stills t1 t2   contact sheet of single frames (pv.png)"""
import json, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan import *
import gfx

BASE = os.path.join(S, "base.mp4")
CAP = os.path.join(S, "cap")

# ---------- prepared graphics ----------
CAPS = {c["text"]: gfx.caption(c["text"]) for c in caps}
HOOK = gfx.hook_box()
HOOK_XY = ((W - HOOK.width) // 2, 168)
URLS = {}
T300 = gfx.tag("+$300", "white", (229, 37, 37, 255))
T60 = gfx.tag("$60", (20, 20, 20, 255), (255, 255, 255, 255))
T60S = gfx.tag("$60", (20, 20, 20, 255), (255, 255, 255, 255), strike=True)
T120 = gfx.tag("$120", "white", (229, 37, 37, 255), px=170)
TOP = gfx.browser_top()
CLOCKS = {}

# ---------- the real /products.json capture, store name blurred ----------
SC = 2.25
VH = H - TOP.height


def load_page(png, js):
    im = Image.open(os.path.join(CAP, png)).convert("RGB")
    bx = json.load(open(os.path.join(CAP, js)))
    for x, y, w, h in bx["brand"]:
        r = (int(x * SC) - 6, int(y * SC) - 4, int((x + w) * SC) + 6, int((y + h) * SC) + 6)
        im.paste(im.crop(r).filter(ImageFilter.GaussianBlur(9)), r[:2])
    return im, bx


RAW, RAWB = load_page("json_full.png", "json_boxes.json")          # what the browser shows: one wall of text
PRE, PREB = load_page("pretty_full.png", "pretty_boxes.json")       # the same response, pretty-printed
px_ = lambda b: (b[0] * SC, b[1] * SC, (b[0] + b[2]) * SC, (b[1] + b[3]) * SC)
PRICE = [PREB["price"][0]]
COMP = [PREB["compare"][0]]
allb = [px_(b) for b in PRICE + COMP]
FX = (min(b[0] for b in allb) + max(b[2] for b in allb)) / 2
FY = (min(b[1] for b in allb) + max(b[3] for b in allb)) / 2
ZMAX = 1.6
S1 = 1650                                                           # raw scroll distance (px)


def ease(x):
    x = min(max(x, 0), 1)
    return x * x * (3 - 2 * x)


def view(page, cx, cy, z, marks=()):
    ww, hh = W / z, VH / z
    x0 = min(max(cx - ww / 2, 0), W - ww)
    y0 = min(max(cy - hh / 2, 0), page.height - hh)
    sx, sy = int(x0) - 2, int(y0) - 2
    reg = page.crop((sx, sy, int(x0 + ww) + 3, int(y0 + hh) + 3)).convert("RGBA")
    if marks:
        ov = Image.new("RGBA", reg.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)
        for (l, tt, r, bb), p in marks:
            l, tt, r, bb = l - sx - 8, tt - sy - 6, r - sx + 8, bb - sy + 8
            d.rounded_rectangle((l, tt, l + (r - l) * p, bb), 10, fill=(255, 221, 0, 125), outline=(229, 37, 37, 255) if p >= 1 else None, width=4)
        reg = Image.alpha_composite(reg, ov)
    reg = reg.resize((round(reg.width * W / ww), round(reg.height * VH / hh)), Image.LANCZOS)
    ox, oy = round((x0 - sx) * W / ww), round((y0 - sy) * VH / hh)
    fr = Image.new("RGB", (W, H), "white")
    fr.paste(reg.crop((ox, oy, ox + W, oy + VH)).convert("RGB"), (0, TOP.height))
    return fr


def json_frame(o, a):
    t = (o - a) / FPS
    s0, s1 = JSON_T["scroll"]
    if t < JSON_T["zoom"][0]:
        scroll = S1 * ease((t - s0) / (s1 - s0))
        fr = view(RAW, W / 2, scroll + VH / 2, 1)
    else:
        z0, z1 = JSON_T["zoom"]
        z = 1.15 + (ZMAX - 1.15) * ease((t - z0) / (z1 - z0)) + .05 * max(0, t - z1) / 3
        marks = []
        for boxes, at in ((PRICE, JSON_T["hl_price"]), (COMP, JSON_T["hl_compare"])):
            p = ease((o / FPS - at) / .22)
            if p > 0:
                marks += [(px_(b), p) for b in boxes]
        fr = view(PRE, FX, FY, z, marks)
    fr.paste(TOP, (0, 0), TOP)
    if t < .35:                                   # page-load bar under the address bar
        ImageDraw.Draw(fr).rectangle((0, TOP.height - 6, int(W * ease(t / .3)), TOP.height - 1), fill=(26, 115, 232))
    return fr


# ---------- stock b-roll readers ----------
class Stock:
    def __init__(self, src, ss, n):
        self.n = n
        self.p = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{ss:.3f}", "-i", src, "-frames:v", str(n),
                                   "-vf", f"fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H}",
                                   "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        self.last = None

    def read(self):
        b = self.p.stdout.read(W * H * 3)
        if len(b) == W * H * 3:
            self.last = b
        return Image.frombuffer("RGB", (W, H), self.last)


def stock_frame(img, o, br):
    p = (o - br["a"]) / max(br["b"] - br["a"] - 1, 1)
    z = 1.0 + .07 * p                            # slow push-in
    dw, dh = W / z, H / z
    return img.resize((W, H), Image.LANCZOS, box=((W - dw) / 2, (H - dh) / 2, (W + dw) / 2, (H + dh) / 2))


# ---------- overlays ----------
def pop(fr, im, cx, cy, since, dur=5):
    """paste im centred at (cx, cy) with a quick scale-in"""
    k = ease(since / dur)
    s = .82 + .18 * k + .05 * np.sin(np.pi * k)
    if s != 1:
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    if since < 2:
        a = np.asarray(im).copy(); a[..., 3] = (a[..., 3] * (since + 1) / 3).astype(np.uint8); im = Image.fromarray(a)
    fr.paste(im, (round(cx - im.width / 2), round(cy - im.height / 2)), im)


def url_img(n, caret):
    k = (n, caret)
    if k not in URLS:
        URLS[k] = gfx.url_bar(n, caret)
    return URLS[k]


def clock_img(hms, flash):
    k = (hms, round(flash, 2))
    if k not in CLOCKS:
        CLOCKS[k] = gfx.countdown(*hms, flash=flash)
    return CLOCKS[k]


def overlays(fr, o):
    t = o / FPS
    if OV["hook"][0] <= o < OV["hook"][1]:
        fr.paste(HOOK, HOOK_XY, HOOK)
    if OV["url"][0] <= o < OV["url"][1]:
        n = int(np.clip((t - TYPE_A) / (TYPE_B - TYPE_A) * len(gfx.PATH) + .5, 0, len(gfx.PATH)))
        typing = TYPE_A <= t < TYPE_B + .05
        im = url_img(n, typing or (int(t * 2) % 2 == 0))
        pop(fr, im, W / 2, HOOK_XY[1] + HOOK.height + im.height / 2 - 14, o - OV["url"][0], 6)
    if OV["t300"][0] <= o < OV["t300"][1]:
        pop(fr, T300, W / 2, .40 * H, o - OV["t300"][0])
    if OV["t60"][0] <= o < OV["t60"][1]:
        im = T60S if t >= STRIKE else T60
        pop(fr, im, .29 * W, .40 * H, o - OV["t60"][0])
    if OV["t120"][0] <= o < OV["t120"][1]:
        pop(fr, T120, .70 * W, .40 * H, o - OV["t120"][0], 4)
    if OV["clock"][0] <= o < OV["clock"][1]:
        hms = [v for at, v in CLOCK if at <= t + 1e-6][-1]
        flash = max(0, 1 - (t - 45.66) / .25) * .8 if t >= 45.66 else 0
        im = clock_img(hms, flash)
        pop(fr, im, W / 2, 340, o - OV["clock"][0])


def draw_caption(fr, o):
    c = next((c for c in caps if c["s"] <= o < c["e"]), None)
    if c:
        im, cx, cy = CAPS[c["text"]]
        fr.paste(im, (round(W / 2 - cx), round(CAP_Y * H - cy)), im)


CAP_Y = gfx.CAP_Y


def zoom_of(o):
    return next(s["z"] for s in shots if s["a"] <= o < s["b"])


def compose(base, o, stock):
    br = next((b for b in BROLL if b["a"] <= o < b["b"]), None)
    if br is None:
        z = zoom_of(o)
        fr = base.resize((W, H), Image.LANCZOS, box=((W - W / z) / 2, (H - H / z) / 2, (W + W / z) / 2, (H + H / z) / 2)) if z != 1 else base.copy()
    elif br["kind"] == "json":
        fr = json_frame(o, br["a"])
    else:
        fr = stock_frame(stock(br), o, br)
    overlays(fr, o)
    draw_caption(fr, o)
    return fr


# ---------- sound ----------
SR = 48000


def load(path, ss=0, dur=None):
    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{ss:.3f}", "-i", path] + (["-t", f"{dur:.3f}"] if dur else []) + ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()


def mix(dst, bed_fn=None):
    """bed_fn(voice, N) -> music bed (N x 2), shaped against the voice"""
    N = round(TOTAL / FPS * SR)
    # voice: raw recording, only gain + a peak limiter (no denoise, no compressor), like the 1125 reel
    v = np.frombuffer(subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", os.path.join(S, "voice.wav"), "-af",
                                      "volume=8dB,alimiter=level_in=1:level_out=1:limit=0.89:attack=1:release=80:level=disabled",
                                      "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32).reshape(-1, 2)
    out = np.zeros((N, 2), np.float32)
    out[:min(N, len(v))] += v[:N]
    fx = np.zeros((N, 2), np.float32)
    for fn, at, g, ss, dur in SFX:
        a = load(os.path.join(AUD, fn), ss, dur) * 10 ** (g / 20)
        fl = min(len(a), int(.03 * SR)); a[-fl:] *= np.linspace(1, 0, fl)[:, None]
        if ss > 0:
            fi = min(len(a), int(.01 * SR)); a[:fi] *= np.linspace(0, 1, fi)[:, None]
        i = round(at * SR); j = min(N, i + len(a))
        fx[i:j] += a[:j - i]
    if bed_fn is not None:
        out += bed_fn(out.copy(), N)
    out += fx
    pk = np.abs(out).max()
    if pk > .97:
        out *= .97 / pk
    with wave.open(dst, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype(np.int16).tobytes())
    print("mix peak", round(20 * np.log10(np.abs(out).max()), 2), "dBFS")


def run(dst):
    wav = os.path.join(S, "mix.wav")
    mix(wav)
    p = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-i", BASE, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
                            "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "-vf", "scale=out_color_matrix=bt709",
                            "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", dst], stdin=subprocess.PIPE)
    readers = {}

    def stock(br):
        k = br["a"]
        if k not in readers:
            readers[k] = Stock(br["src"], br["ss"], br["b"] - br["a"])
        return readers[k].read()

    for o in range(TOTAL):
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3:
            break
        enc.stdin.write(compose(Image.frombuffer("RGB", (W, H), b), o, stock).tobytes())
        if o % 300 == 0:
            print("frame", o, flush=True)
    enc.stdin.close(); enc.wait(); p.stdout.close()
    print("done", dst)


def stills(ts, dst):
    ims = []
    for t in ts:
        o = round(t * FPS)
        raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{(o + .5) / FPS:.4f}", "-i", BASE, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                             capture_output=True, check=True).stdout

        def stock(br):
            st = Stock(br["src"], br["ss"] + (o - br["a"]) / FPS, 1)
            return st.read()
        ims.append(compose(Image.frombuffer("RGB", (W, H), raw), o, stock).resize((405, 720), Image.LANCZOS))
    g = Image.new("RGB", (405 * len(ims), 720))
    for k, im in enumerate(ims):
        g.paste(im, (405 * k, 0))
    g.save(dst)


if __name__ == "__main__":
    if sys.argv[1] == "--stills":
        stills([float(x) for x in sys.argv[2:]], os.path.join(S, "pv.png"))
    else:
        run(sys.argv[1])
