//
//  PhoneAgentView.swift
//  Tomato Remote
//
//  Tomato Phone: the local agent and its capability market.
//
//  The layout follows the desktop agent — a transcript, tool cards, a composer —
//  while the palette is deliberately softer than the Host client: a light
//  canvas, large white cards, and one blue-violet accent. The capability
//  market is the second half of this tab: plugins, skills, and MCP servers,
//  each of which the agent can propose from a conversation.
//

import PhotosUI
import SwiftUI
import UIKit
import UniformTypeIdentifiers

/// Tomato Phone tab: conversation and capability market.
struct PhoneAgentView: View {
    @ObservedObject private var agent = PhoneAgentModel.shared
    @ObservedObject private var store = AgentCapabilityStore.shared
    @State private var segment = ProcessInfo.processInfo.arguments.contains("-TOMATO_PHONE_MARKET") ? 1 : 0
    @State private var showsSettings = false
    @State private var showsMCP = false
    @State private var showsSkill = false
    @State private var marketKind: AgentCapabilityKind = .mcp
    /// The endpoint, model, and depth the next turn uses.
    @State private var config = AgentConfigStore.load()
    /// Which model picker the composer is showing, if any.
    @State private var picker: PhonePicker?
    /// Photos staged for the next prompt.
    @State private var photos: [StagedPhoto] = []
    @State private var pickerItems: [PhotosPickerItem] = []
    /// Document staged for the next prompt, already read to text.
    @State private var document: AgentDocument?
    @State private var attachError: String?
    @State private var showsImporter = false
    @State private var showsCamera = false
    @FocusState private var composerFocused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header
                segmented
                if segment == 0 {
                    chat
                } else {
                    market
                }
            }
            .background(AgentTheme.canvas.ignoresSafeArea())
            .navigationBarHidden(true)
            .toolbar {
                // The keyboard's own way out, next to the composer's chevron:
                // the deck stays one tap away on a long phone.
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("收起") { composerFocused = false }
                        .accessibilityIdentifier("phone.keyboard.dismiss")
                }
            }
            .sheet(isPresented: $showsSettings) {
                AgentModelSettingsView()
                    .tint(AgentTheme.accent)
            }
            .sheet(isPresented: $showsMCP) {
                MCPInstallSheet(store: store)
            }
            .sheet(isPresented: $showsSkill) {
                SkillInstallSheet(store: store)
            }
            .sheet(item: $picker) { which in
                switch which {
                case .model:
                    PhoneModelSheet(config: $config)
                        .tomatoSheet()
                case .reasoning:
                    PhoneReasoningSheet(config: $config)
                        .tomatoSheet()
                }
            }
            .fileImporter(
                isPresented: $showsImporter,
                allowedContentTypes: [.pdf, .plainText, .text],
                allowsMultipleSelection: false
            ) { result in
                read(result)
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
            .onChange(of: config) { _, next in
                AgentConfigStore.save(next)
            }
            .onChange(of: pickerItems) { _, items in
                guard !items.isEmpty else { return }
                let picked = items
                pickerItems = []
                loadPickedPhotos(picked)
            }
            .task { stageDebugStateIfAsked() }
        }
    }

    /// Stage the sample attachment or open a picker a test launch asked for.
    ///
    /// Present only with `-TOMATO_PHONE_SAMPLE_PHOTO` and
    /// `-TOMATO_PHONE_SHEET <model|reasoning>`; a release build never stages a
    /// photo or opens a sheet on its own.
    private func stageDebugStateIfAsked() {
        #if DEBUG
            let arguments = ProcessInfo.processInfo.arguments
            if arguments.contains("-TOMATO_PHONE_SAMPLE_PHOTO"), photos.isEmpty {
                let size = CGSize(width: 900, height: 600)
                let image = UIGraphicsImageRenderer(size: size).image { context in
                    let colors = [UIColor.systemRed.cgColor, UIColor.systemOrange.cgColor] as CFArray
                    let space = CGColorSpaceCreateDeviceRGB()
                    if let gradient = CGGradient(colorsSpace: space, colors: colors, locations: [0, 1]) {
                        context.cgContext.drawLinearGradient(
                            gradient,
                            start: .zero,
                            end: CGPoint(x: size.width, y: size.height),
                            options: []
                        )
                    }
                    let label = "Tomato Phone 样张" as NSString
                    label.draw(
                        at: CGPoint(x: 40, y: 40),
                        withAttributes: [
                            .font: UIFont.systemFont(ofSize: 48, weight: .semibold),
                            .foregroundColor: UIColor.white,
                        ]
                    )
                }
                if let data = image.jpegData(compressionQuality: 0.8) {
                    photos.append(StagedPhoto(data: data))
                }
            }
            if let index = arguments.firstIndex(of: "-TOMATO_PHONE_SHEET"),
               arguments.indices.contains(index + 1)
            {
                picker = arguments[index + 1] == "reasoning" ? .reasoning : .model
            }
        #endif
    }

    // MARK: Header

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Tomato Phone")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(AgentTheme.ink)
                Text("手机上的 agent · 能力经 MCP 获取")
                    .font(.caption)
                    .foregroundStyle(AgentTheme.inkSecondary)
            }
            Spacer()
            Button {
                showsSettings = true
            } label: {
                Image(systemName: "slider.horizontal.3")
                    .font(.body.weight(.medium))
                    .foregroundStyle(AgentTheme.accent)
                    .frame(width: 38, height: 38)
                    .background(AgentTheme.surface, in: Circle())
                    .overlay(Circle().strokeBorder(AgentTheme.border, lineWidth: 1))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("模型设置")
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }

    private var segmented: some View {
        HStack(spacing: 6) {
            segmentButton(0, "对话")
            segmentButton(1, "能力市场")
        }
        .padding(4)
        .background(AgentTheme.surfaceMuted, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .padding(.horizontal, 20)
        .padding(.bottom, 12)
    }

    private func segmentButton(_ value: Int, _ title: String) -> some View {
        Button {
            composerFocused = false
            withAnimation(.easeInOut(duration: 0.18)) { segment = value }
        } label: {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(segment == value ? AgentTheme.ink : AgentTheme.inkSecondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(
                    segment == value ? AgentTheme.surface : Color.clear,
                    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                )
        }
        .buttonStyle(.plain)
    }

    // MARK: Chat

    private var chat: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 10) {
                        if agent.messages.isEmpty {
                            greeting
                        }
                        ForEach(agent.messages) { message in
                            row(message)
                                .id(message.id)
                        }
                        if !agent.streamingText.isEmpty {
                            streamingRow
                                .id("streaming")
                        }
                        if let error = agent.errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(AgentTheme.danger)
                                .padding(.horizontal, 4)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 4)
                    .padding(.bottom, 16)
                }
                .onChange(of: agent.messages.count) { _, _ in
                    guard let last = agent.messages.last else { return }
                    withAnimation(.easeOut(duration: 0.2)) { proxy.scrollTo(last.id, anchor: .bottom) }
                }
                .onChange(of: agent.streamingText) { _, text in
                    guard !text.isEmpty else { return }
                    withAnimation(.easeOut(duration: 0.15)) { proxy.scrollTo("streaming", anchor: .bottom) }
                }
                .scrollDismissesKeyboard(.immediately)
                .simultaneousGesture(TapGesture().onEnded { composerFocused = false })
            }
            composer
        }
    }

    private var greeting: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("你好，我是 Tomato")
                .font(.headline)
                .foregroundStyle(AgentTheme.ink)
            Text("我会用你配置的模型和已安装的能力帮你做事。数据来自 MCP，记忆留在个人记忆里。")
                .font(.subheadline)
                .foregroundStyle(AgentTheme.inkSecondary)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 8) {
                chip("帮我记住：我常喝美式") { agent.send("帮我记住：我常喝美式") }
                chip("你能做什么？") { agent.send("你能做什么？") }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: AgentTheme.cardRadius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AgentTheme.cardRadius, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
        .padding(.bottom, 4)
    }

    private func chip(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.caption.weight(.medium))
                .foregroundStyle(AgentTheme.accent)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(AgentTheme.accent.opacity(0.08), in: Capsule())
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func row(_ message: AgentMessage) -> some View {
        switch message.role {
        case .user:
            userRow(message)
        case .assistant:
            if !message.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                assistantBubble(message.text)
            }
        case .tool:
            toolCard(message)
        case .proposal:
            proposalCard(message)
        }
    }

    /// One answer bubble. The font is the transcript size, so a long turn scans
    /// like a conversation instead of a document.
    /// - Parameter text: Markdown the model wrote.
    private func assistantBubble(_ text: String) -> some View {
        markdown(text)
            .font(AgentTheme.messageFont)
            .lineSpacing(2)
            .foregroundStyle(AgentTheme.ink)
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: AgentTheme.bubbleRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AgentTheme.bubbleRadius, style: .continuous)
                    .strokeBorder(AgentTheme.border, lineWidth: 1)
            )
    }

    /// The answer as it arrives. It occupies the same bubble the finished row
    /// will, with a cursor-like dot so a slow first token still shows activity.
    private var streamingRow: some View {
        HStack(alignment: .bottom, spacing: 6) {
            assistantBubble(agent.streamingText)
            Circle()
                .fill(AgentTheme.accent)
                .frame(width: 5, height: 5)
                .padding(.bottom, 10)
        }
        .accessibilityIdentifier("phone.streaming")
    }

    /// One owner turn: staged photos first, then a document badge, then the text
    /// bubble. A prompt may carry any subset.
    /// - Parameter message: the user turn.
    private func userRow(_ message: AgentMessage) -> some View {
        let files = message.attachmentList
        let images = files.filter { $0.kind == .image }
        let documents = files.filter { $0.kind == .document }
        return VStack(alignment: .trailing, spacing: 8) {
            if !images.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(images) { attachment in
                            if let data = agent.imageData(for: attachment),
                               let image = UIImage(data: data)
                            {
                                Image(uiImage: image)
                                    .resizable()
                                    .scaledToFill()
                                    .frame(width: 156, height: 156)
                                    .clipShape(RoundedRectangle(cornerRadius: AgentTheme.bubbleRadius, style: .continuous))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: AgentTheme.bubbleRadius, style: .continuous)
                                            .strokeBorder(AgentTheme.border, lineWidth: 1)
                                    )
                                    .accessibilityLabel("附带的照片")
                            }
                        }
                    }
                }
                .frame(maxWidth: 300, alignment: .trailing)
            }
            ForEach(documents) { attachment in
                HStack(spacing: 6) {
                    Image(systemName: "doc.text")
                    Text(attachment.name)
                        .lineLimit(1)
                    Text(ByteCountFormatter.string(fromByteCount: Int64(attachment.byteCount), countStyle: .file))
                        .foregroundStyle(AgentTheme.inkSecondary)
                }
                .font(.caption)
                .foregroundStyle(AgentTheme.inkSecondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(AgentTheme.surface, in: Capsule())
                .overlay(Capsule().strokeBorder(AgentTheme.border, lineWidth: 1))
            }
            if !message.text.isEmpty {
                Text(message.text)
                    .font(AgentTheme.messageFont)
                    .lineSpacing(2)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(AgentTheme.accentGradient, in: RoundedRectangle(cornerRadius: AgentTheme.bubbleRadius, style: .continuous))
            }
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
    }

    /// Basic markdown the model commonly writes: bold spans, line breaks.
    private func markdown(_ text: String) -> Text {
        if let attributed = try? AttributedString(
            markdown: text,
            options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        ) {
            return Text(attributed)
        }
        return Text(text)
    }

    private func toolCard(_ message: AgentMessage) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "wrench.and.screwdriver.fill")
                .font(.caption)
                .foregroundStyle(AgentTheme.accent)
                .padding(8)
                .background(AgentTheme.accent.opacity(0.10), in: Circle())
            VStack(alignment: .leading, spacing: 4) {
                Text(message.toolName ?? "工具")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(AgentTheme.ink)
                Text(message.text)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.inkSecondary)
                    .lineLimit(6)
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(AgentTheme.surfaceMuted, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func proposalCard(_ message: AgentMessage) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: message.proposal?.kind.symbol ?? "plus.circle")
                    .foregroundStyle(AgentTheme.accent)
                Text("添加能力：\(message.proposal?.name ?? "")")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(AgentTheme.ink)
            }
            Text(message.proposal?.summary ?? "")
                .font(.caption)
                .foregroundStyle(AgentTheme.inkSecondary)
            Button {
                guard let proposal = message.proposal else { return }
                Task { await agent.install(proposal) }
            } label: {
                Text("添加")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(AgentTheme.accentGradient, in: Capsule())
            }
            .buttonStyle(.plain)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(AgentTheme.accent.opacity(0.25), lineWidth: 1)
        )
    }

    private var composer: some View {
        VStack(spacing: 8) {
            if let attachError {
                Text(attachError)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.danger)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityIdentifier("phone.composer.error")
            }
            if !photos.isEmpty {
                photoStrip
            }
            if let document {
                documentChip(document)
            }
            VStack(alignment: .leading, spacing: 6) {
                modelRow
                HStack(alignment: .bottom, spacing: 8) {
                    inputField
                    sendButton
                }
                toolbar
            }
            .padding(10)
            .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .strokeBorder(
                        composerFocused ? AgentTheme.accent.opacity(0.35) : AgentTheme.border,
                        lineWidth: 1
                    )
            )
            .animation(.easeOut(duration: 0.16), value: composerFocused)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
    }

    @State private var draft = ""

    // MARK: Composer

    /// The model and reasoning chips: each opens its own sheet, because the two
    /// choices are independent.
    private var modelRow: some View {
        HStack(spacing: 6) {
            ModelChoiceChip(title: config.model, identifier: "phone.composer.model") {
                composerFocused = false
                picker = .model
            }
            .layoutPriority(1)
            EffortChoiceChip(
                title: AgentReasoningLevel.title(for: config.reasoningEffort),
                isActive: config.reasoningEffort != nil,
                identifier: "phone.composer.effort"
            ) {
                composerFocused = false
                picker = .reasoning
            }
            .fixedSize()
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 2)
        .padding(.top, 2)
    }

    private var inputField: some View {
        TextField("问点什么，或者让我记住一件事", text: $draft, axis: .vertical)
            .lineLimit(1 ... 4)
            .focused($composerFocused)
            .font(AgentTheme.inputFont)
            .padding(.horizontal, 6)
            .padding(.top, 4)
            .accessibilityIdentifier("phone.composer.input")
    }

    /// Photo library, camera, document, and the way back out of the keyboard.
    private var toolbar: some View {
        HStack(spacing: 8) {
            PhotosPicker(
                selection: $pickerItems,
                maxSelectionCount: max(1, 4 - photos.count),
                matching: .images
            ) {
                composerIcon("photo.on.rectangle")
            }
            .buttonStyle(.plain)
            .disabled(photos.count >= 4)
            .accessibilityLabel("附加照片")
            .accessibilityIdentifier("phone.composer.photo")

            Button(action: openCamera) {
                composerIcon("camera")
            }
            .buttonStyle(.plain)
            .accessibilityLabel("拍照")
            .accessibilityIdentifier("phone.composer.camera")

            Button {
                composerFocused = false
                showsImporter = true
            } label: {
                composerIcon("paperclip")
            }
            .buttonStyle(.plain)
            .accessibilityLabel("附加文档")
            .accessibilityIdentifier("phone.composer.document")

            Spacer(minLength: 0)

            if composerFocused {
                Button {
                    composerFocused = false
                } label: {
                    composerIcon("keyboard.chevron.compact.down")
                }
                .buttonStyle(.plain)
                .accessibilityLabel("收起输入框")
                .accessibilityIdentifier("phone.composer.collapse")
            }
        }
    }

    /// One 34-point tap target in the composer's toolbar.
    /// - Parameter name: SF Symbol.
    private func composerIcon(_ name: String) -> some View {
        Image(systemName: name)
            .font(.body)
            .foregroundStyle(AgentTheme.inkSecondary)
            .frame(width: 34, height: 34)
            .contentShape(Circle())
    }

    @ViewBuilder
    private var sendButton: some View {
        let hasContent = !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || !photos.isEmpty
            || document != nil
        Button {
            if agent.isRunning {
                agent.stop()
            } else {
                send()
            }
        } label: {
            Image(systemName: agent.isRunning ? "stop.fill" : "arrow.up")
                .font(.footnote.weight(.bold))
                .foregroundStyle(agent.isRunning || hasContent ? Color.white : AgentTheme.inkSecondary)
                .frame(width: 38, height: 38)
                .background {
                    if agent.isRunning || hasContent {
                        Circle().fill(agent.isRunning ? AnyShapeStyle(AgentTheme.ink) : AnyShapeStyle(AgentTheme.accentGradient))
                    } else {
                        Circle().fill(AgentTheme.surfaceMuted)
                    }
                }
        }
        .buttonStyle(.plain)
        .disabled(!agent.isRunning && !hasContent)
        .accessibilityLabel(agent.isRunning ? "停止" : "发送")
        .accessibilityIdentifier("phone.composer.send")
    }

    /// Staged photos with a way to drop each one.
    private var photoStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(photos) { photo in
                    ZStack(alignment: .topTrailing) {
                        if let image = photo.image {
                            Image(uiImage: image)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 56, height: 56)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .strokeBorder(AgentTheme.border, lineWidth: 1)
                                )
                        }
                        Button {
                            photos.removeAll { $0.id == photo.id }
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.footnote)
                                .foregroundStyle(AgentTheme.inkSecondary)
                                .background(Circle().fill(AgentTheme.surface))
                        }
                        .buttonStyle(.plain)
                        .offset(x: 5, y: -5)
                        .accessibilityLabel("移除照片")
                    }
                }
            }
            .padding(.top, 5)
            .padding(.trailing, 6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Staged document, shown by name so the owner knows what rides along.
    /// - Parameter document: the file already read to text.
    private func documentChip(_ document: AgentDocument) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "doc.text")
                .font(.footnote)
                .foregroundStyle(AgentTheme.accent)
            VStack(alignment: .leading, spacing: 2) {
                Text(document.name)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.ink)
                    .lineLimit(1)
                Text(document.truncated
                    ? "已保留前 6 万字 · \(Self.byteCount(document.byteCount))"
                    : Self.byteCount(document.byteCount))
                    .font(.caption2)
                    .foregroundStyle(AgentTheme.inkSecondary)
            }
            Spacer(minLength: 0)
            Button {
                self.document = nil
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(AgentTheme.inkSecondary)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("移除文档")
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Hand the staged prompt to the agent, then put the dock back in its
    /// one-line state with the keyboard down.
    private func send() {
        let text = draft
        let images = photos.map(\.data)
        let file = document
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || !images.isEmpty
            || file != nil
        else { return }
        draft = ""
        photos = []
        pickerItems = []
        document = nil
        attachError = nil
        composerFocused = false
        agent.send(text, images: images, document: file)
    }

    private func openCamera() {
        guard PhoneCamera.isAvailable else {
            attachError = "这台设备没有可用的相机"
            return
        }
        composerFocused = false
        attachError = nil
        showsCamera = true
    }

    /// Downscale a capture or library photo and stage it.
    /// - Parameter image: the full-size image.
    private func stage(_ image: UIImage) {
        guard photos.count < 4 else {
            attachError = "一次最多带 4 张照片"
            return
        }
        guard let data = ComposerView.prepare(image) else {
            attachError = "无法压缩这张照片"
            return
        }
        attachError = nil
        photos.append(StagedPhoto(data: data))
    }

    /// Load and stage each picked library photo.
    /// - Parameter items: picker selection.
    private func loadPickedPhotos(_ items: [PhotosPickerItem]) {
        Task { @MainActor in
            for item in items {
                guard photos.count < 4 else {
                    attachError = "一次最多带 4 张照片"
                    break
                }
                do {
                    guard let original = try await item.loadTransferable(type: Data.self),
                          let image = UIImage(data: original)
                    else {
                        attachError = "无法读取这张照片"
                        continue
                    }
                    stage(image)
                } catch {
                    attachError = error.localizedDescription
                }
            }
        }
    }

    /// Read a chosen document while its security scope is open.
    /// - Parameter result: the file importer's result.
    private func read(_ result: Result<[URL], Error>) {
        switch result {
        case let .success(urls):
            guard let url = urls.first else { return }
            let accessed = url.startAccessingSecurityScopedResource()
            Task { @MainActor in
                defer {
                    if accessed {
                        url.stopAccessingSecurityScopedResource()
                    }
                }
                do {
                    let file = try await Task.detached { try PhoneDocumentReader.read(url) }.value
                    document = file
                    attachError = nil
                } catch {
                    attachError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                }
            }
        case let .failure(error):
            attachError = error.localizedDescription
        }
    }

    private static func byteCount(_ bytes: Int) -> String {
        ByteCountFormatter.string(fromByteCount: Int64(bytes), countStyle: .file)
    }

    // MARK: Market

    private var market: some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                ForEach(AgentCapabilityKind.allCases) { kind in
                    Button {
                        withAnimation(.easeInOut(duration: 0.16)) { marketKind = kind }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: kind.symbol)
                            Text(kind.title)
                        }
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(marketKind == kind ? AgentTheme.accent : AgentTheme.inkSecondary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(
                            marketKind == kind ? AgentTheme.accent.opacity(0.10) : AgentTheme.surface,
                            in: Capsule()
                        )
                    }
                    .buttonStyle(.plain)
                }
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 8)

            ScrollView {
                LazyVStack(spacing: 12) {
                    if installed(for: marketKind).isEmpty {
                        Text(emptyText(for: marketKind))
                            .font(.caption)
                            .foregroundStyle(AgentTheme.inkSecondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(16)
                            .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                    ForEach(installed(for: marketKind)) { capability in
                        capabilityCard(capability)
                    }
                    addCard
                    catalog
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 24)
            }
        }
    }

    private func installed(for kind: AgentCapabilityKind) -> [AgentCapability] {
        store.items.filter { $0.kind == kind }
    }

    private func emptyText(for kind: AgentCapabilityKind) -> String {
        switch kind {
        case .plugin: "还没有插件。插件把技能和 MCP 组合成一套能力。"
        case .skill: "还没有 Skill。Skill 是给 agent 的指令包，不执行代码。"
        case .mcp: "还没有 MCP。MCP 提供远程工具，所有外部数据都从这里来。"
        }
    }

    private func capabilityCard(_ capability: AgentCapability) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: capability.kind.symbol)
                .font(.body)
                .foregroundStyle(AgentTheme.accent)
                .frame(width: 38, height: 38)
                .background(AgentTheme.accent.opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(capability.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(AgentTheme.ink)
                    Text("v\(capability.version)")
                        .font(.caption2)
                        .foregroundStyle(AgentTheme.inkSecondary)
                }
                Text(capability.summary)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.inkSecondary)
                    .lineLimit(2)
                if !capability.tools.isEmpty {
                    Text("\(capability.tools.count) 个工具")
                        .font(.caption2)
                        .foregroundStyle(AgentTheme.accent)
                }
            }
            Spacer(minLength: 4)
            VStack(spacing: 8) {
                Toggle("", isOn: Binding(
                    get: { capability.enabled },
                    set: { store.setEnabled(capability, $0) }
                ))
                .labelsHidden()
                .tint(AgentTheme.accent)
                Button {
                    store.remove(capability)
                } label: {
                    Image(systemName: "trash")
                        .font(.caption)
                        .foregroundStyle(AgentTheme.inkSecondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(14)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
    }

    @ViewBuilder
    private var addCard: some View {
        switch marketKind {
        case .mcp:
            Button { showsMCP = true } label: { addLabel("添加 MCP 服务器", "连接远程工具服务器") }
                .buttonStyle(.plain)
        case .skill:
            Button { showsSkill = true } label: { addLabel("添加 Skill", "写入一段给 agent 的指令") }
                .buttonStyle(.plain)
        case .plugin:
            Button {
                Task {
                    _ = try? await store.installPlugin(AgentPluginManifest(
                        name: "外卖订单助手",
                        version: "1.0",
                        summary: "把订单查询技能与 MCP 工具组合成一套能力。",
                        skillText: "查订单时先确认平台（淘宝闪购/外卖）与时间范围，再调用订单工具；只读，不下单不支付。",
                        mcpURL: nil,
                        mcpName: nil
                    ))
                }
            } label: { addLabel("安装示例插件", "技能 + MCP 的声明式组合") }
                .buttonStyle(.plain)
        }
    }

    private func addLabel(_ title: String, _ subtitle: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "plus")
                .font(.body.weight(.semibold))
                .foregroundStyle(AgentTheme.accent)
                .frame(width: 38, height: 38)
                .background(AgentTheme.accent.opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(AgentTheme.ink)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.inkSecondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(AgentTheme.inkSecondary)
        }
        .padding(14)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
    }

    private var catalog: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("能力市场")
                .font(.caption.weight(.semibold))
                .foregroundStyle(AgentTheme.inkSecondary)
            Text("插件、Skill 和 MCP 都可以在这里安装；对话里让 agent 提议也行。外部数据只经 MCP 进入。")
                .font(.caption2)
                .foregroundStyle(AgentTheme.inkSecondary)
        }
        .padding(.top, 4)
    }
}

// MARK: - Model settings

/// Model endpoint, key, and model id for the local agent.
struct AgentModelSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var config = AgentConfigStore.load()
    @State private var keyDraft = AgentConfigStore.apiKey ?? ""
    @State private var saved: String?
    @StateObject private var catalog = PhoneModelCatalog.shared
    @FocusState private var editing: Bool

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Base URL", text: $config.baseURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                        .focused($editing)
                    SecureField("API Key", text: $keyDraft)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($editing)
                } header: {
                    Text("模型服务")
                } footer: {
                    Text("Key 只存在这台手机的钥匙串；Tomato Phone 的模型调用直接发往这个地址，不经过配对的 Mac。")
                }

                Section {
                    HStack {
                        Text("当前模型")
                        Spacer(minLength: 12)
                        Menu {
                            if catalog.models.isEmpty {
                                Text("先获取模型，或直接输入模型 ID")
                            } else {
                                ForEach(catalog.models, id: \.self) { model in
                                    Button {
                                        config.model = model
                                        saveConfig()
                                    } label: {
                                        if model == config.model {
                                            Label(model, systemImage: "checkmark")
                                        } else {
                                            Text(model)
                                        }
                                    }
                                }
                            }
                        } label: {
                            Text(config.model)
                                .foregroundStyle(AgentTheme.accent)
                                .lineLimit(1)
                                .truncationMode(.middle)
                        }
                    }
                    TextField("模型 ID", text: $config.model)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($editing)
                    Button(catalog.isLoading ? "正在获取…" : "获取模型列表") {
                        Task { await refreshModels() }
                    }
                    .disabled(catalog.isLoading)
                    if let error = catalog.error {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(AgentTheme.danger)
                    }
                } header: {
                    Text("模型")
                } footer: {
                    Text("选择后立即生效；即使不点「保存」，关闭时也会保留。")
                }

                Section {
                    Picker("推理深度", selection: reasoningSelection) {
                        Text("自动").tag("")
                        ForEach(AgentReasoningLevel.allCases) { level in
                            Text(level.title).tag(level.rawValue)
                        }
                    }
                    .pickerStyle(.menu)
                    .tint(AgentTheme.accent)
                } header: {
                    Text("推理")
                } footer: {
                    Text("「自动」交给模型决定；低、中、高会作为 reasoning_effort 随每次请求发送。")
                }

                Section {
                    Stepper("最多 \(config.maxSteps) 步", value: $config.maxSteps, in: 2 ... 20)
                }

                Section {
                    Button("保存") {
                        save()
                        saved = "已保存：\(config.model)"
                    }
                    if let saved {
                        Text(saved)
                            .font(.footnote)
                            .foregroundStyle(AgentTheme.success)
                    }
                }
            }
            .scrollDismissesKeyboard(.immediately)
            .navigationTitle("Tomato Phone 模型")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("关闭") {
                        saveIfNeeded()
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("完成") {
                        save()
                        dismiss()
                    }
                }
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("收起键盘") { editing = false }
                }
            }
            .onChange(of: config) { _, next in
                AgentConfigStore.save(next)
            }
            .onDisappear { saveIfNeeded() }
            .presentationDragIndicator(.visible)
        }
    }

    private func saveConfig() {
        AgentConfigStore.save(config)
    }

    /// Bridge the optional stored effort to the picker's string tags.
    private var reasoningSelection: Binding<String> {
        Binding(
            get: { config.reasoningEffort ?? "" },
            set: { config.reasoningEffort = $0.isEmpty ? nil : $0 }
        )
    }

    /// Read the endpoint's models with the key on screen, so a just-typed key
    /// works without saving the sheet first.
    private func refreshModels() async {
        await catalog.load(
            baseURL: config.baseURL,
            apiKey: keyDraft.isEmpty ? AgentConfigStore.apiKey : keyDraft,
            force: true
        )
    }

    private func save() {
        saveConfig()
        try? AgentConfigStore.setAPIKey(keyDraft)
    }

    /// Closing the sheet by swiping must not lose an edit.
    private func saveIfNeeded() {
        saveConfig()
        if !keyDraft.isEmpty {
            try? AgentConfigStore.setAPIKey(keyDraft)
        }
    }
}

// MARK: - Install sheets

/// Add one MCP server by endpoint.
struct MCPInstallSheet: View {
    @ObservedObject var store: AgentCapabilityStore
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var url = ""
    @State private var token = ""
    @State private var busy = false
    @State private var failure: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("名称", text: $name)
                    TextField("https://… 或 http://…", text: $url)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                    SecureField("Bearer Token（可选）", text: $token)
                } header: {
                    Text("MCP 服务器")
                } footer: {
                    Text("只支持远程 HTTP（Streamable HTTP）。添加时会连接服务器并读取工具列表。")
                }
                if let failure {
                    Section { Text(failure).foregroundStyle(AgentTheme.danger).font(.footnote) }
                }
                Section {
                    Button(busy ? "连接中…" : "连接并添加") { Task { await install() } }
                        .disabled(busy || url.isEmpty)
                }
            }
            .scrollDismissesKeyboard(.immediately)
            .presentationDragIndicator(.visible)
            .navigationTitle("添加 MCP")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } } }
        }
    }

    private func install() async {
        busy = true
        defer { busy = false }
        do {
            try await store.installMCP(urlString: url, name: name, token: token)
            dismiss()
        } catch {
            failure = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}

/// Add one skill as instructions.
struct SkillInstallSheet: View {
    @ObservedObject var store: AgentCapabilityStore
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var text = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("名称", text: $name)
                    TextField("给 agent 的指令…", text: $text, axis: .vertical)
                        .lineLimit(4 ... 10)
                } header: {
                    Text("Skill")
                } footer: {
                    Text("Skill 只影响 agent 的提示词，不执行任何代码。")
                }
                Section {
                    Button("添加") {
                        store.installSkill(name: name, text: text)
                        dismiss()
                    }
                    .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .scrollDismissesKeyboard(.immediately)
            .presentationDragIndicator(.visible)
            .navigationTitle("添加 Skill")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } } }
        }
    }
}

// MARK: - Staged photos

/// One JPEG staged for the next Tomato Phone prompt.
private struct StagedPhoto: Identifiable, Equatable {
    let id = UUID()
    let data: Data

    /// The decoded image, or nil when the bytes are not a JPEG.
    var image: UIImage? {
        UIImage(data: data)
    }
}
