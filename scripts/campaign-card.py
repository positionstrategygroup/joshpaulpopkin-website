# Campaign card: an article's own photo + the campaign title in the site's type.
#   python3 scripts/campaign-card.py SRC.jpg OUT.jpg "kicker" "line one" "line two" "footer"
import sys
from PIL import Image, ImageDraw, ImageFont
src, out, kicker, line1, line2, foot = sys.argv[1:7]
im = Image.open(src).convert('RGB'); W, H = im.size
k = W / 1600                                   # type was designed at 1600px wide
grad = Image.new('L', (1, H))
for y in range(H):
    t = max(0, (y - int(H * 0.48)) / (H * 0.52)); grad.putpixel((0, y), int(245 * (t ** 1.3)))
grad = grad.resize((W, H)); im = Image.composite(Image.new('RGB', (W, H), (8, 8, 12)), im, grad)
d = ImageDraw.Draw(im)
F = 'scripts/fonts/'
serif = ImageFont.truetype(F + 'Newsreader.ttf', int(176 * k)); mono = ImageFont.truetype(F + 'IBM_Plex_Mono.ttf', int(38 * k)); mono_s = ImageFont.truetype(F + 'IBM_Plex_Mono.ttf', int(34 * k))
sp = lambda s: '   '.join(' '.join(w) for w in s.upper().split(' '))
x = int(96 * k); y = H - int(96 * k)
d.text((x, y - int(40 * k)), sp(foot), font=mono_s, fill=(236, 236, 241), anchor='ls')
d.text((x, y - int(120 * k)), line2, font=serif, fill=(255, 255, 255), anchor='ls')
d.text((x, y - int(292 * k)), line1, font=serif, fill=(255, 255, 255), anchor='ls')
ky = y - int(482 * k)
d.ellipse((x, ky - int(14 * k), x + int(16 * k), ky + int(2 * k)), fill=(255, 42, 42))
d.text((x + int(34 * k), ky + int(4 * k)), sp(kicker), font=mono, fill=(236, 236, 241), anchor='ls')
im.save(out, quality=90, optimize=True, progressive=True); print(out, im.size)
