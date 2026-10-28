"""Find where a reference clip (the reel you react to) plays inside your phone recording, by audio.

Your phone hears the reel through the speakers, so cross-correlating the reel's clean audio against the
phone audio gives the exact offset. Also reports where the reel's sound stops in the room (your pause).
  python sync_reel.py <phone.MOV> <reel.mp4>
"""
import subprocess, sys
import numpy as np

FF = r"C:\Users\talha\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
SR = 8000
dec = lambda p: np.frombuffer(subprocess.run([FF, "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                             capture_output=True).stdout, np.float32).astype(np.float64)
phone, reel = dec(sys.argv[1]), dec(sys.argv[2])

def whiten(x):  # flatten the spectrum so room colouring and level don't matter
    X = np.fft.rfft(x, n=1 << int(np.ceil(np.log2(len(x) * 2))))
    return X / (np.abs(X) + 1e-9)
n = 1 << int(np.ceil(np.log2(len(phone) + len(reel))))
P = np.fft.rfft(phone - phone.mean(), n); R = np.fft.rfft(reel - reel.mean(), n)
cc = np.fft.irfft(P * np.conj(R) / (np.abs(P * np.conj(R)) + 1e-9), n)  # PHAT-weighted cross-correlation
lag = int(np.argmax(cc[: len(phone)]))
peak = cc[lag] / (np.sort(cc[: len(phone)])[-50:-1].mean() + 1e-12)
print(f"reel starts at {lag / SR:.3f}s in the phone recording (peak/sidelobe {peak:.1f})")

# where does the reel stop being heard? compare short-window correlation along the reel
win = int(0.5 * SR)
last = 0.0
for t in np.arange(0, len(reel) / SR - 0.5, 0.25):
    a = reel[int(t * SR): int(t * SR) + win]; b = phone[lag + int(t * SR): lag + int(t * SR) + win]
    if len(b) < win: break
    r = np.corrcoef(a, b)[0, 1]
    if r > 0.25: last = t + 0.5
print(f"reel audible in the room until reel time ~{last:.2f}s (= phone {lag / SR + last:.2f}s)")
