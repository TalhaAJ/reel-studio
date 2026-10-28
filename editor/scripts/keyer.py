"""Green-screen keyer tuned for this setup.

alpha comes from "green dominance" (G - max(R, B)): the screen is strongly green,
while skin, hair and the grey jumper are not, so they survive intact.
"""
import numpy as np

T_LO, T_HI = 22.0, 50.0   # dominance below T_LO = fully opaque, above T_HI = fully transparent
WALL_Y = 380              # everything above this (white wall, clamp) is masked out (garbage matte)


def key(rgb: np.ndarray) -> np.ndarray:
    """rgb: HxWx3 uint8 -> HxWx4 uint8 (straight alpha, despilled)."""
    f = rgb.astype(np.float32)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    rb = np.maximum(r, b)
    dom = g - rb
    a = 1.0 - np.clip((dom - T_LO) / (T_HI - T_LO), 0.0, 1.0)

    # soften the edge a touch (3x3 box blur), then pull it in so no green halo remains
    p = np.pad(a, 1, mode="edge")
    a = sum(p[dy:dy + a.shape[0], dx:dx + a.shape[1]] for dy in range(3) for dx in range(3)) / 9.0
    a = np.clip((a - 0.15) / 0.85, 0.0, 1.0)
    a[:WALL_Y] = 0.0

    # despill: green may not exceed the brighter of red/blue
    g = np.minimum(g, rb + 6.0)
    out = np.empty(rgb.shape[:2] + (4,), np.uint8)
    out[..., 0] = r.astype(np.uint8)
    out[..., 1] = np.clip(g, 0, 255).astype(np.uint8)
    out[..., 2] = b.astype(np.uint8)
    out[..., 3] = (a * 255).astype(np.uint8)
    return out


if __name__ == "__main__":
    import sys
    from PIL import Image
    src, dst = sys.argv[1], sys.argv[2]
    k = Image.fromarray(key(np.asarray(Image.open(src).convert("RGB"))))
    bg = Image.new("RGBA", k.size, (224, 64, 96, 255))
    bg.alpha_composite(k)
    bg.convert("RGB").resize((540, 960)).save(dst)
