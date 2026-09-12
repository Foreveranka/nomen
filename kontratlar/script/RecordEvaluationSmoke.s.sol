// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {NomenEvaluationRegistry} from "../src/NomenEvaluationRegistry.sol";

/// @notice Writes one explicit test receipt after a deployment and prints its id.
contract RecordEvaluationSmoke is Script {
    function run() external returns (bytes32 evaluationId) {
        uint256 expectedChainId = vm.envUint("EXPECTED_CHAIN_ID");
        require(block.chainid == expectedChainId, "wrong chain");

        NomenEvaluationRegistry registry = NomenEvaluationRegistry(vm.envAddress("EVALUATION_REGISTRY"));
        require(address(registry).code.length > 0, "evaluation registry missing");

        uint256 key = vm.envUint("DEPLOYER_PRIVATE_KEY");
        require(vm.addr(key) != 0x922D05Af2e9535bfe6fDEEB713ea33088b7412CC, "rotate compromised deployer");

        vm.startBroadcast(key);
        evaluationId = registry.recordEvaluation(
            vm.envUint("AGENT_ID"),
            vm.envBytes32("REPORT_HASH"),
            vm.envBytes32("EVIDENCE_HASH"),
            uint64(vm.envUint("OBSERVED_BLOCK")),
            NomenEvaluationRegistry.Outcome.Inconclusive
        );
        vm.stopBroadcast();

        console.logBytes32(evaluationId);
    }
}
