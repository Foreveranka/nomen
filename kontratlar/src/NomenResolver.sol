// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {NomenRegistrar} from "./NomenRegistrar.sol";

/// @notice Text records scoped to a registration generation and its current endorsement.
contract NomenResolver {
    NomenRegistrar public immutable registrar;
    mapping(bytes32 => mapping(uint256 => mapping(string => string))) private records;

    constructor(NomenRegistrar registrar_) { registrar = registrar_; }

    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == 0x01ffc9a7 || id == 0x59d1d43c;
    }

    function setText(bytes32 node, string calldata key, string calldata value) external {
        require(msg.sender == address(registrar), "registrar only");
        uint256 token = registrar.tokenIdOfAgent(registrar.agentOfNode(node));
        require(token != 0, "unregistered");
        records[node][token][key] = value;
    }

    function text(bytes32 node, string calldata key) external view returns (string memory) {
        uint256 agent = registrar.agentOfNode(node);
        (bool live, string memory label,) = registrar.isNamed(agent);
        if (!live || registrar.resolver() != address(this) ||
            node != keccak256(abi.encodePacked(registrar.PARENT_NODE(), keccak256(bytes(label))))) return "";
        return records[node][registrar.tokenIdOfAgent(agent)][key];
    }
}
