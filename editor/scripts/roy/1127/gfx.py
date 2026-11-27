"""Graphics: hook box, address bar, browser chrome, price tags, countdown banner, Roy-style captions."""
import json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = os.path.dirname(os.path.abspath(__file__))
FONTS = r"C:\Users\talha\AppData\Local\CapCut\Apps\6.5.0.2562\Resources\Font\SystemFont"
CAP_FONT = os.path.join(FONTS, "CapCutSansText-Bold.otf")
TITLE_FONT = os.path.join(FONTS, "en.ttf")          # the font of the 1125 hook box
UI_FONT = r"C:\Windows\Fonts\segoeui.ttf"
UI_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
MONO = r"C:\Windows\Fonts\consolab.ttf"
W, H = 1080, 1920
DOMAIN, PATH = "allbirds.com", "/products.json"     # domain is always drawn blurred

# ---------- captions: big, white, thick black border, centred on the ink ----------
CAP_PX, CAP_STROKE, CAP_Y, CAP_MAXW = 112, 10, .705, 980
_cf = {}


def capfont(px):
    if px not in _cf:
        _cf[px] = ImageFont.truetype(CAP_FONT, px)
    return _cf[px]


def caption(text):
    px = CAP_PX
    while capfont(px).getlength(text) + 2 * CAP_STROKE > CAP_MAXW and px > 70:
        px -= 4
    f, sw = capfont(px), max(6, round(CAP_STROKE * px / CAP_PX))
    pad = 40
    l, t, r, b = f.getbbox(text, stroke_width=sw)
    im = Image.new("RGBA", (r - l + 2 * pad, b - t + 2 * pad), (0, 0, 0, 0))
    org = (pad - l, pad - t)
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).text((org[0], org[1] + 6), text, font=f, fill=(0, 0, 0, 150), stroke_width=sw, stroke_fill=(0, 0, 0, 150))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(7)))
    ImageDraw.Draw(im).text(org, text, font=f, fill="white", stroke_width=sw, stroke_fill="black")
    a = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(a > 200)
    ink_cx, ink_cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2   # centre of the solid letters + border
    return im, ink_cx, ink_cy


# ---------- hook: Roy's black rounded box, two centred lines, lower case with one CAPS word, made big ----------
def hook_box(lines=("type THIS on any", "store website today"), px=92):
    k = 2
    f = ImageFont.truetype(TITLE_FONT, px * k)
    lh, padx, pady = int(px * 1.18 * k), 44 * k, 30 * k
    w = max(f.getlength(x) for x in lines) + 2 * padx
    h = lh * len(lines) + 2 * pady
    im = Image.new("RGBA", (int(w), int(h)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), 34 * k, fill=(0, 0, 0, 255))
    for j, x in enumerate(lines):
        d.text((im.width / 2, pady + lh * j + lh / 2), x, font=f, fill="white", anchor="mm")
    return im.resize((im.width // k, im.height // k), Image.LANCZOS)


def lock_icon(sz, col):
    k = 4
    im = Image.new("RGBA", (sz * k, sz * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = sz * k
    d.rounded_rectangle((s * .18, s * .45, s * .82, s * .95), s * .1, fill=col)
    d.arc((s * .3, s * .08, s * .7, s * .68), 180, 360, fill=col, width=int(s * .1))
    d.line((s * .3, s * .38, s * .3, s * .5), fill=col, width=int(s * .1))
    d.line((s * .7, s * .38, s * .7, s * .5), fill=col, width=int(s * .1))
    return im.resize((sz, sz), Image.LANCZOS)


def blurred_text(text, font, col, r=10):
    l, t, rr, b = font.getbbox(text)
    im = Image.new("RGBA", (rr + 40, b + 40), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((20, 20), text, font=font, fill=col)
    return im.filter(ImageFilter.GaussianBlur(r)), rr


def url_bar(typed, caret, w=900, h=112, px=46, bg=(255, 255, 255, 255), shadow=True):
    """address bar: lock, blurred domain, typed path. typed = number of PATH chars shown"""
    pad = 30
    im = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
    if shadow:
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((pad, pad + 8, pad + w, pad + h + 8), h / 2, fill=(0, 0, 0, 110))
        im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(14)))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((pad, pad, pad + w, pad + h), h / 2, fill=bg)
    f = ImageFont.truetype(UI_FONT, px)
    li = lock_icon(int(px * .78), (95, 99, 104, 255))
    x = pad + 42
    im.alpha_composite(li, (x, pad + (h - li.height) // 2))
    x += li.width + 22
    bt, bw = blurred_text(DOMAIN, f, (32, 33, 36, 255), 13)
    cy = pad + h / 2
    im.alpha_composite(bt, (int(x - 20), int(cy - 20 - f.getbbox("Ag")[3] / 2 - 4)))
    x += bw
    s = PATH[:typed]
    d.text((x, cy), s, font=f, fill=(32, 33, 36, 255), anchor="lm")
    x += f.getlength(s)
    if caret:
        d.rectangle((x + 3, cy - px * .55, x + 6, cy + px * .55), fill=(26, 115, 232, 255))
    return im


def browser_top(h=210):
    """mobile browser chrome drawn over the real page capture"""
    im = Image.new("RGBA", (W, h), (255, 255, 255, 255))
    bar = url_bar(len(PATH), False, w=W - 80, h=104, px=42, bg=(241, 243, 244, 255), shadow=False)
    im.alpha_composite(bar, (40 - 30, h - 104 - 26 - 30))
    ImageDraw.Draw(im).line((0, h - 1, W, h - 1), fill=(218, 220, 224, 255), width=2)
    return im


# ---------- price tags over the stock shots ----------
def tag(text, fg, bg, px=150, strike=False, outline=None):
    f = ImageFont.truetype(UI_BOLD, px)
    l, t, r, b = f.getbbox(text)
    padx, pady = int(px * .34), int(px * .16)
    w, h = r - l + 2 * padx, int(px * 1.02) + 2 * pady
    m = 40
    im = Image.new("RGBA", (w + 2 * m, h + 2 * m), (0, 0, 0, 0))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((m, m + 10, m + w, m + h + 10), h * .28, fill=(0, 0, 0, 140))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(16)))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((m, m, m + w, m + h), h * .28, fill=bg, outline=outline, width=6 if outline else 0)
    d.text((m + w / 2, m + h / 2), text, font=f, fill=fg, anchor="mm")
    if strike:
        d.line((m + padx * .6, m + h * .56, m + w - padx * .6, m + h * .44), fill=(229, 37, 37, 255), width=int(px * .09))
    return im


# ---------- countdown banner ----------
def countdown(hh, mm, ss, flash=0.0, w=960):
    k = 2
    h = 300
    im = Image.new("RGBA", ((w + 80) * k, (h + 80) * k), (0, 0, 0, 0))
    o = 40 * k
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((o, o + 14 * k, o + w * k, o + h * k + 14 * k), 40 * k, fill=(0, 0, 0, 150))
    im = Image.alpha_composite(im, sh.filter(ImageFilter.GaussianBlur(18 * k)))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((o, o, o + w * k, o + h * k), 40 * k, fill=(14, 14, 16, 255))
    f1 = ImageFont.truetype(UI_BOLD, 40 * k)
    d.text((o + w * k / 2, o + 62 * k), "BLACK FRIDAY SALE ENDS IN", font=f1, fill=(255, 255, 255, 255), anchor="mm")
    f2 = ImageFont.truetype(UI_BOLD, 118 * k)
    fl = ImageFont.truetype(UI_FONT, 26 * k)
    cells = [f"{hh:02d}", f"{mm:02d}", f"{ss:02d}"]
    cw, gap = 230 * k, 64 * k
    x0 = o + (w * k - (3 * cw + 2 * gap)) / 2
    red = (229, 37, 37, 255)
    for i, (c, lab) in enumerate(zip(cells, ["HRS", "MIN", "SEC"])):
        x = x0 + i * (cw + gap)
        d.rounded_rectangle((x, o + 108 * k, x + cw, o + 262 * k), 22 * k, fill=red)
        d.text((x + cw / 2, o + 178 * k), c, font=f2, fill="white", anchor="mm")
        d.text((x + cw / 2, o + 284 * k), lab, font=fl, fill=(200, 200, 205, 255), anchor="mm")
        if i < 2:
            d.text((x + cw + gap / 2, o + 178 * k), ":", font=f2, fill="white", anchor="mm")
    im = im.resize((im.width // k, im.height // k), Image.LANCZOS)
    if flash > 0:
        a = np.asarray(im).astype(np.float32)
        a[..., :3] = a[..., :3] * (1 - flash) + 255 * flash
        im = Image.fromarray(a.astype(np.uint8))
    return im


if __name__ == "__main__":
    g = Image.new("RGB", (W, H), (60, 70, 80))
    hb = hook_box(); g.paste(hb, ((W - hb.width) // 2, 130), hb)
    ub = url_bar(9, True); g.paste(ub, ((W - ub.width) // 2, 130 + hb.height - 6), ub)
    c, cx, cy = caption("onto the end"); g.paste(c, (round(W / 2 - cx), round(CAP_Y * H - cy)), c)
    t1 = tag("+$300", "white", (229, 37, 37, 255)); g.paste(t1, ((W - t1.width) // 2, 1500), t1)
    print("hook", hb.size, "url", ub.size)
    g.resize((540, 960)).save(os.path.join(S, "gfx_test.png"))
    g2 = Image.new("RGB", (W, H), (60, 70, 80))
    bt = browser_top(); g2.paste(bt, (0, 0), bt)
    cd = countdown(0, 0, 3); g2.paste(cd, ((W - cd.width) // 2, 300), cd)
    t2 = tag("$60", (20, 20, 20, 255), (255, 255, 255, 255), strike=True); g2.paste(t2, (120, 900), t2)
    t3 = tag("$120", "white", (229, 37, 37, 255), px=170); g2.paste(t3, (520, 880), t3)
    c, cx, cy = caption("sabotaging researchers"); g2.paste(c, (round(W / 2 - cx), round(CAP_Y * H - cy)), c)
    g2.resize((540, 960)).save(os.path.join(S, "gfx_test2.png"))
