"""v2: Talha's instrumental (from his OBS recording) under the 1127 reel. It opens on the track's own hit, plays under the
voice with the voice always on top, drops out dry on four punchlines and slams back in, tape-stops on the countdown reset,
and fades out where his recording was cut off. The picture is v1's, copied without re-encoding."""
import os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render import mix, S, SR, TOTAL, FPS

SRC = r"C:\Users\talha\Videos\2026-11-27 18-37-02.mp4"
T0 = 2.592                       # first sample of music in his recording (it starts on a hit)
OUT = r"C:\Users\talha\Downloads\Roy lee video script\1127 edit"
# where the music plays on the reel (s). The source keeps its place through each gap, so nothing is skipped.
PLAY = [(0.00, 8.43), (8.73, 36.18), (37.03, 45.62), (46.44, 51.10), (51.57, None)]
TAPESTOP = (45.22, 45.62)        # the music winds down as the timer resets
FADE_END = 59.70


def smooth(x, sec):
    n = max(int(sec * SR), 1)
    c = np.cumsum(np.pad(x, (n // 2 + 1, n - n // 2), mode="edge"))
    return (c[n:] - c[:-n])[:len(x)] / n


def bed(voice, N):
    m = np.frombuffer(subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-ss", f"{T0:.4f}", "-i", SRC, "-vn", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                                     capture_output=True, check=True).stdout, np.float32).reshape(-1, 2)
    b = np.zeros((N, 2), np.float32)
    p = 0                                                     # source position (samples)
    for a, e in PLAY:
        i, j = round(a * SR), (N if e is None else round(e * SR))
        if (a, e) == (37.03, 45.62):                          # normal play, then a tape-stop
            k = round(TAPESTOP[0] * SR)
            n = min(k - i, len(m) - p); b[i:i + n] = m[p:p + n]; p += n
            L = j - k
            rate = (1 - np.linspace(0, 1, L)) ** 1.6
            pos = p + np.cumsum(rate)
            seg = np.stack([np.interp(pos, np.arange(len(m)), m[:, c]) for c in (0, 1)], 1) * np.sqrt(rate)[:, None]
            b[k:j] = seg; p = int(pos[-1]) + 1
        else:
            n = min(j - i, len(m) - p); b[i:i + n] = m[p:p + n]; p += n
            fo = int(.02 * SR); b[i + n - fo:i + n] *= np.linspace(1, 0, fo)[:, None]
            fi = int(.004 * SR); b[i:i + fi] *= np.linspace(0, 1, fi)[:, None]
    print("music used", round(p / SR, 2), "s of", round(len(m) / SR, 2))
    t = np.arange(N) / SR
    # even out the track's slow level (keep about a third of its own build), on a target curve that lifts for the ending
    env = np.sqrt(smooth((b ** 2).mean(1), 3.0)); env = np.maximum(env, 10 ** (-40 / 20))
    tgt = 10 ** (np.interp(t, [0, 4.3, 4.4, 50, 51.6, 59], [-26, -26, -29, -28, -26, -26]) / 20)
    on = (np.abs(b).max(1) > 1e-5).astype(np.float32)
    b *= ((tgt / env) ** .7 * on)[:, None]
    # every slam back in hits a bit harder, then settles
    acc = np.ones(N, np.float32)
    for r in (8.73, 37.03, 46.44, 51.57):
        x = t - r; acc *= 1 + np.where((x >= 0) & (x < .7), (10 ** (3.5 / 20) - 1) * (1 - x / .7) ** 2, 0)
    b *= acc[:, None]
    # the voice stays on top: while he talks the music sits at least 10 dB under him, never above -22 dBFS
    vr = np.sqrt(smooth((voice ** 2).mean(1), .40))
    ceil = np.clip(vr * 10 ** (-10 / 20), 10 ** (-31 / 20), 10 ** (-22 / 20))
    for _ in range(2):
        r = np.sqrt(smooth((b ** 2).mean(1), .10))
        b *= smooth(np.minimum(1, ceil / np.maximum(r, 1e-6)), .03)[:, None]
    end = min(N, round(p / SR * SR))
    g = np.interp(t, [FADE_END, end / SR], [1, 0]); g[t < FADE_END] = 1
    b *= g[:, None]
    vm = np.sqrt(smooth((voice ** 2).mean(1), 1.0)); bm = np.sqrt(smooth((b ** 2).mean(1), 1.0))
    talk = vm > 10 ** (-30 / 20)
    print("voice above music while talking: median", round(float(np.median(20 * np.log10(vm[talk] / np.maximum(bm[talk], 1e-6)))), 1), "dB")
    import wave
    with wave.open(os.path.join(OUT, "music bed v2.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(b, -1, 1) * 32767).astype(np.int16).tobytes())
    return b


if __name__ == "__main__":
    wav = os.path.join(S, "mix_v2.wav")
    mix(wav, bed)
    v1 = os.path.join(OUT, "1127 products json - v1.mp4")
    v2 = os.path.join(OUT, "1127 products json - v2.mp4")
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", v1, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", v2], check=True)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", v2, "-vf", "scale=720:1280:flags=lanczos", "-c:v", "libx264", "-crf", "21", "-preset", "slow", "-maxrate", "2M", "-bufsize", "4M",
                    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", os.path.join(OUT, "1127 products json - v2 (phone).mp4")], check=True)
    print("ok")
