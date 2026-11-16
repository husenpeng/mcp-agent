//
//  CapabilityCatalogTests.swift
//  TomatoRemoteTests
//
//  The shipped capability table: every kind has open entries, and each one
//  carries what an install needs without asking the owner for a URL.
//

@testable import TomatoRemote
import XCTest

final class CapabilityCatalogTests: XCTestCase {
    func testEveryKindHasEntriesWithUniqueIds() {
        for kind in AgentCapabilityKind.allCases {
            XCTAssertFalse(CapabilityCatalog.entries(for: kind).isEmpty, "\(kind.rawValue) has no shipped rows")
        }
        XCTAssertEqual(Set(CapabilityCatalog.all.map(\.id)).count, CapabilityCatalog.all.count)
    }

    func testRemoteEntriesUseHTTPSAndSourcePages() throws {
        for entry in CapabilityCatalog.all where entry.mcpURL != nil {
            let url = try XCTUnwrap(URL(string: entry.mcpURL ?? ""))
            XCTAssertEqual(url.scheme, "https", "\(entry.id) is not an HTTPS MCP endpoint")
            XCTAssertNotNil(URL(string: entry.sourceURL), "\(entry.id) has no source page")
            XCTAssertFalse(entry.license.isEmpty)
        }
    }

    func testIndustryAnalysisEntriesExist() {
        let ids = [
            "mcp.aws-knowledge",
            "skill.financial-statements", "skill.valuation", "skill.portfolio-risk", "skill.industry-research",
            "skill.architecture-review", "skill.tech-selection", "skill.threat-model",
            "plugin.aws-architecture",
        ]
        for id in ids {
            XCTAssertNotNil(CapabilityCatalog.all.first { $0.id == id }, "\(id) is missing")
        }
    }

    func testOfficeSkillsUseAnthropicSources() throws {
        let ids = ["skill.pptx", "skill.docx", "skill.xlsx", "skill.pdf"]
        for id in ids {
            let entry = try XCTUnwrap(CapabilityCatalog.all.first { $0.id == id }, "\(id) is missing")
            XCTAssertEqual(entry.kind, .skill)
            XCTAssertTrue(entry.sourceName.contains("anthropics/skills"))
            XCTAssertTrue(entry.sourceURL.contains("github.com/anthropics/skills"))
            XCTAssertEqual(entry.license, "Apache-2.0")
            XCTAssertNil(entry.mcpURL, "\(id) must not imply that a file tool is installed")
        }
    }

    func testSkillsAndPluginsCarryInstructions() throws {
        for entry in CapabilityCatalog.all where entry.kind != .mcp {
            let text = try XCTUnwrap(entry.skillText)
            XCTAssertFalse(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        for entry in CapabilityCatalog.all where entry.kind == .plugin {
            XCTAssertNotNil(entry.mcpURL, "\(entry.id) is a plugin without an MCP half")
            XCTAssertEqual(entry.manifest.name, entry.name)
            XCTAssertEqual(entry.manifest.mcpURL, entry.mcpURL)
        }
    }
}
