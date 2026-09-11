// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {NomenResolver} from "../src/NomenResolver.sol";
import {NomenRegistrar} from "../src/NomenRegistrar.sol";
import {IPermissionedRegistry, IIdentityRegistry, RegistryRoles} from "../src/interfaces/IENSv2.sol";

/* ENSv2 Sepolia yüzeyleri (docs.ens.domains/learn/deployments, zincir üstünde doğrulandı) */
interface IETHRegistrar {
    function makeCommitment(string calldata label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, bytes32 referrer) external view returns (bytes32);
    function commit(bytes32 commitment) external;
    function register(string calldata label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, address paymentToken, bytes32 referrer) external returns (uint256 tokenId);
    function getRegisterPrice(string calldata label, uint64 duration, address paymentToken) external view returns (uint256 base, uint256 premium);
    function MIN_COMMITMENT_AGE() external view returns (uint256);
}
interface IVerifiableFactory { function deployProxy(address implementation, uint256 salt, bytes memory data) external returns (address proxy); }
interface IERC20 { function approve(address, uint256) external returns (bool); function mint(address, uint256) external; function balanceOf(address) external view returns (uint256); }
interface IEAC {
    function grantRootRoles(uint256 roleBitmap, address account) external;
    function hasRoles(uint256 resource, uint256 roleBitmap, address account) external view returns (bool);
}
interface IUserRegistryInit { function initialize(address rootAccount, uint256 roleBitmap) external; }

/// @notice Üç adım, her biri ayrı çalıştırılabilir (env ADIM=1|2|3):
///   1 commit          : nomen.eth için commitment gönder, 60 sn bekle
///   2 register+deploy : adı al, alt registry proxy'sini ve resolver'ı kur, registrar'ı dağıt, rolleri ver
///   3 root            : taramanın merkle kökünü yayınla
contract Dagit is Script {
    address constant ETH_REGISTRAR   = 0xa88553F454b77203B0D036A05c894d555EAAa2Cc;
    address constant ETH_REGISTRY    = 0xBDC85dD5b15D7ecb354cd7cb6f2c50b4f2c4F0E2;
    address constant FACTORY         = 0x10dC6333CDFe1FCEf624c6e0a8221b91804Cd7ef;
    address constant USER_REGISTRY_IMPL = 0x624a25d67B59D587752EbEc8DdeD8827dAe52050;
    address constant RESOLVER_IMPL   = 0x9EAe5C2730a7dD16BDD1DeE6421a1B91e3B0365e;
    address constant PUBLIC_RESOLVER = 0xe7B9A25607E02da8145E4eB1836CA539e53F11f7;
    address constant MOCK_USDC       = 0x768F42455A2D082E23ceeF7d51e5787C82d67a39;
    address constant IDENTITY        = 0x8004A818BFB912233c491871b3d84c89A494BD9e;

    uint64 constant SURE = 365 days;

    function namehash(string memory ad) internal pure returns (bytes32 n) {
        // "nomen.eth" → keccak(keccak(0, keccak("eth")), keccak("nomen"))
        n = keccak256(abi.encodePacked(bytes32(0), keccak256("eth")));
        n = keccak256(abi.encodePacked(n, keccak256(bytes(ad))));
    }

    function run() external {
        require(block.chainid == 11155111, "Sepolia only");
        uint256 key = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address sahip = vm.addr(key);
        require(sahip != 0x922D05Af2e9535bfe6fDEEB713ea33088b7412CC, "rotate compromised deployer");
        string memory LABEL = vm.envOr("PARENT_LABEL", string("nomen-demo"));
        require(bytes(LABEL).length >= 3, "parent label required");
        uint256 adim = vm.envOr("ADIM", uint256(1));
        bytes32 secret = adim <= 2 ? vm.envBytes32("COMMIT_SECRET") : bytes32(0);
        require(adim >= 1 && adim <= 3, "invalid step");
        require(adim > 2 || secret != bytes32(0), "random COMMIT_SECRET required");
        if (adim <= 2) {
            require(
                uint8(IPermissionedRegistry(ETH_REGISTRY).getState(uint256(keccak256(bytes(LABEL)))).status) == 0,
                "parent is unavailable; choose a new label"
            );
        }
        vm.startBroadcast(key);

        if (adim == 1) {
            (uint256 fiyat, uint256 prim) = IETHRegistrar(ETH_REGISTRAR).getRegisterPrice(LABEL, SURE, MOCK_USDC);
            console.log("fiyat (MockUSDC, 6 ondalik):", fiyat + prim);
            if (IERC20(MOCK_USDC).balanceOf(sahip) < fiyat + prim) IERC20(MOCK_USDC).mint(sahip, (fiyat + prim) * 2);
            IERC20(MOCK_USDC).approve(ETH_REGISTRAR, type(uint256).max);
            bytes32 c = IETHRegistrar(ETH_REGISTRAR).makeCommitment(LABEL, sahip, secret, address(0), PUBLIC_RESOLVER, SURE, bytes32(0));
            IETHRegistrar(ETH_REGISTRAR).commit(c);
            console.log("commit gonderildi; MIN_COMMITMENT_AGE sn bekle:", IETHRegistrar(ETH_REGISTRAR).MIN_COMMITMENT_AGE());
        }

        if (adim == 2) {
            uint256 tokenId = IETHRegistrar(ETH_REGISTRAR).register(LABEL, sahip, secret, address(0), PUBLIC_RESOLVER, SURE, MOCK_USDC, bytes32(0));
            console.log("parent registered:", LABEL);
            console.log("tokenId:", tokenId);

            // Alt alan adlarinin yasayacagi registry: ENS'in kendi PermissionedRegistry sablonu
            uint256 tuz = uint256(keccak256(abi.encode(keccak256("UserRegistry"), namehash(LABEL), uint256(1))));
            // Kök hesabın rolleri: her rol ve admin varyantı (EAC, "tüm bitler" kabul etmiyor)
            uint256 kokRoller =
                RegistryRoles.ROLE_REGISTRAR | RegistryRoles.ROLE_REGISTRAR_ADMIN |
                RegistryRoles.ROLE_REGISTER_RESERVED | (RegistryRoles.ROLE_REGISTER_RESERVED << 128) |
                RegistryRoles.ROLE_SET_PARENT | (RegistryRoles.ROLE_SET_PARENT << 128) |
                RegistryRoles.ROLE_UNREGISTER | (RegistryRoles.ROLE_UNREGISTER << 128) |
                RegistryRoles.ROLE_RENEW | (RegistryRoles.ROLE_RENEW << 128) |
                RegistryRoles.ROLE_SET_SUBREGISTRY | (RegistryRoles.ROLE_SET_SUBREGISTRY << 128) |
                RegistryRoles.ROLE_SET_RESOLVER | (RegistryRoles.ROLE_SET_RESOLVER << 128);
            address altRegistry = IVerifiableFactory(FACTORY).deployProxy(
                USER_REGISTRY_IMPL, tuz, abi.encodeCall(IUserRegistryInit.initialize, (sahip, kokRoller))
            );
            console.log("alt registry:", altRegistry);

            // nomen.eth -> alt registry
            (bool ok,) = ETH_REGISTRY.call(abi.encodeWithSignature("setSubregistry(uint256,address)", tokenId, altRegistry));
            require(ok, "setSubregistry");

            NomenRegistrar reg = new NomenRegistrar(
                IPermissionedRegistry(altRegistry), IIdentityRegistry(IDENTITY), namehash(LABEL), PUBLIC_RESOLVER
            );
            NomenResolver gatedResolver = new NomenResolver(reg);
            reg.setResolverAddress(address(gatedResolver));
            console.log("NomenRegistrar:", address(reg));
            console.log("NomenResolver:", address(gatedResolver));

            IEAC(altRegistry).grantRootRoles(
                RegistryRoles.ROLE_REGISTRAR | RegistryRoles.ROLE_UNREGISTER | RegistryRoles.ROLE_RENEW, address(reg)
            );
            console.log("roller verildi");
        }

        if (adim == 3) {
            NomenRegistrar reg = NomenRegistrar(vm.envAddress("REGISTRAR"));
            reg.publishRoot(vm.envBytes32("KOK"), vm.envString("KAYNAK"));
            console.log("kok yayinlandi");
        }
        vm.stopBroadcast();
    }
}
