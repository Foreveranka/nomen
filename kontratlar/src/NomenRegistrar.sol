// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {
    IPermissionedRegistry,
    IRegistry,
    ITextResolver,
    IIdentityRegistry,
    RegistryRoles,
    Status,
    State
} from "./interfaces/IENSv2.sol";

/// @title NomenRegistrar
/// @notice Hands out subnames under nomen.eth to ERC-8004 agents that pass NOMEN's
///         published, fact-only checks. The name IS the badge: it is non-transferable,
///         it expires, and it can be taken back the moment the agent stops passing.
///
/// @dev Two independent gates, both onchain, no trusted input from the caller:
///        1. Ownership. The Sepolia ERC-8004 IdentityRegistry must say msg.sender owns
///           the agent. Read live, never passed in.
///        2. Eligibility. The agent id must sit in the merkle root of the last published
///           scan. The root, the rules, and the raw scan output are all published, so
///           anyone can rebuild the tree and check that this contract was given the truth.
///
///      Why a merkle root at all: the checks need the agent's metadata document, and
///      fetching a URL is not something a contract can do. The scan happens offchain and
///      commits to its result here, in one 32 byte value, reproducible by anyone.
contract NomenRegistrar {
    /// @dev Registration roles granted to the agent owner. ROLE_CAN_TRANSFER_ADMIN is
    ///      deliberately absent: without it ENSv2 reverts any transfer with
    ///      TransferDisallowed, so a NOMEN name cannot be sold or moved. A badge that can
    ///      be traded is not a badge.
    uint256 internal constant AGENT_ROLES = 0;

    IPermissionedRegistry public immutable REGISTRY;
    IIdentityRegistry public immutable IDENTITY;
    bytes32 public immutable PARENT_NODE;

    mapping(uint256 => bytes32) public checkedRoot;
    mapping(uint256 => bool) public suspended;
    mapping(bytes32 => uint256) public agentOfNode;
    address public admin;
    address public resolver;
    uint64 public nameDuration = 365 days;

    /// @notice Root of the eligible-agent tree from the most recent scan.
    bytes32 public eligibilityRoot;
    /// @notice Where the scan output behind `eligibilityRoot` is published, so the root is auditable.
    string public eligibilitySource;
    uint64 public eligibilityPublishedAt;

    mapping(uint256 agentId => uint256 tokenId) public tokenIdOfAgent;
    mapping(uint256 agentId => string label) public labelOfAgent;
    mapping(uint256 tokenId => uint256 agentId) public agentOfTokenId;

    event RootPublished(bytes32 indexed root, string source, uint64 at);
    event NameClaimed(uint256 indexed agentId, address indexed owner, string label, uint256 tokenId);
    event NameRevoked(uint256 indexed agentId, string label, string reason);
    event NameRenewed(uint256 indexed agentId, uint64 newExpiry);
    event AdminTransferred(address indexed from, address indexed to);
    event AgentReinstated(uint256 indexed agentId);

    error NotAdmin();
    error NotAgentOwner(address caller, address owner);
    error NotEligible(uint256 agentId);
    error AlreadyClaimed(uint256 agentId, string label);
    error NothingToRevoke(uint256 agentId);
    error EmptyLabel();
    error InvalidLabel();
    error InvalidConfiguration();
    error RootNotSet();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    constructor(IPermissionedRegistry registry, IIdentityRegistry identity, bytes32 parentNode, address resolver_) {
        REGISTRY = registry;
        IDENTITY = identity;
        PARENT_NODE = parentNode;
        resolver = resolver_;
        admin = msg.sender;
    }

    // ---------------------------------------------------------------- claiming

    /// @notice Claim `label`.nomen.eth for an agent you own that passed the last scan.
    /// @param label     the subname to take, e.g. "build"
    /// @param agentId   ERC-8004 agent id on this chain
    /// @param proof     merkle proof that `agentId` is in `eligibilityRoot`
    function claim(string calldata label, uint256 agentId, bytes32[] calldata proof)
        external
        returns (uint256 tokenId)
    {
        bytes memory chars = bytes(label);
        if (chars.length == 0) revert EmptyLabel();
        if (chars.length < 3 || chars.length > 32 || chars[0] == 0x2d || chars[chars.length - 1] == 0x2d) revert InvalidLabel();
        for (uint256 i; i < chars.length; ++i) {
            bytes1 c = chars[i];
            if (!(c >= 0x61 && c <= 0x7a) && !(c >= 0x30 && c <= 0x39) && c != 0x2d) revert InvalidLabel();
        }
        if (resolver.code.length == 0) revert InvalidConfiguration();
        if (eligibilityRoot == bytes32(0)) revert RootNotSet();

        address owner = IDENTITY.ownerOf(agentId);
        if (owner != msg.sender) revert NotAgentOwner(msg.sender, owner);

        if (suspended[agentId] || !_verify(proof, eligibilityRoot, _leaf(agentId))) revert NotEligible(agentId);

        uint256 mevcut = tokenIdOfAgent[agentId];
        if (mevcut != 0 && REGISTRY.getState(mevcut).status == Status.REGISTERED && REGISTRY.getState(mevcut).expiry > block.timestamp && REGISTRY.getState(mevcut).tokenId == mevcut) {
            revert AlreadyClaimed(agentId, labelOfAgent[agentId]);
        }

        if (mevcut != 0) delete agentOfTokenId[mevcut];
        tokenId = REGISTRY.register(
            label, msg.sender, IRegistry(address(0)), resolver, AGENT_ROLES, uint64(block.timestamp) + nameDuration
        );

        checkedRoot[agentId] = eligibilityRoot;
        tokenIdOfAgent[agentId] = tokenId;
        labelOfAgent[agentId] = label;
        agentOfTokenId[tokenId] = agentId;

        agentOfNode[keccak256(abi.encodePacked(PARENT_NODE, keccak256(bytes(label))))] = agentId;
        _writeAgentRecords(label, agentId);
        emit NameClaimed(agentId, msg.sender, label, tokenId);
    }

    /// @dev ENSIP-25 ties the name back to the registry record, ENSIP-26 makes the agent
    ///      discoverable from the name. Written here so a claim is one transaction, not three.
    function _writeAgentRecords(string memory label, uint256 agentId) internal {
        if (resolver.code.length == 0) revert InvalidConfiguration();
        bytes32 node = keccak256(abi.encodePacked(PARENT_NODE, keccak256(bytes(label))));
        // ENSIP-25: agent-registration[<erc7930 registry address>][<agentId>] = "1"
        string memory key = string.concat(
            "agent-registration[", _erc7930(address(IDENTITY)), "][", _toString(agentId), "]"
        );
        ITextResolver(resolver).setText(node, key, "1");
        ITextResolver(resolver).setText(node, "agent-context", _context(agentId));
    }

    // ---------------------------------------------------------------- revocation

    /// @notice Take a name back. Used when a later scan shows the agent stopped passing,
    ///         for example its metadata link died or it turned into a copy of another record.
    /// @dev The reason is written into the event so a revocation is never silent.
    function revoke(uint256 agentId, string calldata reason) external onlyAdmin {
        uint256 tokenId = tokenIdOfAgent[agentId];
        if (tokenId == 0) revert NothingToRevoke(agentId);
        string memory label = labelOfAgent[agentId];
        suspended[agentId] = true;
        State memory state = REGISTRY.getState(tokenId);
        if (state.tokenId == tokenId && state.status == Status.REGISTERED) REGISTRY.unregister(tokenId);
        delete checkedRoot[agentId];
        delete tokenIdOfAgent[agentId];
        delete agentOfTokenId[tokenId];
        delete labelOfAgent[agentId];
        emit NameRevoked(agentId, label, reason);
    }

    /// @notice Explicitly restore eligibility after an operator reviews the repaired record.
    function reinstate(uint256 agentId, bytes32[] calldata proof) external onlyAdmin {
        if (eligibilityRoot == bytes32(0) || !_verify(proof, eligibilityRoot, _leaf(agentId))) revert NotEligible(agentId);
        suspended[agentId] = false;
        emit AgentReinstated(agentId);
    }

    /// @notice Extend a name that still passes the checks.
    function renew(uint256 agentId, bytes32[] calldata proof) external onlyAdmin {
        uint256 tokenId = tokenIdOfAgent[agentId];
        if (tokenId == 0) revert NothingToRevoke(agentId);
        if (suspended[agentId] || !_verify(proof, eligibilityRoot, _leaf(agentId)) || eligibilityRoot == bytes32(0)) revert NotEligible(agentId);
        State memory state = REGISTRY.getState(tokenId);
        if (state.tokenId != tokenId || state.status != Status.REGISTERED || state.latestOwner != IDENTITY.ownerOf(agentId)) revert NotEligible(agentId);
        checkedRoot[agentId] = eligibilityRoot;
        uint64 yeni = uint64(block.timestamp) + nameDuration;
        REGISTRY.renew(tokenId, yeni);
        emit NameRenewed(agentId, yeni);
    }

    // ---------------------------------------------------------------- admin

    /// @notice Publish the result of a new scan.
    /// @param root   merkle root over the eligible agent ids
    /// @param source where the raw scan output lives (IPFS cid or URL), so the root is checkable
    function publishRoot(bytes32 root, string calldata source) external onlyAdmin {
        eligibilityRoot = root;
        eligibilitySource = source;
        eligibilityPublishedAt = uint64(block.timestamp);
        emit RootPublished(root, source, uint64(block.timestamp));
    }

    function setResolverAddress(address resolver_) external onlyAdmin {
        if (resolver_.code.length == 0) revert InvalidConfiguration();
        resolver = resolver_;
    }

    function setNameDuration(uint64 duration) external onlyAdmin {
        if (duration == 0 || duration > 365 days) revert InvalidConfiguration();
        nameDuration = duration;
    }

    function transferAdmin(address yeni) external onlyAdmin {
        if (yeni == address(0)) revert InvalidConfiguration();
        emit AdminTransferred(admin, yeni);
        admin = yeni;
    }

    // ---------------------------------------------------------------- views

    /// @notice Is this agent holding a live NOMEN name right now? One call, for other contracts.
    function isNamed(uint256 agentId) external view returns (bool live, string memory label, uint64 expiry) {
        uint256 tokenId = tokenIdOfAgent[agentId];
        if (tokenId == 0) return (false, "", 0);
        State memory s = REGISTRY.getState(tokenId);
        bool ownerMatches;
        try IDENTITY.ownerOf(agentId) returns (address owner) { ownerMatches = owner != address(0) && owner == s.latestOwner; } catch {}
        return (!suspended[agentId] && s.tokenId == tokenId && checkedRoot[agentId] == eligibilityRoot && eligibilityRoot != bytes32(0) && ownerMatches && s.status == Status.REGISTERED && s.expiry > block.timestamp, labelOfAgent[agentId], s.expiry);
    }

    function isEligible(uint256 agentId, bytes32[] calldata proof) external view returns (bool) {
        return !suspended[agentId] && eligibilityRoot != bytes32(0) && _verify(proof, eligibilityRoot, _leaf(agentId));
    }

    // ---------------------------------------------------------------- internals

    /// @dev Double hashed leaf, the standard guard against second preimage attacks on the tree.
    function _leaf(uint256 agentId) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(agentId))));
    }

    function _verify(bytes32[] calldata proof, bytes32 root, bytes32 leaf) internal pure returns (bool) {
        bytes32 h = leaf;
        for (uint256 i = 0; i < proof.length; ++i) {
            bytes32 p = proof[i];
            h = h <= p ? keccak256(abi.encode(h, p)) : keccak256(abi.encode(p, h));
        }
        return h == root;
    }

    /// @dev ERC-7930 interoperable address for an eip155 chain:
    ///        0x0001            version
    ///        0x0000            chain type, eip155
    ///        <1 byte>          length of the chain reference
    ///        <n bytes>         chain id, big endian, no leading zeros
    ///        0x14              address length
    ///        <20 bytes>        address
    ///      ENSIP-25's own example (mainnet, chain id 1) encodes to 0x000100000101 14 <addr>.
    ///      The chain reference is read from block.chainid so the same bytecode is right on
    ///      Sepolia (0xaa36a7, three bytes) without a redeploy-time constant.
    function _erc7930(address a) internal view returns (string memory) {
        bytes memory ref = _minimalBytes(block.chainid);
        return string.concat(
            "0x00010000", _hex(abi.encodePacked(uint8(ref.length))), _hex(ref), "14", _hex(abi.encodePacked(a))
        );
    }

    function _minimalBytes(uint256 v) internal pure returns (bytes memory out) {
        if (v == 0) return hex"00";
        uint256 n;
        uint256 t = v;
        while (t != 0) { ++n; t >>= 8; }
        out = new bytes(n);
        for (uint256 i = n; i > 0; --i) {
            out[i - 1] = bytes1(uint8(v & 0xff));
            v >>= 8;
        }
    }

    function _context(uint256 agentId) internal view returns (string memory) {
        return string.concat(
            "ERC-8004 agent #", _toString(agentId),
            " on chain ", _toString(block.chainid),
            ". Name issued by NOMEN against published, fact-only checks; revocable."
        );
    }

    function _hex(bytes memory b) internal pure returns (string memory) {
        bytes memory harf = "0123456789abcdef";
        bytes memory o = new bytes(b.length * 2);
        for (uint256 i = 0; i < b.length; ++i) {
            o[2 * i] = harf[uint8(b[i]) >> 4];
            o[2 * i + 1] = harf[uint8(b[i]) & 0x0f];
        }
        return string(o);
    }

    function _toString(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 n = v;
        uint256 hane;
        while (n != 0) {
            ++hane;
            n /= 10;
        }
        bytes memory b = new bytes(hane);
        while (v != 0) {
            b[--hane] = bytes1(uint8(48 + v % 10));
            v /= 10;
        }
        return string(b);
    }
}
