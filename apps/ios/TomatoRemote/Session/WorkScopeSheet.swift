//
//  WorkScopeSheet.swift
//  Tomato Remote
//
//  The folder this conversation runs in on the Mac.
//
//  The Host owns the directory: this sheet offers the folders the Host's other
//  Sessions already use plus a free path, and submits one change. The committed
//  directory arrives back as a projection, so the chip and the Desktop agree.
//

import SwiftUI

struct WorkScopeSheet: View {
    @ObservedObject var chat: ChatModel
    /// Folders the Host's Sessions already work in, offered before typing a path.
    let folders: [String]

    @Environment(\.dismiss) private var dismiss
    @State private var selected: String?
    @State private var manual = ""

    /// The path the Apply button submits: a typed path wins over the list.
    private var effective: String? {
        let typed = manual.trimmingCharacters(in: .whitespacesAndNewlines)
        if !typed.isEmpty {
            return typed
        }
        return selected
    }

    private var canApply: Bool {
        guard let effective, !chat.isChangingWorkingDirectory else { return false }
        return effective != chat.workingDirectory
    }

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(
                title: "工作范围",
                caption: "这段会话在 Mac 上的工作目录；改完后，之后的任务都在新目录里执行。",
                onClose: { dismiss() }
            )
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let failure = chat.workingDirectoryError {
                        ErrorBanner(message: failure)
                    }
                    if let current = chat.workingDirectory {
                        VStack(alignment: .leading, spacing: 3) {
                            Text("当前目录")
                                .font(.caption)
                                .foregroundStyle(TomatoToken.labelCaption)
                            Text(current)
                                .font(.footnote.monospaced())
                                .foregroundStyle(TomatoToken.labelSecondary)
                                .textSelection(.enabled)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    if !folders.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("这台 Mac 的文件夹")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(TomatoToken.labelCaption)
                            TomatoCard(padding: 0) {
                                VStack(spacing: 0) {
                                    ForEach(Array(folders.enumerated()), id: \.element) { index, folder in
                                        folderRow(folder)
                                        if index < folders.count - 1 {
                                            Divider()
                                                .overlay(TomatoToken.borderL1)
                                                .padding(.leading, 14)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    VStack(alignment: .leading, spacing: 8) {
                        Text("或手动输入")
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(TomatoToken.labelCaption)
                        TextField("绝对路径，例如 /Users/you/work", text: $manual)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .font(.footnote.monospaced())
                            .padding(.horizontal, 14)
                            .frame(height: 44)
                            .background(
                                TomatoToken.bgLayer2,
                                in: RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous)
                            )
                            .accessibilityIdentifier("scope.input")
                            .onChange(of: manual) { _, value in
                                if !value.isEmpty {
                                    selected = nil
                                }
                            }
                        Text("目录必须已在这台 Mac 上存在；Host 会拒绝不存在的路径。")
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.labelDimmed)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
                .padding(.top, 4)
            }
            SheetPrimaryButton(title: "应用", isBusy: chat.isChangingWorkingDirectory, isEnabled: canApply) {
                apply()
            }
            .padding(.top, 8)
            .padding(.bottom, 18)
        }
        .background(TomatoToken.bgBase)
        .accessibilityIdentifier("scope.sheet")
        .onAppear {
            if folders.contains(where: { $0 == chat.workingDirectory }) {
                selected = chat.workingDirectory
            }
        }
    }

    /// One known folder, marked while it is the chosen scope.
    private func folderRow(_ folder: String) -> some View {
        Button {
            selected = folder
            manual = ""
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "folder")
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.brandPrimary)
                VStack(alignment: .leading, spacing: 2) {
                    Text(URL(fileURLWithPath: folder).lastPathComponent)
                        .font(.callout)
                        .foregroundStyle(TomatoToken.labelPrimary)
                        .lineLimit(1)
                    Text(folder)
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelDimmed)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
                Spacer(minLength: 8)
                if selected == folder {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(TomatoToken.brandPrimary)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .contentShape(Rectangle())
        }
        .buttonStyle(TomatoPressableStyle())
        .accessibilityIdentifier("scope.folder.\(folder)")
    }

    /// Submit one change; a failure keeps the sheet open with its message.
    private func apply() {
        guard let path = effective else { return }
        Task {
            await chat.setWorkingDirectory(path)
            if chat.workingDirectoryError == nil {
                dismiss()
            }
        }
    }
}

/// The conversation header's folder chip: the Session's scope on the Mac.
struct WorkScopeChip: View {
    /// Directory the Host projects, or nil before it reports one.
    let path: String?
    /// Folder name the list already knew, used before the projection arrives.
    let fallback: String?
    let open: () -> Void

    var body: some View {
        Button(action: open) {
            HStack(spacing: 5) {
                Image(systemName: "folder")
                    .font(.caption2.weight(.semibold))
                Text(title)
                    .font(.caption.weight(.medium))
                    .lineLimit(1)
                Image(systemName: "chevron.down")
                    .font(.system(size: 8, weight: .semibold))
            }
            .foregroundStyle(TomatoToken.labelSecondary)
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(TomatoToken.bgLayer2, in: Capsule())
            .overlay(Capsule().strokeBorder(TomatoToken.borderL2, lineWidth: 0.5))
            .contentShape(Capsule())
        }
        .buttonStyle(TomatoPressableStyle())
        .accessibilityIdentifier("chat.workScope")
        .accessibilityLabel("工作范围")
        .accessibilityValue(title)
    }

    /// Folder name the chip shows.
    private var title: String {
        guard let path else { return fallback ?? "未设置" }
        return URL(fileURLWithPath: path).lastPathComponent
    }
}

extension View {
    /// Present the work-scope sheet from the conversation screen.
    /// - Parameters:
    ///   - chat: conversation whose directory can change.
    ///   - folders: folders the Host's Sessions already use.
    ///   - isPresented: whether the sheet is up.
    /// - Returns: the screen with the sheet attached.
    func workScopeSheet(chat: ChatModel, folders: [String], isPresented: Binding<Bool>) -> some View {
        sheet(isPresented: isPresented) {
            WorkScopeSheet(chat: chat, folders: folders)
                .tomatoSheet([.height(560)])
        }
    }
}
