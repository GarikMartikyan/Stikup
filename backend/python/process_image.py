#!/usr/bin/env python3
"""Remove background, crop to content, output a 512x512 transparent WebP.

Usage: python3 process_image.py <input_path> <output_path>
"""

import io
import sys

from PIL import Image
from rembg import remove


TARGET_SIZE = 512


def process(input_path: str, output_path: str) -> None:
    with open(input_path, "rb") as f:
        source_bytes = f.read()

    cutout_bytes = remove(source_bytes)
    img = Image.open(io.BytesIO(cutout_bytes)).convert("RGBA")

    bbox = img.getbbox()
    if bbox is None:
        raise RuntimeError("background removal produced an empty image")
    img = img.crop(bbox)

    w, h = img.size
    side = max(w, h)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(img, ((side - w) // 2, (side - h) // 2), img)

    canvas = canvas.resize((TARGET_SIZE, TARGET_SIZE), Image.LANCZOS)
    canvas.save(output_path, "WEBP", quality=90, method=6)


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: process_image.py <input_path> <output_path>", file=sys.stderr)
        return 2
    process(sys.argv[1], sys.argv[2])
    return 0


if __name__ == "__main__":
    sys.exit(main())
