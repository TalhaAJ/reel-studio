"""Write a NEW CapCut draft folder next to 1125 (1125 itself is never opened for writing)."""
import copy, json, os, shutil, sys, time, uuid
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan import *

ROOT = r"C:\Users\talha\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft"
SRC, NAME = os.path.join(ROOT, "1125"), sys.argv[1] if len(sys.argv) > 1 else "1125 roy style v2"
DST = os.path.join(ROOT, NAME)
assert NAME != "1125" and not os.path.exists(DST), "refusing to overwrite " + DST
U = lambda: str(uuid.uuid4()).upper()
us = lambda fr: round(fr * 1e6 / FPS)
fwd = lambda p: p.replace("\\", "/")
D = json.load(open(os.path.join(SRC, "draft_content.json"), encoding="utf-8-sig"))
M0 = json.load(open(os.path.join(SRC, "draft_meta_info.json"), encoding="utf-8-sig"))
seg0, vmat0 = copy.deepcopy(D["tracks"][0]["segments"][0]), copy.deepcopy(D["materials"]["videos"][0])
kinds = ["speeds", "placeholder_infos", "canvases", "material_animations", "sound_channel_mappings", "vocal_separations"]
tmpl = {k: copy.deepcopy(next(m for m in D["materials"][k] if m["id"] in seg0["extra_material_refs"])) for k in kinds}
for k, v in D["materials"].items():
    if isinstance(v, list): D["materials"][k] = []
mats = D["materials"]
meta = []


def refs(use):
    ids = []
    for k in use:
        m = copy.deepcopy(tmpl[k]); m["id"] = U(); mats[k].append(m); ids.append(m["id"])
    return ids


def media(path, kind, w, h, dur, audio):
    lid = str(uuid.uuid4())
    m = copy.deepcopy(vmat0); m.update(id=U(), path=fwd(path), material_name=os.path.basename(path), type=kind, width=w, height=h, duration=dur, has_audio=audio, local_material_id=lid)
    if not any(x["file_Path"] == fwd(path) for x in meta):
        now = int(time.time())
        meta.append({"ai_group_type": "", "create_time": now, "duration": dur if kind == "video" else 5000000, "extra_info": os.path.basename(path), "file_Path": fwd(path), "height": h, "id": lid, "import_time": now, "import_time_ms": now * 1000000,
                     "item_source": 1, "md5": "", "metetype": "video" if kind == "video" else "photo", "roughcut_time_range": {"duration": dur if kind == "video" else -1, "start": 0 if kind == "video" else -1},
                     "sub_time_range": {"duration": -1, "start": -1}, "type": 0, "width": w})
    else:
        m["local_material_id"] = next(x["id"] for x in meta if x["file_Path"] == fwd(path))
    mats["videos"].append(m)
    return m["id"]


def seg(mid, use, start, n, src=None, scale=1.0, y=0.0, ri=0, tri=0):
    s = copy.deepcopy(seg0)
    s.update(id=U(), material_id=mid, extra_material_refs=refs(use), render_index=ri, track_render_index=tri,
             target_timerange={"start": us(start), "duration": us(start + n) - us(start)},
             source_timerange=None if src is None else {"start": us(src), "duration": us(start + n) - us(start)})
    s["clip"]["scale"] = {"x": scale, "y": scale}; s["clip"]["transform"] = {"x": 0.0, "y": y}; s["uniform_scale"] = {"on": True, "value": 1.0}
    return s


def track(kind, flag, segs, name):
    return {"attribute": 0, "flag": flag, "id": U(), "is_default_name": False, "name": name, "segments": segs, "type": kind}


BASE = os.path.join(OUT, "1125 keyed base v3.mp4")
tracks = [track("video", 0, [seg(media(BASE, "video", W, H, us(1599), True), kinds, s["out"], s["n"], s["src"], s["z"]) for s in shots], "Talha (punch-ins)")]
for j, n in enumerate(("title", "tweet", "block"), 1):
    fn, im, w, h, yc = place(n); a, b = OV[n]
    # at scale 1 CapCut fits a wide picture to the canvas width
    tracks.append(track("video", 2, [seg(media(os.path.join(OUT, fn), "photo", im.width, im.height, 10800000000, False), kinds, a, b - a, 0, w / W, 1 - 2 * yc, j, j)], {"title": "Hook box", "tweet": "X post", "block": "Block picture"}[n]))
size = round(CAP_PX / 6.56, 2)
tsegs = []
for c in caps:
    content = {"styles": [{"fill": {"alpha": 1.0, "content": {"render_type": "solid", "solid": {"alpha": 1.0, "color": [1.0, 1.0, 1.0]}}}, "font": {"id": "", "path": fwd(CAP_FONT)},
                           "range": [0, len(c["text"])], "size": size, "bold": False, "italic": False, "underline": False, "strokes": []}], "text": c["text"]}
    t = {"id": U(), "type": "text", "content": json.dumps(content, ensure_ascii=False), "alignment": 1, "typesetting": 0, "letter_spacing": 0.0, "line_spacing": 0.02, "line_feed": 1, "line_max_width": 0.96,
         "force_apply_line_max_width": False, "check_flag": 39, "global_alpha": 1.0, "font_path": fwd(CAP_FONT), "font_size": size, "text_color": "#FFFFFF", "text_alpha": 1.0, "fonts": [],
         "background_style": 0, "background_color": "", "background_alpha": 1.0, "border_color": "", "border_width": 0.08, "has_shadow": True, "shadow_alpha": 0.6, "shadow_angle": -45.0, "shadow_color": "#000000",
         "shadow_distance": 4.0, "shadow_point": {"x": 0.45, "y": -0.45}, "shadow_smoothing": 0.6, "name": "", "recognize_type": 0, "add_type": 0, "is_rich_text": False, "initial_scale": 1.0, "layer_weight": 1}
    mats["texts"].append(t)
    s = seg(t["id"], ["material_animations"], c["s"], c["e"] - c["s"], None, 1.0, round(1 - 2 * c["y"], 4), 14000 + len(tsegs), 0)
    tsegs.append(s)
tracks.append(track("text", 0, tsegs, "Captions"))
# music: already arranged and level-automated, on its own track
MUS = os.path.join(OUT, "music bed v3.wav"); lid = str(uuid.uuid4()); now = int(time.time())
aud = {"app_id": 0, "category_id": "", "category_name": "local", "check_flag": 1, "copyright_limit_type": "none", "duration": us(TOTAL), "effect_id": "", "formula_id": "", "id": U(), "intensifies_path": "", "is_ai_clone_tone": False,
       "is_text_edit_overdub": False, "is_ugc": False, "local_material_id": lid, "music_id": str(uuid.uuid4()), "name": os.path.basename(MUS), "path": fwd(MUS), "query": "", "request_id": "", "resource_id": "", "search_id": "", "source_from": "",
       "source_platform": 0, "team_id": "", "text_id": "", "tone_category_id": "", "tone_category_name": "", "tone_effect_id": "", "tone_effect_name": "", "tone_speaker": "", "tone_type": "", "type": "extract_music", "video_id": "", "wave_points": []}
mats["audios"].append(aud)
ms = seg(aud["id"], ["speeds", "placeholder_infos", "sound_channel_mappings", "vocal_separations"], 0, TOTAL, 0)
bt = {"ai_beats": {"beat_speed_infos": [], "beats_path": "", "beats_url": "", "melody_path": "", "melody_percents": [0.0], "melody_url": ""}, "enable_ai_beats": False, "gear": 404, "gear_count": 0, "id": U(), "mode": 404, "type": "beats", "user_beats": [], "user_delete_ai_beats": None}
mats["beats"].append(bt); ms["extra_material_refs"].append(bt["id"]); ms.update(clip=None, hdr_settings=None, enable_adjust=False, enable_lut=False); ms.pop("uniform_scale", None)
tracks.append(track("audio", 0, [ms], "Music"))
meta.append({"ai_group_type": "", "create_time": now, "duration": us(TOTAL), "extra_info": os.path.basename(MUS), "file_Path": fwd(MUS), "height": 0, "id": lid, "import_time": now, "import_time_ms": now * 1000000, "item_source": 1, "md5": "",
             "metetype": "music", "roughcut_time_range": {"duration": us(TOTAL), "start": 0}, "sub_time_range": {"duration": -1, "start": -1}, "type": 0, "width": 0})
D.update(tracks=tracks, duration=us(TOTAL), id=U())
M0.update(draft_id=U(), draft_name=NAME, draft_fold_path=fwd(DST), tm_duration=us(TOTAL), tm_draft_create=int(time.time() * 1e6), tm_draft_modified=int(time.time() * 1e6), draft_cover="")
M0["draft_materials"][0]["value"] = meta

os.makedirs(DST)
for sub in ("Resources", "Resources/audioAlg", "Resources/videoAlg", "adjust_mask", "common_attachment", "matting", "qr_upload", "smart_crop", "subdraft"): os.makedirs(os.path.join(DST, sub), exist_ok=True)
for fn in ("draft_agency_config.json", "draft_settings", "draft_biz_config.json"): shutil.copyfile(os.path.join(SRC, fn), os.path.join(DST, fn))
json.dump({"draft_materials": [], "draft_virtual_store": [{"type": 0, "value": [{"creation_time": 0, "display_name": "", "filter_type": 0, "id": "", "import_time": 0, "import_time_us": 0, "sort_sub_type": 0, "sort_type": 0}]},
           {"type": 1, "value": [{"child_id": m["id"], "parent_id": ""} for m in meta]}, {"type": 2, "value": []}]}, open(os.path.join(DST, "draft_virtual_store.json"), "w"))
body = json.dumps(D, ensure_ascii=False, separators=(",", ":"))
for fn in ("draft_content.json", "template-2.tmp"): open(os.path.join(DST, fn), "w", encoding="utf-8").write(body)
open(os.path.join(DST, "draft_meta_info.json"), "w", encoding="utf-8").write(json.dumps(M0, ensure_ascii=False, separators=(",", ":")))
print("wrote", DST, len(body), "bytes; tracks", [(t["type"], t["name"], len(t["segments"])) for t in tracks], "caption size", size)
