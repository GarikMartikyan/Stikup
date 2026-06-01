#!/usr/bin/env python3
"""Split a grid of stickers on a green background into individual WebP files."""

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def remove_green_background(bgr: np.ndarray) -> np.ndarray:
    """Chroma-key the green background out, returning a BGRA image."""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    lower = np.array([35, 40, 40], dtype=np.uint8)
    upper = np.array([85, 255, 255], dtype=np.uint8)
    green_mask = cv2.inRange(hsv, lower, upper)

    kernel = np.ones((3, 3), np.uint8)
    green_mask = cv2.morphologyEx(green_mask, cv2.MORPH_OPEN, kernel)
    green_mask = cv2.morphologyEx(green_mask, cv2.MORPH_CLOSE, kernel)

    alpha = cv2.bitwise_not(green_mask)

    # Suppress green spill on sticker edges.
    b, g, r = cv2.split(bgr)
    spill = (g.astype(np.int32) > b.astype(np.int32)) & (g.astype(np.int32) > r.astype(np.int32))
    g[spill] = np.maximum(b[spill], r[spill])
    bgr_clean = cv2.merge([b, g, r])

    rgba = cv2.cvtColor(bgr_clean, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = alpha
    return rgba


def crop_to_content(rgba: np.ndarray, padding: int = 4) -> np.ndarray:
    alpha = rgba[:, :, 3]
    ys, xs = np.where(alpha > 10)
    if len(xs) == 0 or len(ys) == 0:
        return rgba
    h, w = rgba.shape[:2]
    x0 = max(int(xs.min()) - padding, 0)
    x1 = min(int(xs.max()) + padding + 1, w)
    y0 = max(int(ys.min()) - padding, 0)
    y1 = min(int(ys.max()) + padding + 1, h)
    return rgba[y0:y1, x0:x1]


def fit_into_square(rgba: np.ndarray, size: int) -> Image.Image:
    """Resize keeping aspect ratio, then center on a transparent size x size canvas."""
    h, w = rgba.shape[:2]
    scale = size / max(h, w)
    new_w = max(1, int(round(w * scale)))
    new_h = max(1, int(round(h * scale)))
    resized = cv2.resize(rgba, (new_w, new_h), interpolation=cv2.INTER_AREA)

    rgba_rgb = cv2.cvtColor(resized, cv2.COLOR_BGRA2RGBA)
    sticker = Image.fromarray(rgba_rgb, mode="RGBA")

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    off_x = (size - new_w) // 2
    off_y = (size - new_h) // 2
    canvas.paste(sticker, (off_x, off_y), sticker)
    return canvas


def find_stickers(rgba: np.ndarray, expected: int, min_area_frac: float = 0.005):
    """Find each sticker as a (bbox, per-sticker mask) pair.

    Progressively erodes the alpha mask to break thin bridges where adjacent
    stickers touch. The component label is then dilated back out and intersected
    with the original mask so neighbours never bleed into the crop.

    Returns a list of (x, y, w, h, mask) where mask covers the full image.
    """
    alpha = rgba[:, :, 3]
    base_mask = (alpha > 10).astype(np.uint8) * 255

    close_kernel = np.ones((5, 5), np.uint8)
    base_mask = cv2.morphologyEx(base_mask, cv2.MORPH_CLOSE, close_kernel)

    total_area = base_mask.shape[0] * base_mask.shape[1]
    min_area = int(total_area * min_area_frac)

    chosen_erosion = 0
    chosen_labels = None
    chosen_stats = None
    chosen_keep = []
    for erosion in (0, 3, 5, 7, 10, 14, 20, 28):
        if erosion > 0:
            mask = cv2.erode(base_mask, np.ones((erosion, erosion), np.uint8))
        else:
            mask = base_mask

        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
        keep = [i for i in range(1, num_labels) if stats[i, cv2.CC_STAT_AREA] >= min_area]
        chosen_erosion = erosion
        chosen_labels = labels
        chosen_stats = stats
        chosen_keep = keep
        if len(keep) >= expected:
            break

    chosen_keep.sort(key=lambda i: chosen_stats[i, cv2.CC_STAT_AREA], reverse=True)
    chosen_keep = chosen_keep[:expected]

    # Dilation must at least recover the erosion radius so the sticker is whole.
    dilate_size = max(chosen_erosion + 4, 5)
    dilate_kernel = np.ones((dilate_size, dilate_size), np.uint8)

    results = []
    for i in chosen_keep:
        single = (chosen_labels == i).astype(np.uint8) * 255
        single = cv2.dilate(single, dilate_kernel)
        single = cv2.bitwise_and(single, base_mask)

        ys, xs = np.where(single > 0)
        if len(xs) == 0:
            continue
        x, y = int(xs.min()), int(ys.min())
        w, h = int(xs.max()) - x + 1, int(ys.max()) - y + 1
        results.append((x, y, w, h, single))
    return results


def sort_row_major(items, row_tolerance_frac: float = 0.5):
    """Sort (x, y, w, h, ...) items top-to-bottom, then left-to-right within each row."""
    if not items:
        return []
    heights = [it[3] for it in items]
    tol = (sum(heights) / len(heights)) * row_tolerance_frac

    by_y = sorted(items, key=lambda it: it[1])
    rows = []
    current = [by_y[0]]
    current_y = by_y[0][1]
    for it in by_y[1:]:
        if abs(it[1] - current_y) <= tol:
            current.append(it)
        else:
            rows.append(current)
            current = [it]
            current_y = it[1]
    rows.append(current)

    ordered = []
    for row in rows:
        ordered.extend(sorted(row, key=lambda it: it[0]))
    return ordered


def keep_largest_component(rgba: np.ndarray) -> np.ndarray:
    """Zero the alpha of everything except the largest opaque blob.

    Used by the geometric splitter so a sliver of a neighbouring sticker that
    bleeds across a cell boundary does not end up in this cell's crop.
    """
    alpha = rgba[:, :, 3]
    mask = (alpha > 10).astype(np.uint8)
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if num_labels <= 1:
        return rgba
    largest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    out = rgba.copy()
    out[:, :, 3] = np.where(labels == largest, alpha, 0).astype(np.uint8)
    return out


def split_grid_geometric(
    image_path: Path,
    output_dir: Path,
    rows: int,
    cols: int,
    size: int,
    overlap: float = 0.08,
) -> None:
    """Split a KNOWN rows x cols grid into exactly rows*cols stickers.

    Deterministic by construction: the sheet is diced into a regular grid of
    cells (each grown by `overlap` so a figure slightly larger than its cell is
    not clipped), green is keyed out per cell, and only the largest blob in each
    cell is kept. Always emits rows*cols files — robust to adjacent figures
    whose outlines touch (which defeats content-based connected components).
    """
    bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if bgr is None:
        raise FileNotFoundError(f"Could not read image: {image_path}")

    full_rgba = remove_green_background(bgr)
    H, W = full_rgba.shape[:2]
    pad_x = int((W / cols) * overlap)
    pad_y = int((H / rows) * overlap)

    output_dir.mkdir(parents=True, exist_ok=True)
    stem = image_path.stem

    idx = 0
    for r in range(rows):
        for c in range(cols):
            idx += 1
            y0 = max(r * H // rows - pad_y, 0)
            y1 = min((r + 1) * H // rows + pad_y, H)
            x0 = max(c * W // cols - pad_x, 0)
            x1 = min((c + 1) * W // cols + pad_x, W)
            cell = keep_largest_component(full_rgba[y0:y1, x0:x1].copy())
            # Skip an essentially-empty cell (model under-drew this slot) so the
            # output count reflects real faces and the caller can reject a bad
            # generation instead of shipping a blank sticker.
            cell_alpha = cell[:, :, 3]
            if int((cell_alpha > 10).sum()) < 0.02 * cell_alpha.size:
                print(f"Skipping empty cell {idx:02d}")
                continue
            sticker = fit_into_square(crop_to_content(cell), size)
            out_path = output_dir / f"{stem}_{idx:02d}.webp"
            sticker.save(out_path, format="WEBP", lossless=True, quality=100)
            print(f"Wrote {out_path}")


def split_grid(image_path: Path, output_dir: Path, rows: int, cols: int, size: int) -> None:
    bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if bgr is None:
        raise FileNotFoundError(f"Could not read image: {image_path}")

    full_rgba = remove_green_background(bgr)
    expected = rows * cols

    stickers = find_stickers(full_rgba, expected=expected)
    if len(stickers) != expected:
        print(f"Warning: expected {expected} stickers, found {len(stickers)}")
    stickers = sort_row_major(stickers)

    output_dir.mkdir(parents=True, exist_ok=True)
    stem = image_path.stem

    pad = 6
    H, W = full_rgba.shape[:2]
    for idx, (x, y, w, h, mask) in enumerate(stickers, start=1):
        x0 = max(x - pad, 0)
        y0 = max(y - pad, 0)
        x1 = min(x + w + pad, W)
        y1 = min(y + h + pad, H)
        crop = full_rgba[y0:y1, x0:x1].copy()
        # Suppress neighbouring stickers that fall inside the bbox.
        crop_mask = mask[y0:y1, x0:x1]
        crop[:, :, 3] = np.minimum(crop[:, :, 3], crop_mask)

        sticker = fit_into_square(crop, size)
        out_path = output_dir / f"{stem}_{idx:02d}.webp"
        sticker.save(out_path, format="WEBP", lossless=True, quality=100)
        print(f"Wrote {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Split a grid of stickers on a green background into individual WebP files."
    )
    parser.add_argument("input", type=Path, help="Path to the input grid image")
    parser.add_argument(
        "-o", "--output", type=Path, default=Path("stickers"),
        help="Output directory (default: ./stickers)",
    )
    parser.add_argument("--rows", type=int, default=3, help="Grid rows (default: 3)")
    parser.add_argument("--cols", type=int, default=4, help="Grid columns (default: 4)")
    parser.add_argument("--size", type=int, default=512, help="Output square size in pixels (default: 512)")
    parser.add_argument(
        "--grid",
        action="store_true",
        help="Geometric rows x cols tiling (deterministic count) instead of content-based detection",
    )
    args = parser.parse_args()

    if args.grid:
        split_grid_geometric(args.input, args.output, args.rows, args.cols, args.size)
    else:
        split_grid(args.input, args.output, args.rows, args.cols, args.size)


if __name__ == "__main__":
    main()
