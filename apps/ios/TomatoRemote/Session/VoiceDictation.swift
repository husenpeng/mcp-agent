//
//  VoiceDictation.swift
//  Tomato Remote
//
//  Push-to-talk dictation for the composer.
//
//  One sentence is recognized twice. While the owner speaks, Apple's on-device
//  model supplies the live transcript the panel shows; no audio leaves the
//  phone for it. On release the same recording travels to the paired Mac, where
//  SenseVoice re-recognizes the finished sentence with better Chinese
//  punctuation and proper nouns, and its text replaces the live one.
//
//  The session never writes into the composer itself. It publishes what it
//  heard and hands back the recording; the composer decides when a sentence is
//  committed, which is what lets a release commit, an upward swipe abandon, and
//  a tap keep listening.
//

import AVFoundation
import Speech

/// The parts of a dictation that change while the owner is speaking.
///
/// Keeping them off the session object means a new hypothesis or level
/// re-renders the capture panel alone, not every control around the composer.
@MainActor
final class VoiceLiveCapture: ObservableObject {
    /// Best hypothesis so far, replaced on every update.
    @Published private(set) var transcript = ""
    /// Rolling input level, newest last.
    @Published private(set) var meter: [Double] = Array(repeating: 0, count: VoiceDictation.meterLength)

    /// Adopt the recognizer's newest hypothesis for the panel and the commit.
    ///
    /// A hypothesis that follows a long pause may cover only the words spoken
    /// after it, so it continues the shown sentence instead of replacing it.
    /// - Parameter text: the recognizer's current best sentence.
    func hear(_ text: String) {
        transcript = VoiceTranscription.adopted(text, after: transcript)
    }

    /// Append one measured level, dropping the oldest.
    /// - Parameter level: normalized input level from 0 to 1.
    func append(level: Double) {
        var next = meter
        next.removeFirst()
        next.append(level)
        meter = next
    }

    /// Take the hypothesis for finishing, leaving an empty slate.
    /// - Returns: the raw transcript.
    func takeTranscript() -> String {
        let text = transcript
        transcript = ""
        return text
    }

    /// Clear the sentence and the meter.
    func reset() {
        transcript = ""
        clearMeter()
    }

    /// Clear only the meter, keeping the hypothesis a caller still has to collect.
    func clearMeter() {
        meter = Array(repeating: 0, count: VoiceDictation.meterLength)
    }
}

/// One dictation session: microphone in, transcript out, nothing else.
@MainActor
final class VoiceDictation: ObservableObject {
    /// What one finished sentence produced: the live transcript, and the
    /// recording the Host can recognize a second time.
    struct Capture: Sendable {
        /// Apple's on-device result, or nil when it heard nothing.
        let text: String?
        /// Canonical WAV of the sentence, or nil when nothing was captured.
        let audio: Data?
    }

    /// Where the session is.
    enum Phase: Equatable {
        /// Waiting for the two permissions, before any audio is captured.
        case preparing
        /// The microphone is open and partial transcripts keep arriving.
        case listening
        /// The owner released; the recognizer is finishing the last words.
        case finishing
        /// No session.
        case idle
    }

    /// Shortest utterance worth converting; below this the owner released by
    /// accident.
    static let minimumDuration: TimeInterval = 0.8
    /// Longest utterance; the recording has to stay inside the Host's intake.
    static let maximumDuration: TimeInterval = 60
    /// Finger travel that abandons the sentence, as WeChat's own swipe does.
    static let cancelDistance: CGFloat = 60
    /// A press shorter than this keeps the microphone open instead of
    /// committing, so the bar works by hold and by tap.
    static let tapDuration: TimeInterval = 0.45
    /// Bars kept for the level meter.
    static let meterLength = 26

    @Published private(set) var phase: Phase = .idle
    @Published private(set) var isAuthorized = false
    /// Whether the microphone stays open after the finger leaves the bar.
    @Published private(set) var isHandsFree = false
    /// Whatever changes while the owner speaks; the panel observes this
    /// object instead of the whole session.
    let live = VoiceLiveCapture()
    @Published private(set) var startedAt: Date?
    /// Whether Apple's on-device model is producing the live transcript. When
    /// the phone has no model for this language the recording still runs, and
    /// only the Host recognizes it.
    @Published private(set) var isPreviewing = false
    /// Why dictation cannot run, when it cannot.
    @Published private(set) var failure: String?
    /// One line the owner should read after a session — too short, too long.
    @Published private(set) var hint: String?

    /// Called when a hands-free session ends without the owner asking: the
    /// recognizer stopped, the time limit hit, or the system took the
    /// microphone back. The composer commits what it is handed.
    var onAutoFinish: ((Capture) -> Void)?

    private let engine = AVAudioEngine()
    private var recognizer: SFSpeechRecognizer?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var gate: CaptureGate?
    /// The sentence as the Host's recognizer will hear it.
    private var recording: SpeechRecording?
    private var tapInstalled = false
    private var isCapturing = false
    private var beganAt = Date.distantPast
    private var finalWaiter: CheckedContinuation<Void, Never>?
    private var finalDeadline: Task<Void, Never>?
    private var deadline: Task<Void, Never>?
    private var observers: [NSObjectProtocol] = []
    private var lastPartialAt = Date.distantPast
    /// Whether the recognizer already delivered its final hypothesis, so a
    /// release right after it does not wait for a callback that will not come.
    private var sawFinal = false

    /// Whether a session is open; the composer draws the panel from this.
    var isActive: Bool {
        phase != .idle
    }

    // MARK: - Permissions

    /// Ask for the microphone and speech permissions, once per run.
    /// - Returns: whether both were granted.
    @discardableResult
    func prepare() async -> Bool {
        if isAuthorized {
            return true
        }
        guard phase == .idle else {
            return isAuthorized
        }
        phase = .preparing
        let speech = await Self.speechAuthorization()
        var microphone = false
        if speech {
            microphone = await Self.microphoneAuthorization()
        }
        // A hold may have started a session while the prompt was up; only leave
        // the preparing phase this call itself entered.
        if phase == .preparing {
            phase = .idle
        }
        isAuthorized = speech && microphone
        if isAuthorized {
            failure = nil
        } else {
            failure = "需要麦克风和语音识别权限，请在系统设置里打开"
        }
        return isAuthorized
    }

    // MARK: - Session

    /// Open the microphone. Does nothing while another session runs.
    func start() {
        guard phase == .idle else {
            return
        }
        guard isAuthorized else {
            failure = "需要麦克风和语音识别权限，请在系统设置里打开"
            return
        }
        failure = nil
        hint = nil
        live.reset()
        sawFinal = false
        isHandsFree = false
        recording = nil

        guard let recognizer = SFSpeechRecognizer(
            locale: VoiceTranscription.locale(among: SFSpeechRecognizer.supportedLocales())
        ) else {
            failure = "这台设备暂时不能识别语音"
            return
        }
        self.recognizer = recognizer
        guard activateAudioSession() else {
            self.recognizer = nil
            return
        }
        // Only the on-device model may run while the owner speaks: the audio
        // stays on the phone until the finished sentence goes to the Host.
        let request = recognizer.supportsOnDeviceRecognition ? makeRequest() : nil
        self.request = request
        guard installTap(appendingTo: request), startEngine() else {
            return
        }
        beginListening(on: recognizer, request: request)
    }

    /// Keep the microphone open after the finger leaves, until `finish`.
    func enterHandsFree() {
        guard phase == .listening else {
            return
        }
        isHandsFree = true
    }

    /// Put one line above the dock, such as a phrase the owner should repeat.
    /// - Parameter text: the sentence to show.
    func note(_ text: String) {
        hint = text
    }

    // MARK: - Audio setup

    /// Activate a record-only session. `.measurement` keeps the system's own
    /// processing out of the signal, and no Bluetooth option leaves the input
    /// on the phone's wideband microphone instead of a narrowband headset.
    private func activateAudioSession() -> Bool {
        do {
            let audio = AVAudioSession.sharedInstance()
            try audio.setCategory(.record, mode: .measurement, options: [.duckOthers])
            try audio.setActive(true)
            return true
        } catch {
            failure = "麦克风启动失败：\(error.localizedDescription)"
            deactivateAudioSession()
            return false
        }
    }

    /// Configure one recognition request for the live transcript.
    private func makeRequest() -> SFSpeechAudioBufferRecognitionRequest {
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        request.taskHint = .dictation
        // The live text is a preview; the Host's model produces the final one.
        request.addsPunctuation = true
        request.contextualStrings = VoiceTranscription.vocabulary
        // Recognition on the device keeps the audio on the phone.
        request.requiresOnDeviceRecognition = true
        return request
    }

    private func installTap(appendingTo request: SFSpeechAudioBufferRecognitionRequest?) -> Bool {
        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        guard format.sampleRate > 0, format.channelCount > 0 else {
            failure = "没有可用的麦克风输入"
            self.request = nil
            recognizer = nil
            deactivateAudioSession()
            return false
        }
        removeTap()
        // The recording the Host re-hears is assembled from the same buffers;
        // without a converter the live transcript still works.
        let recording = SpeechRecording(from: format)
        self.recording = recording
        if recording == nil {
            AppLog.warning(.ui, "无法把麦克风音频转成 16 kHz，本次不做 Mac 精修")
        }
        let gate = CaptureGate()
        self.gate = gate
        let relay = MeterRelay(interval: 0.1) { [weak self] level in
            Task { @MainActor [weak self] in
                self?.append(level: level)
            }
        }
        input.installTap(onBus: 0, bufferSize: 2048, format: format) { buffer, _ in
            guard gate.acceptsAudio else {
                return
            }
            request?.append(buffer)
            recording?.append(buffer)
            relay.consume(Self.level(of: buffer))
        }
        tapInstalled = true
        return true
    }

    private func startEngine() -> Bool {
        engine.prepare()
        do {
            try engine.start()
            return true
        } catch {
            removeTap()
            gate?.close()
            gate = nil
            request = nil
            recognizer = nil
            recording = nil
            deactivateAudioSession()
            failure = "麦克风启动失败：\(error.localizedDescription)"
            return false
        }
    }

    private func beginListening(
        on recognizer: SFSpeechRecognizer,
        request: SFSpeechAudioBufferRecognitionRequest?
    ) {
        beganAt = .now
        startedAt = .now
        isCapturing = true
        phase = .listening
        isPreviewing = request != nil
        observeAudio()
        if let request {
            task = recognizer.recognitionTask(with: request) { [weak self] result, error in
                Task { @MainActor [weak self] in
                    self?.receive(result: result, error: error)
                }
            }
        }
        // The recording has to stay inside the Host's intake; stop before the
        // recognizer errors, so the words already heard are committed.
        deadline = Task { @MainActor [weak self] in
            try? await Task.sleep(for: .seconds(Self.maximumDuration))
            guard let self, phase == .listening else {
                return
            }
            deadline = nil
            let wasHandsFree = isHandsFree
            endSession(keepingTranscript: true)
            hint = "已到最长录音时间"
            if wasHandsFree {
                deliverAutomatically()
            }
        }
    }
}

// MARK: - Finish

extension VoiceDictation {
    /// Finish the sentence the owner just spoke.
    /// - Returns: Apple's live transcript and the recording the Host can hear
    ///   again. Either may be missing; a session that ended by itself hands
    ///   back what it kept.
    func finish() async -> Capture {
        switch phase {
        case .idle:
            return Capture(text: takeTranscript(), audio: takeAudio())
        case .preparing:
            cancel()
            return Capture(text: nil, audio: nil)
        case .finishing:
            await waitForFinal()
            return Capture(text: nil, audio: nil)
        case .listening:
            let spoken = Date.now.timeIntervalSince(beganAt)
            guard spoken >= Self.minimumDuration else {
                cancel()
                hint = "说话时间太短"
                return Capture(text: nil, audio: nil)
            }
            phase = .finishing
            finishCapturing()
            await waitForFinal()
            let capture = Capture(text: takeTranscript(), audio: takeAudio())
            endSession(keepingTranscript: false)
            return capture
        }
    }

    /// Hand back this sentence's recording, clearing it.
    func takeAudio() -> Data? {
        let audio = recording?.wav()
        recording = nil
        return audio
    }

    /// Abandon the session; nothing reaches the composer.
    func cancel() {
        recording = nil
        guard phase != .idle else {
            live.reset()
            return
        }
        endSession(keepingTranscript: false)
        hint = nil
    }
}

// MARK: - Recognition

extension VoiceDictation {
    private func receive(result: SFSpeechRecognitionResult?, error: Error?) {
        if let result {
            let text = result.bestTranscription.formattedString
            let now = Date.now
            if result.isFinal {
                sawFinal = true
            }
            // Partials arrive faster than the panel needs to re-render, and a
            // final hypothesis must always land.
            if !text.isEmpty, result.isFinal || now.timeIntervalSince(lastPartialAt) >= 0.15 {
                live.hear(text)
                lastPartialAt = now
            }
        }
        guard phase == .listening || phase == .finishing else {
            return
        }
        if phase == .finishing {
            if error != nil || result?.isFinal == true {
                resumeFinalWaiter()
            }
            return
        }
        guard error != nil || result?.isFinal == true else {
            return
        }
        let wasHandsFree = isHandsFree
        if let error {
            noteFailure(error)
        }
        endSession(keepingTranscript: true)
        if wasHandsFree {
            deliverAutomatically()
        }
    }

    /// Turn a recognizer failure into one sentence, and remember the server
    /// model's failure so the next sentence starts on the device model.
    private func noteFailure(_ error: Error) {
        AppLog.warning(.ui, "语音识别中断", detail: error.localizedDescription)
        let heard = !live.transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        failure = heard
            ? "实时识别中断，已保留听到的文字"
            : "实时识别中断，松手后仍会尝试转写"
    }

    private func append(level: Double) {
        guard phase == .listening else {
            return
        }
        live.append(level: level)
    }

    private func deliverAutomatically() {
        let capture = Capture(text: takeTranscript(), audio: takeAudio())
        guard capture.text != nil || capture.audio != nil else {
            return
        }
        onAutoFinish?(capture)
    }

    private func takeTranscript() -> String? {
        let text = VoiceTranscription.normalized(live.takeTranscript())
        return text.isEmpty ? nil : text
    }
}

// MARK: - Capture

extension VoiceDictation {
    /// Stop feeding the microphone but keep the recognition task alive, so the
    /// words still being finalized after the release are not thrown away.
    private func finishCapturing() {
        guard isCapturing else {
            return
        }
        isCapturing = false
        deadline?.cancel()
        deadline = nil
        gate?.close()
        gate = nil
        stopObservers()
        removeTap()
        if engine.isRunning {
            engine.stop()
        }
        request?.endAudio()
    }

    /// Close the session now, keeping whatever was heard.
    /// - Parameter keepingTranscript: whether the transcript survives for the
    ///   caller to collect; a system interruption keeps it, a cancel does not.
    private func endSession(keepingTranscript: Bool) {
        finishCapturing()
        task?.cancel()
        task = nil
        request = nil
        recognizer = nil
        phase = .idle
        isPreviewing = false
        startedAt = nil
        isHandsFree = false
        resumeFinalWaiter()
        if !keepingTranscript {
            live.reset()
        } else {
            live.clearMeter()
        }
        deactivateAudioSession()
    }

    private func removeTap() {
        guard tapInstalled else {
            return
        }
        engine.inputNode.removeTap(onBus: 0)
        tapInstalled = false
    }

    private func deactivateAudioSession() {
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}

// MARK: - Final hypothesis

extension VoiceDictation {
    private func waitForFinal() async {
        guard task != nil, !sawFinal else {
            return
        }
        await withCheckedContinuation { continuation in
            finalWaiter = continuation
            finalDeadline = Task { @MainActor [weak self] in
                try? await Task.sleep(for: .milliseconds(1500))
                self?.resumeFinalWaiter()
            }
        }
    }

    private func resumeFinalWaiter() {
        finalDeadline?.cancel()
        finalDeadline = nil
        guard let waiter = finalWaiter else {
            return
        }
        finalWaiter = nil
        waiter.resume()
    }
}

// MARK: - System events

extension VoiceDictation {
    private func observeAudio() {
        stopObservers()
        let center = NotificationCenter.default
        observers.append(
            center.addObserver(forName: AVAudioSession.interruptionNotification, object: nil, queue: .main) { [weak self] _ in
                Task { @MainActor [weak self] in
                    self?.systemTookMicrophone("录音被系统中断")
                }
            }
        )
        observers.append(
            center.addObserver(forName: .AVAudioEngineConfigurationChange, object: engine, queue: .main) { [weak self] _ in
                Task { @MainActor [weak self] in
                    self?.systemTookMicrophone("音频通道变了，录音已结束")
                }
            }
        )
    }

    private func stopObservers() {
        for token in observers {
            NotificationCenter.default.removeObserver(token)
        }
        observers.removeAll()
    }

    /// A call, another app, or a route change closes the microphone. What was
    /// heard is kept; a hands-free session hands it straight to the composer.
    private func systemTookMicrophone(_ reason: String) {
        guard phase == .listening else {
            return
        }
        let wasHandsFree = isHandsFree
        endSession(keepingTranscript: true)
        hint = reason
        if wasHandsFree {
            deliverAutomatically()
        }
    }
}

// MARK: - Permissions, continued

extension VoiceDictation {
    private static func speechAuthorization() async -> Bool {
        switch SFSpeechRecognizer.authorizationStatus() {
        case .authorized:
            true
        case .notDetermined:
            await withCheckedContinuation { continuation in
                SFSpeechRecognizer.requestAuthorization { status in
                    continuation.resume(returning: status == .authorized)
                }
            }
        default:
            false
        }
    }

    private static func microphoneAuthorization() async -> Bool {
        await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }
}

// MARK: - Audio level

extension VoiceDictation {
    /// Root-mean-square level of one buffer, mapped from a -55 dB floor to 0…1
    /// so the meter shows speech and stays quiet in a silent room.
    private static func level(of buffer: AVAudioPCMBuffer) -> Double {
        guard let samples = buffer.floatChannelData?[0] else {
            return 0
        }
        let frames = Int(buffer.frameLength)
        guard frames > 0 else {
            return 0
        }
        var sum = 0.0
        for index in 0 ..< frames {
            let sample = Double(samples[index])
            sum += sample * sample
        }
        let rms = (sum / Double(frames)).squareRoot()
        guard rms > 0 else {
            return 0
        }
        let decibels = 20 * log10(rms)
        return min(1, max(0, (decibels + 55) / 55))
    }
}

// MARK: - Tap plumbing

/// Whether the audio tap may still append, so `endAudio` and an in-flight
/// buffer never race.
private final class CaptureGate: @unchecked Sendable {
    private let lock = NSLock()
    private var open = true

    var acceptsAudio: Bool {
        lock.lock()
        defer { lock.unlock() }
        return open
    }

    func close() {
        lock.lock()
        open = false
        lock.unlock()
    }
}

/// Hands the newest level to the main actor at a fixed rate; a buffer arrives
/// every 40 ms and re-rendering the panel that often is wasted work.
private final class MeterRelay: @unchecked Sendable {
    private let interval: TimeInterval
    private let emit: (Double) -> Void
    private var lastEmit = 0.0
    private var latest = 0.0

    init(interval: TimeInterval, emit: @escaping (Double) -> Void) {
        self.interval = interval
        self.emit = emit
    }

    func consume(_ level: Double) {
        latest = level
        let now = Date.now.timeIntervalSinceReferenceDate
        guard now - lastEmit >= interval else {
            return
        }
        lastEmit = now
        emit(latest)
    }
}
