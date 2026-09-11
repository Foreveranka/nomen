// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal slice of the ENSv2 registry surface NOMEN depends on.
///         Signatures verified against the Sepolia deployment of PermissionedRegistry
///         (ETHRegistry 0xbdc85dd5b15d7ecb354cd7cb6f2c50b4f2c4f0e2).
interface IRegistry {
    function getSubregistry(string calldata label) external view returns (address);
    function getResolver(string calldata label) external view returns (address);
}

enum Status {
    AVAILABLE,
    RESERVED,
    REGISTERED
}

struct State {
    Status status;
    uint64 expiry;
    address latestOwner;
    uint256 tokenId;
    uint256 resource;
}

interface IPermissionedRegistry is IRegistry {
    function register(
        string calldata label,
        address owner,
        IRegistry registry,
        address resolver,
        uint256 roleBitmap,
        uint64 expiry
    ) external returns (uint256 tokenId);

    function renew(uint256 anyId, uint64 newExpiry) external;

    /// @dev Pulls expiry back to block.timestamp; the name drops to AVAILABLE immediately.
    ///      Caller must hold ROLE_UNREGISTER.
    function unregister(uint256 anyId) external;

    function setResolver(uint256 anyId, address resolver) external;

    function getState(uint256 anyId) external view returns (State memory);

    function getExpiry(uint256 anyId) external view returns (uint64);
}

/// @notice ENSv2 PermissionedResolver text records (ENSIP-25 / ENSIP-26 live here).
interface ITextResolver {
    function setText(bytes32 node, string calldata key, string calldata value) external;
    function text(bytes32 node, string calldata key) external view returns (string memory);
}

/// @notice The only part of ERC-8004 NOMEN reads: who owns an agent.
interface IIdentityRegistry {
    function ownerOf(uint256 agentId) external view returns (address);
    function tokenURI(uint256 agentId) external view returns (string memory);
}

/// @notice Role bits from RegistryRolesLib. Admin variant of a role is `role << 128`.
library RegistryRoles {
    uint256 internal constant ROLE_REGISTRAR = 1 << 0;
    uint256 internal constant ROLE_REGISTRAR_ADMIN = ROLE_REGISTRAR << 128;
    uint256 internal constant ROLE_REGISTER_RESERVED = 1 << 4;
    uint256 internal constant ROLE_SET_PARENT = 1 << 8;
    uint256 internal constant ROLE_UNREGISTER = 1 << 12;
    uint256 internal constant ROLE_RENEW = 1 << 16;
    uint256 internal constant ROLE_SET_SUBREGISTRY = 1 << 20;
    uint256 internal constant ROLE_SET_RESOLVER = 1 << 24;
    uint256 internal constant ROLE_CAN_TRANSFER_ADMIN = (1 << 28) << 128;
}
