import subprocess, numpy as np, sys
SR=16000
for n in ["2940","2941","2942","2944"]:
    a=np.frombuffer(subprocess.run(["ffmpeg","-nostdin","-v","error","-i",rf"C:\Users\talha\Downloads\IMG_{n}.MOV","-vn","-ac","1","-ar",str(SR),"-af","highpass=f=80","-f","f32le","-"],capture_output=True).stdout,np.float32)
    hop=160; fr=len(a)//hop
    rms=np.sqrt((a[:fr*hop].reshape(fr,hop)**2).mean(1)+1e-12); db=20*np.log10(rms)
    np.save(f"db_{n}.npy",db)
    floor=np.percentile(db,10); peak=np.percentile(db,95); thr=floor+0.30*(peak-floor)
    print(n,f"dur {len(a)/SR:.2f} floor {floor:.1f} peak {peak:.1f} thr {thr:.1f}")
    q=db<thr; out=[]; i=0
    while i<fr:
        if q[i]:
            j=i
            while j<fr and q[j]: j+=1
            if (j-i)*0.01>=0.12: out.append((i*0.01,j*0.01))
            i=j
        else: i+=1
    print("  silences:", " ".join(f"{s:.2f}-{e:.2f}" for s,e in out))
