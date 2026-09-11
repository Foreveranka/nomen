// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {NomenRegistrar} from "../src/NomenRegistrar.sol";
import {IPermissionedRegistry, IIdentityRegistry} from "../src/interfaces/IENSv2.sol";

/// @notice The scanner builds the eligibility tree in Python; this contract verifies proofs in
///         Solidity. If the two ever disagree, every claim breaks. These are real proofs taken
///         from the 2026-09-06 Ethereum scan (3,709 eligible agents), pasted verbatim.
///         Regenerate with tarayici/adim7_merkle.py when the scan changes.
contract MerkleCrossCheckTest is Test {
    NomenRegistrar reg;

    bytes32 constant ROOT = 0x7fc1becaf9a9508963cd38356cfcad46059a04a3dcc33a8ed8e7e666abdaafc7;

    function setUp() public {
        reg = new NomenRegistrar(
            IPermissionedRegistry(address(1)), IIdentityRegistry(address(2)), bytes32(uint256(1)), address(0)
        );
        reg.publishRoot(ROOT, "scan 2026-09-06 ethereum");
    }

    /// @dev first eligible agent in the tree (agent #2364).
    function test_python_proof_for_agent_2364_verifies_in_solidity() public view {
        bytes32[] memory p = new bytes32[](12);
        p[0] = 0x33e637d87488af617d4f96af319c4850e8a3d7e84b89697f910a47e67e26462e;
        p[1] = 0xbdaebd3fac5c1dfddc1cb22e0e804b0a63ed231f485856246332245ca241eac2;
        p[2] = 0xef044b2b7c8808cdb4b1eaf1af4bd0bf5b5719248ff1b6dbfa2d394172605085;
        p[3] = 0x7e3dd06c456bfbd49d725b70bb4503b2ede426334ffa410333153f3ee7119790;
        p[4] = 0x781f4accf4b872e08123bfb9230c7ed9fb7519ed0a7a517ae26c353c663376e6;
        p[5] = 0x2f048ee359f886d162cc0584bf5676eafcf4d67c5c33b6b60768510e14d32354;
        p[6] = 0x6c684173f91be158fc74a2c7d741f0a603f23f2782466e35e0ade25019434691;
        p[7] = 0x995cbee632b572f05ee96b794cd0bd1429af68b7ffcfdd2f4f7fcd0a2dd0c495;
        p[8] = 0xffabad4cfb44785ca545c0918fe0a5d97c263cae30276ad0d5959afd7356baef;
        p[9] = 0x2115cd52a456d238e6c4dd34c5208bf71a59fa193b9340c13e669c47d75e2ab5;
        p[10] = 0x8eb5dacb27bdafbf52ccde54995264eb03c6883483ff524df108f5133bd95cf7;
        p[11] = 0xf73421ae40a8b441cab4844bee7d8da345a26540d7a9a5c4d6ab39c6a15a3238;
        assertTrue(reg.isEligible(2364, p));
    }
    /// @dev middle eligible agent in the tree (agent #34678).
    function test_python_proof_for_agent_34678_verifies_in_solidity() public view {
        bytes32[] memory p = new bytes32[](12);
        p[0] = 0x171cd34d5ed804b626e8688e0846bf31fcb0cee7a7ad886a571b37ea6df75ab0;
        p[1] = 0x0dbb30d6322b7b2cb8820640f24c291bfbd94a8b17b26966a94505458485e476;
        p[2] = 0x62100b3af7cc7e0e3191732a3c6056445fc543c516ebcfabc08d41ce4f2822b0;
        p[3] = 0x9341e8d39dc76221fb7be12a27a8edf54188cf87ad0d086a0346e157444556ab;
        p[4] = 0x3b77cda783870ed052e94f97a7eed41631a428218edc0af643d71fa1d2840b1e;
        p[5] = 0x15ea684c4d84ed7eec59d80bc3c0e2587bdc5765c1a9e670ac6594d92dbc5d90;
        p[6] = 0x33e72dea949c1071913d252430d25c6d984e59179d4ff753386bb93026754503;
        p[7] = 0x12c25947a1487e7967fad5974aef704f8a491dbdbd26d39406aa1337bc7120a4;
        p[8] = 0x7c2197f93a92711c041fc2129f0951302bf1452cdb028b86875fa4617af9bc44;
        p[9] = 0x07ea188f675e5087be3846391ff320f30b5fc460361874301bd1d5d7c7e72d16;
        p[10] = 0xf9b172da5b30a1c1a848fb5c0644cfd66b65e70dff4ceaf6039cd1d11dc6f2ec;
        p[11] = 0xf73421ae40a8b441cab4844bee7d8da345a26540d7a9a5c4d6ab39c6a15a3238;
        assertTrue(reg.isEligible(34678, p));
    }
    /// @dev last eligible agent in the tree (agent #50688).
    function test_python_proof_for_agent_50688_verifies_in_solidity() public view {
        bytes32[] memory p = new bytes32[](8);
        p[0] = 0x1166c41af535e68bbdda39157d4bca8448fe399b8838c7e6d0f1a8162e5038c8;
        p[1] = 0x57f392838ef5b7f6a78c50d041103b5e7ba3f2226893996f1a144543e96b7048;
        p[2] = 0x17d989cda286436e6ad5b5028bf1568bf3cb612e9d7c3a4099c14c21896fd4d3;
        p[3] = 0x200d1d65fa8b9a101574d44f4b091c242a2df1cde850ba6cbe61afcab200959d;
        p[4] = 0x62c950241121e696fb6a8a8649219285a212226b5c7fa58c5b1c5519445a6c10;
        p[5] = 0xa55af10844923694d6bded136e0ddb3d7fa39670bf240f6049d6cf72038e7404;
        p[6] = 0x347b5d0e9c2871fd4cf23562cc785bdc46264bd0e610e1e6028ad40676e36cbe;
        p[7] = 0x4c5e86baa584f907b1371c21b217a3930a240ac37e1c17ed401c3b478d282e13;
        assertTrue(reg.isEligible(50688, p));
    }

    /// @dev A hidden agent (the 2,043-times duplicated "test" record) must not verify.
    function test_a_filtered_agent_does_not_verify_with_a_borrowed_proof() public view {
        bytes32[] memory p = new bytes32[](1);
        p[0] = 0x33e637d87488af617d4f96af319c4850e8a3d7e84b89697f910a47e67e26462e;
        assertFalse(reg.isEligible(3337, p));
    }
}
