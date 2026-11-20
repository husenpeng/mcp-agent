//
//  AgentTheme.swift
//  Tomato Remote
//
//  Visual tokens for Tomato Phone.
//
//  Tomato Phone is one of the app's own surfaces, so it reads the same Tomato
//  tokens as the Host client: one brand red, one page background, one text ramp.
//  The names stay intent-based (`accent`, `canvas`, `surface`) so the phone
//  screens do not spell token identifiers on every line.
//

import SwiftUI

/// Colors and metrics shared by every Tomato Phone screen.
enum AgentTheme {
    /// Page background behind cards and the composer.
    static let canvas = TomatoSurface.page
    /// Card and bubble surface.
    static let surface = TomatoSurface.card
    /// Secondary surface for tool cards and suggestion chips.
    static let surfaceMuted = TomatoSurface.variant
    /// Headline and body text.
    static let ink = TomatoToken.labelPrimary
    /// Supporting copy.
    static let inkSecondary = TomatoToken.labelCaption
    /// Accent used for primary actions and the user's own messages.
    static let accent = TomatoToken.brandPrimary
    /// Accent gradient end.
    static let accentSoft = TomatoToken.stateErrorSecondary
    /// Hairline border on cards.
    static let border = TomatoLine.hairline
    /// Destructive action.
    static let danger = TomatoToken.stateErrorPrimary
    /// Success status.
    static let success = TomatoToken.stateSuccessPrimary

    /// The send control keeps the existing gradient API but uses one solid brand
    /// colour, so primary actions do not become decorative red gradients.
    static var accentGradient: LinearGradient {
        LinearGradient(colors: [accent, accent], startPoint: .topLeading, endPoint: .bottomTrailing)
    }

    /// Conversation text. One step below the system body size, so a turn reads
    /// like a transcript rather than a document.
    static let messageFont = Font.subheadline
    /// What the owner types; larger than the transcript, smaller than a title.
    static let inputFont = Font.callout

    /// Card radius, sharing the Host client's card geometry.
    static let cardRadius: CGFloat = TomatoCorner.card
    /// Message bubble radius.
    static let bubbleRadius: CGFloat = TomatoCorner.control
    /// Composer and chip radius.
    static let pillRadius: CGFloat = 20
}
