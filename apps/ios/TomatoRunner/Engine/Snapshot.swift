//
//  Snapshot.swift
//  Tomato Runner
//
//  Reads the visible screen from one accessibility tree dump.
//
//  `XCUIApplication.debugDescription` returns the whole subtree in a single
//  round trip to testmanagerd. Walking `children` element by element costs one
//  round trip per node and stalls for tens of seconds on SpringBoard, which is
//  why the reader parses this text instead.
//
//  The dump looks like:
//
//      Element subtree:
//       →Application, 0x1069e2a80, pid: 35, label: ' '
//          Window, 0x1069e2bc0, {{0.0, 0.0}, {393.0, 852.0}}
//            Button, 0x1069e3c00, label: '通用', {{16.0, 404.0}, {358.0, 44.0}}
//

import XCTest

/// One element the engine can act on later.
struct SnapshotTarget {
    let role: String
    let label: String
    let value: String?
    let frame: CGRect
}

/// One element parsed out of a dump.
private struct ParsedElement {
    let role: String
    let label: String
    let value: String?
    let frame: CGRect
}

/// One reading of the screen.
final class Snapshot {
    let observation: PhoneObservation
    let targets: [String: SnapshotTarget]

    init(observation: PhoneObservation, targets: [String: SnapshotTarget]) {
        self.observation = observation
        self.targets = targets
    }

    /// Fingerprint of the visible content, used to answer `pageChanged`.
    var signature: Int {
        var hasher = Hasher()
        for element in observation.elements {
            hasher.combine(element.label)
            for value in element.frame {
                hasher.combine(Int(value.rounded()))
            }
        }
        hasher.combine(observation.elements.count)
        return hasher.finalize()
    }
}

/// Parses one accessibility dump into the wire observation.
enum SnapshotReader {
    /// Roles whose elements are worth showing: containers only carry their own
    /// label, and everything else is structure the model cannot act on.
    static let interestingRoles: Set<String> = [
        "Button", "Cell", "StaticText", "TextField", "SecureTextField", "TextView",
        "Switch", "Slider", "Link", "Image", "SearchField", "TabBar", "SegmentedControl",
        "PickerWheel", "Stepper", "CheckBox", "RadioButton", "MenuItem", "Alert", "Keyboard",
    ]

    /// Read one application's current screen.
    /// @param app - application bound to the foreground process.
    /// @param maxElements - most elements to return.
    /// @returns the observation and the targets its refs name.
    static func read(app: XCUIApplication, maxElements: Int) -> Snapshot {
        parse(app.debugDescription, maxElements: maxElements)
    }

    /// Parse one dump.
    /// @param dump - `XCUIApplication.debugDescription` output.
    /// @param maxElements - most elements to return.
    static func parse(_ dump: String, maxElements: Int) -> Snapshot {
        var collected: [ParsedElement] = []
        var keyboardVisible = false
        var alertTitle: String?
        var alertButtons: [String] = []
        var border: CGRect?
        var inAlert = false
        var alertDepth = 0

        for line in dump.split(separator: "\n", omittingEmptySubsequences: true) {
            let indent = line.prefix { $0 == " " || $0 == "\u{2192}" }.count
            let body = line.dropFirst(indent)
            guard let comma = body.firstIndex(of: ",") else { continue }
            let role = String(body[..<comma]).trimmingCharacters(in: .whitespaces)
            guard !role.isEmpty else { continue }
            let frame = parseFrame(body) ?? .zero
            // Icon-only controls carry no label; their identifier is the only
            // handle a model can use, so it stands in for one.
            let identifier = parseQuoted(body, key: "identifier")
            let declared = parseQuoted(body, key: "label") ?? ""
            let label = declared.isEmpty ? (identifier ?? "") : declared
            let value = parseQuoted(body, key: "value")
            if border == nil, role == "Window", frame.width > 1, frame.height > 1 {
                border = frame
            }
            if role == "Keyboard" {
                keyboardVisible = true
            }
            if role == "Alert" {
                inAlert = true
                alertDepth = indent
                alertTitle = label.isEmpty ? nil : label
            } else if inAlert, indent > alertDepth, role == "Button" {
                alertButtons.append(label)
            } else if inAlert, indent <= alertDepth {
                inAlert = false
            }
            guard interestingRoles.contains(role), frame.width > 1, frame.height > 1, role != "Keyboard", role != "Alert",
                  !label.isEmpty || !(value ?? "").isEmpty else { continue }
            collected.append(ParsedElement(role: role, label: label, value: value, frame: frame))
        }

        let screen = PhoneScreen(
            width: Double(border?.width ?? 393),
            height: Double(border?.height ?? 852),
            scale: Double(UIScreen.main.scale)
        )
        let visible = CGRect(origin: .zero, size: CGSize(width: screen.width, height: screen.height))
        let onScreen = collected.filter { visible.intersects($0.frame) }
        let kept = Array(onScreen.prefix(maxElements))
        let elements = kept.enumerated().map { index, item in
            PhoneElement(
                ref: "e\(index)",
                role: item.role,
                label: item.label,
                value: item.value,
                frame: [
                    Double(item.frame.minX), Double(item.frame.minY),
                    Double(item.frame.width), Double(item.frame.height),
                ],
                enabled: true
            )
        }
        var targets: [String: SnapshotTarget] = [:]
        for (index, item) in kept.enumerated() {
            targets["e\(index)"] = SnapshotTarget(role: item.role, label: item.label, value: item.value, frame: item.frame)
        }
        let alert = alertTitle == nil && alertButtons.isEmpty
            ? nil
            : PhoneAlert(title: alertTitle, buttons: alertButtons)
        let observation = PhoneObservation(
            observationId: UUID().uuidString,
            foreground: nil,
            screen: screen,
            elements: elements,
            ocr: nil,
            truncated: onScreen.count > kept.count,
            keyboardVisible: keyboardVisible,
            alert: alert
        )
        return Snapshot(observation: observation, targets: targets)
    }

    /// Read one `{{x, y}, {w, h}}` frame from a dump line.
    /// @param body - line without its indent.
    /// @returns the rectangle, or nil when the line carries none.
    private static func parseFrame(_ body: Substring) -> CGRect? {
        guard let open = body.range(of: "{{"), let close = body.range(of: "}}", range: open.upperBound ..< body.endIndex) else {
            return nil
        }
        // The dump writes `{{x, y}, {w, h}}`: strip the inner braces before
        // splitting, or the second and third components keep a brace and fail
        // to parse.
        let numbers = body[open.upperBound ..< close.lowerBound]
            .replacingOccurrences(of: "{", with: " ")
            .replacingOccurrences(of: "}", with: " ")
            .split(separator: ",")
            .compactMap { Double($0.trimmingCharacters(in: .whitespaces)) }
        guard numbers.count == 4 else { return nil }
        return CGRect(x: numbers[0], y: numbers[1], width: numbers[2], height: numbers[3])
    }

    /// Read one `key: 'value'` member from a dump line.
    /// @param body - line without its indent.
    /// @param key - member name.
    private static func parseQuoted(_ body: Substring, key: String) -> String? {
        guard let marker = body.range(of: "\(key): '") else { return nil }
        let rest = body[marker.upperBound...]
        guard let end = rest.firstIndex(of: "'") else { return nil }
        return String(rest[..<end])
    }
}
