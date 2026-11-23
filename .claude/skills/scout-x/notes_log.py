"""Timestamp every idea Talha saves in ideas/ideas.txt during a Watch session.

Polls the file twice a second. Whenever it changes, each new or edited line is
appended to the log with the exact time (epoch ms, the same clock as the browser
watcher), so the scout can match it to what was on screen when he left X.

Run:  python notes_log.py <ideas.txt> <out.jsonl>     (stop with Ctrl+C / TaskStop)
Read-only on ideas.txt; it never edits his file.
"""
import json
import os
import sys
import time

src, out = sys.argv[1], sys.argv[2]


def read_lines():
    try:
        with open(src, encoding="utf-8-sig", errors="replace") as f:
            return [l.rstrip("\r\n") for l in f]
    except OSError:
        return None


prev = read_lines() or []
prev_mtime = os.path.getmtime(src) if os.path.exists(src) else 0
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
with open(out, "a", encoding="utf-8") as log:
    log.write(json.dumps({"t": int(time.time() * 1000), "type": "logger-start"}) + "\n")
    log.flush()
    while True:
        time.sleep(0.5)
        try:
            mtime = os.path.getmtime(src)
        except OSError:
            continue
        if mtime == prev_mtime:
            continue
        prev_mtime = mtime
        cur = read_lines()
        if cur is None:
            continue
        old = set(prev)
        saved_at = int(mtime * 1000)
        for i, line in enumerate(cur):
            if line.strip() and line not in old:
                log.write(json.dumps({"t": saved_at, "type": "note", "line_no": i + 1,
                                      "text": line}, ensure_ascii=False) + "\n")
        log.flush()
        prev = cur
