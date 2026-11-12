//
//  SpeechAudio.swift
//  Tomato Remote
//
//  The recording the Host's own recognizer accepts: one canonical 16 kHz mono
//  PCM16 WAV. The microphone runs at the hardware's rate, which is 48 kHz or
//  44.1 kHz on a phone, so the conversion happens on the audio thread and only
//  the bytes that fit the Host's intake limit are kept.
//
//  Audio never reaches this file's callers as files: one recording lives in
//  memory from the first buffer until the composer hands it to the Host, and is
//  dropped otherwise.
//

import AVFoundation

/// Accumulates the microphone stream as the canonical WAV the Host recognizes.
final class SpeechRecording: @unchecked Sendable {
    /// Rate the Host's WAV validation requires.
    static let sampleRate: Double = 16000
    /// Bytes kept, matching the minute the composer allows one sentence to run.
    static let maximumBytes = 60 * Int(sampleRate) * 2

    private let lock = NSLock()
    private let converter: AVAudioConverter
    private let format: AVAudioFormat
    private var pcm = Data()

    /// Build a recorder for the microphone's own format.
    /// - Parameter input: format of the tap buffers.
    /// - Returns: nil when the format cannot be converted to 16 kHz mono.
    init?(from input: AVAudioFormat) {
        guard let output = AVAudioFormat(
            commonFormat: .pcmFormatInt16,
            sampleRate: Self.sampleRate,
            channels: 1,
            interleaved: true
        ), let converter = AVAudioConverter(from: input, to: output) else {
            return nil
        }
        // The Host's model is the final transcript; the resampler must not be
        // the weakest link.
        converter.sampleRateConverterQuality = AVAudioQuality.max.rawValue
        format = output
        self.converter = converter
    }

    /// Convert and append one microphone buffer. Called from the audio tap.
    /// - Parameter buffer: one tap buffer in the microphone's own format.
    func append(_ buffer: AVAudioPCMBuffer) {
        lock.lock()
        defer { lock.unlock() }
        guard pcm.count < Self.maximumBytes else {
            return
        }
        let ratio = Self.sampleRate / buffer.format.sampleRate
        let capacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 64
        guard let output = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: capacity) else {
            return
        }
        // The converter pulls from this block; one tap buffer feeds one call,
        // and telling it there is no more input keeps its resampler state for
        // the next buffer.
        var supplied = false
        let status = converter.convert(to: output, error: nil) { _, outStatus in
            if supplied {
                outStatus.pointee = .noDataNow
                return nil
            }
            supplied = true
            outStatus.pointee = .haveData
            return buffer
        }
        guard status != .error, output.frameLength > 0, let samples = output.int16ChannelData?[0] else {
            return
        }
        pcm.append(Data(bytes: samples, count: Int(output.frameLength) * MemoryLayout<Int16>.size))
    }

    /// Finish this recording.
    /// - Returns: one canonical WAV, or nil when nothing was captured.
    func wav() -> Data? {
        lock.lock()
        defer { lock.unlock() }
        guard !pcm.isEmpty else {
            return nil
        }
        return Self.container(holding: pcm)
    }

    /// Wrap PCM16 samples in a canonical WAV container.
    /// @param pcm - raw little-endian samples.
    private static func container(holding pcm: Data) -> Data {
        var data = Data(capacity: 44 + pcm.count)
        func write(_ value: UInt32) {
            var little = value.littleEndian
            withUnsafeBytes(of: &little) { data.append(contentsOf: $0) }
        }
        func write(_ value: UInt16) {
            var little = value.littleEndian
            withUnsafeBytes(of: &little) { data.append(contentsOf: $0) }
        }
        let byteRate = UInt32(sampleRate) * 2
        data.append(contentsOf: Array("RIFF".utf8))
        write(UInt32(36 + pcm.count))
        data.append(contentsOf: Array("WAVE".utf8))
        data.append(contentsOf: Array("fmt ".utf8))
        write(UInt32(16))
        write(UInt16(1))
        write(UInt16(1))
        write(UInt32(sampleRate))
        write(byteRate)
        write(UInt16(2))
        write(UInt16(16))
        data.append(contentsOf: Array("data".utf8))
        write(UInt32(pcm.count))
        data.append(pcm)
        return data
    }
}
