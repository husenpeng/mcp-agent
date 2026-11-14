//
//  AgentDebugSeed.swift
//  Tomato Remote
//
//  Debug-only seed for the local agent on a simulator or device check.
//
//  A test copies `Documents/agent-seed.json` into the app container and
//  relaunches: the file carries the model endpoint, key, one MCP server, and a
//  prompt. The app configures Tomato Phone, installs the MCP server, runs one
//  turn, and writes `agent-result.json` back to the same container. A release
//  build compiles all of this out.
//

#if DEBUG
    import Foundation

    /// One local-agent check.
    @MainActor
    enum AgentDebugSeed {
        private struct Seed: Decodable {
            let baseURL: String
            let key: String
            let model: String
            let mcpURL: String?
            let mcpName: String?
            let prompt: String
            /// `reasoning_effort` to check; absent leaves the default automatic.
            let reasoningEffort: String?
        }

        private struct Result: Encodable {
            struct Entry: Encodable {
                let role: String
                let text: String
                let tool: String?
                /// Characters of thinking the endpoint streamed for this turn.
                let reasoningChars: Int?
            }

            let finishedAt: String
            let entries: [Entry]
            let error: String?
            let installError: String?
        }

        static var seedURL: URL {
            documents.appendingPathComponent("agent-seed.json")
        }

        static var resultURL: URL {
            documents.appendingPathComponent("agent-result.json")
        }

        static var isPresent: Bool {
            FileManager.default.fileExists(atPath: seedURL.path)
        }

        private static var documents: URL {
            FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        }

        /// Configure, install, run one prompt, and leave the transcript behind.
        static func runIfPresent() async {
            guard let data = try? Data(contentsOf: seedURL) else { return }
            try? FileManager.default.removeItem(at: seedURL)
            guard let seed = try? JSONDecoder().decode(Seed.self, from: data) else {
                AppLog.error(.model, "agent 种子无法解析")
                return
            }
            var config = AgentModelConfig()
            config.baseURL = seed.baseURL
            config.model = seed.model
            config.maxSteps = 8
            config.reasoningEffort = seed.reasoningEffort
            AgentConfigStore.save(config)
            do {
                try AgentConfigStore.setAPIKey(seed.key)
            } catch {
                AppLog.error(.model, "agent Key 写入失败", detail: error.localizedDescription)
            }
            var installError: String?
            if let url = seed.mcpURL, !url.isEmpty {
                do {
                    let capability = try await AgentCapabilityStore.shared.installMCP(
                        urlString: url,
                        name: seed.mcpName ?? "MCP",
                        token: ""
                    )
                    AppLog.info(.model, "已安装 MCP", detail: "\(capability.name) · \(capability.tools.count) 个工具")
                } catch {
                    installError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                    AppLog.error(.model, "MCP 安装失败", detail: installError ?? "")
                }
            }
            let agent = PhoneAgentModel.shared
            let messages = await agent.runForTesting(seed.prompt)
            let result = Result(
                finishedAt: ISO8601DateFormatter().string(from: Date()),
                entries: messages.map {
                    Result.Entry(
                        role: $0.role.rawValue, text: $0.text, tool: $0.toolName,
                        reasoningChars: $0.reasoning?.count
                    )
                },
                error: agent.errorMessage,
                installError: installError
            )
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            if let encoded = try? encoder.encode(result) {
                try? encoded.write(to: resultURL, options: .atomic)
            }
            AppLog.info(.model, "agent 种子完成", detail: "\(messages.count) 条")
        }
    }
#endif
