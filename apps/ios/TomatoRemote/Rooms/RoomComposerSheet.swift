//
//  RoomComposerSheet.swift
//  Tomato Remote
//
//  Building a publishable room on the phone.
//
//  A room specification carries guard, budget, and context limits that nobody
//  should type on a phone. The sheet therefore starts from the same preset the
//  Desktop editor starts from, fills the conservative member defaults, and asks
//  only for what a person actually decides: the name, the charter, and who is in
//  the room.
//

import SwiftUI

/// Room starter presets, mirroring the Host's own three configurations.
enum RoomPreset: String, CaseIterable, Identifiable {
    case conservative, balanced, permissive

    var id: String {
        rawValue
    }

    var label: String {
        switch self {
        case .conservative: "保守"
        case .balanced: "均衡"
        case .permissive: "宽松"
        }
    }

    /// Guard and budget limits the Host publishes for this preset.
    var limits: [String: Int] {
        switch self {
        case .conservative:
            [
                "maxDepth": 2, "episodeTurns": 6, "episodeMessages": 20, "episodeTokens": 100_000,
                "wallClockMs": 600_000, "memberTurnTimeoutMs": 90000, "memberTurnsPerMinute": 4,
                "memberBurst": 2, "maxPendingPerMember": 2, "maxDuplicates": 1, "pingPongLimit": 3,
                "noProgressWindow": 3, "dailyTokens": 1_000_000,
            ]
        case .balanced:
            [
                "maxDepth": 4, "episodeTurns": 12, "episodeMessages": 40, "episodeTokens": 250_000,
                "wallClockMs": 1_200_000, "memberTurnTimeoutMs": 120_000, "memberTurnsPerMinute": 6,
                "memberBurst": 3, "maxPendingPerMember": 3, "maxDuplicates": 2, "pingPongLimit": 4,
                "noProgressWindow": 3, "dailyTokens": 3_000_000,
            ]
        case .permissive:
            [
                "maxDepth": 6, "episodeTurns": 24, "episodeMessages": 80, "episodeTokens": 600_000,
                "wallClockMs": 2_700_000, "memberTurnTimeoutMs": 180_000, "memberTurnsPerMinute": 10,
                "memberBurst": 5, "maxPendingPerMember": 5, "maxDuplicates": 3, "pingPongLimit": 6,
                "noProgressWindow": 4, "dailyTokens": 8_000_000,
            ]
        }
    }
}

struct RoomComposerSheet: View {
    let hub: HubClient
    /// Published robots offered as members; the first picked one coordinates.
    let robots: [Robot]
    let onCreated: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var charter = ""
    @State private var preset: RoomPreset = .balanced
    @State private var picked: [String] = []
    @State private var isSaving = false
    @State private var errorMessage: String?

    private var canSave: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !charter.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && picked.count >= 2
    }

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(title: "新建群聊", caption: "成员由已发布的智能体组成；创建后桌面端即可看到同一个群聊。", onClose: { dismiss() })
            Form {
                Section("群聊") {
                    TextField("名字", text: $name)
                    TextField("宗旨：这个群聊要做什么", text: $charter, axis: .vertical)
                        .lineLimit(2 ... 5)
                }
                Section {
                    ForEach(robots) { robot in
                        memberRow(robot)
                    }
                } header: {
                    Text("成员（至少 2 个）")
                } footer: {
                    Text("第一个选中的成员负责协调；其余成员只在被提到时发言。")
                }
                Section("限制") {
                    Picker("预设", selection: $preset) {
                        ForEach(RoomPreset.allCases) { preset in
                            Text(preset.label).tag(preset)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.stateErrorPrimary)
                    }
                }
            }
            .tomatoSheetContent()
            SheetPrimaryButton(title: "创建", isBusy: isSaving, isEnabled: canSave) {
                Task { await create() }
            }
            .padding(.top, 8)
            .padding(.bottom, 16)
            .accessibilityIdentifier("room.create")
        }
    }

    private func memberRow(_ robot: Robot) -> some View {
        Button {
            if let index = picked.firstIndex(of: robot.id) {
                picked.remove(at: index)
            } else {
                picked.append(robot.id)
            }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: picked.contains(robot.id) ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(picked.contains(robot.id) ? TomatoToken.brandPrimary : TomatoToken.labelDimmed)
                Text(robot.name)
                    .foregroundStyle(TomatoToken.labelPrimary)
                Spacer(minLength: 0)
                if picked.first == robot.id {
                    Text("协调")
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelCaption)
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func create() async {
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil
        do {
            _ = try await hub.publishRoom(spec: spec())
            await onCreated()
            dismiss()
        } catch {
            errorMessage = describe(error)
        }
    }

    /// The complete specification the Host publishes for this room.
    ///
    /// Assembled one block at a time: a single literal large enough to hold all
    /// of it exceeds what the type checker will accept.
    private func spec() -> JSONValue {
        let members = picked.enumerated().map { index, id in member(id, index: index) }
        let encoded = members.map { JSONValue.object($0) }
        var fields: [String: JSONValue] = [
            "name": .string(name.trimmingCharacters(in: .whitespacesAndNewlines)),
            "charter": .string(charter.trimmingCharacters(in: .whitespacesAndNewlines)),
            "members": .array(encoded),
        ]
        fields["routing"] = routing(encoded)
        fields["guard"] = guardLimits()
        fields["budget"] = .object([
            "dailyTokens": .number(Double(preset.limits["dailyTokens"] ?? 3_000_000)),
            "softLimitRatio": .number(0.8),
        ])
        fields["context"] = .object([
            "window": .number(20),
            "messageChars": .number(1500),
            "summaryChars": .number(1200),
            "triggerChars": .number(6000),
        ])
        return .object(fields)
    }

    /// Who answers an unmentioned human message.
    private func routing(_ members: [JSONValue]) -> JSONValue {
        .object([
            "humanDefault": .string("coordinator"),
            "coordinator": members.first?["id"] ?? .string(""),
            "maxFanout": .number(Double(max(1, min(3, members.count - 1)))),
            "floor": .number(1),
        ])
    }

    /// Loop protection for the chosen preset.
    private func guardLimits() -> JSONValue {
        let limits = preset.limits
        var fields: [String: JSONValue] = [
            "noProgressSimilarity": .number(0.85),
        ]
        for key in [
            "maxDepth", "episodeTurns", "episodeMessages", "episodeTokens", "wallClockMs",
            "memberTurnTimeoutMs", "memberTurnsPerMinute", "memberBurst", "maxPendingPerMember",
            "maxDuplicates", "pingPongLimit", "noProgressWindow",
        ] {
            fields[key] = .number(Double(limits[key] ?? 0))
        }
        return .object(fields)
    }

    /// One member, with the conservative wake, peer, and limit defaults the
    /// Desktop editor also fills in.
    private func member(_ id: String, index: Int) -> [String: JSONValue] {
        let robot = robots.first { $0.id == id }
        var entry: [String: JSONValue] = [
            "id": .string(Self.memberId(robot?.name ?? id, index: index)),
            "robot": .object([
                "spec": .string(robot?.spec.spec ?? id),
                "revision": .number(Double(robot?.spec.revision ?? 1)),
            ]),
            "displayName": .string(robot?.name ?? id),
            "role": .string(index == 0 ? "coordinator" : "worker"),
            "wake": .object(["kind": .string(index == 0 ? "all-human" : "mention")]),
            "a2a": .object([
                "canAddress": .string("*"),
                "accepts": .array(["request", "delegate", "handoff", "reply"].map { .string($0) }),
                "requiresApproval": .array([]),
            ]),
            "budget": .object([
                "turnInputTokens": .number(48000),
                "turnOutputTokens": .number(6000),
                "dailyTokens": .number(600_000),
            ]),
            "enabled": .bool(true),
        ]
        if index == 0 {
            entry["color"] = .string("indigo")
        }
        return entry
    }

    /// Lowercase member address derived from a robot name.
    private static func memberId(_ name: String, index: Int) -> String {
        let folded = name.lowercased()
            .replacingOccurrences(of: "[^a-z0-9]+", with: "-", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: "-"))
        let candidate = folded.isEmpty ? "member-\(index + 1)" : folded
        return String(candidate.prefix(32))
    }
}
