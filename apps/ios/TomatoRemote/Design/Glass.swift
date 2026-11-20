//
//  Glass.swift
//  Tomato Remote
//
//  The navigation layer's material, in one place.
//
//  iOS 26 renders floating controls with Liquid Glass, and Apple reserves that
//  material for the layer above content: bars, docks, floating controls. Lists,
//  messages, and cards stay opaque under it. This file is the only place that
//  decides what that layer is made of, so the deployment target (17.0) can fall
//  back to a thin material where the API does not exist.
//

import SwiftUI

extension View {
    /// Place this view on the navigation layer.
    /// - Parameter shape: outline of the control, used by both arms so a
    ///   floating button looks the same across releases.
    /// - Returns: the same view over the release's own material.
    @ViewBuilder
    func tomatoGlass(in shape: some Shape = Capsule()) -> some View {
        if #available(iOS 26.0, *) {
            glassEffect(.regular, in: shape)
                .overlay(shape.stroke(TomatoToken.borderL2, lineWidth: 0.5))
        } else {
            background(.ultraThinMaterial, in: shape)
                .overlay(shape.stroke(TomatoToken.borderL2, lineWidth: 1))
        }
    }

    /// A filled action that keeps readable contrast on the brand colour.
    func tomatoProminentButton() -> some View {
        buttonStyle(.borderedProminent)
            .tint(TomatoToken.brandPrimary)
            .controlSize(.large)
    }

    /// Let the bar, search field, and dock blur the content beneath them.
    /// - Returns: the same view with the release's scroll-edge treatment.
    @ViewBuilder
    func tomatoScrollEdge() -> some View {
        if #available(iOS 26.0, *) {
            // A soft effect on every edge washed out the transcript far above
            // the dock. Both edges keep a crisp fade: without it, list rows
            // stayed legible through the search field and the title while the
            // page scrolled under them.
            scrollEdgeEffectStyle(.hard, for: .bottom)
                .scrollEdgeEffectStyle(.hard, for: .top)
        } else {
            self
        }
    }

    /// Pin a control to the bottom safe area, floating over the content rather
    /// than sitting under a divider.
    /// - Parameter content: the dock, typically the composer.
    /// - Returns: the view with the dock occupying the bottom edge.
    func tomatoBottomBar(@ViewBuilder _ content: () -> some View) -> some View {
        // `safeAreaBar` on iOS 26 floats a glass bar over the scroll view: the
        // chat kept drawing beneath it and the dock appeared to hover mid-page.
        // Reserving the inset keeps the transcript above the dock, and the dock
        // hugs its own content instead of stretching a glass sheet.
        safeAreaInset(edge: .bottom, spacing: 0) {
            // The page's own fill, not a material: a thin material over a white
            // page painted the band below the controls grey and drew a seam
            // across it. The controls carry their own edge.
            content()
                .background(TomatoSurface.page.ignoresSafeArea(edges: .bottom))
        }
    }

    /// Page title with one explanatory line under it.
    ///
    /// iOS 26 can put the line in the navigation bar itself, where it scrolls
    /// with the title and collapses with it; earlier releases render the line as
    /// the first paragraph of the page instead.
    /// - Parameters:
    ///   - title: the page name.
    ///   - caption: one line of context, or nil.
    /// - Returns: the view with a title set.
    @ViewBuilder
    func tomatoPageTitle(_ title: String, caption: String?) -> some View {
        if #available(iOS 26.0, *), let caption {
            navigationTitle(title)
                .navigationSubtitle(caption)
        } else {
            navigationTitle(title)
        }
    }
}
