# Editorial grade for the site's portraits. Phone snapshots -> consistent, quieter, sharper.
#   python3 scripts/grade.py SRC.jpg OUT.jpg [--inpaint cx,cy,rx,ry] [--bg-blur N] [--no-bg] [--no-crop] [--face cx,cy,h]
# Recipe (lightened 2026-09-18 after the heavier version read as fake): subject-aware 4:5 crop -> light denoise
# -> Lanczos to 1600x2000 -> restrained white balance -> tone -> very gentle desaturation -> background eased
# down 5% (no blur unless --bg-blur N) -> light unsharp on the subject -> faint vignette. Grayscale stays grayscale.
import sys, io, numpy as np, cv2
from PIL import Image, ImageOps
from rembg import remove

args = sys.argv[1:]; src, out = args[0], args[1]
opt = {'inpaint': None, 'bg_blur': 0.0, 'bg': True, 'face': None}   # 2026-09-18: no background blur by default; it read as a composite
i = 2
while i < len(args):
    if args[i] == '--inpaint': opt['inpaint'] = [int(v) for v in args[i+1].split(',')]; i += 2
    elif args[i] == '--bg-blur': opt['bg_blur'] = float(args[i+1]); i += 2
    elif args[i] == '--no-bg': opt['bg'] = False; i += 1
    elif args[i] == '--face': opt['face'] = [float(v) for v in args[i+1].split(',')]; i += 2   # cx,cy,h in source px: manual override when the matte misreads a busy frame
    else: i += 1

pil = ImageOps.exif_transpose(Image.open(src)).convert('RGB')

# 0. subject-aware 4:5 crop (added 2026-09-18). Finds the person with rembg + a face detector and frames
#    them the same way every time: face centred horizontally, face centre at 36% of the height, face about
#    13% of the height. That leaves the bottom third clear for the campaign-card type. --no-crop skips it.
def subject_crop(pil, face_y=0.36, face_h=0.13, ratio=0.8):
    W, H = pil.size; sc = 900 / max(W, H); sm = pil.resize((max(1, int(W * sc)), max(1, int(H * sc))))
    if opt['face']:
        fx, fy, fh = [v * sc for v in opt['face']]; sx0, sx1 = fx - fh, fx + fh; faces = ['manual']
        return _frame(pil, sm, sc, fx, fy, fh, sx0, sx1, face_y, face_h, ratio, 'manual')
    matte = np.array(remove(sm, only_mask=True)).astype(np.float32) / 255
    n, lab, stats, _ = cv2.connectedComponentsWithStats((matte > 0.5).astype(np.uint8), 8)
    if n > 2:  # keep the largest person only (crowds, dogs, railings drop out)
        keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA])); matte = matte * (lab == keep)
    ys, xs = np.where(matte > 0.5)
    if len(xs) < 200:   # no person found: plain centre crop to 4:5 so nothing gets stretched
        W0, H0 = pil.size; cw = min(W0, H0 * ratio); ch = cw / ratio
        return pil.crop((int((W0 - cw) / 2), int((H0 - ch) * 0.3), int((W0 + cw) / 2), int((H0 - ch) * 0.3 + ch)))
    sx0, sx1, sy0, sy1 = xs.min(), xs.max(), ys.min(), ys.max()
    faces = []
    if hasattr(cv2, 'CascadeClassifier'):   # not every OpenCV build ships objdetect; the matte fallback below is fine
        gray = cv2.cvtColor(np.array(sm), cv2.COLOR_RGB2GRAY)
        cas = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = [f for f in cas.detectMultiScale(gray, 1.1, 5, minSize=(24, 24)) if matte[f[1] + f[3] // 2, f[0] + f[2] // 2] > 0.5]
    if faces:
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3]); fx, fy, fh = x + w / 2, y + h / 2, h * 1.15
    else:  # sunglasses / profile: estimate the head from the top of the matte
        band = matte[sy0:sy0 + max(6, int((sy1 - sy0) * 0.09))] > 0.5
        widths = band.sum(1); row = int(np.argmax(widths)); cols = np.where(band[row])[0]
        hw = (cols.max() - cols.min()) if len(cols) else (sx1 - sx0) * 0.3
        fh = hw * 1.25; fx, fy = ((cols.min() + cols.max()) / 2 if len(cols) else (sx0 + sx1) / 2), sy0 + fh * 0.5
    return _frame(pil, sm, sc, fx, fy, fh, sx0, sx1, face_y, face_h, ratio, 'face' if faces else 'head-est')
def _frame(pil, sm, sc, fx, fy, fh, sx0, sx1, face_y, face_h, ratio, how):
    ch = fh / face_h; cw = ch * ratio
    cw = max(cw, (sx1 - sx0) * 1.12)                      # shoulders stay in frame
    cw = min(cw, sm.width); ch = min(cw / ratio, sm.height); cw = ch * ratio
    x0 = min(max(fx - cw / 2, 0), sm.width - cw); y0 = min(max(fy - ch * face_y, 0), sm.height - ch)
    box = tuple(int(v / sc) for v in (x0, y0, x0 + cw, y0 + ch))
    print(f'crop {box} face@({int(fx/sc)},{int(fy/sc)}) {how}')
    return pil.crop(box)
def centre_crop(pil, ratio=0.8):
    W0, H0 = pil.size; cw = min(W0, H0 * ratio); ch = cw / ratio
    return pil.crop((int((W0 - cw) / 2), int((H0 - ch) * 0.3), int((W0 + cw) / 2), int((H0 - ch) * 0.3 + ch)))
if '--no-crop' not in args: pil = subject_crop(pil) if opt['bg'] else centre_crop(pil)   # --no-bg = illustration, no person to find
im = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
H0, W0 = im.shape[:2]
gray_src = np.abs(im[..., 0].astype(int) - im[..., 2].astype(int)).mean() < 2

# 1. denoise small/noisy sources gently
h = 4 if W0 < 1300 else 2
im = cv2.fastNlMeansDenoisingColored(im, None, h, h, 7, 21)

# 2. inpaint (earbud etc.) in source coordinates scaled to output
TW, TH = 1600, 2000
s = TW / W0
im = cv2.resize(im, (TW, TH), interpolation=cv2.INTER_LANCZOS4)
if opt['inpaint']:
    cx, cy, rx, ry = opt['inpaint']
    m = np.zeros((TH, TW), np.uint8); cv2.ellipse(m, (cx, cy), (rx, ry), 0, 0, 360, 255, -1)
    im = cv2.inpaint(im, m, 7, cv2.INPAINT_TELEA)

f = im.astype(np.float32) / 255.0

# 3. restrained white balance (gray-world, 55% blend, clamp gains)
if not gray_src:
    mean = f.reshape(-1, 3).mean(0); g = mean.mean() / mean; g = np.clip(g, 0.85, 1.18)
    g = 1 + (g - 1) * 0.55
    f = np.clip(f * g, 0, 1)

# 4. tone
lum = lambda x: 0.114 * x[..., 0] + 0.587 * x[..., 1] + 0.299 * x[..., 2]
f = f * (1 - 0.02) + 0.02                      # black lift
f = np.power(f, 1 / 1.04)                        # gamma
f = np.clip(f + 0.22 * (f - 0.5) * (1 - np.abs(2 * f - 1)) * 0.5, 0, 1)  # gentle S-curve around mid
hi = f > 0.85; f[hi] = 0.85 + (f[hi] - 0.85) * 0.75  # highlight rolloff

# 5. colour: gentle desaturation toward editorial, tiny cool shadows / warm highlights
if not gray_src:
    hsv = cv2.cvtColor((f * 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] *= 0.96
    f = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32) / 255
    L = lum(f)[..., None]
    f = np.clip(f + (1 - L) * np.array([0.018, 0.0, -0.012], np.float32) + L * np.array([-0.008, 0.0, 0.014], np.float32), 0, 1)

# 6. subject / background split
if opt['bg']:
    buf = io.BytesIO(); Image.fromarray(cv2.cvtColor((f * 255).astype(np.uint8), cv2.COLOR_BGR2RGB)).save(buf, 'PNG')
    matte = np.array(remove(Image.open(io.BytesIO(buf.getvalue())), only_mask=True).resize((TW, TH))).astype(np.float32) / 255
    matte = cv2.GaussianBlur(matte, (0, 0), 6)
    bg = f.copy()
    if opt['bg_blur'] > 0: bg = cv2.GaussianBlur(bg, (0, 0), opt['bg_blur'])
    bg = bg * 0.95                                     # background down a touch, not a stop
    if not gray_src:
        hsv = cv2.cvtColor((bg * 255).astype(np.uint8), cv2.COLOR_BGR2HSV).astype(np.float32); hsv[..., 1] *= 0.94
        bg = cv2.cvtColor(np.clip(hsv, 0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32) / 255
    m3 = matte[..., None]
    f = f * m3 + bg * (1 - m3)
    # unsharp only on the subject
    blur = cv2.GaussianBlur(f, (0, 0), 1.6); sharp = np.clip(f + 0.28 * (f - blur), 0, 1)
    f = sharp * m3 + f * (1 - m3)
else:
    blur = cv2.GaussianBlur(f, (0, 0), 1.6); f = np.clip(f + 0.28 * (f - blur), 0, 1)

# 7. vignette
yy, xx = np.mgrid[0:TH, 0:TW]; r = np.sqrt(((xx - TW / 2) / (TW / 2)) ** 2 + ((yy - TH / 2) / (TH / 2)) ** 2)
v = 1 - 0.10 * np.clip((r - 0.65) / 0.9, 0, 1) ** 1.6
f = np.clip(f * v[..., None], 0, 1)

outim = Image.fromarray(cv2.cvtColor((f * 255 + 0.5).astype(np.uint8), cv2.COLOR_BGR2RGB))
outim.save(out, quality=88, optimize=True, progressive=True); print(out, outim.size, 'gray' if gray_src else 'colour')
