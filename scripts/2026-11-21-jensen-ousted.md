# Jensen Huang ousted (follow-up to the Nvidia CEO reel)

**Date:** 2026-11-21
**Style:** split screen copied from the brain-tumor reference (`C:\Users\Musa\Downloads\snapgram.io_slko8tdzn76q.mp4`, broken down with rea-video in `C:\rea-video\out\ref1`): top 1080x1152 black panel with a faint dot grid, Inter titles + JetBrains Mono sub-lines, numbered circles joined by a line, dark tiles, accent blue `#1D63EC` (Talha chose the exact reference blue over his orange); bottom 1080x768 is his footage, hair to chest. Captions: 1–3 word white caps (Inter 700, 56 px) on a `#222725` box sitting on the seam. Light UI sounds only, no music.
**Footage:** `raw-footage/IMG_2765.MOV` (24.5 s) + `IMG_2766.MOV` (86 s), 4K/30, standing, cream wall, handheld mic. Not flipped (he prefers it as recorded).
**Storyboard:** https://claude.ai/artifact/VDDeXWfBLZGP5heSRNwVnu
**Edit:** takes in `editor/scripts/plain_cut.py` → `REELS["ousted"]`, composition `editor/src/ousted/Ousted.tsx` (`Ousted`), sounds `editor/scripts/make_ui_sfx.py ou`, screenshots in `editor/public/ousted/shots/`. Render `output/ousted_vN.mp4` (+ `_phone` copy under 30 MB).

## Script (as said, ~61 s cut)

The king of tech has been fired from his own empire.
I'm talking about Jensen Huang, the CEO of Nvidia.
He was caught having an affair with a Chinese girl that apparently turned out to be a spy.
He then was caught having an affair with a director.
And lastly, he was caught having another affair, which we don't know who that is right now.
So he's been caught having three affairs.
What he's done is wrong, but is it that wrong that he has to get fired from his own company? The one that he's built from nothing to a trillion-dollar company. That is insane.
Whenever someone thinks of Nvidia, they think of Jensen Huang. So if Jensen Huang has been labeled with these allegations, no one wants a company CEO to have these allegations.
Now, the second one is, Jensen Huang was a very big advocate for local AI, open-source AI. He was selling his chip to China.
So there could be opposition parties in America that did not like what he's trying to do. They wanted to keep AI for the big doggies, and not for the small public.
But I don't know, these are allegations, these are conspiracies, and I'm gonna let you guys decide what you guys think. Follow me for more updates.

Cut for length: the "every CEO has a side chick" opening of IMG_2766 (0–19.6 s), plus the garbled "why the fire has also been happened" and "both directors are fired him" lines.

## Fact check (21 Nov 2026)
- Exit: Nvidia says he resigned (12 Nov); CNBC reported the board pushed him out; board chair says it does not intend to reinstate him (NPR, CNN, 17 Nov). Colette Kress is interim CEO. Card: NPR headline + "FORMER CEO".
- Affairs: reported via Reuters: the alleged Chinese spy (NYT, citing US intelligence; China denies), an Nvidia vice president of healthcare (he says "director"; card says "Nvidia executive · Reuters: VP of healthcare"), and another subordinate.
- Market cap: first company to hit $5T (Oct 2025). Chart labelled "approx.".
- Reason 2 is his theory; on screen as "HIS THEORY · unconfirmed".

## v3: real material in the top panel (Talha: v2 "doesn't go the same as the reference… the reference has real overlays of stuff that's happening")
- Photos (`editor/public/ousted/photos/`, credits in `credits.json`, shown on screen): Jensen at Stanford 2026 by Anders Eidesvik (CC BY 4.0; j01 is the cropped CC BY-SA 4.0 version), Nvidia Voyager HQ by Coolcaesar (CC BY-SA 4.0). Blue tracking boxes like the reference's "tumor" box: "CEO · 0.99" → "FIRED", "NVIDIA HQ · HIS EMPIRE", photo wall "NVIDIA" → "ALLEGED", "THE BIG DOGGIES?".
- Screen recordings (`scripts/capture.mjs ou_*`, frame by frame, yellow highlight sweep): Wikipedia lead ("served as its president and CEO … until his resignation in 2026"), The Week standfirst ("according to U.S. intelligence services, is a Chinese asset"), CNBC live blog ("stepping down as CEO … 33 years ago"; "preserving access to open-source AI" / "lobbying to allow chip exports to China"), companiesmarketcap.com chart with the cursor up to the peak.
- Tall captures scrolled in Remotion (`scripts/tall_shots.mjs`; these sites won't scroll in headless Edge): Reuters via BNN Bloomberg ("vice-president of health care", "a second employee", "Reuters is not naming the second employee."), NPR ("does not intend to reinstate Jensen as CEO", Brad Gerstner's "political pressure from the left or the right").
- Dropped: Boston.com (paywall), HPCwire (Cloudflare block), CNN (consent overlay), Forbes (blocks bots).
- Correction: the VP of health care report is the NYT's (Reuters reported the second employee).
- Tooling: Edge 157 needs `--headless=new` (remotion.config.ts chromeMode, capture.mjs launch args); run Remotion/Playwright from PowerShell on the Musa PC.

## Edit decisions (v2)
- Top panel: status card (CEO struck through on "fired") → NPR headline → name + years → numbered affairs list with the Newsweek "Who is Alice Huang?" shot inside it → big "3" → wrong vs fair? rows → market-cap chart with a drawn circle on the peak → Reason 1 (Nvidia ↔ Jensen tiles, ALLEGATIONS tag) → CNBC live-coverage headline → Reason 2 checklist → theory split card → "Why is he out?" poll → Follow button tap.
- Sound set `ou`: hit on frame 0, "spy" and "three"; pop per scene, whoosh per screenshot, ticks on list items, ding on the Follow tap.
