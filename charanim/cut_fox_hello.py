"""Cut the standalone 'Hi, I'm Ms. Fox.' greeting for the sound check,
using the same grey-background matte as the six narration clips."""
import os, subprocess, sys
import numpy as np

SRC = "/Users/ashleythomas/Dropbox (Personal)/Mac (2)/Downloads/GMT20261119-200807_Recording_avo_1280x720.mp4"
OUT = sys.argv[1]
START, END = 3.70, 6.30          # silence after "Fox." runs 6.15-6.39
W, H = 1280, 720
CX0, CX1, CY0, CY1 = 440, 938, 70, 720
CW, CH = CX1 - CX0, CY1 - CY0
BG, LO, HI = 226.0, 7.0, 17.0

ramp = np.clip((np.arange(0, 512) - LO) / (HI - LO), 0, 1).astype(np.float32)
dur = END - START

dec = subprocess.Popen(
    ["ffmpeg", "-nostdin", "-v", "error", "-ss", "%.3f" % START, "-t", "%.3f" % dur,
     "-i", SRC, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
enc = subprocess.Popen(
    ["ffmpeg", "-nostdin", "-v", "error", "-y",
     "-f", "rawvideo", "-pix_fmt", "rgba", "-s", "%dx%d" % (CW, CH), "-r", "25", "-i", "-",
     "-ss", "%.3f" % START, "-t", "%.3f" % dur, "-i", SRC,
     "-map", "0:v", "-map", "1:a",
     "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "32",
     "-auto-alt-ref", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2",
     "-c:a", "libopus", "-b:a", "64k", "-ac", "1", OUT], stdin=subprocess.PIPE)

n = 0
while True:
    buf = dec.stdout.read(W * H * 3)
    if len(buf) < W * H * 3:
        break
    im = np.frombuffer(buf, np.uint8).reshape(H, W, 3)[CY0:CY1, CX0:CX1].astype(np.float32)
    d = np.sqrt(((im - BG) ** 2).sum(2))
    al = ramp[np.minimum(d, 511).astype(np.int32)]
    safe = np.maximum(al, 0.08)[:, :, None]
    fg = (im - (1.0 - safe) * BG) / safe
    out = np.empty((CH, CW, 4), np.uint8)
    out[:, :, :3] = np.clip(fg, 0, 255).astype(np.uint8)
    out[:, :, 3] = (al * 255).astype(np.uint8)
    enc.stdin.write(out.tobytes())
    n += 1
dec.stdout.close(); dec.wait()
enc.stdin.close(); enc.wait()
print("%.2fs, %d frames -> %s" % (dur, n, OUT))
