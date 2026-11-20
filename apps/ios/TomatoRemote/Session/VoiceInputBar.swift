//
//  VoiceInputBar.swift
//  Tomato Remote
//
//  WeChat's hold-to-talk surface, shared by both composers.
//
//  Press and speak, release to convert, slide up to abandon, tap to keep the
//  microphone open. The bar owns only the finger's geometry; the sentence and
//  its commit stay with the screen that placed it.
//

import SwiftUI
import UIKit

/// The press-and-hold bar that replaces the text field in voice mode.
struct VoiceInputBar: View {
    @ObservedObject var dictation: VoiceDictation
    /// Upward travel, shared with the capture panel so both show the cancel state.
    @Binding var dragUp: CGFloat
    /// Accessibility identifier, so each composer is addressable on its own.
    var identifier = "composer.holdToTalk"
    /// Called when a hold begins, before capture starts.
    var onBegin: () -> Void = {}
    /// Called on release after a real hold; the owner finishes and commits.
    let onFinish: () -> Void
    /// Called when the finger slides up to abandon the sentence.
    let onCancel: () -> Void

    /// When the current touch began, so a tap can be told from a hold.
    @State private var touchStartedAt: Date?
    /// Whether the session was already hands-free when this touch began.
    @State private var touchBeganHandsFree = false

    private var isCancelling: Bool {
        dragUp <= -VoiceDictation.cancelDistance
    }

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: symbol)
                .font(.subheadline)
            Text(label)
                .font(.subheadline.weight(.medium))
        }
        .foregroundStyle(foreground)
        // Hold-to-talk is a eyes-free gesture; the bar meets the 44 pt minimum
        // rather than asking for a 36 pt strip under a thumb.
        .frame(maxWidth: .infinity, minHeight: 44)
        .background(background, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .contentShape(Rectangle())
        .gesture(holdGesture)
        // VoiceOver cannot hold a finger down; its representation is a button
        // that toggles the same session hands-free.
        .accessibilityRepresentation {
            Button(action: toggleHandsFree) {
                Text(label)
            }
            .accessibilityIdentifier(identifier)
            .accessibilityHint("按住说话，松手转成文字；手指上滑取消。轻点则由麦克风持续收音。")
        }
    }

    private var label: String {
        if !dictation.isAuthorized, dictation.phase == .preparing {
            return "正在请求麦克风权限…"
        }
        if dictation.isHandsFree {
            return "正在听写 · 轻点完成"
        }
        switch dictation.phase {
        case .listening:
            return isCancelling ? "松开 取消" : "松开 转文字"
        case .finishing:
            return "正在转文字…"
        case .preparing:
            return "正在准备麦克风…"
        case .idle:
            return dictation.isAuthorized ? "按住 说话" : "需要麦克风权限"
        }
    }

    private var symbol: String {
        if dictation.isHandsFree {
            return "waveform.circle.fill"
        }
        return dictation.phase == .listening ? "waveform" : "mic"
    }

    private var foreground: Color {
        if isCancelling {
            return TomatoToken.stateErrorPrimary
        }
        if dictation.phase == .listening || dictation.isHandsFree {
            return TomatoToken.brandPrimary
        }
        return dictation.isAuthorized ? TomatoToken.labelSecondary : TomatoToken.labelDimmed
    }

    private var background: Color {
        if isCancelling {
            return TomatoToken.stateErrorPrimary.opacity(0.12)
        }
        return dictation.phase == .listening ? TomatoToken.brandPrimary.opacity(0.1) : TomatoToken.bgLayer3
    }

    /// Press to talk, drag up to abandon, release to convert. A short press
    /// keeps the session open hands-free.
    private var holdGesture: some Gesture {
        DragGesture(minimumDistance: 0, coordinateSpace: .local)
            .onChanged { value in
                // A gesture the system cancelled may not have delivered its
                // end; a stale start would then swallow the next sentence.
                if let started = touchStartedAt,
                   !dictation.isActive,
                   Date.now.timeIntervalSince(started) > VoiceDictation.tapDuration
                {
                    touchStartedAt = nil
                    dragUp = 0
                }
                if touchStartedAt == nil {
                    touchStartedAt = .now
                    touchBeganHandsFree = dictation.isHandsFree
                    dragUp = 0
                    if !touchBeganHandsFree {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        onBegin()
                        if dictation.isAuthorized {
                            dictation.start()
                        } else {
                            // Permission may have been granted in Settings since
                            // the last attempt.
                            Task { await dictation.prepare() }
                        }
                    }
                }
                dragUp = min(0, value.translation.height)
            }
            .onEnded { value in
                guard let started = touchStartedAt else {
                    return
                }
                let held = Date.now.timeIntervalSince(started)
                let travelled = value.translation.height
                let wasHandsFree = touchBeganHandsFree
                touchStartedAt = nil
                dragUp = 0
                if wasHandsFree {
                    onFinish()
                    return
                }
                if travelled <= -VoiceDictation.cancelDistance {
                    onCancel()
                    UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
                    return
                }
                if held < VoiceDictation.tapDuration {
                    dictation.enterHandsFree()
                    return
                }
                onFinish()
            }
    }

    /// Start or end a hands-free sentence: the accessible equivalent of hold
    /// and release, and what a tap on the bar does.
    private func toggleHandsFree() {
        if dictation.isHandsFree {
            onFinish()
            return
        }
        if dictation.isActive {
            dictation.enterHandsFree()
            return
        }
        guard dictation.isAuthorized else {
            Task { await dictation.prepare() }
            return
        }
        onBegin()
        dictation.start()
        dictation.enterHandsFree()
    }
}
