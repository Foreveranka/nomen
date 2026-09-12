// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {NomenEvaluationRegistry} from "../src/NomenEvaluationRegistry.sol";

/// @notice Deploys the same evaluation receipt contract to any supported EVM chain.
contract DeployEvaluation is Script {
    function run() external returns (NomenEvaluationRegistry registry) {
        uint256 expectedChainId = vm.envUint("EXPECTED_CHAIN_ID");
        require(block.chainid == expectedChainId, "wrong chain");

        address identityRegistry = vm.envAddress("IDENTITY_REGISTRY");
        require(identityRegistry.code.length > 0, "identity registry missing");

        uint256 key = vm.envUint("DEPLOYER_PRIVATE_KEY");
        require(vm.addr(key) != 0x922D05Af2e9535bfe6fDEEB713ea33088b7412CC, "rotate compromised deployer");
        vm.startBroadcast(key);
        registry = new NomenEvaluationRegistry(identityRegistry);
        vm.stopBroadcast();

        console.log("chain id:", block.chainid);
        console.log("identity registry:", identityRegistry);
        console.log("evaluation registry:", address(registry));
    }
}
