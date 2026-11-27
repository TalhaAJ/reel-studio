import json,subprocess,os,sys
import numpy as np
S=os.path.dirname(os.path.abspath(sys.argv[0]))
d=json.load(open(r"C:\Users\talha\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft\1125\draft_content.json",encoding="utf-8-sig"))
src=d["materials"]["videos"][0]["path"]; SR=16000
full=np.frombuffer(subprocess.run(["ffmpeg","-nostdin","-loglevel","error","-i",src,"-vn","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True,check=True).stdout,np.float32)
out=np.zeros(int(d["duration"]/1e6*SR)+SR//10,np.float32)
for s in d["tracks"][0]["segments"]:
    a=int(s["source_timerange"]["start"]/1e6*SR); n=int(s["source_timerange"]["duration"]/1e6*SR); t=int(s["target_timerange"]["start"]/1e6*SR)
    out[t:t+n]=full[a:a+n]
out.tofile(S+r"\tl.f32"); print("timeline audio",len(out)/SR,"s; source",len(full)/SR,"s",flush=True)
from faster_whisper import WhisperModel
m=WhisperModel("medium.en",device="cpu",compute_type="int8")
segs,_=m.transcribe(out,word_timestamps=True,vad_filter=False,language="en",initial_prompt="Anthropic, Claude Fable 5, Opus 4.8, system card, steering vectors, API, cockblocking, lobotomise, larping.")
W=[]
for s in segs:
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text.strip()}",flush=True)
    W+=[{"w":w.word.strip(),"s":round(w.start,2),"e":round(w.end,2),"p":round(w.probability,2)} for w in s.words]
json.dump(W,open(S+r"\tl_words.json","w",encoding="utf-8")); print("words",len(W))
