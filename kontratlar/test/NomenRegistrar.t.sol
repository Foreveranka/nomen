// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {NomenResolver} from "../src/NomenResolver.sol";
import {Test} from "forge-std/Test.sol";
import {NomenRegistrar} from "../src/NomenRegistrar.sol";
import {IPermissionedRegistry, IRegistry, IIdentityRegistry, Status, State} from "../src/interfaces/IENSv2.sol";

/// @dev Stands in for the ENSv2 PermissionedRegistry, including the one behaviour that
///      matters most to us: a name with no transfer role cannot be moved.
contract MockRegistry {
    uint256 public sonraki = 1;
    mapping(uint256 => State) internal durum;
    mapping(uint256 => uint256) public rolesOf;
    mapping(uint256 => string) public labelOf;
    mapping(string => uint256) public currentToken;

    error TransferDisallowed();

    function register(string calldata label, address owner, IRegistry, address, uint256 roleBitmap, uint64 expiry)
        external
        returns (uint256 tokenId)
    {
        uint256 previous = currentToken[label];
        require(previous == 0 || durum[previous].status != Status.REGISTERED || durum[previous].expiry <= block.timestamp, "label unavailable");
        tokenId = sonraki++;
        currentToken[label] = tokenId;
        durum[tokenId] = State(Status.REGISTERED, expiry, owner, tokenId, tokenId);
        rolesOf[tokenId] = roleBitmap;
        labelOf[tokenId] = label;
    }

    function unregister(uint256 anyId) external {
        anyId = currentToken[labelOf[anyId]];
        durum[anyId].status = Status.AVAILABLE;
        durum[anyId].expiry = uint64(block.timestamp);
    }

    function renew(uint256 anyId, uint64 yeni) external {
        durum[anyId].expiry = yeni;
    }

    function setResolver(uint256, address) external {}

    function getState(uint256 anyId) external view returns (State memory) {
        uint256 latest = currentToken[labelOf[anyId]];
        return durum[latest == 0 ? anyId : latest];
    }

    function getExpiry(uint256 anyId) external view returns (uint64) {
        return durum[anyId].expiry;
    }

    function getSubregistry(string calldata) external pure returns (address) {
        return address(0);
    }

    function getResolver(string calldata) external pure returns (address) {
        return address(0);
    }

    /// @dev ENSv2 reverts here unless ROLE_CAN_TRANSFER_ADMIN was granted.
    function safeTransferFrom(address, address to, uint256 tokenId) external {
        if (rolesOf[tokenId] & ((1 << 28) << 128) == 0) revert TransferDisallowed();
        durum[tokenId].latestOwner = to;
    }
}

contract MockIdentity {
    mapping(uint256 => address) public sahip;

    function setOwner(uint256 agentId, address o) external {
        sahip[agentId] = o;
    }

    function ownerOf(uint256 agentId) external view returns (address) {
        return sahip[agentId];
    }

    function tokenURI(uint256) external pure returns (string memory) {
        return "";
    }
}

contract MockTextResolver {
    mapping(bytes32 => mapping(string => string)) public text;
    bool public fail;
    function setFail(bool value) external { fail = value; }
    function setText(bytes32 node, string calldata key, string calldata value) external {
        require(!fail, "resolver rejected"); text[node][key] = value;
    }
}

contract NomenRegistrarTest is Test {
    NomenRegistrar reg;
    MockRegistry ensv2;
    MockIdentity kimlik;

    address admin = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    uint256 constant AGENT_A = 2364;
    uint256 constant AGENT_B = 6815;
    uint256 constant AGENT_YOK = 99999;

    bytes32 kok;
    bytes32 yaprakA;
    bytes32 yaprakB;

    function setUp() public {
        ensv2 = new MockRegistry();
        kimlik = new MockIdentity();
        reg = new NomenRegistrar(
            IPermissionedRegistry(address(ensv2)), IIdentityRegistry(address(kimlik)), bytes32(uint256(1)), address(new MockTextResolver())
        );

        kimlik.setOwner(AGENT_A, alice);
        kimlik.setOwner(AGENT_B, bob);
        kimlik.setOwner(AGENT_YOK, alice);

        yaprakA = _leaf(AGENT_A);
        yaprakB = _leaf(AGENT_B);
        kok = yaprakA <= yaprakB ? keccak256(abi.encode(yaprakA, yaprakB)) : keccak256(abi.encode(yaprakB, yaprakA));
        reg.publishRoot(kok, "ipfs://scan-2026-09-06");
    }

    function test_resolver_hides_expired_revoked_and_reused_records() public {
        NomenResolver resolver = new NomenResolver(reg);
        reg.setResolverAddress(address(resolver));
        vm.prank(alice); reg.claim("build", AGENT_A, _proofA());
        bytes32 node = keccak256(abi.encodePacked(reg.PARENT_NODE(), keccak256("build")));
        assertGt(bytes(resolver.text(node, "agent-context")).length, 0);
        vm.warp(block.timestamp + 366 days);
        assertEq(resolver.text(node, "agent-context"), "");
        vm.prank(bob); reg.claim("build", AGENT_B, _proofB());
        string memory bContext = resolver.text(node, "agent-context");
        assertGt(bytes(bContext).length, 0);
        reg.revoke(AGENT_A, "old registration");
        assertEq(resolver.text(node, "agent-context"), bContext);
        reg.revoke(AGENT_B, "withdrawn");
        assertEq(resolver.text(node, "agent-context"), "");
    }

    function _leaf(uint256 id) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(id))));
    }

    function _proofA() internal view returns (bytes32[] memory p) {
        p = new bytes32[](1);
        p[0] = yaprakB;
    }

    function _proofB() internal view returns (bytes32[] memory p) {
        p = new bytes32[](1);
        p[0] = yaprakA;
    }

    function test_failed_record_write_rolls_back_registration() public {
        MockTextResolver(reg.resolver()).setFail(true);
        vm.prank(alice); vm.expectRevert("resolver rejected");
        reg.claim("build", AGENT_A, _proofA());
        assertEq(reg.tokenIdOfAgent(AGENT_A), 0);
        assertEq(ensv2.sonraki(), 1);
    }

    function test_transfer_invalidates_badge() public {
        vm.prank(alice); reg.claim("build", AGENT_A, _proofA());
        kimlik.setOwner(AGENT_A, bob);
        (bool live,,) = reg.isNamed(AGENT_A); assertFalse(live);
    }

    function test_new_root_requires_fresh_proof_for_renewal() public {
        vm.prank(alice); reg.claim("build", AGENT_A, _proofA());
        reg.publishRoot(yaprakB, "ipfs://new-scan");
        (bool live,,) = reg.isNamed(AGENT_A); assertFalse(live);
        vm.expectRevert(abi.encodeWithSelector(NomenRegistrar.NotEligible.selector, AGENT_A));
        reg.renew(AGENT_A, _proofA());
    }

    function test_label_cannot_contain_dot() public {
        vm.prank(alice); vm.expectRevert(NomenRegistrar.InvalidLabel.selector);
        reg.claim("a.b", AGENT_A, _proofA());
    }

    function test_eligible_owner_claims_a_name() public {
        vm.prank(alice);
        uint256 tokenId = reg.claim("build", AGENT_A, _proofA());

        assertEq(reg.tokenIdOfAgent(AGENT_A), tokenId);
        assertEq(reg.labelOfAgent(AGENT_A), "build");
        (bool live, string memory label, uint64 expiry) = reg.isNamed(AGENT_A);
        assertTrue(live);
        assertEq(label, "build");
        assertEq(expiry, uint64(block.timestamp) + 365 days);
    }

    function test_claiming_for_an_agent_you_do_not_own_reverts() public {
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(NomenRegistrar.NotAgentOwner.selector, bob, alice));
        reg.claim("build", AGENT_A, _proofA());
    }

    function test_agent_outside_the_published_scan_cannot_claim() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(NomenRegistrar.NotEligible.selector, AGENT_YOK));
        reg.claim("ghost", AGENT_YOK, _proofA());
    }

    function test_a_wrong_proof_does_not_pass() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(NomenRegistrar.NotEligible.selector, AGENT_A));
        reg.claim("build", AGENT_A, _proofB());
    }

    function test_the_same_agent_cannot_hold_two_names() public {
        vm.startPrank(alice);
        reg.claim("build", AGENT_A, _proofA());
        vm.expectRevert(abi.encodeWithSelector(NomenRegistrar.AlreadyClaimed.selector, AGENT_A, "build"));
        reg.claim("build2", AGENT_A, _proofA());
        vm.stopPrank();
    }

    /// @dev The whole point of the badge: it cannot be sold.
    function test_the_name_cannot_be_transferred() public {
        vm.prank(alice);
        uint256 tokenId = reg.claim("build", AGENT_A, _proofA());
        vm.prank(alice);
        vm.expectRevert(MockRegistry.TransferDisallowed.selector);
        ensv2.safeTransferFrom(alice, bob, tokenId);
    }

    function test_revocation_frees_the_name_and_says_why() public {
        vm.prank(alice);
        reg.claim("build", AGENT_A, _proofA());

        vm.expectEmit(true, false, false, true);
        emit NomenRegistrar.NameRevoked(AGENT_A, "build", "metadata link went dead on the 2026-09-20 scan");
        reg.revoke(AGENT_A, "metadata link went dead on the 2026-09-20 scan");

        (bool live,,) = reg.isNamed(AGENT_A);
        assertFalse(live);
        assertEq(reg.tokenIdOfAgent(AGENT_A), 0);
    }

    function test_a_revoked_agent_can_claim_again_after_it_is_fixed() public {
        vm.prank(alice);
        reg.claim("build", AGENT_A, _proofA());
        reg.revoke(AGENT_A, "dead link");
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(NomenRegistrar.NotEligible.selector, AGENT_A));
        reg.claim("build", AGENT_A, _proofA());
        reg.reinstate(AGENT_A, _proofA());
        vm.prank(alice);
        uint256 yeni = reg.claim("build", AGENT_A, _proofA());
        (bool live,,) = reg.isNamed(AGENT_A);
        assertTrue(live);
        assertGt(yeni, 0);
    }

    function test_only_admin_revokes() public {
        vm.prank(alice);
        reg.claim("build", AGENT_A, _proofA());
        vm.prank(bob);
        vm.expectRevert(NomenRegistrar.NotAdmin.selector);
        reg.revoke(AGENT_A, "nice try");
    }

    function test_claiming_before_any_scan_is_published_reverts() public {
        NomenRegistrar taze = new NomenRegistrar(
            IPermissionedRegistry(address(ensv2)), IIdentityRegistry(address(kimlik)), bytes32(uint256(1)), address(new MockTextResolver())
        );
        vm.prank(alice);
        vm.expectRevert(NomenRegistrar.RootNotSet.selector);
        taze.claim("build", AGENT_A, _proofA());
    }

    function test_publishing_a_new_scan_replaces_the_root() public {
        bytes32 yeniKok = keccak256("2026-09-20");
        reg.publishRoot(yeniKok, "ipfs://scan-2026-09-20");
        assertEq(reg.eligibilityRoot(), yeniKok);
        assertEq(reg.eligibilitySource(), "ipfs://scan-2026-09-20");
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(NomenRegistrar.NotEligible.selector, AGENT_A));
        reg.claim("build", AGENT_A, _proofA());
    }

    function test_expired_name_reads_as_not_live() public {
        vm.prank(alice);
        reg.claim("build", AGENT_A, _proofA());
        vm.warp(block.timestamp + 366 days);
        (bool live,,) = reg.isNamed(AGENT_A);
        assertFalse(live);
    }

    function testFuzz_only_the_two_scanned_agents_are_eligible(uint256 id) public view {
        vm.assume(id != AGENT_A && id != AGENT_B);
        assertFalse(reg.isEligible(id, _proofA()));
    }
}
