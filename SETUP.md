# Setting up reel editing on a new PC

Everything here is the *recipe*: the `/reel-edit` skill, style presets (`styles/`), the Remotion template (`editor/`),
scripts, music and sound effects. Raw footage and finished videos are not in git.

## 1. Get the project
Put it at the **same path**, `C:\AI Video Editing`, so Claude's memory lines up:
```
gh repo clone <your-username>/reel-studio "C:\AI Video Editing"
```

## 2. Restore Claude's memory (preferences, catchphrase, voice rules)
Copy `claude-memory\*.md` to `C:\Users\<you>\.claude\projects\C--AI-Video-Editing\memory\`.

## 3. Tools (or just tell Claude: "set this PC up for reel editing")
- ffmpeg: `winget install Gyan.FFmpeg` (the scripts use the winget path; update `FF` in `editor/scripts/*.py` and `capture.mjs` if your user name differs)
- Python 3.12 + `pip install faster-whisper numpy`
- Node.js LTS, then `cd editor && npm install`
- Microsoft Edge (for website screen recordings)

## 4. Folders git skips
Create `raw-footage\`, `output\`, `references\` and `analysis\` (empty).
