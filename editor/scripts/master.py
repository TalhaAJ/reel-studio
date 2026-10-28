"""Final loudness pass: bring the rendered mix to -14 LUFS (Instagram/TikTok target) with a clean linear gain.

usage: python master.py <in.mp4> <out.mp4>
"""
import json, subprocess, sys

FF = r"C:\Users\talha\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
src, dst = sys.argv[1], sys.argv[2]
stats = subprocess.run([FF, "-hide_banner", "-i", src, "-vn", "-af", "loudnorm=I=-14:TP=-1:LRA=11:print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(stats[stats.rindex("{"):stats.rindex("}") + 1])
af = (f"loudnorm=I=-14:TP=-1:LRA=11:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
      f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
subprocess.run([FF, "-v", "error", "-y", "-i", src, "-c:v", "copy", "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "256k",
                "-movflags", "+faststart", dst], check=True)
print(f"input {m['input_i']} LUFS -> -14 LUFS: {dst}")
