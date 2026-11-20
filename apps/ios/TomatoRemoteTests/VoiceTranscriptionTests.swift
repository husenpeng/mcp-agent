//
//  VoiceTranscriptionTests.swift
//  TomatoRemoteTests
//
//  The live dictation rule: a recognizer that restarts its hypothesis after a
//  long pause must never erase words the owner has already read.
//

@testable import TomatoRemote
import XCTest

final class VoiceTranscriptionTests: XCTestCase {
    /// After a pause the on-device recognizer starts a new hypothesis that
    /// covers only the words spoken afterwards; the shown sentence keeps its
    /// words and the new ones follow them.
    func testHypothesisAfterAPauseContinuesTheSentence() {
        XCTAssertEqual(
            VoiceTranscription.adopted("然后看一下界面", after: "今天我们讨论三个问题"),
            "今天我们讨论三个问题然后看一下界面"
        )
    }

    /// A restart that repeats the utterance tail does not repeat it twice.
    func testRestartedHypothesisDoesNotRepeatTheShownTail() {
        XCTAssertEqual(
            VoiceTranscription.adopted("然后保存并且关闭", after: "把文件打开然后保存"),
            "把文件打开然后保存并且关闭"
        )
    }

    /// The ordinary case: the same utterance arrives longer on every update.
    func testGrowingHypothesisReplacesTheShownSentence() {
        XCTAssertEqual(
            VoiceTranscription.adopted("今天我们讨论三个问题", after: "今天我们讨论"),
            "今天我们讨论三个问题"
        )
    }

    /// A trimmed update may not shorten what is already shown.
    func testTrimmedHypothesisKeepsTheShownSentence() {
        XCTAssertEqual(
            VoiceTranscription.adopted("今天我们讨论", after: "今天我们讨论三个问题"),
            "今天我们讨论三个问题"
        )
    }

    /// A revision in place replaces the words it corrected.
    func testRevisedHypothesisReplacesTheShownSentence() {
        XCTAssertEqual(
            VoiceTranscription.adopted("我们今天开会", after: "我门今天开会"),
            "我们今天开会"
        )
    }

    /// The owner repeated the whole sentence after a failed attempt; the
    /// fuller second attempt replaces the first instead of being appended.
    func testRepeatedFullAttemptReplacesInsteadOfConcatenating() {
        XCTAssertEqual(
            VoiceTranscription.adopted(
                "Agent Service 北京的 Agent 服务能走通正式的模型",
                after: "Agent Service 北京的 Agent 服务"
            ),
            "Agent Service 北京的 Agent 服务能走通正式的模型"
        )
    }

    /// A shorter fragment already contained in the shown sentence is a repeat,
    /// not a new tail.
    func testContainedFragmentDoesNotAppend() {
        XCTAssertEqual(
            VoiceTranscription.adopted(
                "北京的 Agent 服务",
                after: "Agent Service 北京的 Agent 服务能走通正式的模型"
            ),
            "Agent Service 北京的 Agent 服务能走通正式的模型"
        )
    }

    /// A silent update carries nothing and changes nothing.
    func testSilentHypothesisKeepsTheShownSentence() {
        XCTAssertEqual(VoiceTranscription.adopted("", after: "已经说过的话"), "已经说过的话")
    }

    /// The first hypothesis of a session becomes the sentence.
    func testFirstHypothesisBecomesTheSentence() {
        XCTAssertEqual(VoiceTranscription.adopted("你好", after: ""), "你好")
    }

    /// The junction follows the script: one space between Latin words.
    func testLatinContinuationKeepsOneSeparator() {
        XCTAssertEqual(
            VoiceTranscription.adopted("and save it", after: "open the file"),
            "open the file and save it"
        )
    }

    /// A Latin word repeated while the recognizer revises collapses once;
    /// Chinese repetition stays meaningful.
    func testNormalizationCollapsesRepeatedLatinWord() {
        XCTAssertEqual(VoiceTranscription.normalized("Agent Agent Service"), "Agent Service")
        XCTAssertEqual(VoiceTranscription.normalized("看看这个"), "看看这个")
    }

    /// A continuation after punctuation joins with no stray separator.
    func testPunctuatedContinuationJoinsDirectly() {
        XCTAssertEqual(
            VoiceTranscription.adopted("第二，调整亮度", after: "第一，打开设置。"),
            "第一，打开设置。第二，调整亮度"
        )
    }
}
