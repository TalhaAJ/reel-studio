import subprocess,json,os,sys
import numpy as np
from faster_whisper import WhisperModel
S=os.path.dirname(os.path.abspath(sys.argv[0]))
raw=np.frombuffer(subprocess.run(["ffmpeg","-nostdin","-loglevel","error","-i",r"C:\Users\talha\Downloads\IMG_2919.MOV","-vn","-ac","1","-ar","16000","-f","f32le","-"],capture_output=True,check=True).stdout,np.float32)
m=WhisperModel("small.en",device="cpu",compute_type="int8")
segs,_=m.transcribe(raw,word_timestamps=False,vad_filter=False,language="en",condition_on_previous_text=False)
for s in segs: print(f"[{s.start:6.1f}-{s.end:6.1f}] {s.text.strip()}",flush=True)
