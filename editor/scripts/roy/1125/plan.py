"""One plan for the Roy-style cut: shots (with punch-ins), captions, hook box, overlays. Times in, everything snapped to 30 fps frames."""
import json, os
from PIL import Image, ImageDraw, ImageFont

S = os.path.dirname(os.path.abspath(__file__))
OUT = r"C:\Users\talha\Downloads\Roy lee video script\1125 edit"
IMG = r"C:\Users\talha\AppData\Local\Temp\claude\108bc052c3096a0d\fe3fb1e1-add8-430f-965d-7288e75f8b8e\images"
FONTS = r"C:\Users\talha\AppData\Local\CapCut\Apps\6.5.0.2562\Resources\Font\SystemFont"
CAP_FONT, TITLE_FONT = os.path.join(FONTS, "CapCutSansText-Bold.otf"), os.path.join(FONTS, "en.ttf")
FPS, W, H = 30, 1080, 1920
PUNCH = 1.10                # Roy: hard cut to 110 %, centred, no drift
CAP_PX, CAP_Y, CAP_Y_TWEET, CAP_Y_BLOCK = 82, .760, .676, .648
f = lambda t: round(t * FPS)

# base.mp4 ranges to keep (pauses removed between them) and the zoom for each shot
SHOTS = [
 (0.00, 2.17, 1), (2.17, 4.72, 1), (4.80, 6.00, PUNCH), (6.11, 9.69, 1), (9.78, 11.46, 1), (11.76, 12.52, 1), (12.68, 13.56, 1),
 (13.74, 16.57, 1), (16.57, 18.68, PUNCH), (18.77, 20.90, 1), (20.90, 23.50, PUNCH), (23.50, 25.47, 1), (25.67, 29.08, PUNCH),
 (29.19, 32.11, 1), (32.33, 33.82, PUNCH), (33.98, 36.69, 1), (36.79, 40.07, 1), (40.07, 43.93, PUNCH), (43.93, 45.27, 1),
 (45.27, 46.74, PUNCH), (46.82, 48.92, 1), (49.12, 51.03, 1), (51.03, 52.07, PUNCH), (52.07, 53.30, 1)]

shots, t = [], 0
for a, b, z in SHOTS:
    a, b = f(a), f(b)
    shots.append(dict(src=a, n=b - a, out=t, z=z))
    t += b - a
TOTAL = t

def to_out(sec):
    """base time -> output frame (times inside a removed pause snap to the next shot)"""
    x = f(sec)
    for s in shots:
        if x < s["src"]:
            return s["out"]
        if x < s["src"] + s["n"]:
            return s["out"] + x - s["src"]
    return TOTAL

# captions: what was said, in Roy's 1-4 word lower-case chunks. Each chunk = (text, number of transcript words it covers)
CH = [("I've seen", 2), ("greedy demons", 2), ("in tech before", 3), ("but Anthropic's", 2), ("streak of", 2), ("sabotaging researchers", 2), ("is genuinely crazy", 3),
 ("if you tried", 3), ("doing serious", 2), ("AI research", 2), ("on Fable 5.5", 4), ("it wouldn't even", 3), ("reject your prompts", 3), ("or tell you", 3), ("it's against", 2), ("the rules", 2),
 ("instead", 1), ("it would quietly", 3), ("downgrade", 1), ("your answers", 2), ("to an older model", 4), ("while pretending", 2), ("you were still", 3), ("using the flagship", 3),
 ("think about", 2), ("what that actually", 3), ("does to someone", 3), ("you're paying for", 3), ("the best model", 3), ("to give you", 3), ("the best answers", 2), ("but when", 2),
 ("your results", 2), ("keep coming", 2), ("back mid", 2), ("you have no clue", 4), ("the model", 2), ("is feeding you", 3), ("sh*t answers", 2), ("on purpose", 2),
 ("if Anthropic", 2), ("doesn't want", 2), ("people doing", 2), ("AI research", 2), ("on Claude", 2), ("just put up", 3), ("a refusal screen", 3), ("and own it", 3), ("so nobody", 2),
 ("wastes weeks", 2), ("chasing dead ends", 3), ("and the worst", 3), ("part is", 2), ("when people", 2), ("actually caught them", 3), ("in this treachery", 3), ("Anthropic came out", 3),
 ("larping like", 2), ("invisible guardrails", 2), ("were some", 2), ("noble features", 2), ("there to protect", 3), ("people", 1), ("you're not", 2), ("protecting humanity", 2),
 ("you're just", 2), ("gatekeeping", 1), ("breakthrough research", 2), ("so people outside", 3), ("can't catch up", 3), ("to you", 2), ("this is", 2), ("actually crazy", 2), ("follow me", 2), ("for more updates", 3)]
WORDS = json.load(open(os.path.join(S, "tl_words.json"), encoding="utf-8"))
assert sum(n for _, n in CH) == len(WORDS), (sum(n for _, n in CH), len(WORDS))

OV = dict(title=(0, to_out(4.80)), block=(0, to_out(2.17)), tweet=(to_out(2.17), to_out(6.11)))
caps, i = [], 0
for txt, n in CH:
    caps.append([to_out(WORDS[i]["s"]), None, txt])
    i += n
for k, c in enumerate(caps):
    c[1] = caps[k + 1][0] if k + 1 < len(caps) else TOTAL
for k, c in enumerate(caps):          # never shorter than 6 frames
    if c[1] - c[0] < 6 and k + 1 < len(caps):
        c[1] = c[0] + 6; caps[k + 1][0] = c[1]
def ypos(a, b):
    m = (a + b) / 2
    return CAP_Y_TWEET if OV["tweet"][0] <= m < OV["tweet"][1] else CAP_Y_BLOCK if OV["block"][0] <= m < OV["block"][1] else CAP_Y
caps = [dict(s=a, e=b, text=x, y=ypos(a, b)) for a, b, x in caps]


def rounded(im, r):
    m = Image.new("L", (im.width * 2, im.height * 2), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width * 2 - 1, im.height * 2 - 1), r * 2, fill=255)
    im = im.convert("RGBA"); im.putalpha(m.resize(im.size, Image.LANCZOS))
    return im

def assets():
    os.makedirs(OUT, exist_ok=True)
    # hook box, Roy's shape: black rounded box, two centred lines, lower case with one CAPS word
    k = 2; font = ImageFont.truetype(TITLE_FONT, 60 * k); L = ["how anthropic is actually", "COCKBLOCKING researchers"]
    w = max(font.getlength(x) for x in L) + 2 * 40 * k; lh = 70 * k; h = lh * 2 + 2 * 27 * k
    im = Image.new("RGBA", (int(w), int(h)), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), 32 * k, fill=(0, 0, 0, 255))
    for j, x in enumerate(L):
        d.text((im.width / 2, 27 * k + lh * j + lh / 2), x, font=font, fill="white", anchor="mm")
    im.save(os.path.join(OUT, "hook box v2.png"))
    tw = Image.open(os.path.join(IMG, "3.png")).convert("RGB"); tw = tw.crop((0, 0, 592, 212)); tw = tw.resize((tw.width * 2, tw.height * 2), Image.LANCZOS)
    rounded(tw, 40).save(os.path.join(OUT, "x post - yacineMTB.png"))
    bl = Image.open(os.path.join(IMG, "1.webp")).convert("RGB").crop((0, 60, 600, 430)); bl = bl.resize((bl.width * 2, bl.height * 2), Image.LANCZOS)
    rounded(bl, 44).save(os.path.join(OUT, "block picture.png"))

# name, width on canvas, centre y (fraction)
LAY = dict(title=("hook box v2.png", None, .226), tweet=("x post - yacineMTB.png", 930, .792), block=("block picture.png", 680, .788))
def place(n):
    fn, w, yc = LAY[n]; im = Image.open(os.path.join(OUT, fn)); w = w or im.width / 2; return fn, im, w, w * im.height / im.width, yc

if __name__ == "__main__":
    assets()
    print("total", TOTAL, "frames", round(TOTAL / FPS, 2), "s | shots", len(shots), "punch-ins", sum(s["z"] != 1 for s in shots), "avg shot", round(TOTAL / FPS / len(shots), 2))
    print("overlays", {k: (round(a / FPS, 2), round(b / FPS, 2)) for k, (a, b) in OV.items()}, "| captions", len(caps))
    print("short caps", [(c["text"], c["e"] - c["s"]) for c in caps if c["e"] - c["s"] < 8])
    for n in LAY: fn, im, w, h, yc = place(n); print(n, im.size, "->", round(w), round(h), "y", round(yc * H - h / 2), "-", round(yc * H + h / 2))
