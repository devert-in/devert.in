# Removes the baked-in text from the brand plate (public/devert-hero-bg.jpg).
#
# WHY. The plate is the site-wide background on all three apps, and the artwork
# carries legible code-like text: a folder tree, a while(improve) block, CODE /
# CREATE / SOLVE / DEPLOY / SCALE / REPEAT, and two comment stacks. Behind real
# UI copy that reads as a second column of words competing with the first - it
# is the reason the navbar needed a scrim, and on the DeVert100 day pages the
# breadcrumb sits directly on top of "pages/ >".
#
# HOW. Each text region is replaced with a patch of CLEAN plate taken from the
# open centre of the same image, composited through a feathered mask so no
# rectangle edge is visible. Sampling the real artwork keeps the brushed grain,
# the vertical lighting gradient and the JPEG noise consistent - a flat fill or
# a blur would read as a smudge.
#
# The circuit tracery, the panel edges and the blue glows are deliberately left
# alone. Only the text goes.
#
# Usage:
#   python scripts/clean-hero-plate.py            # writes the cleaned plate
#   python scripts/clean-hero-plate.py --preview  # side-by-side, writes nothing

import sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageStat

SRC = "devert-frontend/public/devert-hero-bg.jpg"

# Each entry: the text box to erase, and where to take clean plate from.
# Sources are all in the open centre band (x 330-900, y 250-940), which is
# uninterrupted brushed metal in the original.
PATCHES = [
    # (name,                       box (l, t, r, b),        source top-left)
    ("// build / learn / ship",    (58, 118, 215, 230),     (360, 300)),
    ("folder tree",                (30, 258, 232, 500),     (360, 300)),
    ("while (improve) { }",        (958,   0, 1200, 175),   (620, 300)),
    ("// ideas to impact",         (958, 130, 1215, 180),   (620, 560)),
    ("CODE/CREATE/SOLVE/...",      (1050, 470, 1215, 665),  (700, 300)),
    ("// better / developers",     (1038, 740, 1220, 860),  (700, 560)),
    ("function build() { }",       (34, 955, 258, 1095),    (400, 700)),
]

# How far the mask fades at the edges. Large enough that no seam is visible,
# small enough that the patch still fully covers the glyphs.
FEATHER = 14


# Width of the band of real plate sampled around each box to measure the local
# brightness the patch has to match.
RING = 26


def _ring_mean(im, box, pad):
    """Mean colour of the band just OUTSIDE `box`.

    Measured through a MASK rather than by blanking the middle - compositing the
    centre to black and averaging the whole crop drags the mean toward zero and
    makes every patch come out near-black, which is exactly what happened the
    first time.
    """
    l, t, r, b = box
    ol, ot = max(l - pad, 0), max(t - pad, 0)
    orr, ob = min(r + pad, im.width), min(b + pad, im.height)
    outer = im.crop((ol, ot, orr, ob))

    mask = Image.new("L", outer.size, 255)
    ImageDraw.Draw(mask).rectangle([l - ol, t - ot, (l - ol) + (r - l), (t - ot) + (b - t)], fill=0)
    return ImageStat.Stat(outer, mask).mean


def _scale_channels(img, scale):
    bands = []
    for band, s in zip(img.split(), scale):
        bands.append(band.point(lambda v, s=s: max(0, min(255, int(v * s)))))
    return Image.merge("RGB", bands)


def clean(im):
    out = im.copy()
    for name, box, (sx, sy) in PATCHES:
        l, t, r, b = box
        w, h = r - l, b - t

        patch = im.crop((sx, sy, sx + w, sy + h))

        # BRIGHTNESS MATCH. The plate is lit unevenly - brighter through the
        # middle, darker toward the corners - so a patch lifted from the centre
        # and dropped near an edge shows up as a pale rectangle even through a
        # feathered mask. Scale the patch so its mean matches the ring of real
        # plate immediately around the destination, measured on the original.
        ring = _ring_mean(im, box, RING)
        pm = ImageStat.Stat(patch).mean
        scale = [(r / s) if s > 1 else 1.0 for r, s in zip(ring, pm)]
        patch = _scale_channels(patch, scale)

        # Feathered mask: solid in the middle, fading to nothing at the border,
        # so the patch dissolves into the surrounding plate.
        mask = Image.new("L", (w, h), 0)
        ImageDraw.Draw(mask).rectangle(
            [FEATHER, FEATHER, w - FEATHER - 1, h - FEATHER - 1], fill=255
        )
        mask = mask.filter(ImageFilter.GaussianBlur(FEATHER / 1.6))

        out.paste(patch, (l, t), mask)
    return out


def main():
    im = Image.open(SRC).convert("RGB")
    out = clean(im)

    if "--preview" in sys.argv:
        side = Image.new("RGB", (im.width * 2 + 16, im.height), (0, 0, 0))
        side.paste(im, (0, 0))
        side.paste(out, (im.width + 16, 0))
        side.save("scripts/_plate-preview.jpg", quality=88)
        print("wrote scripts/_plate-preview.jpg (before | after), nothing else touched")
        return

    # quality 92: the plate is a large flat gradient, where JPEG artefacts show
    # as banding. The original is ~1.2MB and this stays in the same range.
    out.save(SRC, quality=92, subsampling=0)
    print(f"cleaned {SRC} - {len(PATCHES)} text regions replaced")


main()
