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
    /// The draft lives here, not on the conversation screen: a keystroke must
    /// only redraw the dock, never the transcript behind it.
    @State private var text = ""
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
    /// Receives the text to send and the staged photos, if any. A document is
    /// uploaded by the conversation screen before sending and travels by
    /// receipt instead.
    let onSend: (String, [Data]) -> Void
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
    /// Staged photos carry a stable identity: removing one by its row offset
    /// deleted the next photo, or trapped once the array had shrunk.
    @State private var pickedImages: [StagedPhoto] = []
    @State private var attachError: String?
    @State private var showsImporter = false
    @State private var showsCamera = false
    @StateObject private var dictation = VoiceDictation()
    @Environment(\.scenePhase) private var scenePhase
    @State private var mode: InputMode = .typing
    /// Upward travel of the finger on the voice bar; negative is up.
    @State private var dragUp: CGFloat = 0
    /// Whether the Host is re-recognizing the sentence just spoken.
    @State private var isRefining = false
    /// The in-flight second pass, cancelled when the composer moves on.
    @State private var refinementTask: Task<Void, Never>?
    /// Bumped whenever a pending refinement no longer belongs to the field.
    @State private var sentenceToken = 0
    /// Recognizer the Host advertised for mixed speech, when it has one ready.
    @State private var speechChoice: SpeechProviderChoice?

    /// Longest edge kept from a picked photo. Vision input loses nothing useful
    /// beyond this, and the Host counts the encoded bytes.
    private static let maximumEdge: CGFloat = 1568
    private static let jpegQuality: CGFloat = 0.8
    /// How many lines the field shows before it scrolls internally.
    ///
    /// The field grows into the conversation's height, and with the keyboard up
    /// the chips and toolbar already take room. Four lines keeps a phone-sized
    /// transcript on screen; a longer draft scrolls inside the field instead of
    /// pushing the conversation away.
    private static let maximumInputLines = 4

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
                    ForEach(pickedImages) { photo in
                        attachmentChip(photo) {
                            pickedImages.removeAll { $0.id == photo.id }
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
                    live: dictation.live,
                    phase: dictation.phase,
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
                if mode == .typing {
                    inputField
                } else {
                    VoiceInputBar(
                        dictation: dictation,
                        dragUp: $dragUp,
                        onBegin: invalidateRefinement,
                        onFinish: finishDictation,
                        onCancel: { dictation.cancel() }
                    )
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
    /// Two small icons where the composer used to carry a chip row: one for the
    /// model, one for its reasoning level. The row cost a whole line of the
    /// conversation; an icon keeps both choices one tap away at toolbar size.
    @ViewBuilder
    private var modelIcons: some View {
        if let modelTitle, let onOpenModel {
            Button(action: onOpenModel) {
                Image(systemName: "cpu")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .frame(width: 30, height: 30)
                    .contentShape(Circle().inset(by: -7))
                    .overlay(alignment: .topTrailing) {
                        if isSwitchingModel {
                            ProgressView()
                                .controlSize(.mini)
                                .offset(x: 2, y: -2)
                        }
                    }
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityIdentifier("composer.model")
            .accessibilityLabel("选择模型")
            .accessibilityValue(modelTitle)
        }
        if let effortTitle, let onOpenReasoning {
            Button(action: onOpenReasoning) {
                Image(systemName: "brain")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(effortIsActive ? TomatoToken.brandPrimary : TomatoToken.labelSecondary)
                    .frame(width: 30, height: 30)
                    .contentShape(Circle().inset(by: -7))
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityIdentifier("composer.effort")
            .accessibilityLabel("推理等级")
            .accessibilityValue(effortTitle)
        }
    }

    /// The typed prompt; hidden while the voice bar takes its place.
    private var inputField: some View {
        TextField("给 Tomato 发消息", text: $text, axis: .vertical)
            // An empty field is pinned to one line rather than remembering the
            // height its last draft needed: clearing the text while the field
            // stays focused otherwise leaves an empty multi-line box.
            .lineLimit(1 ... (text.isEmpty ? 1 : Self.maximumInputLines))
            .focused(isFocused)
            .font(.body)
            .submitLabel(.send)
            .onSubmit {
                if isReadyToSend {
                    send()
                }
            }
            // A vertical-axis TextField inserts a newline on the software
            // keyboard's return key and never fires onSubmit, so the key this
            // field labels 发送 did nothing at all. Intercept it: send when
            // there is something to send, otherwise fall through to a newline.
            .onKeyPress(.return) {
                guard isReadyToSend else { return .ignored }
                send()
                return .handled
            }
            .padding(.horizontal, 6)
            .padding(.top, 4)
            .accessibilityIdentifier("composer.input")
    }

    /// Photo, document, mode switch, and send, under whichever surface is up.
    private var toolbar: some View {
        HStack(spacing: 8) {
            modelIcons
            PhotosPicker(selection: $pickerItems, maxSelectionCount: 6, matching: .images) {
                Image(systemName: "photo.on.rectangle")
                    .font(.body)
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .frame(width: 34, height: 34)
                    .contentShape(Circle().inset(by: -5))
            }
            .buttonStyle(TomatoPressableStyle())
            .disabled(pickedImages.count >= 6)
            .accessibilityLabel("附加照片")

            Button(action: openCamera) {
                Image(systemName: "camera")
                    .font(.body)
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .frame(width: 34, height: 34)
                    .contentShape(Circle().inset(by: -5))
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityLabel("拍照")
            .accessibilityIdentifier("composer.camera")

            Button {
                showsImporter = true
            } label: {
                Image(systemName: "paperclip")
                    .font(.body)
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .frame(width: 34, height: 34)
                    .contentShape(Circle().inset(by: -5))
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityLabel("附加文档")

            if mode == .typing {
                Button(action: enterVoiceMode) {
                    Image(systemName: "mic")
                        .font(.body)
                        .foregroundStyle(TomatoToken.labelSecondary)
                        .frame(width: 34, height: 34)
                        .contentShape(Circle().inset(by: -5))
                }
                .buttonStyle(TomatoPressableStyle())
                .accessibilityLabel("语音输入")
                .accessibilityIdentifier("composer.mic")
            } else {
                Button(action: leaveVoiceMode) {
                    Image(systemName: "keyboard")
                        .font(.body)
                        .foregroundStyle(TomatoToken.labelSecondary)
                        .frame(width: 34, height: 34)
                        .contentShape(Circle().inset(by: -5))
                }
                .buttonStyle(TomatoPressableStyle())
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
                        .contentShape(Circle().inset(by: -5))
                }
                .buttonStyle(TomatoPressableStyle())
                .accessibilityLabel("收起输入框")
                .accessibilityIdentifier("composer.collapse")
            }

            Spacer(minLength: 0)
            actionButton
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
            .buttonStyle(TomatoPressableStyle())
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
            .buttonStyle(TomatoPressableStyle())
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
        // Ask once per entry: a Whisper provider handles mixed Chinese-English
        // better than whatever the Host selected earlier.
        Task { @MainActor in
            speechChoice = await hub?.preferredSpeechProvider()
        }
    }

    /// Return to typing without committing anything the microphone heard.
    private func leaveVoiceMode() {
        invalidateRefinement()
        dictation.cancel()
        mode = .typing
        isFocused.wrappedValue = true
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
        refine(audio, using: hub, choice: speechChoice, prefix: prefix, live: live)
    }

    /// Send the recording to the Host and adopt its sentence when it arrives
    /// before the owner changes anything.
    /// - Parameters:
    ///   - audio: canonical WAV of the sentence.
    ///   - hub: paired Host.
    ///   - prefix: field contents before this sentence.
    ///   - live: Apple's live transcript, empty when it heard nothing.
    private func refine(_ audio: Data, using hub: HubClient, choice: SpeechProviderChoice?, prefix: String, live: String) {
        let token = sentenceToken
        let committed = live.isEmpty ? prefix : VoiceTranscription.merged(into: prefix, live)
        refinementTask?.cancel()
        isRefining = true
        refinementTask = Task { @MainActor in
            let refined = await Self.transcribe(audio, using: hub, choice: choice)
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
    private static func transcribe(_ audio: Data, using hub: HubClient, choice: SpeechProviderChoice?) async -> String? {
        let deadline = Self.refinementDeadline(for: audio)
        return await withTaskGroup(of: String?.self) { group in
            group.addTask {
                do {
                    let transcript = try await hub.transcribeSpeech(
                        wav: audio,
                        providerId: choice?.id,
                        language: choice?.language
                    )
                    AppLog.info(
                        .ui,
                        "Mac 精修完成",
                        detail: "\(choice?.id ?? "Host 默认") · \(transcript.audioSeconds ?? 0) 秒音频"
                    )
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
        let images = pickedImages.map(\.data)
        let outgoing = text
        text = ""
        pickedImages = []
        pickerItems = []
        attachError = nil
        // Sending ends the edit: retract the keyboard and the field, so the
        // conversation gets its screen back instead of keeping an empty dock
        // open over it.
        isFocused.wrappedValue = false
        onSend(outgoing, images)
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
            .buttonStyle(TomatoPressableStyle())
            .accessibilityLabel("移除文档")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Staged-photo preview with its size and a way to drop it.
    /// @param photo - one staged photo; its image was decoded once at staging.
    /// @param remove - drops this photo from the staged set.
    private func attachmentChip(_ photo: StagedPhoto, remove: @escaping () -> Void) -> some View {
        HStack(spacing: 10) {
            if let image = photo.image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 44, height: 44)
                    .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
            }
            Text("照片 · \(byteCount(photo.data.count))")
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
            Spacer()
            Button(action: remove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
            .buttonStyle(TomatoPressableStyle())
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
        pickedImages.append(StagedPhoto(data: encoded))
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
            pickedImages.append(StagedPhoto(data: encoded))
        } catch {
            attachError = describe(error)
        }
    }

    /// Downscale to `maximumEdge` and re-encode as JPEG.
    /// @param image - the decoded photo.
    /// @returns JPEG bytes, or nil when encoding fails.
    static func prepare(_ image: UIImage) -> Data? {
        // A decode can yield a zero-size image; a zero renderer size is not a
        // photo the composer can stage.
        guard image.size.width > 0, image.size.height > 0 else { return nil }
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

/// One staged photo, identified across a removal.
private struct StagedPhoto: Identifiable, Equatable {
    let id = UUID()
    let data: Data
    /// Decoded once at staging so the chip and the send path never re-decode
    /// the full-resolution JPEG on every keystroke.
    let image: UIImage?

    init(data: Data) {
        self.data = data
        image = UIImage(data: data)
    }

    static func == (lhs: StagedPhoto, rhs: StagedPhoto) -> Bool {
        lhs.id == rhs.id && lhs.data == rhs.data
    }
}
