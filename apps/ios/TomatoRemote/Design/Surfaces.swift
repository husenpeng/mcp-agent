//
//  Surfaces.swift
//  Tomato Remote
//
//  The tomato palette, carried over from client-monorepo's `packages/ui/src/styles`
//  (colors.css / tokens.css). `Tokens.swift` is generated from the harness's
//  `design-platform.css`, whose borders are black at 4–16 % alpha and whose
//  radii follow a different scale; those read flat on a phone and did not match
//  the product's own design language.
//
//  This file is the app's hand-curated layer: solid warm-neutral hairlines,
//  brand-soft fills, container/on-container status pairs, the tomato radius
//  scale (8/16/24/32), and warm-slate shadows. Values mirror client-monorepo
//  where it defines them; the dark counterparts follow the same perceptual
//  logic because that repository only ships a light theme.
//

import SwiftUI

/// Solid hairlines and dividers. A warm neutral line reads richer than a black
/// alpha wash and stays stable over gradients, cards, and glass.
enum TomatoLine {
    /// Default 1 px card edge and row divider.
    static let hairline = tomatoDynamic(
        light: Color(.sRGB, red: 0xE8 / 255, green: 0xE6 / 255, blue: 0xE3 / 255, opacity: 1),
        dark: Color(.sRGB, red: 240 / 255, green: 242 / 255, blue: 244 / 255, opacity: 0.10)
    )
    /// A stronger edge for controls that must read as an object (chips, fields).
    static let strong = tomatoDynamic(
        light: Color(.sRGB, red: 0xC5 / 255, green: 0xC7 / 255, blue: 0xC9 / 255, opacity: 1),
        dark: Color(.sRGB, red: 240 / 255, green: 242 / 255, blue: 244 / 255, opacity: 0.16)
    )
    /// Brand-tinted edge for a soft brand surface.
    static let brandSoft = tomatoDynamic(
        light: Color(.sRGB, red: 255 / 255, green: 40 / 255, blue: 40 / 255, opacity: 0.28),
        dark: Color(.sRGB, red: 1, green: 0.33, blue: 0.29, opacity: 0.34)
    )
}

/// Warm-neutral fills, from the tomato surface ladder.
enum TomatoSurface {
    /// The page behind a scroll of cards.
    static let page = tomatoDynamic(
        light: Color(.sRGB, red: 0xFA / 255, green: 0xFA / 255, blue: 0xF8 / 255, opacity: 1),
        dark: Color(.sRGB, red: 0.098, green: 0.1059, blue: 0.1098, opacity: 1)
    )
    /// A raised card sitting on the page.
    static let card = tomatoDynamic(
        light: Color(.sRGB, red: 1, green: 1, blue: 1, opacity: 1),
        dark: Color(.sRGB, red: 0.1294, green: 0.1412, blue: 0.1451, opacity: 1)
    )
    /// A recessed block inside a card (rows, wells, chips).
    static let variant = tomatoDynamic(
        light: Color(.sRGB, red: 0xF5 / 255, green: 0xF4 / 255, blue: 0xF2 / 255, opacity: 1),
        dark: Color(.sRGB, red: 0.1804, green: 0.1922, blue: 0.1961, opacity: 1)
    )
    /// A very quiet tint for grouping without a border.
    static let subtle = tomatoDynamic(
        light: Color(.sRGB, red: 0xF5 / 255, green: 0xF4 / 255, blue: 0xF2 / 255, opacity: 1),
        dark: Color(.sRGB, red: 0.1451, green: 0.1569, blue: 0.1608, opacity: 1)
    )
    /// Separates temporary navigation chrome from the work underneath it.
    static let scrim = tomatoDynamic(
        light: Color.black.opacity(0.08),
        dark: Color.black.opacity(0.32)
    )
}

/// Container / on-container pairs: a status surface plus the text that sits on
/// it. Pairing both keeps contrast right in each appearance, which a raw
/// `tint.opacity()` wash cannot guarantee.
enum TomatoContainer {
    struct Pair: Sendable {
        let fill: Color
        let label: Color
    }

    static let primary = Pair(
        fill: tomatoDynamic(
            light: Color(.sRGB, red: 0xFF / 255, green: 0xE9 / 255, blue: 0xE9 / 255, opacity: 1),
            dark: Color(.sRGB, red: 1, green: 0.33, blue: 0.29, opacity: 0.16)
        ),
        label: tomatoDynamic(
            light: Color(.sRGB, red: 0x4A / 255, green: 0x05 / 255, blue: 0x05 / 255, opacity: 1),
            dark: Color(.sRGB, red: 1, green: 0.5373, blue: 0.4902, opacity: 1)
        )
    )

    static let success = Pair(
        fill: tomatoDynamic(
            light: Color(.sRGB, red: 0xCD / 255, green: 0xF8 / 255, blue: 0xD3 / 255, opacity: 1),
            dark: Color(.sRGB, red: 0.31, green: 0.75, blue: 0.36, opacity: 0.18)
        ),
        label: tomatoDynamic(
            light: Color(.sRGB, red: 0x17 / 255, green: 0x78 / 255, blue: 0x41 / 255, opacity: 1),
            dark: Color(.sRGB, red: 0.31, green: 0.749, blue: 0.3647, opacity: 1)
        )
    )

    static let warning = Pair(
        fill: tomatoDynamic(
            light: Color(.sRGB, red: 0xFC / 255, green: 0xF4 / 255, blue: 0xDD / 255, opacity: 1),
            dark: Color(.sRGB, red: 0.9843, green: 0.7451, blue: 0, opacity: 0.16)
        ),
        label: tomatoDynamic(
            light: Color(.sRGB, red: 0x8F / 255, green: 0x67 / 255, blue: 0x00 / 255, opacity: 1),
            dark: Color(.sRGB, red: 0.9843, green: 0.7451, blue: 0, opacity: 1)
        )
    )

    static let info = Pair(
        fill: tomatoDynamic(
            light: Color(.sRGB, red: 0xE7 / 255, green: 0xF4 / 255, blue: 0xFF / 255, opacity: 1),
            dark: Color(.sRGB, red: 0.4784, green: 0.6667, blue: 1, opacity: 0.16)
        ),
        label: tomatoDynamic(
            light: Color(.sRGB, red: 0x03 / 255, green: 0x6D / 255, blue: 0xC6 / 255, opacity: 1),
            dark: Color(.sRGB, red: 0.4784, green: 0.6667, blue: 1, opacity: 1)
        )
    )

    static let error = Pair(
        fill: tomatoDynamic(
            light: Color(.sRGB, red: 0xFE / 255, green: 0xF2 / 255, blue: 0xF2 / 255, opacity: 1),
            dark: Color(.sRGB, red: 1, green: 0.5373, blue: 0.4902, opacity: 0.16)
        ),
        label: tomatoDynamic(
            light: Color(.sRGB, red: 0x4F / 255, green: 0x09 / 255, blue: 0x0B / 255, opacity: 1),
            dark: Color(.sRGB, red: 1, green: 0.5373, blue: 0.4902, opacity: 1)
        )
    )

    static let neutral = Pair(
        fill: tomatoDynamic(
            light: Color(.sRGB, red: 0xF3 / 255, green: 0xF4 / 255, blue: 0xF6 / 255, opacity: 1),
            dark: Color(.sRGB, red: 240 / 255, green: 242 / 255, blue: 244 / 255, opacity: 0.10)
        ),
        label: tomatoDynamic(
            light: Color(.sRGB, red: 0x5C / 255, green: 0x5F / 255, blue: 0x60 / 255, opacity: 1),
            dark: Color(.sRGB, red: 0.6275, green: 0.6392, blue: 0.6471, opacity: 1)
        )
    )
}

/// The Tomato corner scale. Content cards stay quieter than the single hero.
enum TomatoCorner {
    /// Chips, tags, small indicators.
    static let chip = TomatoRadius.sm
    /// Fields, buttons, inline wells.
    static let control: CGFloat = 16
    /// A grouped card or substantial list row. Tighter than the previous 20pt
    /// so lists read as rows rather than a stack of heavy panels.
    static let card: CGFloat = 16
    /// The one hero card on a screen.
    static let hero: CGFloat = 20
}

/// Warm-slate shadows. Pure black at low alpha leaves a grey halo on a warm
/// surface; these mirror client-monorepo's `--tomato-shadow-*` presets.
enum TomatoShadow {
    /// Minimum lift for a card on the page.
    static let flat = (color: Color(.sRGB, red: 17 / 255, green: 24 / 255, blue: 39 / 255, opacity: 0.025), radius: CGFloat(2), y: CGFloat(1))
    /// A card raised above the page.
    static let raised = (color: Color(.sRGB, red: 17 / 255, green: 24 / 255, blue: 39 / 255, opacity: 0.07), radius: CGFloat(12), y: CGFloat(4))
    /// Floating chrome (the destination ball, a dock).
    static let floating = (color: Color(.sRGB, red: 17 / 255, green: 24 / 255, blue: 39 / 255, opacity: 0.10), radius: CGFloat(20), y: CGFloat(8))
}

/// The brand's soft fill, used behind a selected or emphasised block.
enum TomatoBrand {
    static let soft = tomatoDynamic(
        light: Color(.sRGB, red: 255 / 255, green: 40 / 255, blue: 40 / 255, opacity: 0.08),
        dark: Color(.sRGB, red: 1, green: 0.33, blue: 0.29, opacity: 0.14)
    )
    static let softBorder = TomatoLine.brandSoft
    /// Fill of the one solid primary action on a screen.
    static let solid = tomatoDynamic(
        light: Color(.sRGB, red: 0xFF / 255, green: 0x28 / 255, blue: 0x28 / 255, opacity: 1),
        dark: Color(.sRGB, red: 0.7176, green: 0.0863, blue: 0.0863, opacity: 1)
    )
}

/// Resolve one token to the appearance the system currently asks for.
/// Mirrors the helper the generated token file uses, kept private to this file.
private func tomatoDynamic(light: Color, dark: Color) -> Color {
    Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
    })
}