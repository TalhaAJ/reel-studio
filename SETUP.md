# Setting up reel editing on a new PC

Everything here is the *recipe*: the `/reel-edit` skill, style presets (`styles/`), the Remotion template (`editor/`),
scripts, music and sound effects. Raw footage and finished videos are not in git.

## 1. Get the project
Any folder works (scripts find the repo root themselves); `C:\AI Video Editing` and `C:\reel-studio` are both in use.
The memory folder in step 2 is named after the path you choose:
```
gh repo clone <your-username>/reel-studio "C:\AI Video Editing"
```

## 2. Restore Claude's memory (preferences, catchphrase, voice rules)
Copy `claude-memory\*.md` to `C:\Users\<you>\.claude\projects\<path-with-dashes>\memory\` (e.g. `C--AI-Video-Editing` or `C--reel-studio`).

## 3. Tools (or just tell Claude: "set this PC up for reel editing")
- ffmpeg: `winget install Gyan.FFmpeg` (the scripts look for it under `%LOCALAPPDATA%`; update `FF` in `editor/scripts/*.py` and `capture.mjs` if winget installs a newer version folder)
- Python 3.12 + `pip install faster-whisper numpy`
- Node.js LTS, then `cd editor && npm install`
- Microsoft Edge (for website screen recordings)
- If Smart App Control is on (`(Get-MpComputerStatus).SmartAppControlState`), Remotion's own Chrome won't start. Render with Edge instead: `setx REEL_BROWSER "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"` (read by `editor/remotion.config.ts`)

## 4. Folders git skips
Create `raw-footage\`, `output\`, `references\` and `analysis\` (empty).
