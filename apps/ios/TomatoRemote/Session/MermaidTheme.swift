//
//  MermaidTheme.swift
//  Tomato Remote
//
//  Mermaid's base theme, expressed with the app's own tokens.
//
//  `theme: 'base'` is the only Mermaid theme that accepts every colour; the
//  named themes ignore most of them. Values are read from the generated token
//  table at render time, so a token change reaches diagrams too, and a dark
//  phone never gets a light diagram.
//

import SwiftUI
import UIKit

/// Colours and diagram options handed to `mermaid.initialize`.
enum MermaidTheme {
    /// Configuration for the current appearance.
    /// - Parameter scheme: light or dark appearance.
    /// - Returns: a JSON-ready configuration object.
    static func configuration(scheme: ColorScheme) -> [String: Any] {
        let palette = Palette(scheme)
        return [
            "startOnLoad": false,
            // Strict keeps model-authored diagram text from injecting markup or
            // callbacks into the shared renderer.
            "securityLevel": "strict",
            "theme": "base",
            "themeVariables": variables(palette, scheme: scheme),
            "fontFamily": fontFamily,
            "flowchart": flowchart,
            "sequence": sequence,
            "gantt": gantt,
            "mindmap": mindmap,
            "class": ["useMaxWidth": true],
            "state": ["useMaxWidth": true],
            "er": ["useMaxWidth": true],
            "journey": ["useMaxWidth": true],
            "timeline": ["useMaxWidth": true],
        ]
    }

    /// Family shared by the page and the diagram text.
    static let fontFamily = "-apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif"

    // MARK: Options

    private static let flowchart: [String: Any] = [
        "htmlLabels": false,
        "useMaxWidth": true,
        "curve": "basis",
        "padding": 12,
        "nodeSpacing": 28,
        "rankSpacing": 36,
        "diagramPadding": 4,
    ]

    private static let sequence: [String: Any] = [
        "useMaxWidth": true,
        "wrap": true,
        "diagramMarginX": 8,
        "diagramMarginY": 8,
        "actorMargin": 36,
        "messageMargin": 24,
        "boxMargin": 8,
        "noteMargin": 8,
    ]

    private static let gantt: [String: Any] = [
        "useMaxWidth": true,
        "barHeight": 22,
        "barGap": 4,
        "topPadding": 24,
        "leftPadding": 56,
    ]

    private static let mindmap: [String: Any] = ["useMaxWidth": true, "padding": 8]

    // MARK: Variables

    /// All theme variables Mermaid accepts, grouped by the diagram family that
    /// reads them.
    /// - Parameters:
    ///   - palette: resolved token colours.
    ///   - scheme: appearance the diagram is drawn for.
    /// - Returns: the `themeVariables` object.
    private static func variables(_ palette: Palette, scheme: ColorScheme) -> [String: Any] {
        var values = baseVariables(palette, scheme: scheme)
        values.merge(sequenceVariables(palette)) { _, sequence in sequence }
        values.merge(chartVariables(palette)) { _, chart in chart }
        return values
    }

    private static func baseVariables(_ palette: Palette, scheme: ColorScheme) -> [String: Any] {
        [
            "darkMode": scheme == .dark,
            "background": "transparent",
            "fontFamily": fontFamily,
            "fontSize": "13px",
            "primaryColor": palette.surface,
            "primaryTextColor": palette.text,
            "primaryBorderColor": palette.border,
            "secondaryColor": palette.secondary,
            "secondaryTextColor": palette.text,
            "secondaryBorderColor": palette.border,
            "tertiaryColor": palette.page,
            "tertiaryTextColor": palette.text,
            "tertiaryBorderColor": palette.border,
            "mainBkg": palette.surface,
            "nodeBorder": palette.border,
            "clusterBkg": palette.cluster,
            "clusterBorder": palette.border,
            "lineColor": palette.muted,
            "edgeLabelBackground": palette.page,
            "textColor": palette.text,
            "titleColor": palette.text,
            "noteBkgColor": palette.note,
            "noteTextColor": palette.text,
            "noteBorderColor": palette.border,
            "signalColor": palette.muted,
            "signalTextColor": palette.text,
            "labelBoxBkgColor": palette.note,
            "labelBoxBorderColor": palette.border,
            "labelTextColor": palette.text,
            "loopTextColor": palette.text,
            "activationBorderColor": palette.border,
            "activationBkgColor": palette.note,
            "sequenceNumberColor": palette.page,
        ]
    }

    private static func sequenceVariables(_ palette: Palette) -> [String: Any] {
        [
            "actorBkg": palette.surface,
            "actorBorder": palette.border,
            "actorTextColor": palette.text,
            "actorLineColor": palette.border,
            "sectionBkgColor": palette.note,
            "altSectionBkgColor": palette.page,
            "sectionBkgColor2": palette.surface,
        ]
    }

    private static func chartVariables(_ palette: Palette) -> [String: Any] {
        [
            "taskBkgColor": palette.accent,
            "taskTextColor": "#FFFFFF",
            "taskBorderColor": palette.accent,
            "activeTaskBkgColor": palette.accent,
            "activeTaskBorderColor": palette.accent,
            "gridColor": palette.border,
            "doneTaskBkgColor": palette.surface,
            "doneTaskBorderColor": palette.border,
            "critBkgColor": palette.accent,
            "critBorderColor": palette.accent,
            "todayLineColor": palette.accent,
            "pie1": palette.accent,
            "pie2": palette.warn,
            "pie3": palette.success,
            "pie4": palette.business,
            "pie5": palette.muted,
            "pie6": palette.border,
            "pieTitleTextColor": palette.text,
            "pieSectionTextColor": "#FFFFFF",
            "pieLegendTextColor": palette.text,
            "pieStrokeColor": palette.page,
            "pieOuterStrokeColor": palette.border,
            "git0": palette.accent,
            "git1": palette.warn,
            "git2": palette.success,
            "git3": palette.business,
            "gitBranchLabel0": "#FFFFFF",
            "gitBranchLabel1": "#FFFFFF",
            "gitBranchLabel2": "#FFFFFF",
            "gitBranchLabel3": "#FFFFFF",
        ]
    }

    // MARK: Palette

    /// The token colours a diagram needs, resolved for one appearance.
    private struct Palette {
        let text: String
        let muted: String
        let border: String
        let surface: String
        let secondary: String
        let cluster: String
        let page: String
        let note: String
        let accent: String
        let warn: String
        let success: String
        let business: String

        init(_ scheme: ColorScheme) {
            text = hex(TomatoToken.labelPrimary, scheme)
            muted = hex(TomatoToken.labelCaption, scheme)
            border = hex(TomatoToken.labelTertiary, scheme)
            // Nodes sit on the page itself; a near-white fill disappeared
            // against a white transcript. One step down from the card keeps the
            // outline and the fill distinct in both appearances.
            surface = hex(TomatoToken.bgLayer3, scheme)
            secondary = hex(TomatoToken.bgLayer2, scheme)
            cluster = hex(TomatoToken.bgLayer1, scheme)
            page = hex(TomatoToken.bgBase, scheme)
            note = hex(TomatoToken.bgLayer3, scheme)
            accent = hex(TomatoToken.brandPrimary, scheme)
            warn = hex(TomatoToken.stateWarnPrimary, scheme)
            success = hex(TomatoToken.stateSuccessPrimary, scheme)
            business = hex(TomatoToken.stateBusinessPrimary, scheme)
        }
    }

    /// One token as a CSS hex string in the requested appearance.
    /// - Parameters:
    ///   - color: dynamic app token.
    ///   - scheme: appearance to resolve it in.
    /// - Returns: `#RRGGBB`, or `#RRGGBBAA` when the token is translucent.
    private static func hex(_ color: Color, _ scheme: ColorScheme) -> String {
        let traits = UITraitCollection(userInterfaceStyle: scheme == .dark ? .dark : .light)
        let resolved = UIColor(color).resolvedColor(with: traits)
        var red: CGFloat = 0
        var green: CGFloat = 0
        var blue: CGFloat = 0
        var alpha: CGFloat = 1
        guard resolved.getRed(&red, green: &green, blue: &blue, alpha: &alpha) else {
            return "#000000"
        }
        let redByte = Int((red * 255).rounded())
        let greenByte = Int((green * 255).rounded())
        let blueByte = Int((blue * 255).rounded())
        if alpha < 0.999 {
            return String(format: "#%02X%02X%02X%02X", redByte, greenByte, blueByte, Int((alpha * 255).rounded()))
        }
        return String(format: "#%02X%02X%02X", redByte, greenByte, blueByte)
    }
}
