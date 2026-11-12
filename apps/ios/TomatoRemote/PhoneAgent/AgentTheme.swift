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
    static let canvas = TomatoToken.bgBase
    /// Card and bubble surface.
    static let surface = TomatoToken.bgLayer1
    /// Secondary surface for tool cards and suggestion chips.
    static let surfaceMuted = TomatoToken.bgLayer2
    /// Headline and body text.
    static let ink = TomatoToken.labelPrimary
    /// Supporting copy.
    static let inkSecondary = TomatoToken.labelCaption
    /// Accent used for primary actions and the user's own messages.
    static let accent = TomatoToken.brandPrimary
    /// Accent gradient end.
    static let accentSoft = TomatoToken.stateErrorSecondary
    /// Hairline border on cards.
    static let border = TomatoToken.borderL3
    /// Destructive action.
    static let danger = TomatoToken.stateErrorPrimary
    /// Success status.
    static let success = TomatoToken.stateSuccessPrimary

    /// The accent used on primary buttons and the send control.
    static var accentGradient: LinearGradient {
        LinearGradient(colors: [accent, accentSoft], startPoint: .topLeading, endPoint: .bottomTrailing)
    }

    /// Conversation text. One step below the system body size, so a turn reads
    /// like a transcript rather than a document.
    static let messageFont = Font.subheadline
    /// What the owner types; larger than the transcript, smaller than a title.
    static let inputFont = Font.callout

    /// Card radius, sharing the Host client's card geometry.
    static let cardRadius: CGFloat = 18
    /// Message bubble radius.
    static let bubbleRadius: CGFloat = 16
    /// Composer and chip radius.
    static let pillRadius: CGFloat = 20
}
