//
//  HubClient+Create.swift
//  Tomato Remote
//
//  Creating the two shared objects a Desktop also owns: a hired Rbot from one of
//  the Host's templates, and a room assembled from published robots.
//
//  Both writes land in the Host's own store, so the Desktop lists them on its
//  next read without any sync step of its own.
//

import Foundation

extension HubClient {
    /// Hire one robot from a registered template.
    /// - Parameters:
    ///   - templateId: template to copy.
    ///   - name: display name; the Host uses the template's localized name when nil.
    ///   - locale: locale whose template copy fills the specification.
    /// - Returns: the hired robot.
    func hireRobot(templateId: String, name: String?, locale: String = "zh-CN") async throws -> Robot {
        var request: [String: JSONValue] = [
            "templateId": .string(templateId),
            "locale": .string(locale),
        ]
        if let name, !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            request["name"] = .string(name)
        }
        return try await call("robot/hire", body: JSONValue.object(request), as: Robot.self)
    }

    /// Publish a new room.
    /// - Parameter spec: complete room specification, built from the starter
    ///   defaults the Host's editor also uses.
    /// - Returns: the stored room.
    func publishRoom(spec: JSONValue) async throws -> Room {
        try await call("room/publish", body: JSONValue.object(["spec": spec]), as: Room.self)
    }
}
