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

/// One starter prompt the conversation screen asks the dock to hold. The token
/// separates two taps of the same starter, so the second lands even when the
/// field already holds the first.
struct ComposerPrefill: Equatable {
    let token = UUID()
    let text: String
}

/// A document staged for the next prompt, with the bytes its chip previews.
///
/// The Host's receipt names the upload but cannot serve its contents back, so
/// the composer keeps the local copy for the lifetime of the staged chip.
struct StagedDocument: Identifiable {
    let id = UUID()
    let name: String
    let data: Data
}

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
    /// Document already staged on the Host, with the bytes its chip previews.
    var stagedDocument: StagedDocument?
    var onRemoveDocument: (() -> Void)?
    /// A starter prompt to place in the field, unsent.
    var prefill: ComposerPrefill?
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
    /// A staged photo the owner asked to view before sending.
    @State private var previewPhoto: StagedPhoto?
    /// A staged document the owner asked to view before sending.
    @State private var previewDocument: StagedDocument?
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
    /// Width the dock stops growing at, matching the Web client's composer
    /// column: on an iPad or a landscape phone a dock spanning the page would
    /// leave a line of text running across the whole screen.
    private static let maximumDockWidth: CGFloat = 560
    /// Side length of one control in the toolbar row.
    private static let controlSide: CGFloat = 32

    private var isReadyToSend: Bool {
        let hasText = !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        return canSend && (hasText || !pickedImages.isEmpty || stagedDocument != nil)
    }

    private var isCancelling: Bool {
        dragUp <= -VoiceDictation.cancelDistance
    }

    /// Outline of the focused dock, in the brand tint the controls use.
    private var focusBorder: Color {
        TomatoToken.brandPrimary.opacity(0.4)
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
            // One card, one surface: the prompt sits directly on the card and
            // the controls that act on it share the row beneath, with the send
            // action at the row's trailing edge. A recessed well inside the
            // card drew a box inside a box; the fill and the hairline carry
            // the lift on their own.
            VStack(alignment: .leading, spacing: 4) {
                inputRow
                toolbar
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .frame(maxWidth: Self.maximumDockWidth)
            .background(TomatoSurface.card, in: RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous)
                    .strokeBorder(
                        isFocused.wrappedValue ? TomatoLine.brandSoft : TomatoLine.hairline,
                        lineWidth: 1
                    )
            )
            .shadow(
                color: TomatoShadow.flat.color,
                radius: TomatoShadow.flat.radius,
                y: TomatoShadow.flat.y
            )
            .animation(.easeOut(duration: 0.16), value: isFocused.wrappedValue)
        }
        .padding(.horizontal, 12)
        .padding(.top, 6)
        // Six points above the home indicator: the home indicator already
        // marks where the screen ends, and the previous inset plus the dock's
        // shadow read as a grey plank under the card.
        .padding(.bottom, 6)
        .animation(.easeOut(duration: 0.18), value: dictation.isActive)
        .animation(.easeOut(duration: 0.18), value: mode)
        // A starter goes into the field, not onto the wire: the reader can edit it first.
        .onChange(of: prefill) { _, next in
            guard let next else { return }
            leaveVoiceMode()
            text = text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? next.text
                : text + "\n" + next.text
        }
        // A test run may stage the sample photo without the system picker, so the
        // preview path is reachable on a simulator.
        .task {
            #if DEBUG
                stageDebugPhotoIfAsked()
                stageDebugDraftIfAsked()
            #endif
        }
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
        // A staged attachment is the owner's own file, still on the phone, so
        // its preview never waits for the Host. Both sheets show what will be
        // sent, not a stand-in for it.
        .sheet(item: $previewPhoto) { photo in
            if let image = photo.image {
                ImagePreviewSheet(image: image)
                    .tomatoFullSheet()
                    .presentationBackground(.black)
            }
        }
        .sheet(item: $previewDocument) { document in
            LocalFilePreviewSheet(name: document.name, data: document.data)
                .tomatoFullSheet()
        }
    }
}

// MARK: - Dock surfaces

extension ComposerView {
    /// The prompt's row: the field or the voice bar, directly on the card.
    /// The card's own fill is what the eye reads as "type here"; a second
    /// recessed surface inside it only added a seam.
    @ViewBuilder
    private var inputRow: some View {
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
    }

    /// One equal weight per control, at the dock's own size. Model and
    /// reasoning sit apart from the attachment controls so the row groups as
    /// "what answers" on the left and "what it carries" beside it; the send
    /// action closes the row at thumb height.
    private var toolbar: some View {
        HStack(spacing: 6) {
            modelIcons
            dockDivider
            PhotosPicker(selection: $pickerItems, maxSelectionCount: 6, matching: .images) {
                controlGlyph("photo.on.rectangle")
            }
            .buttonStyle(TomatoPressableStyle())
            .disabled(pickedImages.count >= 6)
            .accessibilityLabel("附加照片")

            Button(action: openCamera) {
                controlGlyph("camera")
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityLabel("拍照")
            .accessibilityIdentifier("composer.camera")

            Button {
                showsImporter = true
            } label: {
                controlGlyph("paperclip")
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityLabel("附加文档")

            if mode == .typing {
                Button(action: enterVoiceMode) {
                    controlGlyph("mic")
                }
                .buttonStyle(TomatoPressableStyle())
                .accessibilityLabel("语音输入")
                .accessibilityIdentifier("composer.mic")
            } else {
                Button(action: leaveVoiceMode) {
                    controlGlyph("keyboard")
                }
                .buttonStyle(TomatoPressableStyle())
                .accessibilityLabel("切回键盘")
                .accessibilityIdentifier("composer.keyboard")
            }

            Spacer(minLength: 0)

            // The keyboard's own dismiss key sits where the row ends: it is a
            // convenience while typing, not one of the dock's standing actions.
            if isFocused.wrappedValue {
                Button {
                    isFocused.wrappedValue = false
                } label: {
                    controlGlyph("keyboard.chevron.compact.down")
                }
                .buttonStyle(TomatoPressableStyle())
                .accessibilityLabel("收起输入框")
                .accessibilityIdentifier("composer.collapse")
            }

            actionButton
        }
    }

    /// Separates the two groups of controls without a second fill; a full
    /// hairline would cut the card the way a divider does.
    private var dockDivider: some View {
        Rectangle()
            .fill(TomatoToken.borderL3)
            .frame(width: 1, height: 16)
            .padding(.horizontal, 4)
            .accessibilityHidden(true)
    }

    /// One toolbar control: a square glyph that shows its tint on press, at the
    /// 44 pt touch minimum the row's spacing alone cannot give it.
    /// - Parameter name: the SF Symbol to draw.
    /// - Returns: the pressed glyph.
    private func controlGlyph(_ name: String) -> some View {
        Image(systemName: name)
            .font(.system(size: 16, weight: .regular))
            .foregroundStyle(TomatoToken.labelSecondary)
            // A circle inset past the 32 pt square: the visible glyph stays a
            // toolbar control, the touch area reaches 44 pt, and a neighbour
            // 6 pt away never takes the tap.
            .frame(width: Self.controlSide, height: Self.controlSide)
            .contentShape(Circle().inset(by: -6))
    }

    /// Two small icons where the composer used to carry a chip row: one for the
    /// model, one for its reasoning level. Each opens its own sheet, because a
    /// model and its reasoning depth are two separate choices.
    @ViewBuilder
    private var modelIcons: some View {
        if let modelTitle, let onOpenModel {
            Button(action: onOpenModel) {
                controlGlyph("cpu")
                    .overlay(alignment: .topTrailing) {
                        if isSwitchingModel {
                            ProgressView()
                                .controlSize(.mini)
                                .offset(x: 6, y: 8)
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
                    .font(.system(size: 16, weight: .regular))
                    .foregroundStyle(effortIsActive ? TomatoToken.brandPrimary : TomatoToken.labelSecondary)
                    .frame(width: Self.controlSide, height: Self.controlSide)
                    .contentShape(Circle().inset(by: -6))
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
            .foregroundStyle(TomatoToken.labelPrimary)
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
            .padding(.vertical, 7)
            .accessibilityIdentifier("composer.input")
    }

    /// Send while idle, stop while a turn runs, closing the control row at
    /// thumb height.
    @ViewBuilder
    private var actionButton: some View {
        if isRunning {
            Button(action: onCancel) {
                Image(systemName: "stop.fill")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color.white)
                    .frame(width: Self.controlSide, height: Self.controlSide)
                    .background(TomatoToken.labelPrimary, in: Circle())
                    .contentShape(Circle().inset(by: -6))
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityLabel("停止")
            .accessibilityIdentifier("composer.stop")
        } else {
            Button(action: send) {
                Image(systemName: "arrow.up")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(isReadyToSend ? Color.white : TomatoToken.labelDimmed)
                    .frame(width: Self.controlSide, height: Self.controlSide)
                    .background(isReadyToSend ? TomatoToken.buttonPrimaryFill : TomatoToken.bgLayer3, in: Circle())
                    .contentShape(Circle().inset(by: -6))
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
                } else {
                    dictation.note("Mac 精修未完成，已保留手机识别，可直接修改")
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
        return min(30, max(8, 5 + seconds * 0.7))
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
    /// Its name opens a local preview; the remove control stays a separate
    /// target so a tap never drops the file the owner meant to inspect.
    /// - Parameter document: the staged file and the bytes it will send.
    private func documentChip(_ document: StagedDocument) -> some View {
        HStack(spacing: 8) {
            Button {
                previewDocument = document
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "doc")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.brandPrimary)
                    Text(document.name)
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .lineLimit(1)
                    Spacer(minLength: 0)
                    Image(systemName: "chevron.right")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                .frame(minHeight: 44)
                .contentShape(Rectangle())
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityLabel("预览文档 \(document.name)")
            .accessibilityHint("打开这个文件的本地副本")
            .accessibilityIdentifier("composer.document.preview")
            Button {
                onRemoveDocument?()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(TomatoToken.labelDimmed)
                    .frame(width: 44, height: 44)
                    .contentShape(Circle())
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityLabel("移除文档")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Staged-photo preview with its size and a way to drop it.
    /// The thumbnail opens the picture full screen; its bytes are already on the
    /// phone, so the preview does not depend on the Host.
    /// @param photo - one staged photo; its image was decoded once at staging.
    /// @param remove - drops this photo from the staged set.
    private func attachmentChip(_ photo: StagedPhoto, remove: @escaping () -> Void) -> some View {
        HStack(spacing: 10) {
            if let image = photo.image {
                Button {
                    previewPhoto = photo
                } label: {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 44, height: 44)
                        .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
                        .contentShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
                }
                .buttonStyle(TomatoPressableStyle())
                .accessibilityLabel("预览照片")
                .accessibilityHint("打开这张照片")
                .accessibilityIdentifier("composer.photo.preview")
            }
            Text("照片 · \(byteCount(photo.data.count))")
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
            Spacer()
            Button(action: remove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(TomatoToken.labelDimmed)
                    .frame(width: 44, height: 44)
                    .contentShape(Circle())
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

    #if DEBUG
        /// Stage one generated photo when a test run asks for it.
        ///
        /// Present only with `-TOMATO_STAGE_SAMPLE_PHOTO`; a release build never
        /// attaches a photo the owner did not choose.
        private func stageDebugPhotoIfAsked() {
            guard ProcessInfo.processInfo.arguments.contains("-TOMATO_STAGE_SAMPLE_PHOTO"),
                  pickedImages.isEmpty
            else { return }
            let image = UIGraphicsImageRenderer(size: CGSize(width: 240, height: 240)).image { context in
                context.cgContext.setFillColor(UIColor.systemTeal.cgColor)
                context.cgContext.fill(CGRect(x: 0, y: 0, width: 240, height: 240))
            }
            guard let data = Self.prepare(image) else { return }
            pickedImages.append(StagedPhoto(data: data))
        }

        /// Put a draft in the field when a style preview asks for one.
        ///
        /// Present only with `-TOMATO_PREVIEW_DRAFT`; the layout preview has no
        /// keyboard to type on, so the filled dock — the send action lit, the
        /// placeholder gone — otherwise has no way to be inspected.
        private func stageDebugDraftIfAsked() {
            guard ProcessInfo.processInfo.arguments.contains("-TOMATO_PREVIEW_DRAFT"),
                  text.isEmpty
            else { return }
            text = "把输入框的圆角和留白收一下，发送键放进框里。"
        }
    #endif

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
