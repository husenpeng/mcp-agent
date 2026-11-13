//
//  Brain.swift
//  Tomato Runner
//
//  The on-device task loop.
//
//  It runs inside the runner, not in the application: the application is
//  suspended as soon as the task drives another app, while the runner keeps
//  running. Every step is one model turn over the same engine calls a remote
//  caller uses, so the lease, the risk gate, and the observation format stay
//  identical whichever side drives the phone.
//
//  The loop opens on a real reading of the screen, answers every tool call with
//  its own result — including the reason an action was refused — and carries only
//  the newest screen, so each decision is made on what is in front of the phone
//  now rather than on a remembered one.
//

import Foundation

/// One task the phone runs by itself.
final class PhoneTask: @unchecked Sendable {
    enum State: String {
        case running, needsConfirm = "needs_confirm", done, failed, stopped, maxSteps = "max_steps"
    }

    struct Step: Codable {
        let n: Int
        let action: String
        let ok: Bool
        let ms: Int
        let detail: String
    }

    let id = UUID().uuidString
    let goal: String
    /// Set by `cancel`; the model call in flight stops at its next checkpoint.
    let signal = AsyncSignal()
    private let lock = NSLock()
    private var state: State = .running
    private var steps: [Step] = []
    private var summary: String?
    private var failure: String?
    private var cancelled = false

    init(goal: String) {
        self.goal = goal
    }

    var snapshot: PhoneJSON {
        lock.lock()
        defer { lock.unlock() }
        return .object([
            "runId": .string(id),
            "goal": .string(goal),
            "status": .string(state.rawValue),
            "steps": .array(steps.map { step in
                .object([
                    "n": .number(Double(step.n)),
                    "action": .string(step.action),
                    "ok": .bool(step.ok),
                    "ms": .number(Double(step.ms)),
                    "detail": .string(step.detail),
                ])
            }),
            "summary": summary.map(PhoneJSON.string) ?? .null,
            "error": failure.map(PhoneJSON.string) ?? .null,
        ])
    }

    /// Whether a new task has to wait for this one.
    var isActive: Bool {
        lock.lock()
        defer { lock.unlock() }
        return state == .running || state == .needsConfirm
    }

    var isCancelled: Bool {
        lock.lock()
        defer { lock.unlock() }
        return cancelled
    }

    func cancel() {
        lock.lock()
        cancelled = true
        if state == .running || state == .needsConfirm {
            state = .stopped
        }
        lock.unlock()
        signal.cancel()
    }

    func finish(_ state: State, summary: String? = nil, failure: String? = nil) {
        lock.lock()
        self.state = state
        self.summary = summary ?? self.summary
        self.failure = failure ?? self.failure
        lock.unlock()
    }

    func append(_ step: Step) {
        lock.lock()
        steps.append(step)
        lock.unlock()
    }

    func markNeedsConfirm() {
        lock.lock()
        state = .needsConfirm
        lock.unlock()
    }

    func resumeRunning() {
        lock.lock()
        if state == .needsConfirm {
            state = .running
        }
        lock.unlock()
    }
}

/// Runs one goal through the engine, step by step.
final class Brain {
    /// Bounds one task runs under. They live with the loop rather than with the
    /// screen: the model sees one screen at a time, and a step that keeps failing
    /// is a reason to stop rather than to spend the rest of the budget.
    private enum Limits {
        /// Seconds one model turn may take.
        static let turn: TimeInterval = 90
        static let observe: TimeInterval = 30
        static let act: TimeInterval = 45
        static let lease: TimeInterval = 10
        /// Lease lifetime in milliseconds; the loop releases instead of renewing.
        static let leaseMs = 1_800_000
        /// Consecutive failed steps that end a task.
        static let failedSteps = 3
    }

    private let engine: Engine
    private let queue = DispatchQueue(label: "ai.tomato.runner.brain")
    private let lock = NSLock()
    private var tasks: [String: PhoneTask] = [:]
    /// Identity of the most recently started task; UUID order is not start order.
    private var newest: String?

    init(engine: Engine) {
        self.engine = engine
    }

    /// Start one task and return its identity immediately.
    /// @param params - goal, provider choice, and step budget.
    /// @returns `{ runId }`.
    /// @throws PhoneFailure when a task is already running or the goal is empty.
    func start(_ params: PhoneJSON) throws -> PhoneJSON {
        let goal = params["goal"]?.stringValue?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !goal.isEmpty else { throw PhoneFailure(.badRequest, "task.start 需要 goal") }
        let choice = try params["provider"]?.decode(ProviderChoice.self) ?? {
            throw PhoneFailure(.badRequest, "task.start 需要 provider")
        }()
        let maxSteps = max(1, min(60, params["maxSteps"]?.intValue ?? 30))
        let startApp = params["startApp"]?.stringValue

        lock.lock()
        if let newest, let current = tasks[newest], current.isActive {
            lock.unlock()
            throw PhoneFailure(.badRequest, "已经有一个任务在跑，先 task.stop")
        }
        let task = PhoneTask(goal: goal)
        tasks[task.id] = task
        newest = task.id
        lock.unlock()

        queue.async {
            self.run(task: task, choice: choice, maxSteps: maxSteps, startApp: startApp)
        }
        return .object(["runId": .string(task.id)])
    }

    /// Read one task's state, or the newest one when no id is given.
    /// @param params - optional `runId`.
    /// @returns the task snapshot, or a failure when none exists.
    func status(_ params: PhoneJSON) throws -> PhoneJSON {
        lock.lock()
        defer { lock.unlock() }
        let id = params["runId"]?.stringValue
        let task = id.flatMap { tasks[$0] } ?? newest.flatMap { tasks[$0] }
        guard let task else { throw PhoneFailure(.notFound, "没有任务记录") }
        return task.snapshot
    }

    /// Stop one task.
    /// @param params - optional `runId`; omitted stops the running one.
    func stop(_ params: PhoneJSON) throws -> PhoneJSON {
        lock.lock()
        defer { lock.unlock() }
        let id = params["runId"]?.stringValue
        let task = id.flatMap { tasks[$0] } ?? newest.flatMap { tasks[$0] }
        task?.cancel()
        return task?.snapshot ?? .object([:])
    }

    // MARK: - Loop

    /// Run one task, holding the device for its whole duration.
    ///
    /// The lease is released on every exit path: left to expire, it would keep
    /// the page from taking the phone back for thirty minutes after a task that
    /// already ended.
    private func run(task: PhoneTask, choice: ProviderChoice, maxSteps: Int, startApp: String?) {
        let holder = "local:task:\(task.id)"
        do {
            let provider = try makeProvider(choice)
            try acquire(holder: holder)
            defer { release(holder: holder) }

            var conversation = TaskConversation()
            let prelude = startApp.flatMap { launch(task: task, app: $0) }
            let screen = try BrainText.render(readScreen())
            conversation.start(system: BrainText.systemPrompt, goal: task.goal, prelude: prelude, screen: screen)
            try loop(
                task: task,
                provider: provider,
                conversation: &conversation,
                maxSteps: maxSteps,
                holder: holder
            )
        } catch let failure as PhoneFailure {
            // A stop, an unanswered confirmation, or the owner's halt ends the
            // task where it stood; everything else is a failure worth reporting.
            if task.isCancelled {
                task.finish(.stopped)
            } else if failure.code == PhoneErrorCode.halted.rawValue {
                task.finish(.stopped, failure: failure.message)
            } else {
                task.finish(.failed, failure: failure.message)
            }
        } catch {
            task.finish(.failed, failure: error.localizedDescription)
        }
    }

    private func loop(
        task: PhoneTask,
        provider: ModelProvider,
        conversation: inout TaskConversation,
        maxSteps: Int,
        holder: String
    ) throws {
        var failed = 0
        for step in 1 ... maxSteps {
            if task.isCancelled {
                task.finish(.stopped)
                return
            }
            // Renew before asking for a step: a task that runs longer than the
            // lease would otherwise lose the device between two actions, and a
            // takeover is reported here rather than in the middle of a gesture.
            try acquire(holder: holder)
            let decision = try awaitTurn(provider, conversation: conversation, task: task)
            switch decision {
            case let .text(text):
                task.finish(.done, summary: text)
                return
            case let .tool(call):
                conversation.append(.toolCall(id: call.id, name: call.name, arguments: call.arguments))
                if call.name == "done" {
                    task.finish(.done, summary: call.arguments["summary"]?.stringValue ?? "完成")
                    return
                }
                let started = Date()
                let outcome = try perform(call: call, task: task, conversation: &conversation)
                task.append(PhoneTask.Step(
                    n: step,
                    action: outcome.action,
                    ok: outcome.ok,
                    ms: ms(since: started),
                    detail: outcome.detail
                ))
                failed = outcome.ok ? 0 : failed + 1
                if failed >= Limits.failedSteps {
                    task.finish(.failed, failure: "连续 \(failed) 步没有成功，先停下")
                    return
                }
            }
        }
        task.finish(.maxSteps, summary: "达到步数上限")
    }

    /// One device call, and the answer the model reads afterwards.
    private struct StepOutcome {
        let action: String
        let ok: Bool
        let detail: String
    }

    /// Run one tool call and answer it.
    ///
    /// A refusal the model can correct is answered as the tool's own result so
    /// the loop continues — a stale ref is information, not the end of the task.
    private func perform(call: ToolCall, task: PhoneTask, conversation: inout TaskConversation) throws -> StepOutcome {
        switch call.name {
        case "observe":
            do {
                let observation = try readScreen()
                conversation.answer(id: call.id, text: BrainText.render(observation), screen: true)
                return StepOutcome(action: "observe", ok: true, detail: BrainText.summary(of: observation))
            } catch let failure as PhoneFailure {
                try endIfUnrecoverable(failure)
                conversation.answer(id: call.id, text: BrainText.refusal(failure), screen: false)
                return StepOutcome(action: "observe", ok: false, detail: failure.message)
            }
        case "act":
            let action = call.arguments["action"] ?? .object([:])
            let label = action["type"]?.stringValue ?? "act"
            do {
                let result = try act(action: action, task: task)
                let observation = result["observation"] ?? .object([:])
                conversation.answer(
                    id: call.id,
                    text: BrainText.actionReport(
                        label: label,
                        hint: result["hint"]?.stringValue ?? "已执行",
                        changed: result["pageChanged"]?.boolValue ?? false,
                        observation: observation
                    ),
                    screen: observation.objectValue?.isEmpty == false
                )
                return StepOutcome(action: label, ok: true, detail: result["hint"]?.stringValue ?? "已执行")
            } catch let failure as PhoneFailure {
                try endIfUnrecoverable(failure)
                conversation.answer(id: call.id, text: BrainText.refusal(failure), screen: false)
                return StepOutcome(action: label, ok: false, detail: failure.message)
            }
        default:
            let text = "没有这个工具：\(call.name)。可用的是 observe、act、done。"
            conversation.answer(id: call.id, text: text, screen: false)
            return StepOutcome(action: call.name, ok: false, detail: "未知工具")
        }
    }

    /// Open the requested application before the first model turn.
    /// @returns a remark for the model when it did not open; nil when it did.
    private func launch(task: PhoneTask, app: String) -> String? {
        let started = Date()
        guard let params = try? PhoneJSON.from(PhoneActRequest(
            action: PhoneAction(type: .launch, name: app, fresh: true),
            observeAfter: false,
            confirmToken: nil
        )) else {
            return "没能把「\(app)」交给启动动作"
        }
        switch engine.perform(method: "act", params: params, deadline: Limits.act) {
        case .success:
            task.append(PhoneTask.Step(n: 0, action: "launch", ok: true, ms: ms(since: started), detail: "打开 \(app)"))
            return nil
        case let .failure(failure):
            task.append(PhoneTask.Step(n: 0, action: "launch", ok: false, ms: ms(since: started), detail: failure.message))
            return "打开「\(app)」失败：\(failure.message)。可以改用其它应用，或先回主屏幕。"
        }
    }

    /// Ask the model for one step, with the XCTest main thread left free.
    private func awaitTurn(_ provider: ModelProvider, conversation: TaskConversation, task: PhoneTask) throws -> Decision {
        let outcome = LockedBox<Result<Decision, Error>?>(nil)
        let finished = DispatchSemaphore(value: 0)
        let work = Task {
            do {
                outcome.value = try await .success(provider.decide(transcript: conversation.items, signal: task.signal))
            } catch {
                outcome.value = .failure(error)
            }
            finished.signal()
        }
        defer { work.cancel() }
        let deadline = Date().addingTimeInterval(Limits.turn)
        while finished.wait(timeout: .now() + 0.02) == .timedOut {
            if task.isCancelled {
                throw PhoneFailure(.halted, "任务已停止")
            }
            if Date() >= deadline {
                throw PhoneFailure(.timeout, "模型调用超过 \(Int(Limits.turn))s 没有返回", retryable: true)
            }
            RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02))
        }
        guard let result = outcome.value else { throw PhoneFailure(.internal, "模型调用没有返回结果") }
        return try result.get()
    }

    /// Read the screen as the loop's own tool call.
    private func readScreen() throws -> PhoneJSON {
        let params: PhoneJSON
        do {
            params = try PhoneJSON.from(PhoneObserveRequest(maxElements: BrainText.elements, includeOcr: "auto", screenshot: nil))
        } catch {
            throw PhoneFailure(.internal, "observe 参数无法编码")
        }
        return try perform("observe", params, deadline: Limits.observe)
    }

    /// Perform one action, asking a person first when the risk gate refuses it.
    private func act(action: PhoneJSON, task: PhoneTask) throws -> PhoneJSON {
        func attempt(_ token: String?) -> Result<PhoneJSON, PhoneFailure> {
            var params: [String: PhoneJSON] = ["action": action, "observeAfter": .bool(true)]
            if let token {
                params["confirmToken"] = .string(token)
            }
            return engine.perform(method: "act", params: .object(params), deadline: Limits.act)
        }
        var outcome = attempt(nil)
        if case let .failure(failure) = outcome, failure.code == PhoneErrorCode.needsConfirmation.rawValue {
            // A person must approve; the notification carries the decision.
            let prompt = ConfirmRequest(
                reason: failure.details?["reason"]?.stringValue ?? "这个操作不可撤销",
                target: failure.details?["target"]?.stringValue ?? "当前界面",
                token: failure.details?["confirmToken"]?.stringValue ?? ""
            )
            task.markNeedsConfirm()
            let token = ConfirmCenter.shared.await(prompt: prompt)
            task.resumeRunning()
            if task.isCancelled {
                throw PhoneFailure(.halted, "任务已停止")
            }
            guard let token else {
                throw PhoneFailure(.halted, "没有人确认这次操作")
            }
            outcome = attempt(token)
        }
        switch outcome {
        case let .success(value): return value
        case let .failure(failure): throw failure
        }
    }

    /// One engine call; the engine reports failure as a value, and every caller
    /// here models it as the throw it is.
    private func perform(_ method: String, _ params: PhoneJSON, deadline: TimeInterval) throws -> PhoneJSON {
        switch engine.perform(method: method, params: params, deadline: deadline) {
        case let .success(value): value
        case let .failure(failure): throw failure
        }
    }

    /// Take the device for this task.
    ///
    /// A refusal is reported rather than ignored: driving the screen under
    /// another holder's lease would let this task and that holder act at once.
    private func acquire(holder: String) throws {
        let params: PhoneJSON
        do {
            params = try PhoneJSON.from(PhoneLeaseRequest(holder: holder, ttlMs: Limits.leaseMs))
        } catch {
            throw PhoneFailure(.internal, "lease.acquire 参数无法编码")
        }
        let grant = try perform("lease.acquire", params, deadline: Limits.lease)
        guard grant["granted"]?.boolValue == true else {
            let current = grant["holder"]?.stringValue ?? "别的控制者"
            throw PhoneFailure(
                .leaseHeld,
                "设备正被 \(current) 占用；先在「手机」页让出设备再开始任务",
                details: .object(["holder": .string(current)])
            )
        }
    }

    /// Hand the device back; only this task's own lease can be released.
    private func release(holder: String) {
        guard let params = try? PhoneJSON.from(PhoneLeaseReleaseRequest(holder: holder)) else { return }
        _ = engine.perform(method: "lease.release", params: params, deadline: Limits.lease)
    }

    /// End the task for a failure no model choice can fix: a locked device, a
    /// blocked application, another controller's lease, or the owner's stop.
    private func endIfUnrecoverable(_ failure: PhoneFailure) throws {
        let terminal = [
            PhoneErrorCode.locked, .blockedApp, .leaseHeld, .halted, .unauthorized,
        ].map(\.rawValue)
        if terminal.contains(failure.code) {
            throw failure
        }
    }

    private func ms(since start: Date) -> Int {
        Int(Date().timeIntervalSince(start) * 1000)
    }
}

/// One value handed across a thread hop.
private final class LockedBox<Value>: @unchecked Sendable {
    private let lock = NSLock()
    private var stored: Value

    init(_ value: Value) {
        stored = value
    }

    var value: Value {
        get {
            lock.lock()
            defer { lock.unlock() }
            return stored
        }
        set {
            lock.lock()
            stored = newValue
            lock.unlock()
        }
    }
}
