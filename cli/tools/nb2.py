#!/usr/bin/env python3
"""
NB2 CLI — Standalone Nano Banana 2 (Gemini image gen) tool.

Handles all image I/O internally so images never enter the calling agent's
context window. This works around the Claude Code 2000px multi-image limit bug:
https://github.com/anthropics/claude-code/issues/2939

Usage:
    nb2.py generate  --prompt "..." --output out.png [--images a.png b.png] [--size 1K] [--aspect 16:9]
    nb2.py upscale   --input src.png --output dst.png [--size 4K] [--aspect 16:9]
    nb2.py info      --images a.png b.png
    nb2.py composite --layout "..." --output out.png [--images a.png b.png] [--size 1K] [--aspect 16:9]
    nb2.py text      --text "LINE 1\nLINE 2" --output text.png [--font "font name"] [--color "#hex"] [--bg transparent]

Environment:
    GEMINI_API_KEY — required
"""

import argparse
import base64
import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error


API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-3.1-flash-image-preview:generateContent"
)


def get_api_key():
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_AI_API_KEY")
    if not key:
        print("ERROR: GEMINI_API_KEY or GOOGLE_AI_API_KEY env var required", file=sys.stderr)
        sys.exit(1)
    return key


def load_b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def mime_for(path):
    ext = os.path.splitext(path)[1].lower()
    return {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }.get(ext, "image/png")


def get_dimensions(path):
    """Get image dimensions via ImageMagick identify."""
    try:
        r = subprocess.run(
            ["magick", "identify", "-format", "%wx%h", path],
            capture_output=True, text=True, timeout=10
        )
        if r.returncode == 0 and r.stdout.strip():
            return r.stdout.strip()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    return "unknown"


def call_nb2(parts, size="1K", aspect="1:1", timeout=180):
    """Call NB2 API and return the response JSON."""
    api_key = get_api_key()
    url = f"{API_URL}?key={api_key}"

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "imageConfig": {
                "imageSize": size,
                "aspectRatio": aspect,
            },
        },
    }

    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            result = json.loads(resp.read())
        elapsed = time.time() - start
        return result, elapsed
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:500]
        print(f"ERROR: HTTP {e.code} — {body}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)


def extract_image(result, output_path):
    """Extract image from NB2 response, save to disk, return metadata."""
    candidates = result.get("candidates", [])
    if not candidates:
        print("ERROR: No candidates in response", file=sys.stderr)
        print(json.dumps(result)[:500], file=sys.stderr)
        return False

    parts = candidates[0].get("content", {}).get("parts", [])
    text_parts = []
    saved = False

    for part in parts:
        if "inlineData" in part:
            img_data = base64.b64decode(part["inlineData"]["data"])
            os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(img_data)
            saved = True
        elif "text" in part:
            text_parts.append(part["text"])

    if text_parts:
        for t in text_parts:
            print(f"NB2_TEXT: {t[:300]}")

    return saved


def print_info(path):
    """Print image metadata without loading into context."""
    if not os.path.exists(path):
        print(f"  NOT_FOUND: {path}")
        return
    size_kb = os.path.getsize(path) // 1024
    dims = get_dimensions(path)
    print(f"  FILE: {path}")
    print(f"  SIZE: {size_kb}KB")
    print(f"  DIMS: {dims}")


# ── Commands ──────────────────────────────────────────────────────────────


def cmd_generate(args):
    """Generate an image from prompt + optional reference images."""
    parts = []

    # Add input images as inline data
    if args.images:
        for img_path in args.images:
            if not os.path.exists(img_path):
                print(f"ERROR: Image not found: {img_path}", file=sys.stderr)
                sys.exit(1)
            b64 = load_b64(img_path)
            parts.append({"inlineData": {"mimeType": mime_for(img_path), "data": b64}})
            size_kb = os.path.getsize(img_path) // 1024
            print(f"INPUT: {os.path.basename(img_path)} ({size_kb}KB)")

    # Add prompt
    parts.append({"text": args.prompt})

    # Call API
    print(f"GENERATING: size={args.size} aspect={args.aspect}")
    result, elapsed = call_nb2(parts, size=args.size, aspect=args.aspect)

    # Extract and save
    if extract_image(result, args.output):
        size_kb = os.path.getsize(args.output) // 1024
        dims = get_dimensions(args.output)
        print(f"SAVED: {args.output}")
        print(f"OUTPUT_SIZE: {size_kb}KB")
        print(f"OUTPUT_DIMS: {dims}")
        print(f"ELAPSED: {elapsed:.1f}s")
    else:
        print("ERROR: No image in NB2 response", file=sys.stderr)
        sys.exit(1)


def cmd_upscale(args):
    """Upscale an existing image to higher resolution."""
    if not os.path.exists(args.input):
        print(f"ERROR: Input not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    print_info(args.input)

    b64 = load_b64(args.input)
    parts = [
        {"inlineData": {"mimeType": mime_for(args.input), "data": b64}},
        {"text": (
            "Upscale this exact image to higher resolution. Reproduce every element "
            "pixel-perfect. Do not change anything — same layout, same text, same "
            "elements, same colors. Just higher resolution."
        )},
    ]

    print(f"UPSCALING: size={args.size} aspect={args.aspect}")
    result, elapsed = call_nb2(parts, size=args.size, aspect=args.aspect)

    if extract_image(result, args.output):
        size_kb = os.path.getsize(args.output) // 1024
        dims = get_dimensions(args.output)
        print(f"SAVED: {args.output}")
        print(f"OUTPUT_SIZE: {size_kb}KB")
        print(f"OUTPUT_DIMS: {dims}")
        print(f"ELAPSED: {elapsed:.1f}s")
    else:
        print("ERROR: No image in NB2 response", file=sys.stderr)
        sys.exit(1)


def cmd_info(args):
    """Print image metadata without loading images into context."""
    for img_path in args.images:
        print_info(img_path)


def cmd_composite(args):
    """Generate a composite graphic with a structured layout prompt.

    Like generate, but the --layout arg is treated as the primary prompt
    and --images are explicitly labeled as ingredients.
    """
    parts = []

    if args.images:
        for i, img_path in enumerate(args.images, 1):
            if not os.path.exists(img_path):
                print(f"ERROR: Image not found: {img_path}", file=sys.stderr)
                sys.exit(1)
            b64 = load_b64(img_path)
            parts.append({"inlineData": {"mimeType": mime_for(img_path), "data": b64}})
            size_kb = os.path.getsize(img_path) // 1024
            print(f"INPUT_{i}: {os.path.basename(img_path)} ({size_kb}KB)")

    parts.append({"text": args.layout})

    print(f"COMPOSITING: size={args.size} aspect={args.aspect}")
    result, elapsed = call_nb2(parts, size=args.size, aspect=args.aspect)

    if extract_image(result, args.output):
        size_kb = os.path.getsize(args.output) // 1024
        dims = get_dimensions(args.output)
        print(f"SAVED: {args.output}")
        print(f"OUTPUT_SIZE: {size_kb}KB")
        print(f"OUTPUT_DIMS: {dims}")
        print(f"ELAPSED: {elapsed:.1f}s")
    else:
        print("ERROR: No image in NB2 response", file=sys.stderr)
        sys.exit(1)


def cmd_text(args):
    """Render text using a real system font via Pillow.

    Produces a PNG with the exact font rendering that can be fed into NB2
    as an ingredient image so the final graphic matches the real typeface.
    Runs via `uv run --with Pillow` to avoid install issues.
    """
    # We shell out to a Pillow script via uv to handle font rendering
    text = args.text.replace("\\n", "\n")

    script = f'''
import sys
from PIL import Image, ImageDraw, ImageFont

text = {repr(text)}
font_path = {repr(args.font)}
color = {repr(args.color)}
bg = {repr(args.bg)}
pointsize = {args.pointsize}
padding = {args.padding}
interline = {args.interline}
output = {repr(args.output)}

# Load font
try:
    font = ImageFont.truetype(font_path, pointsize)
except OSError:
    print(f"ERROR: Cannot load font: {{font_path}}", file=sys.stderr)
    sys.exit(1)

# Measure text
lines = text.split("\\n")
dummy = Image.new("RGBA", (1, 1))
draw = ImageDraw.Draw(dummy)

line_bboxes = []
total_height = 0
max_width = 0
for i, line in enumerate(lines):
    bbox = draw.textbbox((0, 0), line, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    line_bboxes.append((w, h, bbox[1]))  # width, height, y_offset
    max_width = max(max_width, w)
    total_height += h
    if i > 0:
        total_height += interline

# Create image
img_w = max_width + padding * 2
img_h = total_height + padding * 2

if bg == "transparent":
    img = Image.new("RGBA", (img_w, img_h), (0, 0, 0, 0))
else:
    # Parse hex color
    bg_hex = bg.lstrip("#")
    bg_rgb = tuple(int(bg_hex[i:i+2], 16) for i in (0, 2, 4))
    img = Image.new("RGBA", (img_w, img_h), bg_rgb + (255,))

draw = ImageDraw.Draw(img)

# Parse text color
c_hex = color.lstrip("#")
c_rgb = tuple(int(c_hex[i:i+2], 16) for i in (0, 2, 4))

# Draw lines centered
y_cursor = padding
for i, line in enumerate(lines):
    w, h, y_off = line_bboxes[i]
    x = (img_w - w) // 2
    draw.text((x, y_cursor - y_off), line, font=font, fill=c_rgb + (255,))
    y_cursor += h + interline

img.save(output, "PNG")
print(f"OK {{img_w}}x{{img_h}}")
'''

    print(f"FONT: {args.font}")
    print(f"TEXT: {repr(text)}")
    print(f"COLOR: {args.color} on {args.bg}")
    print(f"SIZE: {args.pointsize}pt")

    r = subprocess.run(
        ["uv", "run", "--with", "Pillow", "python3", "-c", script],
        capture_output=True, text=True, timeout=30,
    )

    if r.returncode != 0:
        print(f"ERROR: {r.stderr.strip()}", file=sys.stderr)
        sys.exit(1)

    print(f"PILLOW: {r.stdout.strip()}")

    if os.path.exists(args.output):
        size_kb = os.path.getsize(args.output) // 1024
        dims = get_dimensions(args.output)
        print(f"SAVED: {args.output}")
        print(f"OUTPUT_SIZE: {size_kb}KB")
        print(f"OUTPUT_DIMS: {dims}")
    else:
        print("ERROR: Output not created", file=sys.stderr)
        sys.exit(1)


# ── CLI Parser ────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(
        description="NB2 CLI — Standalone Gemini image gen tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # generate
    gen = sub.add_parser("generate", help="Generate image from prompt + optional refs")
    gen.add_argument("--prompt", "-p", required=True, help="Generation prompt")
    gen.add_argument("--output", "-o", required=True, help="Output image path")
    gen.add_argument("--images", "-i", nargs="*", default=[], help="Input reference images")
    gen.add_argument("--size", "-s", default="1K", choices=["512", "1K", "2K", "4K"])
    gen.add_argument("--aspect", "-a", default="1:1", help="Aspect ratio (e.g. 16:9, 3:4)")

    # upscale
    up = sub.add_parser("upscale", help="Upscale image to higher resolution")
    up.add_argument("--input", required=True, help="Source image path")
    up.add_argument("--output", "-o", required=True, help="Output image path")
    up.add_argument("--size", "-s", default="4K", choices=["512", "1K", "2K", "4K"])
    up.add_argument("--aspect", "-a", default="16:9", help="Aspect ratio to lock")

    # info
    inf = sub.add_parser("info", help="Print image metadata (no context loading)")
    inf.add_argument("--images", "-i", nargs="+", required=True, help="Image paths")

    # composite
    comp = sub.add_parser("composite", help="Composite graphic from layout + ingredient images")
    comp.add_argument("--layout", "-l", required=True, help="Layout/composition prompt")
    comp.add_argument("--output", "-o", required=True, help="Output image path")
    comp.add_argument("--images", "-i", nargs="*", default=[], help="Ingredient images")
    comp.add_argument("--size", "-s", default="1K", choices=["512", "1K", "2K", "4K"])
    comp.add_argument("--aspect", "-a", default="16:9", help="Aspect ratio")

    # text
    txt = sub.add_parser("text", help="Render text with real font via ImageMagick")
    txt.add_argument("--text", "-t", required=True, help="Text to render (use \\n for newlines)")
    txt.add_argument("--output", "-o", required=True, help="Output PNG path")
    txt.add_argument("--font", "-f", default="TitlingGothicFB-Wide-Black",
                     help="Font name (fc-list name or path)")
    txt.add_argument("--color", "-c", default="#1a1a1a", help="Text color (hex)")
    txt.add_argument("--bg", default="transparent", help="Background color or 'transparent'")
    txt.add_argument("--pointsize", type=int, default=120, help="Font size in points")
    txt.add_argument("--padding", type=int, default=40, help="Padding around text in px")
    txt.add_argument("--interline", type=int, default=0, help="Interline spacing in px")

    args = parser.parse_args()

    if args.command == "generate":
        cmd_generate(args)
    elif args.command == "upscale":
        cmd_upscale(args)
    elif args.command == "info":
        cmd_info(args)
    elif args.command == "composite":
        cmd_composite(args)
    elif args.command == "text":
        cmd_text(args)


if __name__ == "__main__":
    main()
