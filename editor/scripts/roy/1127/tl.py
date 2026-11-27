"""Output timeline: every kept word with its time in the cut (seconds)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plate import SEGS, FPS, frames_of
S = os.path.dirname(os.path.abspath(__file__))
FR = frames_of()
TOTAL = FR[-1][2] + FR[-1][3]
RAW = json.load(open(os.path.join(S, "words.json"), encoding="utf-8"))
# fixes from the re-listen: 2942 is the second take; 2944's first "$60" is dropped by the cut
FIX = {("2942", "larp"): "larp", ("2942", "actual"): "actually"}


def to_out(take, t):
    for tk, a, n, o in FR:
        if tk == take and a - .02 <= t <= a + n / FPS + .02:
            return (o + (t - a) * FPS) / FPS
    return None


def words():
    out = []
    for take, W in RAW.items():
        for w in W:
            m = (w["s"] + w["e"]) / 2
            if take == "2942" and m < 8.1:
                continue
            o = to_out(take, max(w["s"], m - .15)) if to_out(take, m) is not None else None
            if o is None:
                continue
            out.append(dict(w=FIX.get((take, w["w"].strip(".,")), w["w"]), s=o, take=take, src=w["s"]))
    out.sort(key=lambda x: x["s"])
    return out


if __name__ == "__main__":
    print("total", TOTAL / FPS)
    for tk, a, n, o in FR:
        print(f"{tk} {a:6.2f}+{n / FPS:5.2f}s -> out {o / FPS:6.2f}")
    print(" ".join(f"{w['w']}@{w['s']:.2f}" for w in words()))
