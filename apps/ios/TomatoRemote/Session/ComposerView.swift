//
//  ComposerView.swift
//  Tomato Remote
//
//  The input dock. Send while idle, stop while a turn runs.
//
//  Two input modes share the dock: typing, and the hold-to-talk bar that
//  WeChat puts in the keyboard's place. A hold dictates and commits on release,
//  an upward swipe abandons the sentence, and a tap keeps the microphone open
//  for as long as the owner needs — the same path VoiceOver can operate.
//
//  A photo is downscaled and re-encoded here, before it reaches the wire: the
//  Host carries an image inline inside the prompt, so the phone decides the
//  bytes that count against the deployment's per-image limit.
//

import PhotosUI
import SwiftUI
import UIKit

struct ComposerView: View {
    @Binding var text: String
    /// Focus is owned by the conversation screen, which drops it when the
    /// reader scrolls, taps the transcript, or presses 完成.
    let isFocused: FocusState<Bool>.Binding
    let isRunning: Bool
    /// Whether a prompt can be queued at all. A dropped stream does not block
    /// sending: the prompt travels over HTTP and the stream only carries back
    /// the answer.
    let canSend: Bool
    /// The paired Host, which re-recognizes a finished sentence with its own
    /// model. Nil while unpaired; the phone's live transcript then stands.
    let hub: HubClient?
    /// Receives the staged photo, if any. A document is uploaded by the
    /// conversation screen before sending and travels by receipt instead.
    let onSend: ([Data]) -> Void
    let onCancel: () -> Void
    /// Called with a document the owner chose and whether its security scope
    /// was opened; the screen stages it and closes the scope when done.
    var onPickDocument: ((URL, Bool) -> Void)?
    /// Name of the document already staged, shown so the owner can drop it.
    var stagedDocument: String?
    var onRemoveDocument: (() -> Void)?
    /// Requests this conversation is waiting on, shown above the field.
    var pending: [PendingInteraction] = []
    var onAnswer: (() -> Void)?
    /// What the model pill says. Nil hides the row: a Session the Host serves
    /// only through its parent, or one opened without a paired Host, has no
    /// choice to offer.
    var modelTitle: String?
    /// What the reasoning-level chip says, or nil when the chosen model
    /// advertises no levels.
    var effortTitle: String?
    /// Whether the model will reason at all, which highlights the level chip.
    var effortIsActive = false
    /// Whether a switch is already on its way to the Host.
    var isSwitchingModel = false
    /// Opens the model sheet.
    var onOpenModel: (() -> Void)?
    /// Opens the reasoning-level sheet.
    var onOpenReasoning: (() -> Void)?

    /// Which surface the dock shows: the text field, or the hold-to-talk bar.
    private enum InputMode {
        case typing
        case voice
    }

    @State private var pickerItems: [PhotosPickerItem] = []
    @State private var pickedImages: [Data] = []
    @State private var attachError: String?
    @State private var showsImporter = false
    @State private var showsCamera = false
    @StateObject private var dictation = VoiceDictation()
    @Environment(\.scenePhase) private var scenePhase
    @State private var mode: InputMode = .typing
    /// When the current touch on the voice bar began, so a tap can be told
    /// from a hold.
    @State private var touchStartedAt: Date?
    /// Whether the session was already hands-free when this touch began.
    @State private var touchBeganHandsFree = false
    /// Upward travel of the finger on the voice bar; negative is up.
    @State private var dragUp: CGFloat = 0
    /// Whether the Host is re-recognizing the sentence just spoken.
    @State private var isRefining = false
    /// The in-flight second pass, cancelled when the composer moves on.
    @State private var refinementTask: Task<Void, Never>?
    /// Bumped whenever a pending refinement no longer belongs to the field.
    @State private var sentenceToken = 0

    /// Longest edge kept from a picked photo. Vision input loses nothing useful
    /// beyond this, and the Host counts the encoded bytes.
    private static let maximumEdge: CGFloat = 1568
    private static let jpegQuality: CGFloat = 0.8

    private var isReadyToSend: Bool {
        let hasText = !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        return canSend && (hasText || !pickedImages.isEmpty || stagedDocument != nil)
    }

    private var isCancelling: Bool {
        dragUp <= -VoiceDictation.cancelDistance
    }

    var body: some View {
        // The dock floats over the conversation rather than sitting under a
        // divider, so it carries the navigation layer's material instead of an
        // opaque page fill.
        VStack(spacing: 8) {
            if let first = pending.first {
                PendingBanner(interaction: first, count: pending.count) { onAnswer?() }
            }
            if let attachError {
                Text(attachError)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.stateErrorPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            if !pickedImages.isEmpty {
                HStack(spacing: 8) {
                    ForEach(Array(pickedImages.enumerated()), id: \.offset) { index, data in
                        attachmentChip(data) {
                            pickedImages.remove(at: index)
                        }
                    }
                    Spacer(minLength: 0)
                }
            }
            if let stagedDocument {
                documentChip(stagedDocument)
            }
            if let failure = dictation.failure {
                Text(failure)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.stateErrorPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else if let hint = dictation.hint {
                Text(hint)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelCaption)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            if isRefining {
                HStack(spacing: 6) {
                    ProgressView().controlSize(.mini)
                    Text("正在用 Mac 精修…")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .accessibilityIdentifier("composer.refining")
            }
            if dictation.isActive, dictation.phase != .preparing {
                VoiceCapturePanel(
                    phase: dictation.phase,
                    transcript: dictation.transcript,
                    meter: dictation.meter,
                    startedAt: dictation.startedAt,
                    isCancelling: isCancelling,
                    isHandsFree: dictation.isHandsFree,
                    isPreviewing: dictation.isPreviewing,
                    onCancel: { dictation.cancel() },
                    onFinish: { finishDictation() }
                )
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
            // One container holds the field and both actions, the way chat
            // assistants draw their input: the whole capsule reads as the place
            // to type, and the send action sits inside it at the trailing edge.
            VStack(alignment: .leading, spacing: 6) {
                modelRow
                if mode == .typing {
                    inputField
                } else {
                    holdToTalkBar
                }
                toolbar
            }
            .padding(8)
            .tomatoGlass(in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .strokeBorder(isFocused.wrappedValue ? TomatoToken.brandPrimary.opacity(0.35) : Color.clear, lineWidth: 1)
            )
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .animation(.easeOut(duration: 0.18), value: dictation.isActive)
        .animation(.easeOut(duration: 0.18), value: mode)
        // A test run may start dictation without a tap, so the microphone path
        // can be observed on a device that automation cannot touch.
        .task {
            #if DEBUG
                guard ProcessInfo.processInfo.arguments.contains("-TOMATO_DICTATE"),
                      !dictation.isActive
                else { return }
                mode = .voice
                isFocused.wrappedValue = false
                guard await dictation.prepare() else { return }
                dictation.start()
                dictation.enterHandsFree()
            #endif
        }
        .onAppear {
            // A session that ends without a release (time limit, interruption)
            // hands its sentence straight to the field.
            dictation.onAutoFinish = { capture in
                commit(capture)
            }
        }
        .onDisappear {
            dictation.onAutoFinish = nil
            dictation.cancel()
            refinementTask?.cancel()
            refinementTask = nil
        }
        // A suspended app cannot keep the microphone; commit what was heard
        // instead of leaving a recorder that looks open when the owner returns.
        .onChange(of: scenePhase) { _, phase in
            guard phase == .background, dictation.isActive else { return }
            finishDictation()
        }
        .onChange(of: pickerItems) { _, items in
            guard !items.isEmpty else { return }
            let picked = items
            pickerItems = []
            Task {
                for item in picked {
                    await load(item)
                }
            }
        }
        // The dock carries no identifier of its own: an identifier on a container
        // replaces every child's, which left the field, the send control, and the
        // attachment buttons unreachable for a test run and for VoiceOver.
        .fileImporter(
            isPresented: $showsImporter,
            allowedContentTypes: [.pdf, .plainText, .spreadsheet, .presentation, .image, .data],
            allowsMultipleSelection: false
        ) { result in
            guard case let .success(urls) = result, let url = urls.first else { return }
            // A document outside the app's container arrives security-scoped.
            // Access stays open through the upload, which runs after this
            // callback returns.
            let accessed = url.startAccessingSecurityScopedResource()
            onPickDocument?(url, accessed)
        }
        .fullScreenCover(isPresented: $showsCamera) {
            PhoneCamera(
                onPhoto: { image in
                    showsCamera = false
                    stage(image)
                },
                onCancel: { showsCamera = false }
            )
            .ignoresSafeArea()
        }
    }
}

// MARK: - Dock surfaces

extension ComposerView {
    /// The model and reasoning chips above the field: each chips opens its own
    /// sheet, because a model and its reasoning level are two separate choices.
    @ViewBuilder
    private var modelRow: some View {
        if let modelTitle, onOpenModel != nil {
            HStack(spacing: 6) {
                ModelChoiceChip(title: modelTitle, isBusy: isSwitchingModel) {
                    onOpenModel?()
                }
                .layoutPriority(1)
                if let effortTitle {
                    EffortChoiceChip(title: effortTitle, isActive: effortIsActive) {
                        onOpenReasoning?()
                    }
                    .fixedSize()
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 2)
            .padding(.top, 2)
        }
    }

    /// The typed prompt; hidden while the voice bar takes its place.
    private var inputField: some View {
        TextField("给 Tomato 发消息", text: $text, axis: .vertical)
            .lineLimit(1 ... 6)
            .focused(isFocused)
            .font(.body)
            .submitLabel(.send)
            .onSubmit {
                if isReadyToSend {
                    send()
                }
            }
            .padding(.horizontal, 6)
            .padding(.top, 4)
            .accessibilityIdentifier("composer.input")
    }

    /// Photo, document, mode switch, and send, under whichever surface is up.
    private var toolbar: some View {
        HStack(spacing: 8) {
            PhotosPicker(selection: $pickerItems, maxSelectionCount: 6, matching: .images) {
                Image(systemName: "photo.on.rectangle")
                    .font(.body)
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .frame(width: 34, height: 34)
                    .contentShape(Circle())
            }
            .buttonStyle(.plain)
            .disabled(pickedImages.count >= 6)
            .accessibilityLabel("附加照片")

            Button(action: openCamera) {
                Image(systemName: "camera")
                    .font(.body)
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .frame(width: 34, height: 34)
                    .contentShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("拍照")
            .accessibilityIdentifier("composer.camera")

            Button {
                showsImporter = true
            } label: {
                Image(systemName: "paperclip")
                    .font(.body)
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .frame(width: 34, height: 34)
                    .contentShape(Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("附加文档")

            if mode == .typing {
                Button(action: enterVoiceMode) {
                    Image(systemName: "mic")
                        .font(.body)
                        .foregroundStyle(TomatoToken.labelSecondary)
                        .frame(width: 34, height: 34)
                        .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("语音输入")
                .accessibilityIdentifier("composer.mic")
            } else {
                Button(action: leaveVoiceMode) {
                    Image(systemName: "keyboard")
                        .font(.body)
                        .foregroundStyle(TomatoToken.labelSecondary)
                        .frame(width: 34, height: 34)
                        .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("切回键盘")
                .accessibilityIdentifier("composer.keyboard")
            }

            if isFocused.wrappedValue {
                Button {
                    isFocused.wrappedValue = false
                } label: {
                    Image(systemName: "keyboard.chevron.compact.down")
                        .font(.body)
                        .foregroundStyle(TomatoToken.labelSecondary)
                        .frame(width: 34, height: 34)
                        .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("收起输入框")
                .accessibilityIdentifier("composer.collapse")
            }

            Spacer(minLength: 0)
            actionButton
        }
    }

    /// WeChat's hold-to-talk surface: press and speak, release to convert.
    private var holdToTalkBar: some View {
        HStack(spacing: 8) {
            Image(systemName: barSymbol)
                .font(.subheadline)
            Text(barLabel)
                .font(.subheadline.weight(.medium))
        }
        .foregroundStyle(barForeground)
        .frame(maxWidth: .infinity, minHeight: 36)
        .background(barBackground, in: RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
        .contentShape(Rectangle())
        .gesture(holdGesture)
        // VoiceOver cannot hold a finger down; its representation is a button
        // that toggles the same session hands-free.
        .accessibilityRepresentation {
            Button(action: toggleHandsFree) {
                Text(barLabel)
            }
            .accessibilityIdentifier("composer.holdToTalk")
            .accessibilityHint("按住说话，松手转成文字；手指上滑取消。轻点则由麦克风持续收音。")
        }
    }

    private var barLabel: String {
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

    private var barSymbol: String {
        if dictation.isHandsFree {
            return "waveform.circle.fill"
        }
        return dictation.phase == .listening ? "waveform" : "mic"
    }

    private var barForeground: Color {
        if isCancelling {
            return TomatoToken.stateErrorPrimary
        }
        if dictation.phase == .listening || dictation.isHandsFree {
            return TomatoToken.brandPrimary
        }
        return dictation.isAuthorized ? TomatoToken.labelSecondary : TomatoToken.labelDimmed
    }

    private var barBackground: Color {
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
                        invalidateRefinement()
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
                    finishDictation()
                    return
                }
                if travelled <= -VoiceDictation.cancelDistance {
                    dictation.cancel()
                    UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
                    return
                }
                if held < VoiceDictation.tapDuration {
                    dictation.enterHandsFree()
                    return
                }
                finishDictation()
            }
    }

    /// Send while idle, stop while a turn runs.
    @ViewBuilder
    private var actionButton: some View {
        if isRunning {
            Button(action: onCancel) {
                Image(systemName: "stop.fill")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Color.white)
                    .frame(width: 34, height: 34)
                    .background(TomatoToken.labelPrimary, in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("停止")
            .accessibilityIdentifier("composer.stop")
        } else {
            Button(action: send) {
                Image(systemName: "arrow.up")
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(isReadyToSend ? Color.white : TomatoToken.labelTertiary)
                    .frame(width: 34, height: 34)
                    .background(isReadyToSend ? TomatoToken.buttonPrimaryFill : TomatoToken.bgLayer3, in: Circle())
            }
            .buttonStyle(.plain)
            .disabled(!isReadyToSend)
            .accessibilityLabel("发送")
            .accessibilityIdentifier("composer.send")
        }
    }
}

// MARK: - Dictation

extension ComposerView {
    /// Show the hold-to-talk bar and ask for the permissions it needs.
    private func enterVoiceMode() {
        guard mode == .typing else {
            return
        }
        invalidateRefinement()
        mode = .voice
        isFocused.wrappedValue = false
        Task {
            await dictation.prepare()
        }
    }

    /// Return to typing without committing anything the microphone heard.
    private func leaveVoiceMode() {
        invalidateRefinement()
        dictation.cancel()
        mode = .typing
        isFocused.wrappedValue = true
    }

    /// Start or end a hands-free sentence: the accessible equivalent of hold
    /// and release, and what a tap on the bar does.
    private func toggleHandsFree() {
        if dictation.isHandsFree {
            finishDictation()
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
        invalidateRefinement()
        dictation.start()
        dictation.enterHandsFree()
    }

    /// Convert what was heard, then put it in the field for review. When the
    /// Host can re-recognize the recording, its sentence replaces the live one
    /// shortly after.
    private func finishDictation() {
        Task { @MainActor in
            let capture = await dictation.finish()
            commit(capture)
        }
    }

    /// Put one sentence at the end of the field, the way WeChat drops a
    /// converted voice message into the input box: editable, not sent.
    private func commit(_ capture: VoiceDictation.Capture) {
        let prefix = text
        let live = capture.text ?? ""
        if !live.isEmpty {
            text = VoiceTranscription.merged(into: prefix, live)
            mode = .typing
            dragUp = 0
            touchStartedAt = nil
            focusField()
        }
        // A second finish for the same sentence carries neither text nor audio;
        // the first one already settled it.
        guard capture.text != nil || capture.audio != nil else {
            return
        }
        guard let audio = capture.audio, let hub else {
            if live.isEmpty {
                dictation.note("没有听到声音，请再试一次")
            }
            return
        }
        refine(audio, using: hub, prefix: prefix, live: live)
    }

    /// Send the recording to the Host and adopt its sentence when it arrives
    /// before the owner changes anything.
    /// - Parameters:
    ///   - audio: canonical WAV of the sentence.
    ///   - hub: paired Host.
    ///   - prefix: field contents before this sentence.
    ///   - live: Apple's live transcript, empty when it heard nothing.
    private func refine(_ audio: Data, using hub: HubClient, prefix: String, live: String) {
        let token = sentenceToken
        let committed = live.isEmpty ? prefix : VoiceTranscription.merged(into: prefix, live)
        refinementTask?.cancel()
        isRefining = true
        refinementTask = Task { @MainActor in
            let refined = await Self.transcribe(audio, using: hub)
            guard !Task.isCancelled else {
                return
            }
            isRefining = false
            let sentence = (refined ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            guard token == sentenceToken else {
                return
            }
            guard !sentence.isEmpty else {
                if live.isEmpty {
                    dictation.note("没有听清，请再说一次")
                }
                return
            }
            // The field still holds exactly what this sentence left, so the
            // replacement cannot overwrite anything typed meanwhile.
            guard text == committed else {
                return
            }
            text = VoiceTranscription.merged(into: prefix, sentence)
            if live.isEmpty {
                mode = .typing
                focusField()
            }
        }
    }

    /// One Host call with a deadline; the live transcript stands if it fails.
    /// - Parameters:
    ///   - audio: canonical WAV of the sentence.
    ///   - hub: paired Host.
    /// - Returns: the Host's transcript, or nil on failure or deadline.
    private static func transcribe(_ audio: Data, using hub: HubClient) async -> String? {
        let deadline = Self.refinementDeadline(for: audio)
        return await withTaskGroup(of: String?.self) { group in
            group.addTask {
                do {
                    let transcript = try await hub.transcribeSpeech(wav: audio)
                    AppLog.info(.ui, "Mac 精修完成", detail: "\(transcript.audioSeconds ?? 0) 秒音频")
                    return transcript.text
                } catch {
                    AppLog.warning(.ui, "Mac 精修失败", detail: describe(error))
                    return nil
                }
            }
            group.addTask {
                try? await Task.sleep(for: .seconds(deadline))
                return nil
            }
            // The first settled child wins: either the Host's transcript or the
            // deadline, whose result is nil.
            guard let first = await group.next() else {
                return nil
            }
            group.cancelAll()
            return first
        }
    }

    /// How long the Host may take for one recording. A short phrase settles in
    /// a couple of seconds; a full minute of speech on a CPU needs longer.
    /// - Parameter audio: canonical WAV of the sentence.
    private static func refinementDeadline(for audio: Data) -> TimeInterval {
        let seconds = Double(max(0, audio.count - 44)) / 32000
        return min(20, max(6, 4 + seconds * 0.5))
    }

    /// Drop a second pass that no longer belongs to the field.
    private func invalidateRefinement() {
        sentenceToken += 1
        refinementTask?.cancel()
        refinementTask = nil
        isRefining = false
    }

    /// Bring the keyboard back so the sentence can be reviewed before it is sent.
    private func focusField() {
        Task { @MainActor in
            isFocused.wrappedValue = true
        }
    }

    private func send() {
        UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
        invalidateRefinement()
        dictation.cancel()
        mode = .typing
        let images = pickedImages
        pickedImages = []
        pickerItems = []
        attachError = nil
        onSend(images)
    }
}

// MARK: - Attachments

extension ComposerView {
    /// Staged document, shown by name so the owner knows what rides along.
    private func documentChip(_ name: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "doc")
                .font(.footnote)
                .foregroundStyle(TomatoToken.brandPrimary)
            Text(name)
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
                .lineLimit(1)
            Spacer(minLength: 0)
            Button {
                onRemoveDocument?()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("移除文档")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Staged-photo preview with its size and a way to drop it.
    /// @param data - JPEG bytes of one staged photo.
    /// @param remove - drops this photo from the staged set.
    private func attachmentChip(_ data: Data, remove: @escaping () -> Void) -> some View {
        HStack(spacing: 10) {
            if let image = UIImage(data: data) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 44, height: 44)
                    .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
            }
            Text("照片 · \(byteCount(data.count))")
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
            Spacer()
            Button(action: remove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("移除照片")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Present the camera for a new photo.
    private func openCamera() {
        guard PhoneCamera.isAvailable else {
            attachError = "这台设备没有可用的相机"
            return
        }
        attachError = nil
        isFocused.wrappedValue = false
        showsCamera = true
    }

    /// Downscale and stage one captured photo.
    /// @param image - the full-size capture.
    private func stage(_ image: UIImage) {
        guard pickedImages.count < 6 else {
            attachError = "一次最多带 6 张照片"
            return
        }
        guard let encoded = Self.prepare(image) else {
            attachError = "无法压缩这张照片"
            return
        }
        attachError = nil
        pickedImages.append(encoded)
    }

    /// Load, downscale, and re-encode one picked photo.
    /// @param item - the Photos picker selection.
    private func load(_ item: PhotosPickerItem) async {
        attachError = nil
        do {
            guard let original = try await item.loadTransferable(type: Data.self),
                  let source = UIImage(data: original)
            else {
                attachError = "无法读取这张照片"
                return
            }
            guard let encoded = Self.prepare(source) else {
                attachError = "无法压缩这张照片"
                return
            }
            pickedImages.append(encoded)
        } catch {
            attachError = describe(error)
        }
    }

    /// Downscale to `maximumEdge` and re-encode as JPEG.
    /// @param image - the decoded photo.
    /// @returns JPEG bytes, or nil when encoding fails.
    static func prepare(_ image: UIImage) -> Data? {
        let longest = max(image.size.width, image.size.height)
        let scale = longest > maximumEdge ? maximumEdge / longest : 1
        let target = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        let resized = UIGraphicsImageRenderer(size: target, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: target))
        }
        return resized.jpegData(compressionQuality: jpegQuality)
    }

    private func byteCount(_ bytes: Int) -> String {
        ByteCountFormatter.string(fromByteCount: Int64(bytes), countStyle: .file)
    }
}
