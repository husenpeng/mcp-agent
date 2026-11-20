//
//  WindowSafeArea.swift
//  Tomato Remote
//
//  The bottom clearance the window itself reserves, separate from any bar a
//  screen has hidden inside it.
//

import UIKit

/// Window-owned safe-area distances.
///
/// A view's `safeAreaInsets` can also include a bar the screen has hidden, so a
/// composer anchored to the view's bottom edge floats above that stale inset.
/// The window never includes a bar inside it, which is the clearance a screen
/// that owns its bottom edge needs.
enum WindowSafeArea {
    /// Height the device reserves at the bottom edge.
    static var bottomInset: CGFloat {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let window = scenes.flatMap(\.windows).first(where: \.isKeyWindow)
            ?? scenes.flatMap(\.windows).first
        return window?.safeAreaInsets.bottom ?? 0
    }
}
