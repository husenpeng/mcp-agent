//
//  VoiceCapturePanel.swift
//  Tomato Remote
//
//  The card above the dock while the microphone is open.
//
//  It answers the three questions a person has mid-sentence: is it recording,
//  how long have I been talking, and what did it hear. The swipe hint lives
//  here because the finger is on the bar below, not on this card.
//

import SwiftUI

/// Recording state, level, and the words heard so far, above the composer.
struct VoiceCapturePanel: View {
    let phase: VoiceDictation.Phase
    let transcript: String
    let meter: [Double]
    let startedAt: Date?
    let isCancelling: Bool
    let isHandsFree: Bool
    /// Whether Apple's on-device model is producing the live transcript.
    let isPreviewing: Bool
    let onCancel: () -> Void
    let onFinish: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            header
            if !transcript.isEmpty {
                Text(transcript)
                    .font(.callout)
                    .foregroundStyle(phase == .finishing ? TomatoToken.labelCaption : TomatoToken.labelPrimary)
                    .lineLimit(2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .transition(.opacity)
            }
            waveform
            footer
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .tomatoGlass(in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .animation(.easeOut(duration: 0.15), value: transcript)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("语音输入")
        .accessibilityIdentifier("composer.dictationPanel")
    }

    /// Microphone state, elapsed time, and where the audio goes.
    private var header: some View {
        HStack(spacing: 8) {
            Image(systemName: "waveform")
                .font(.caption.weight(.semibold))
                .foregroundStyle(accent)
                .symbolEffect(.variableColor.iterative, isActive: isListening)
            clock
                .font(.caption.monospacedDigit())
                .foregroundStyle(TomatoToken.labelCaption)
            Spacer(minLength: 8)
            Text(isPreviewing ? "本机实时" : "Mac 转写")
                .font(.caption2)
                .foregroundStyle(TomatoToken.labelDimmed)
        }
    }

    @ViewBuilder
    private var clock: some View {
        if let startedAt {
            TimelineView(.periodic(from: startedAt, by: 0.5)) { context in
                Text(Self.clock(context.date.timeIntervalSince(startedAt)))
            }
        } else {
            Text("0:00")
        }
    }

    /// Newest level at the trailing edge, like a level meter running left to
    /// right.
    private var waveform: some View {
        HStack(alignment: .center, spacing: 2) {
            ForEach(Array(meter.enumerated()), id: \.offset) { _, value in
                Capsule()
                    .fill(accent.opacity(isListening ? 0.85 : 0.3))
                    .frame(width: 2.5, height: max(2, 22 * CGFloat(value)))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: 22)
        .animation(.linear(duration: 0.1), value: meter)
        .accessibilityHidden(true)
    }

    /// The hint while holding, or the two explicit actions of a hands-free
    /// session — the accessible equivalent of holding the bar down.
    private var footer: some View {
        HStack(spacing: 10) {
            Text(caption)
                .font(.caption)
                .foregroundStyle(isCancelling ? TomatoToken.stateErrorPrimary : TomatoToken.labelCaption)
                .lineLimit(1)
            Spacer(minLength: 8)
            if isHandsFree {
                Button("取消", role: .cancel, action: onCancel)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .disabled(!isListening)
                    .accessibilityIdentifier("composer.dictationCancel")
                Button("完成", action: onFinish)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(isListening ? TomatoToken.brandPrimary : TomatoToken.labelDimmed)
                    .disabled(!isListening)
                    .accessibilityIdentifier("composer.dictationFinish")
            }
        }
    }

    private var caption: String {
        if isCancelling {
            return "松开取消"
        }
        switch phase {
        case .preparing:
            return "正在准备麦克风…"
        case .finishing:
            return "正在转成文字…"
        case .listening:
            if isHandsFree {
                return "正在听写，轻点完成"
            }
            if !isPreviewing {
                return "正在录音，松手后转写"
            }
            return transcript.isEmpty ? "请说话" : "松开转文字 · 上滑取消"
        case .idle:
            return ""
        }
    }

    private var isListening: Bool {
        phase == .listening
    }

    private var accent: Color {
        if isCancelling {
            return TomatoToken.stateErrorPrimary
        }
        return isListening ? TomatoToken.brandPrimary : TomatoToken.labelDimmed
    }

    /// Elapsed time as `m:ss`, the shape a voice message shows.
    static func clock(_ seconds: TimeInterval) -> String {
        let whole = max(0, Int(seconds.rounded(.down)))
        return String(format: "%d:%02d", whole / 60, whole % 60)
    }
}
