"""The whole edit on the cut timeline (base.mp4 frame i = output frame i): shots + punch-ins, full-screen b-roll,
overlays, captions and sound effects. Times are seconds on the cut; everything is snapped to 30 fps frames."""
import json, os

S = os.path.dirname(os.path.abspath(__file__))
FPS, W, H = 30, 1080, 1920
TOTAL = 1821
f = lambda t: min(round(t * FPS), TOTAL)
PUNCH = 1.10                      # Roy: hard cut to 110 %, centred, no drift

# (start, zoom): each shot runs to the next one's start. Every jump cut changes the zoom.
SHOTS = [(0.00, 1), (4.33, PUNCH), (8.73, 1), (15.43, 1), (17.46, PUNCH), (19.27, 1), (20.63, 1), (23.50, PUNCH),
         (26.47, 1), (31.20, PUNCH), (33.83, 1), (36.23, PUNCH), (37.03, 1), (39.62, 1), (41.10, PUNCH), (44.30, 1),
         (45.50, PUNCH), (46.44, 1), (49.43, PUNCH), (51.13, 1), (51.57, PUNCH), (56.10, 1), (59.37, PUNCH)]
shots = [dict(a=f(a), b=f(SHOTS[i + 1][0]) if i + 1 < len(SHOTS) else TOTAL, z=z) for i, (a, z) in enumerate(SHOTS)]

ST = r"C:\Users\talha\AppData\Local\Temp\claude\bdcbdb3d50d2fb87\33458b2d-dc1b-4fb9-834e-97ce4f91af89\scratchpad\stock_dl\hd"
# full-screen b-roll: (start, end, kind, source, source start s)
BROLL = [
    dict(a=f(8.73), b=f(15.43), kind="json"),                                              # the real /products.json dump
    dict(a=f(20.63), b=f(23.50), kind="stock", src=os.path.join(ST, "5924999.mp4"), ss=1.0),  # sale tag: "jacking prices up right before the sale"
    dict(a=f(28.75), b=f(31.20), kind="stock", src=os.path.join(ST, "8937985.mp4"), ss=2.0),  # laptop: "hiking a Lenovo laptop by 300 bucks"
    dict(a=f(37.03), b=f(39.62), kind="stock", src=os.path.join(ST, "8738548.mp4"), ss=3.0),  # sneakers: "$60 New Balances straight to $120"
    dict(a=f(42.55), b=f(44.30), kind="stock", src=os.path.join(ST, "7534961.mp4"), ss=2.0),  # panic buying
]
# overlays: name, start, end
OV = dict(hook=(0, f(4.33)), url=(0, f(4.33)), t300=(f(30.34), f(31.20)), t60=(f(37.03), f(39.62)), t120=(f(39.22), f(39.62)),
          clock=(f(44.30), f(46.44)))
TYPE_A, TYPE_B = 0.60, 1.50        # "/products.json" typed while he says "products.json"
STRIKE = 38.54                     # $60 gets struck on "straight"
CLOCK = [(44.30, (0, 0, 3)), (44.75, (0, 0, 2)), (45.20, (0, 0, 1)), (45.55, (0, 0, 0)), (45.66, (23, 59, 59)), (46.35, (23, 59, 58))]
JSON_T = dict(scroll=(0.25, 2.95), zoom=(3.03, 3.40), hl_price=13.44, hl_compare=14.60)   # zoom local s, highlights cut s

# captions: (text, number of transcript words it covers) - Roy's 1-4 word chunks, his words (whisper's mishearings fixed)
CH = [("if you type", 3), ("products.json", 2), ("onto the end", 3), ("of any big", 3), ("Shopify store today", 3),
      ("you can literally", 3), ("catch them", 2), ("scamming you", 2), ("for Black Friday deals", 4), ("inside their own code", 4),
      ("it dumps their", 3), ("entire backend", 2), ("catalogue out", 2), ("in plain text", 3), ("where some brands", 3), ("leave their", 2),
      ("upcoming sale prices", 3), ("sitting days early", 3),
      ("and pairing that", 3), ("with a basic", 3), ("price tracker", 2), ("exposes how", 2), ("diabolical", 1), ("Black Friday", 2), ("really is", 2),
      ("brands love", 2), ("quietly jacking", 2), ("prices up", 2), ("right before the sale", 4), ("just to larp", 3), ("like you're getting", 3),
      ("an actually", 2), ("crazy price", 2),
      ("people tracking", 2), ("Best Buy", 2), ("reportedly caught them", 3), ("hiking a", 2), ("Lenovo laptop", 2), ("by 300 bucks", 3),
      ("days earlier", 2), ("just to slap", 3), ("a fake discount", 3), ("on it", 2),
      ("Foot Locker", 1), ("allegedly", 1), ("went even crazier", 3), ("and doubled", 2), ("$60 New Balances", 3), ("straight to $120", 3),
      ("for their", 2), ("Black Friday page", 3),
      ("you only", 2), ("fall for it", 3), ("because they", 2), ("gaslight you", 2), ("into panic buying", 3), ("with fake", 2),
      ("countdown timers", 2), ("that reset at zero", 4), ("or selling fast", 3), ("banners", 1), ("on sites whose", 3), ("own JSON code", 3),
      ("still shows", 2), ("hundreds left", 2), ("in stock", 2),
      ("worse", 1), ("brands like", 2), ("Gymshark", 1), ("have even buried", 3), ("their biggest", 2), ("discounts", 1), ("on unlinked", 2),
      ("hidden pages", 2), ("because they know", 3), ("you'll buy", 2), ("the worst", 2), ("home page deals", 3), ("anyway", 1),
      ("follow me", 2), ("for more tech videos", 4)]
WORDS = json.load(open(os.path.join(S, "cut_words.json"), encoding="utf-8"))
assert sum(n for _, n in CH) == len(WORDS), (sum(n for _, n in CH), len(WORDS))
caps, i = [], 0
for txt, n in CH:
    caps.append([max(0, f(WORDS[i]["s"]) - 1), None, txt])     # one frame early reads as on time
    i += n
for k, c in enumerate(caps):
    c[1] = caps[k + 1][0] if k + 1 < len(caps) else TOTAL
for k, c in enumerate(caps):                                    # never shorter than 6 frames
    if c[1] - c[0] < 6 and k + 1 < len(caps):
        c[1] = c[0] + 6; caps[k + 1][0] = c[1]
caps = [dict(s=a, e=b, text=x) for a, b, x in caps]

AUD = r"C:\AI Video Editing\editor\public\audio"
# sound effects: file, cut time it starts, gain dB, trim start s, length s (None = whole). Each b-roll has its own sounds.
SFX = [
    ("pop_dry.mp3", 0.00, -6, 0, None),                 # hook: address bar pops in
    ("typing_soft.mp3", TYPE_A - .02, -6, 2.0, 0.95),     # hook: "/products.json" typed
    ("whoosh_fast.mp3", 8.73 - .75, -11, 0, None),        # into the JSON dump (whoosh ends on the cut)
    ("select_click.mp3", JSON_T["hl_price"], -10, 0, None),
    ("select_click.mp3", JSON_T["hl_compare"], -12, 0, None),
    ("zoom_air.mp3", 20.63 - .42, -12, 0, None),          # into the sale tag
    ("sweep.mp3", 28.75 - .22, -13, 0, None),             # into the laptop
    ("ding.mp3", 30.34, -15, 0, None),                    # +$300
    ("pop_whoosh.mp3", 37.03 - .06, -12, 0, None),        # into the sneakers, $60 tag
    ("impact_whoosh.mp3", 39.22 - .45, -15, 0, 1.6),      # $120 slams in
    ("riser_short.mp3", 44.30 - 1.75, -15, 4.55, 1.75),   # panic buying builds into the timer
    ("ui_click.mp3", 44.75, -6, 0, None), ("ui_click.mp3", 45.20, -6, 0, None), ("ui_click.mp3", 45.55, -5, 0, None),
    ("rewind_fast.mp3", 45.62, -15, 0.05, 0.95),          # the timer resets
]
