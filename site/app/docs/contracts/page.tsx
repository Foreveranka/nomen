import Link from "next/link";
const A = {
  registrar: "0x481d5fbd6f7B955D34Dbe3069B30dFFd3C15E81C",
  altRegistry: "0x01F0e0F27F30C445C3F5e48Fc9873849e06B76c8",
  identity: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  reputation: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  ethRegistry: "0xBDC85dD5b15D7ecb354cd7cb6f2c50b4f2c4F0E2",
  ethRegistrar: "0xa88553F454b77203B0D036A05c894d555EAAa2Cc",
  resolver: "0xe7b9A25607E02da8145E4EB1836CA539E53f11f7",
  identityMain: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
};
function Adr({ a, agi = "sepolia" }: { a: string; agi?: "sepolia" | "mainnet" | "arbitrum" | "arc" }) {
  const taban = agi === "sepolia" ? "https://sepolia.etherscan.io/address/" : agi === "mainnet" ? "https://etherscan.io/address/" : agi === "arbitrum" ? "https://sepolia.arbiscan.io/address/" : "https://testnet.arcscan.app/address/";
  return <a className="mono text-[13px]" href={taban + a} target="_blank" rel="noopener">{a}</a>;
}

export default function Kontratlar() {
  return (
    <>
      <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--cok-soluk)]">Contracts &amp; addresses</p>
      <h1 className="mt-2">Everything onchain, by address</h1>

      <h2>Current NOMEN deployment · Sepolia</h2><p>Deployed September 11, 2026 under <code>nomen-demo.eth</code>, with a new operator wallet. The deployed registrar and resolver bytecode match the local build. Registry permissions, current ownership, Merkle eligibility, a real claim, non-transferability and ENS text records were checked against Sepolia. This is testnet deployment verification, not an independent security audit.</p><p><Link href="/name/reader">reader.nomen-demo.eth</Link> identifies NOMEN-owned test agent #10226. <a href="https://sepolia.etherscan.io/tx/0x29904930ef63e6c79cf99aa6b9da4fe007e0d2261d5f54a691cbcb8c65570139" target="_blank" rel="noopener">View the claim transaction</a>. The older registrar at <code>0x0ae4…8686</code> and the old <code>nomen.eth</code> test namespace are no longer used by this app.</p>
      <table>
        <thead><tr><th>Contract</th><th>Address</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td>NomenResolver</td><td><Adr a="0x8443a2C263e770C5180E533B7B571BA6eED029f7" /></td><td>Returns current endorsement text; only the registrar can write records.</td></tr>
          <tr><td>NomenRegistrar</td><td><Adr a={A.registrar} /></td><td>Issues and revokes names. Holds <code>ROLE_REGISTRAR</code>, <code>ROLE_UNREGISTER</code>, <code>ROLE_RENEW</code> on the subregistry.</td></tr>
          <tr><td>nomen-demo.eth subregistry</td><td><Adr a={A.altRegistry} /></td><td>An ENSv2 PermissionedRegistry proxy, the same template ENS uses for <code>.eth</code> itself. Attached to <code>nomen-demo.eth</code> with <code>setSubregistry</code>.</td></tr>
          <tr><td>nomen-demo.eth</td><td>registered in ETHRegistry</td><td>One year, paid in MockUSDC through the ENSv2 ETHRegistrar (commit, wait 60 s, reveal).</td></tr>
        </tbody>
      </table>

      <h2>ENSv2 on Sepolia (ENS deployments)</h2>
      <table>
        <thead><tr><th>Contract</th><th>Address</th></tr></thead>
        <tbody>
          <tr><td>ETHRegistry</td><td><Adr a={A.ethRegistry} /></td></tr>
          <tr><td>ETHRegistrar</td><td><Adr a={A.ethRegistrar} /></td></tr>
          <tr><td>PublicResolverV2</td><td><Adr a={A.resolver} /></td></tr>
        </tbody>
      </table>

      <h2>ERC-8004 registries</h2>
      <table>
        <thead><tr><th>Chain</th><th>Identity</th><th>Reputation</th></tr></thead>
        <tbody>
          <tr><td>Ethereum mainnet</td><td><Adr a={A.identityMain} agi="mainnet" /></td><td className="mono text-[13px]">0x8004BAa17C55a88189AE136b182e5fdA19dE9b63</td></tr>
          <tr><td>Sepolia</td><td><Adr a={A.identity} /></td><td><Adr a={A.reputation} /></td></tr>
          <tr><td>Arbitrum Sepolia</td><td><Adr a={A.identity} agi="arbitrum" /></td><td><Adr a={A.reputation} agi="arbitrum" /></td></tr>
          <tr><td>Arc testnet</td><td><Adr a={A.identity} agi="arc" /></td><td><Adr a={A.reputation} agi="arc" /></td></tr>
        </tbody>
      </table>
      <p>Sepolia, Arbitrum Sepolia and Arc share addresses because the testnet registries were deployed deterministically.</p>

      <h2>Registrar interface</h2>
      <pre><code>{`function claim(string label, uint256 agentId, bytes32[] proof) returns (uint256 tokenId);
function isNamed(uint256 agentId) view returns (bool live, string label, uint64 expiry);
function isEligible(uint256 agentId, bytes32[] proof) view returns (bool);
function eligibilityRoot() view returns (bytes32);
function eligibilitySource() view returns (string);   // where the scan behind the root lives

// admin
function publishRoot(bytes32 root, string source);
function revoke(uint256 agentId, string reason);
function renew(uint256 agentId, bytes32[] proof);
function reinstate(uint256 agentId, bytes32[] proof);

event NameClaimed(uint256 indexed agentId, address indexed owner, string label, uint256 tokenId);
event NameRevoked(uint256 indexed agentId, string label, string reason);
event RootPublished(bytes32 indexed root, string source, uint64 at);
event AgentReinstated(uint256 indexed agentId);`}</code></pre>

      <h2>Tests</h2>
      <p>Twenty-five local Foundry tests (using an ENS registry mock, not a live-network certification): ownership, merkle eligibility, double claims, non-transferability, revocation and re-claim, expiry, admin gating, and a cross-check that pins real proofs generated by the Python scanner so the two implementations cannot drift apart. A separate test reproduces ENSIP-25&rsquo;s ERC-7930 example byte for byte and checks the Sepolia and Arc chain references.</p>
    </>
  );
}
