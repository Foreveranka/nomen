// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NomenEvaluationRegistry} from "../src/NomenEvaluationRegistry.sol";

contract IdentityMock {
    mapping(uint256 => address) public ownerOf;

    function mint(uint256 agentId, address owner) external {
        ownerOf[agentId] = owner;
    }
}

contract NomenEvaluationRegistryTest is Test {
    IdentityMock identity;
    NomenEvaluationRegistry registry;
    address reviewer = address(0xBEEF);

    function setUp() external {
        identity = new IdentityMock();
        identity.mint(42, address(0xA11CE));
        registry = new NomenEvaluationRegistry(address(identity));
    }

    function testRecordsHashOnlyReceipt() external {
        vm.roll(100);
        vm.warp(1_700_000_000);
        bytes32 reportHash = keccak256("report");
        bytes32 evidenceHash = keccak256("evidence");

        vm.prank(reviewer);
        bytes32 id = registry.recordEvaluation(
            42,
            reportHash,
            evidenceHash,
            99,
            NomenEvaluationRegistry.Outcome.Passed
        );

        NomenEvaluationRegistry.Evaluation memory result = registry.getEvaluation(id);
        assertEq(result.reviewer, reviewer);
        assertEq(result.agentId, 42);
        assertEq(result.reportHash, reportHash);
        assertEq(result.evidenceHash, evidenceHash);
        assertEq(result.observedBlock, 99);
        assertEq(result.recordedAt, 1_700_000_000);
        assertEq(uint8(result.outcome), uint8(NomenEvaluationRegistry.Outcome.Passed));
        assertEq(registry.evaluationCount(), 1);
        assertEq(registry.reviewerNonces(reviewer), 1);
    }

    function testSameEvidenceGetsUniqueReviewerReceipts() external {
        vm.roll(100);
        bytes32 reportHash = keccak256("report");
        bytes32 evidenceHash = keccak256("evidence");
        vm.startPrank(reviewer);
        bytes32 first = registry.recordEvaluation(42, reportHash, evidenceHash, 100, NomenEvaluationRegistry.Outcome.Inconclusive);
        bytes32 second = registry.recordEvaluation(42, reportHash, evidenceHash, 100, NomenEvaluationRegistry.Outcome.Inconclusive);
        vm.stopPrank();
        assertTrue(first != second);
    }

    function testRejectsUnknownAgent() external {
        vm.expectRevert(abi.encodeWithSelector(NomenEvaluationRegistry.UnknownAgent.selector, 99));
        registry.recordEvaluation(99, keccak256("report"), keccak256("evidence"), 1, NomenEvaluationRegistry.Outcome.Failed);
    }

    function testRejectsEmptyHashesAndMissingBlock() external {
        vm.expectRevert(NomenEvaluationRegistry.EmptyHash.selector);
        registry.recordEvaluation(42, bytes32(0), keccak256("evidence"), 1, NomenEvaluationRegistry.Outcome.Passed);

        vm.expectRevert(NomenEvaluationRegistry.MissingObservedBlock.selector);
        registry.recordEvaluation(42, keccak256("report"), keccak256("evidence"), 0, NomenEvaluationRegistry.Outcome.Passed);
    }

    function testRejectsNonContractIdentityRegistry() external {
        vm.expectRevert(NomenEvaluationRegistry.InvalidIdentityRegistry.selector);
        new NomenEvaluationRegistry(address(123));
    }
}
