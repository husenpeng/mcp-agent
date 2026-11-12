//
//  VoiceDictation.swift
//  Tomato Remote
//
//  Dictation into the composer, on the phone.
//
//  Apple's recognizer runs on device, needs no Host plugin, and reports partial
//  results while the owner is still speaking, which is what a composer wants.
//  The Host's own transcription plugin stays unused: it is off by default, needs
//  a downloaded model, and takes one finished 16 kHz recording instead of a
//  live stream.
//

import AVFoundation
import Speech

/// One dictation session; partial text lands in the composer as it arrives.
@MainActor
final class VoiceDictation: ObservableObject {
    /// Whether the microphone is currently capturing.
    @Published private(set) var isListening = false
    /// Why dictation cannot start, when it cannot.
    @Published private(set) var failure: String?

    private let engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "zh-CN"))
    /// Called with the transcript so far, so the composer can show it live.
    private var onText: ((String) -> Void)?

    /// Ask for microphone and speech permission, once.
    /// - Parameter completion: receives whether both were granted.
    func requestPermission(_ completion: @escaping (Bool) -> Void) {
        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else {
                completion(false)
                return
            }
            AVAudioApplication.requestRecordPermission { granted in
                completion(granted)
            }
        }
    }

    /// Start dictating into a binding.
    /// - Parameters:
    ///   - onText: receives the transcript so far, replacing earlier text.
    ///   - onFinish: called once when recording stops on its own.
    func start(onText: @escaping (String) -> Void, onFinish: @escaping () -> Void) {
        guard !isListening else { return }
        failure = nil
        self.onText = onText
        guard let recognizer, recognizer.isAvailable else {
            failure = "这台设备暂时不能识别语音"
            onFinish()
            return
        }
        requestPermission { [weak self] granted in
            Task { @MainActor in
                guard let self else { return }
                guard granted else {
                    self.failure = "需要麦克风和语音识别权限，请在系统设置里打开"
                    onFinish()
                    return
                }
                self.begin(recognizer: recognizer, onFinish: onFinish)
            }
        }
    }

    /// Stop capturing and keep the transcript already shown.
    func stop() {
        guard isListening else { return }
        isListening = false
        engine.stop()
        request?.endAudio()
        task?.cancel()
        task = nil
        request = nil
        onText = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    private func begin(recognizer: SFSpeechRecognizer, onFinish: @escaping () -> Void) {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.record, mode: .measurement, options: .duckOthers)
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = true
            request.requiresOnDeviceRecognition = true
            self.request = request

            let input = engine.inputNode
            let format = input.outputFormat(forBus: 0)
            input.removeTap(onBus: 0)
            input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
                request.append(buffer)
            }
            engine.prepare()
            try engine.start()
            isListening = true

            task = recognizer.recognitionTask(with: request) { [weak self] result, error in
                Task { @MainActor in
                    guard let self else { return }
                    if let result {
                        self.onText?(result.bestTranscription.formattedString)
                    }
                    if error != nil || result?.isFinal == true {
                        self.stop()
                        onFinish()
                    }
                }
            }
        } catch {
            failure = "麦克风启动失败：\(error.localizedDescription)"
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            onFinish()
        }
    }
}
