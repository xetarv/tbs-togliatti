"""Bake the original TBS fastback body into a local mesh asset.

Run from any directory: python tools/build_hero_car.py
Use --output PATH to generate a comparison file without replacing the asset.
No third-party models or Python dependencies are required.
"""

import argparse
import json
import math
from pathlib import Path


STATIONS = [
    (-2.9, 1.08, 1.04),
    (-2.65, 1.28, 1.15),
    (-2.1, 1.55, 1.29),
    (-1.55, 1.54, 1.38),
    (-0.7, 1.32, 1.37),
    (0.45, 1.32, 1.38),
    (1.45, 1.54, 1.39),
    (2.15, 1.55, 1.35),
    (2.65, 1.28, 1.25),
    (2.9, 1.12, 1.15),
]


def profile(z, component):
    """Interpolate body half-width (1) or height (2) along its length."""
    index = 0
    while index < len(STATIONS) - 2 and z > STATIONS[index + 1][0]:
        index += 1
    t = (z - STATIONS[index][0]) / (STATIONS[index + 1][0] - STATIONS[index][0])
    a, b, c, d = [
        STATIONS[station][component]
        for station in (
            max(0, index - 1),
            index,
            index + 1,
            min(len(STATIONS) - 1, index + 2),
        )
    ]
    return 0.5 * (
        2 * b
        + (-a + c) * t
        + (2 * a - 5 * b + 4 * c - d) * t * t
        + (-a + 3 * b - 3 * c + d) * t * t * t
    )


def create_panel(name, material, columns, rows, sample_point, flip=False):
    """Sample one surface into vertices, UV coordinates and triangle indices."""
    positions, uvs, indices = [], [], []
    for row in range(rows + 1):
        for column in range(columns + 1):
            positions.extend(round(value, 5) for value in sample_point(column / columns, row / rows))
            uvs.extend((round(column / columns, 5), round(row / rows, 5)))
            if column < columns and row < rows:
                a = row * (columns + 1) + column
                b = a + 1
                c = a + columns + 1
                d = c + 1
                indices.extend((a, b, c, b, d, c) if flip else (a, c, b, b, c, d))
    return {
        "name": name,
        "material": material,
        "position": positions,
        "uv": uvs,
        "index": indices,
    }


def side_point(u, v, side):
    z = -2.9 + 5.8 * v
    width = profile(z, 1)
    height = profile(z, 2)
    axle_distance = min(abs(z - 1.75), abs(z + 1.75))
    low = (
        max(0.45, 0.52 + math.sqrt(max(0, 0.635**2 - axle_distance * axle_distance)))
        if axle_distance < 0.635
        else 0.45
    )
    inset = (
        0.11 - 0.085 * math.sqrt(max(0, 1 - (axle_distance / 0.635) ** 2))
        if axle_distance < 0.635
        else 0.11
    )
    return (
        side * (width - inset * (1 - u) ** 2 + 0.017 * math.sin(u * math.pi)),
        low + (height - low) * u,
        z,
    )


def build_mesh():
    """Build deterministic body panels without writing files or sharing state."""
    panels = []
    for side in (-1, 1):
        panels.append(create_panel(
            f"sculpted-flank-{side}", "paint", 14, 160,
            lambda u, v, s=side: side_point(u, v, s), side > 0,
        ))
        panels.append(create_panel(
            f"shoulder-{side}", "paint", 12, 64,
            lambda u, v, s=side: (
                s * (1.10 + (profile(-1.5 + 3.15 * v, 1) - 1.10) * u),
                profile(-1.5 + 3.15 * v, 2) + 0.055 * math.sin(u * math.pi),
                -1.5 + 3.15 * v,
            ),
            side < 0,
        ))

    for name, front, back in (("bonnet", -2.9, -1.5), ("rear-deck", 1.65, 2.9)):
        panels.append(create_panel(
            name, "paint", 40, 38,
            lambda u, v, a=front, b=back: (
                (u * 2 - 1) * profile(a + (b - a) * v, 1),
                profile(a + (b - a) * v, 2) + 0.055 * (1 - (u * 2 - 1) ** 2),
                a + (b - a) * v,
            ),
        ))

    # Curved roof and glass use the same axle/body dimensions as the driving model.
    panels.append(create_panel(
        "roof", "roof", 32, 32,
        lambda u, v: (
            (u * 2 - 1) * (0.98 - 0.045 * (2 * v - 1) ** 2),
            2.035 + 0.075 * (1 - (u * 2 - 1) ** 2) + 0.035 * math.sin(v * math.pi),
            -0.72 + 1.45 * v,
        ),
    ))
    panels.append(create_panel(
        "windshield", "glass", 32, 20,
        lambda u, v: (
            (u * 2 - 1) * (1.11 - 0.18 * v),
            1.43 + 0.615 * v + 0.04 * math.sin(v * math.pi) + 0.065 * (1 - (u * 2 - 1) ** 2) * v,
            -1.50 + 0.78 * v - 0.065 * (1 - (u * 2 - 1) ** 2) * math.sin(v * math.pi),
        ),
    ))
    panels.append(create_panel(
        "rear-glass", "glass", 32, 22,
        lambda u, v: (
            (u * 2 - 1) * (0.94 + 0.17 * v),
            2.045 - 0.61 * v + 0.02 * math.sin(v * math.pi) + 0.065 * (1 - (u * 2 - 1) ** 2) * (1 - v),
            0.73 + 0.92 * v + 0.035 * (1 - (u * 2 - 1) ** 2) * math.sin(v * math.pi),
        ),
    ))
    for side in (-1, 1):
        def side_window(u, v, s=side):
            z_bottom = -1.45 + 3.05 * v
            z_top = -0.68 + 1.38 * v
            return (
                s * (1.115 - 0.17 * u + 0.018 * math.sin(v * math.pi)),
                1.425 + 0.61 * u + 0.035 * math.sin(v * math.pi) * u,
                z_bottom * (1 - u) + z_top * u,
            )

        panels.append(create_panel(
            f"side-glass-{side}", "glass", 14, 36, side_window, side > 0,
        ))

    # Rounded nose/tail panels; the runtime model supplies the lower valances.
    for side in (-1, 1):
        panels.append(create_panel(
            f"end-cap-{side}", "paint", 40, 10,
            lambda u, v, s=side: (
                (u * 2 - 1) * 1.11,
                0.96 + v * (0.08 if s < 0 else 0.19),
                s * (2.90 + 0.055 * (1 - (u * 2 - 1) ** 2)),
            ),
            side < 0,
        ))

    return {"name": "TBS Fastback 063", "stations": STATIONS, "panels": panels}


def main():
    default_output = Path(__file__).resolve().parents[1] / "assets" / "tbs-fastback-mesh.js"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=default_output)
    output = parser.parse_args().output
    mesh = build_mesh()
    content = (
        "/* Original TBS fastback mesh; generated by tools/build_hero_car.py. */\n"
        "window.TBS_FASTBACK_MESH=" + json.dumps(mesh, separators=(",", ":")) + ";\n"
    )
    output.write_text(content, encoding="utf-8", newline="\n")
    vertices = sum(len(panel["position"]) // 3 for panel in mesh["panels"])
    triangles = sum(len(panel["index"]) // 3 for panel in mesh["panels"])
    print(f"{output.name}: {vertices} vertices, {triangles} triangles")


if __name__ == "__main__":
    main()
