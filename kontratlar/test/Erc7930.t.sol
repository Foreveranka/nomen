// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NomenRegistrar} from "../src/NomenRegistrar.sol";
import {IPermissionedRegistry, IIdentityRegistry} from "../src/interfaces/IENSv2.sol";

contract Erc7930Harness is NomenRegistrar {
    constructor() NomenRegistrar(IPermissionedRegistry(address(1)), IIdentityRegistry(address(2)), bytes32(0), address(0)) {}
    function encode(address a) external view returns (string memory) { return _erc7930(a); }
}

/// @notice ENSIP-25 publishes one worked example; the encoder must reproduce it byte for byte,
///         and must change the chain reference when the chain changes.
contract Erc7930Test is Test {
    Erc7930Harness h;

    function setUp() public { h = new Erc7930Harness(); }

    function test_matches_the_ensip25_mainnet_example() public {
        vm.chainId(1);
        assertEq(h.encode(0x8004A169FB4a3325136EB29fA0ceB6D2e539a432),
                 "0x000100000101148004a169fb4a3325136eb29fa0ceb6d2e539a432");
    }

    function test_sepolia_uses_a_three_byte_chain_reference() public {
        vm.chainId(11155111);
        assertEq(h.encode(0x8004A818BFB912233c491871b3d84c89A494BD9e),
                 "0x0001000003aa36a7148004a818bfb912233c491871b3d84c89a494bd9e");
    }

    function test_arc_testnet_reference() public {
        vm.chainId(5042002);
        // 5042002 = 0x4cef52
        assertEq(h.encode(0x8004A818BFB912233c491871b3d84c89A494BD9e),
                 "0x00010000034cef52148004a818bfb912233c491871b3d84c89a494bd9e");
    }
}
