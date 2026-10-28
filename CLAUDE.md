# Reel Studio

Talha's workspace for short tech-explainer reels (Instagram, 9:16, ~40–55 s). He films green-screen talking heads on an iPhone and Claude edits them in code (Remotion + ffmpeg + Python).

## One chat per video
Each new video gets its own chat in the **🎬 Reel Studio** sidebar group, titled `NN · Topic`. The whole lifecycle happens in that chat:
1. `/new-reel`: find a trending topic, write the script → `scripts/YYYY-MM-DD-<topic>.md`
2. Talha records it and drops the file in `raw-footage/`
3. `/reel-edit`: cut, captions, cards, sound, render → `output/<topic>_vN.mp4`, plus a thumbnail
4. Notes → fixes → final. If he approves a new look, save it as a style preset (see `/reel-edit`).

## Where things are
- `styles/`: style presets (default `electric-orange-v1.md`) and `sound-design.md`
- `scripts/`: every script so far (also the list of topics already covered, so don't repeat them)
- `editor/`: Remotion template; `editor/scripts/` for the pipeline; `SETUP.md` for a new PC
- `analysis/STYLE_GUIDE.md`: the reference creator's structure (structure only, never identity)

## Rules that matter
- Voice: nearly raw. Never add denoise or a compressor ("stuffed" voice).
- His sign-off is **"Let's go, boys"**. The verdict is always his own words; never invent his opinion.
- Never type his passwords. Logins are his to do.
- Each video goes on its own git branch `reel/<topic>`. Push to the private repo (github.com/TalhaAJ/reel-studio) when a video or a style changes, so his second PC stays in sync.
