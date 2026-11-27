"""Re-mix the sound (voice +8.5 dB), put it on the rendered video without re-encoding the picture, then make the phone copy."""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render import mix, S
OUT = r"C:\Users\talha\Downloads\Roy lee video script\1127 edit"
src = os.path.join(OUT, "1127 products json - v1.mp4")
tmp = os.path.join(S, "v1_video.mp4")
os.replace(src, tmp)
wav = os.path.join(S, "mix.wav")
mix(wav)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", tmp, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", src], check=True)
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", src, "-vf", "scale=720:1280:flags=lanczos", "-c:v", "libx264", "-crf", "21", "-preset", "slow", "-maxrate", "2M", "-bufsize", "4M",
                "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", os.path.join(OUT, "1127 products json - v1 (phone).mp4")], check=True)
print("ok")
