"""Arrange Talha's soundtrack under the voice: hits on cuts, a swell through each shot, full drop-outs under the punchlines."""
import os, subprocess, sys, wave
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan import S, FPS, TOTAL, shots

SR = 48000
T = TOTAL / FPS
N = round(T * SR)


def rd(fn):
    w = wave.open(os.path.join(S, fn)); a = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, w.getnchannels()).astype(np.float32) / 32768
    return np.repeat(a, 2, 1) if a.shape[1] == 1 else a


def wr(fn, a):
    w = wave.open(fn, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()


def smooth(x, sec):
    n = max(int(sec * SR), 1); c = np.cumsum(np.pad(x, (n // 2 + 1, n - n // 2), mode="edge")); return (c[n:] - c[:-n])[:len(x)] / n


M = rd("music_src.wav")
# (out start, out end, source start): every jump in the source is hidden behind a drop-out
PARTS = [(0.0, 4.80, 0.30), (5.93, 24.60, 6.57), (26.43, 35.15, 30.55), (36.17, 43.60, 39.93), (45.00, 49.05, 46.38), (50.03, T, 12.52)]
bed = np.zeros((N, 2), np.float32)
for a, b, s in PARTS:
    i, j = round(a * SR), min(round(b * SR), N); n = j - i; seg = M[round(s * SR):round(s * SR) + n].copy(); n = len(seg)
    env = np.sqrt(smooth((seg ** 2).mean(1), 3.0)); env = np.maximum(env, 10 ** (-33 / 20))
    seg *= (10 ** (-26 / 20) / env)[:, None]                          # even out the slow level; the hits stay
    f = int(.008 * SR); seg[:f] *= np.linspace(0, 1, f)[:, None]
    bed[i:i + n] += seg
k = M[round(12.52 * SR):round(13.9 * SR)].copy(); k *= np.linspace(1, 0, len(k))[:, None] ** 1.5   # the track's own big hit, for frame one
bed[:len(k)] += k * 10 ** (-9 / 20)

OFF = -90
# keyframes: time, target level in dB relative to the -26 dB bed (0 = -26 dBFS)
K = [(0, 4), (.7, -3), (2.14, 2), (2.17, -8), (4.60, 3.5), (4.70, OFF), (5.90, OFF),
     (5.93, 4), (7.2, -4), (9.50, 1.5), (9.53, -8), (11.20, 1), (11.23, -5), (11.93, 3), (12.0, 4), (12.86, -2),
     (12.90, -17), (15.70, 3), (15.73, 4.5), (17.0, -3), (17.79, 0), (17.83, -15), (19.93, 1), (19.97, 4.5), (21.3, -3), (22.53, 1), (22.57, -7), (24.44, 4.5), (24.50, OFF), (26.41, OFF),
     (26.43, 5), (27.89, -1), (27.93, -8), (30.80, 3), (30.83, 5), (32.29, -2), (32.33, -7), (34.98, 4.5), (35.05, OFF), (36.15, OFF),
     (36.17, 5), (37.3, -2), (38.29, 2), (38.33, 5), (40.0, -4), (42.16, 1), (42.20, -6), (43.45, 5), (43.51, OFF), (44.98, OFF),
     (45.00, 6), (46.4, 0), (47.06, 1), (47.10, -3), (48.92, 6), (48.98, OFF), (50.01, OFF), (50.03, 6), (50.7, 1), (T - .02, -30), (T, OFF)]
t = np.arange(N) / SR
g = 10 ** (np.interp(t, *zip(*K)) / 20)
g = np.where(np.interp(t, *zip(*K)) < -60, 0, g); g = smooth(g, .012)
bed *= g[:, None]
# voice: same raw recording and +7.5 dB as v2, peaks held a little lower to leave room for the music
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", os.path.join(S, "voice.wav"), "-af", "volume=7.5dB,alimiter=level_in=1:level_out=1:limit=0.708:attack=2:release=30:level=disabled", os.path.join(S, "voice_v3.wav")], check=True)
v = rd("voice_v3.wav"); cut = np.zeros((N, 2), np.float32); f = int(.006 * SR)
for s in shots:
    x = v[round(s["src"] / FPS * SR):round((s["src"] + s["n"]) / FPS * SR)].copy(); x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
    i = round(s["out"] / FPS * SR); cut[i:i + len(x)] += x[:N - i]
# ceiling tied to the voice: while he talks the music stays at least 6 dB under him, and never above -20.5 dBFS
vr = np.sqrt(smooth((cut ** 2).mean(1), .40))
CEIL = np.clip(vr * 10 ** (-6 / 20), 10 ** (-27 / 20), 10 ** (-20.5 / 20))
for _ in range(2):
    r = np.sqrt(smooth((bed ** 2).mean(1), .10)); bed *= smooth(np.minimum(1, CEIL / np.maximum(r, 1e-6)), .03)[:, None]
OUT = os.path.join(S, "music_bed.wav"); wr(OUT, bed)
wr(os.path.join(S, "voice_cut_v3.wav"), cut); wr(os.path.join(S, "mix_v3_raw.wav"), cut + bed)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", os.path.join(S, "mix_v3_raw.wav"), "-af", "alimiter=level_in=1:level_out=1:limit=0.891:attack=2:release=40:level=disabled", os.path.join(S, "mix_v3.wav")], check=True)

# how far the voice sits above the music, in 0.4 s windows where he is talking
w = int(.4 * SR); V, B, D = [], [], []
for i in range(0, N - w, w // 2):
    a = 20 * np.log10(np.sqrt((cut[i:i + w] ** 2).mean()) + 1e-9); b = 20 * np.log10(np.sqrt((bed[i:i + w] ** 2).mean()) + 1e-9)
    if a > -30: V.append(a); B.append(b); D.append((a - b, i / SR))
d = np.array([x[0] for x in D]); on = np.array(B) > -60
print("voice median", round(float(np.median(V)), 1), "music min/median/max", round(float(np.min(np.array(B)[on])), 1), round(float(np.median(np.array(B)[on])), 1), round(float(np.max(B)), 1))
print("voice above music: worst", sorted((round(float(a), 1), round(b, 1)) for a, b in D)[:6], "| median (music on)", round(float(np.median(d[on])), 1), "| windows under 5 dB:", int((d < 5).sum()), "of", len(d), "| music silent:", round((~on).mean() * 100), "%")
print("raw mix peak", round(float(np.abs(cut + bed).max()), 2))
lv = [20 * np.log10(np.sqrt((bed[i:i + SR // 4] ** 2).mean()) + 1e-5) for i in range(0, N - SR // 4, SR // 4)]
print("music level each 0.25 s:", " ".join("." if x < -70 else f"{x:.0f}" for x in lv))
