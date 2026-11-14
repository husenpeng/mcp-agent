//
//  FeishuLoginButton.swift
//  Tomato Remote
//
//  The sign-in entry for company Feishu login.
//
//  A generic key symbol made the action look like a placeholder, so the entry
//  carries the service's own mark on the surfaces that start the flow.
//

import SwiftUI

/// Outlined button that starts Feishu sign-in.
struct FeishuLoginButton: View {
    /// Wording beside the mark.
    var title = "使用飞书账号登录"
    var isEnabled = true
    var isBusy = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                if isBusy {
                    ProgressView()
                        .controlSize(.small)
                } else {
                    Image("FeishuLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 22, height: 22)
                        .accessibilityHidden(true)
                }
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TomatoToken.labelPrimary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .padding(.horizontal, 16)
            .background(TomatoToken.bgLayer1)
            .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous)
                    .strokeBorder(TomatoToken.borderL2, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled || isBusy)
        .opacity(isEnabled ? 1 : 0.5)
    }
}
