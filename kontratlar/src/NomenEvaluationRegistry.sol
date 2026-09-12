// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC8004IdentityRegistry {
    function ownerOf(uint256 agentId) external view returns (address);
}

/// @title Nomen Evaluation Registry
/// @notice Append-only, reviewer-signed receipts for offchain agent trials.
/// @dev Only hashes are stored. A receipt proves what a wallet recorded, not that NOMEN certified the result.
contract NomenEvaluationRegistry {
    enum Outcome {
        Inconclusive,
        Passed,
        Failed
    }

    struct Evaluation {
        address reviewer;
        uint256 agentId;
        bytes32 reportHash;
        bytes32 evidenceHash;
        uint64 observedBlock;
        uint64 recordedAt;
        Outcome outcome;
    }

    error EmptyHash();
    error InvalidIdentityRegistry();
    error MissingObservedBlock();
    error UnknownAgent(uint256 agentId);

    address public immutable identityRegistry;
    uint256 public evaluationCount;

    mapping(bytes32 evaluationId => Evaluation evaluation) private evaluations;
    mapping(address reviewer => uint256 nextNonce) public reviewerNonces;

    event EvaluationRecorded(
        bytes32 indexed evaluationId,
        address indexed reviewer,
        uint256 indexed agentId,
        bytes32 reportHash,
        bytes32 evidenceHash,
        uint64 observedBlock,
        uint64 recordedAt,
        Outcome outcome
    );

    constructor(address identityRegistry_) {
        if (identityRegistry_.code.length == 0) revert InvalidIdentityRegistry();
        identityRegistry = identityRegistry_;
    }

    function recordEvaluation(
        uint256 agentId,
        bytes32 reportHash,
        bytes32 evidenceHash,
        uint64 observedBlock,
        Outcome outcome
    ) external returns (bytes32 evaluationId) {
        if (reportHash == bytes32(0) || evidenceHash == bytes32(0)) revert EmptyHash();
        // RPC block numbers are chain-specific. On Arbitrum, the JSON-RPC L2 block
        // number and the EVM BLOCKNUMBER opcode intentionally use different domains.
        if (observedBlock == 0) revert MissingObservedBlock();

        try IERC8004IdentityRegistry(identityRegistry).ownerOf(agentId) returns (address owner) {
            if (owner == address(0)) revert UnknownAgent(agentId);
        } catch {
            revert UnknownAgent(agentId);
        }

        uint256 nonce = reviewerNonces[msg.sender]++;
        evaluationId = keccak256(
            abi.encode(block.chainid, address(this), msg.sender, nonce, agentId, reportHash, evidenceHash)
        );
        uint64 recordedAt = uint64(block.timestamp);
        evaluations[evaluationId] = Evaluation({
            reviewer: msg.sender,
            agentId: agentId,
            reportHash: reportHash,
            evidenceHash: evidenceHash,
            observedBlock: observedBlock,
            recordedAt: recordedAt,
            outcome: outcome
        });
        unchecked {
            ++evaluationCount;
        }

        emit EvaluationRecorded(
            evaluationId,
            msg.sender,
            agentId,
            reportHash,
            evidenceHash,
            observedBlock,
            recordedAt,
            outcome
        );
    }

    function getEvaluation(bytes32 evaluationId) external view returns (Evaluation memory) {
        return evaluations[evaluationId];
    }
}
