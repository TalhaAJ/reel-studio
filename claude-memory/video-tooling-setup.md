---
name: video-tooling-setup
description: "Where ffmpeg lives on the user's Windows machine and known quirks with faster-whisper/PyAV"
metadata:
  node_type: memory
  type: reference
  originSessionId: e04e02be-77ba-45bd-add8-5db7e51921ab
  modified: 2026-10-28T14:20:05.145Z
---

- ffmpeg 9.0.2 installed via winget but not on Git Bash PATH. Prepend: /c/Users/talha/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin
- ffmpeg drawtext segfaults without an explicit fontfile (no fontconfig). Pass a Windows font path.
- faster-whisper installed (Python 3.12), but its PyAV decode breaks (`metadata_errors` TypeError). Decode audio with ffmpeg to 16 kHz mono f32le and pass a numpy array instead.
- Pillow installed.

Related: [[reel-style-project]]
