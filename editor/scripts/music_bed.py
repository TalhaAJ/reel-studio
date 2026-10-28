"""Prepare the music bed for a reel (see styles/sound-design.md).

- starts the track at MUSIC_FROM (skips the intro)
- hook is low-passed ("muffled") and opens up to full brightness on the first layout switch
- writes public/audio/music_bed.wav; level automation (ducking, swells, build, drop-out) happens in Reel.tsx
"""
import json, os, subprocess

FF = r"C:\Users\talha\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe"
PUB = r"C:\AI Video Editing\editor\public"
TRACK = os.path.join(PUB, r"audio\music_digital_clouds.mp3")
MUSIC_FROM = 28.5   # seconds into the track: lands on the fuller section
OPEN_TIME = 0.35    # how long the filter takes to open

caps = json.load(open(os.path.join(PUB, "captions.json")))
total = json.load(open(os.path.join(PUB, "cuts.json")))["total"]
hook_end = next(c["s"] for c in caps if c["beat"] == "name") - 0.05

# muffled and full versions crossfaded with time-based gains
af = (f"[0]atrim=start={MUSIC_FROM}:duration={total + 1},asetpts=PTS-STARTPTS,asplit=2[a][b];"
      f"[a]lowpass=f=700,lowpass=f=700,volume='if(lt(t,{hook_end}),1,max(0,1-(t-{hook_end})/{OPEN_TIME}))':eval=frame,volume=1.25[m];"
      f"[b]volume='if(lt(t,{hook_end}),0,min(1,(t-{hook_end})/{OPEN_TIME}))':eval=frame[f];"
      f"[m][f]amix=inputs=2:normalize=0[o]")
subprocess.run([FF, "-v", "error", "-y", "-i", TRACK, "-filter_complex", af, "-map", "[o]", "-ar", "48000",
                os.path.join(PUB, r"audio\music_bed.wav")], check=True)
print(f"music_bed.wav: {total:.2f}s, muffled until {hook_end:.2f}s")
