"""Cut the six Ms. Fox clips out of the Zoom recording and key the flat grey
virtual background to transparent.

The background is a synthetic, perfectly flat (226,226,226), so the matte is a
distance ramp rather than a chroma key: alpha runs 0 at d<=LO to 1 at d>=HI,
and the edge pixels are un-blended against the known grey so no light fringe
survives onto the page.
"""
import os, subprocess, sys
import numpy as np

SRC = "/Users/ashleythomas/Dropbox (Personal)/Mac (2)/Downloads/GMT20261119-200807_Recording_avo_1280x720.mp4"
OUT = sys.argv[1]
W, H = 1280, 720
CX0, CX1, CY0, CY1 = 440, 938, 70, 720       # global fox bbox + 8px pad
CW, CH = CX1 - CX0, CY1 - CY0                 # 498 x 650
BG = 226.0
LO, HI = 7.0, 17.0

# name, speech start, speech end (from silencedetect); padded below.
CLIPS = [
    ("fox_intro",             3.883, 18.563),
    ("fox_pie_intro",        23.657, 38.570),
    ("fox_button_training",  42.853, 58.502),
    ("fox_pie_slice_first",  62.512, 65.656),
    ("fox_pie_slice_more",   67.639, 71.243),
    ("fox_pie_slice_more_yum", 73.287, 80.222),
]
LEAD, TAIL = 0.30, 0.50

os.makedirs(OUT, exist_ok=True)

ramp_lut = np.clip((np.arange(0, 512) - LO) / (HI - LO), 0, 1).astype(np.float32)

for name, s, e in CLIPS:
    a, b = max(0.0, s - LEAD), e + TAIL
    dur = b - a
    rgba = os.path.join(OUT, name + ".rgba")

    dec = subprocess.Popen(
        ["ffmpeg", "-nostdin", "-v", "error", "-ss", "%.3f" % a, "-t", "%.3f" % dur,
         "-i", SRC, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE)

    enc = subprocess.Popen(
        ["ffmpeg", "-nostdin", "-v", "error", "-y",
         "-f", "rawvideo", "-pix_fmt", "rgba", "-s", "%dx%d" % (CW, CH), "-r", "25", "-i", "-",
         "-ss", "%.3f" % a, "-t", "%.3f" % dur, "-i", SRC,
         "-map", "0:v", "-map", "1:a",
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "32",
         "-auto-alt-ref", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2",
         "-c:a", "libopus", "-b:a", "64k", "-ac", "1",
         os.path.join(OUT, name + ".webm")],
        stdin=subprocess.PIPE)

    n = 0
    while True:
        buf = dec.stdout.read(W * H * 3)
        if len(buf) < W * H * 3:
            break
        im = np.frombuffer(buf, np.uint8).reshape(H, W, 3)[CY0:CY1, CX0:CX1].astype(np.float32)
        d = np.sqrt(((im - BG) ** 2).sum(2))
        al = ramp_lut[np.minimum(d, 511).astype(np.int32)]
        # un-blend: observed = a*fg + (1-a)*bg
        safe = np.maximum(al, 0.08)[:, :, None]
        fg = (im - (1.0 - safe) * BG) / safe
        out = np.empty((CH, CW, 4), np.uint8)
        out[:, :, :3] = np.clip(fg, 0, 255).astype(np.uint8)
        out[:, :, 3] = (al * 255).astype(np.uint8)
        enc.stdin.write(out.tobytes())
        n += 1
    dec.stdout.close(); dec.wait()
    enc.stdin.close(); enc.wait()
    print("%-24s %5.2fs  %4d frames" % (name, dur, n))
