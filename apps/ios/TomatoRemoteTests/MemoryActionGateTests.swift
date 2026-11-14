//
//  MemoryActionGateTests.swift
//  TomatoRemoteTests
//
//  The memory rows accept one mutation at a time, and stay inert while the list
//  settles. These tests pin the two taps a slow link used to allow: the same
//  row twice, and a tap that lands on the row that replaced it.
//

@testable import TomatoRemote
import XCTest

final class MemoryActionGateTests: XCTestCase {
    /// The first tap starts its request and closes the gate for every row.
    func testFirstActionClosesTheGate() {
        var gate = MemoryActionGate()
        XCTAssertFalse(gate.blocksInput)
        XCTAssertTrue(gate.begin("m1", .confirm))
        XCTAssertTrue(gate.blocksInput)
        XCTAssertEqual(gate.busyId, "m1")
        XCTAssertEqual(gate.busyAction, .confirm)
    }

    /// A second tap on the same row during its request is ignored.
    func testSecondTapOnTheSameRowIsIgnored() {
        var gate = MemoryActionGate()
        XCTAssertTrue(gate.begin("m1", .confirm))
        XCTAssertFalse(gate.begin("m1", .confirm))
        XCTAssertEqual(gate.busyId, "m1")
    }

    /// A tap on another row during the request is ignored too.
    func testTapOnAnotherRowIsIgnoredWhileBusy() {
        var gate = MemoryActionGate()
        XCTAssertTrue(gate.begin("m1", .confirm))
        XCTAssertFalse(gate.begin("m2", .forget))
        XCTAssertEqual(gate.busyId, "m1")
        XCTAssertEqual(gate.busyAction, .confirm)
    }

    /// After the response the list still reflows; a tap aimed at the row that
    /// disappeared must wait out the settle window before it can target the
    /// row that replaced it.
    func testGateStaysClosedUntilTheListSettles() {
        var gate = MemoryActionGate()
        XCTAssertTrue(gate.begin("m1", .confirm))
        gate.finish()
        XCTAssertNil(gate.busyId)
        XCTAssertNil(gate.busyAction)
        XCTAssertTrue(gate.blocksInput)
        XCTAssertFalse(gate.begin("m2", .forget))
        gate.settle()
        XCTAssertFalse(gate.blocksInput)
        XCTAssertTrue(gate.begin("m2", .forget))
    }
}
