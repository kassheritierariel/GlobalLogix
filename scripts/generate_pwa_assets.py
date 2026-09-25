from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "images" / "icon.png"
OUTPUT = ROOT / "public" / "pwa"
BLUE = (0, 63, 135, 255)


def save_square(source: Image.Image, size: int, name: str) -> None:
    source.resize((size, size), Image.Resampling.LANCZOS).save(OUTPUT / name, optimize=True)


def save_maskable(source: Image.Image) -> None:
    canvas = Image.new("RGBA", (512, 512), BLUE)
    safe = source.resize((410, 410), Image.Resampling.LANCZOS)
    canvas.alpha_composite(safe, ((512 - safe.width) // 2, (512 - safe.height) // 2))
    canvas.convert("RGB").save(OUTPUT / "icon-maskable-512.png", optimize=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")
    save_square(source, 192, "icon-192.png")
    save_square(source, 512, "icon-512.png")
    save_square(source, 180, "apple-touch-icon.png")
    save_maskable(source)


if __name__ == "__main__":
    main()
