---
name: new-reel
description: Start a new reel - find a trending AI/tech topic, verify the facts, and write a filmable script in the user's house formula with hand cues, proof moments and a filming checklist. Use when the user wants a new video, topic, idea or script.
---

# Start a new reel (topic + script)

Each video lives in its own chat. This skill is step 1 of that chat; `/reel-edit` is the next step once footage exists.

## 0. Set up the chat
- Count the `.md` files in `scripts/` and add 1 to get `NN` (zero-padded, starting from 01).
- After the topic is chosen, rename this session to `NN · <Topic>` (`set_session_title` "self") and file it in the **🎬 Reel Studio** sidebar group (`list_groups` → `move_sessions` "self"). Create the group only if it's missing.

## 1. Find a topic that's trending *this week*
- Read the past scripts in `scripts/` first and don't repeat a topic.
- Search in parallel, using `mode: "extended"`, with the current month/year in the query: new AI tool launches this week, GitHub trending AI repos, viral AI tools.
- **Verify** every candidate at its source: the GitHub API (`api.github.com/repos/<owner>/<name>`) for stars, licence and creation date, and the README or official site for features, install and pricing. Aggregator blogs get numbers wrong.
- Good fits for this channel: free/open-source tools, things that run locally, AI that does a creator job (voice, video, editing, coding), with something **visible to demo**. Avoid anything that needs a paid account to show.
- Offer **1 recommended topic plus 1 backup** in a sentence each (why it's hot, the hook). Let the user pick unless they said "just pick".

## 2. Write the script (house formula, ~40–50 s spoken)
Save it to `scripts/YYYY-MM-DD-<topic-slug>.md`, using the layout of the existing scripts:
- **HOOK**: "You can now …" + what it replaces ("no X, no subscription").
- **NAME + PROOF**: "It's called X" + a verified number (stars, downloads).
- **FIRST / THEN / AND FINALLY**: three concrete steps (they become the STEP 1/3 counter).
- **PROOF moment(s)**: something real the viewer sees or hears working (a screen recording, a generated output). Note who records it: Claude can capture public websites; the app itself usually needs the user (OBS, sound on).
- **PLUS**: a quick bonus (free, no account, platforms).
- **VERDICT**: leave a clear placeholder. The verdict is the user's own words, so ask for them; never write their opinion.
- **CTA**: "comment WORD down below and I'll send it to you directly". Pick a short WORD; remind them to say it clearly.
- **SIGN-OFF**: "Let's go, boys."
- Add `[hand / body cues]` under lines (finger counts at chest height so hands stay in frame).
- Then a **Filming checklist** (chest up, room for hands, 2–3 full takes per line, 0.5 s pause between attempts, say the sign-off 3 ways), the **Screen recordings** list (who does what), and the **Sources** used.
- Note in the script any claims that are rounded ("over 90,000").

## 3. Hand over
- Send the script file to the user (SendUserFile) and paste the spoken lines in chat so they can read from their phone.
- Commit it on a new branch `reel/<topic-slug>` (from `master`) and push.
- Tell them: record, drop the file in `raw-footage/`, then say "edit it" in this same chat (→ `/reel-edit`).
