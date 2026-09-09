#!/usr/bin/env python3

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/home/ubuntu/upload/logoGlobalLogix.png")
ASSETS = ROOT / "assets" / "images"


def transparent_black_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = []
    for red, green, blue, alpha in rgba.getdata():
        if alpha and red <= 6 and green <= 6 and blue <= 6:
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, alpha))
    rgba.putdata(pixels)
    return rgba


def contain(image: Image.Image, size: int, padding: int, background: tuple[int, int, int, int]) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), background)
    max_edge = size - (padding * 2)
    image.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
    left = (size - image.width) // 2
    top = (size - image.height) // 2
    canvas.alpha_composite(image, (left, top))
    return canvas


def save_png(image: Image.Image, filename: str) -> None:
    image.save(ASSETS / filename, "PNG", optimize=True)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Logo source introuvable : {SOURCE}")
    ASSETS.mkdir(parents=True, exist_ok=True)

    original = Image.open(SOURCE)
    cleaned = transparent_black_background(original)
    interface_logo = cleaned.copy()
    interface_logo.thumbnail((960, 640), Image.Resampling.LANCZOS)
    save_png(interface_logo, "globallogix-logo.png")

    brand_blue = (0, 63, 135, 255)
    icon = contain(cleaned.copy(), 1024, 72, brand_blue)
    save_png(icon, "icon.png")
    save_png(icon, "splash-icon.png")
    save_png(contain(cleaned.copy(), 256, 18, brand_blue), "favicon.png")

    foreground = contain(cleaned.copy(), 432, 28, (0, 0, 0, 0))
    save_png(foreground, "android-icon-foreground.png")


if __name__ == "__main__":
    main()
