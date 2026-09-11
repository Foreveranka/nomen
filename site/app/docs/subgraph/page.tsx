export default function Subgraph() {
  return (
    <>
      <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--cok-soluk)]">Subgraph</p>
      <h1 className="mt-2">The registries, indexed</h1>
      <p>The subgraph indexes the three ERC-8004 registries on Sepolia and the NOMEN registrar, from events only, so every entity can be reproduced from the logs. The activity API can consume a deployed instance through NOMEN_SUBGRAPH_URL. Without that configuration it returns 503 and the interface shows unavailable, not zero activity. Version v0.3.0 is deployed to Graph Studio on Sepolia and connected to the app. The activity panel reports its current indexed block and warns when it is catching up. Deployment alone does not establish that historical indexing is complete.</p>

      <h2>Deployment</h2>
      <p>The Studio development endpoint is <code>https://api.studio.thegraph.com/query/1760110/nomen/v0.3.0</code>. This is a testnet Studio deployment, not a publication on the decentralized Graph Network. Published descriptions supply candidate capabilities. The Graph is required for Sepolia and Arc AI matching: current and historical ownership and metadata URI are compared before ranking, and the remaining registry facts are passed to DeepSeek. Missing or stale evidence withholds candidates on the affected network. Immutable identity checkpoints record each registration, URI update and transfer. The server selects the last checkpoint at or before the snapshot block, so the comparison survives pruning of mutable entity history.</p>

      <h2>Arc Testnet scope</h2>
      <p>Arc Studio version v0.1.1 is deployed at https://api.studio.thegraph.com/query/1760110/nomen-arc/v0.1.1, configured through <code>NOMEN_ARC_SUBGRAPH_URL</code>. It follows identity, reputation and validation events for the 249 explicitly listed catalog IDs. It does not index the entire Arc registry and contains no ENS registrar. Event filters and the ID list are reproducible from <code>subgraph/subgraph.arc.yaml</code> and <code>subgraph/arc-scope.json</code>.</p>
      <p>The catalog was refreshed on September 11, 2026, at block 61,552,064. Ownership, URI and metadata were re-read for all 249 listed records. Excluded records outside this set keep their older observations. The <a href="/veri/arc/catalog-refresh.json">refresh manifest</a> records that limited scope. AI results show freshness, eligibility and withheld records separately for each network. An unavailable Arc index pauses Arc recommendations while Sepolia can continue.</p>
      <h2>Entities</h2>
      <table>
        <thead><tr><th>Entity</th><th>What it holds</th></tr></thead>
        <tbody>
          <tr><td><code>Agent</code></td><td>owner, current URI, how many times the URI moved, transfers since mint, feedback count, distinct reviewers, current NOMEN name.</td></tr>
          <tr><td><code>IdentityCheckpoint</code></td><td>immutable owner and URI after each identity event, with block and event order. AI matching uses these rows to compare the current identity with the published snapshot.</td></tr>
          <tr><td><code>AgentMetadata</code></td><td>onchain key/value metadata set through <code>MetadataSet</code>.</td></tr>
          <tr><td><code>Feedback</code></td><td>one review: reviewer, value, decimals, tags, endpoint, URI, and whether it was later revoked.</td></tr>
          <tr><td><code>AgentClient</code></td><td>one (agent, reviewer) pair, so distinct reviewers are counted exactly rather than inferred.</td></tr>
          <tr><td><code>Validation</code></td><td>a validation request and, when it arrives, the response.</td></tr>
          <tr><td><code>NomenName</code></td><td>a subname: label, agent, owner, expiry, revocation flag and reason. The indexed live flag means not revoked; use isNamed for current endorsement.</td></tr>
          <tr><td><code>Scan</code></td><td>every merkle root the registrar ever published, with its source.</td></tr>
          <tr><td><code>Registry</code></td><td>one row of totals within the indexed scope.</td></tr>
        </tbody>
      </table>

      <h2>Event signatures</h2>
      <p>These are the event signatures currently configured in the manifest; deployment requires checking the target addresses and start blocks:</p>
      <pre><code>{`Registered(uint256 indexed agentId, string agentURI, address indexed owner)
URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy)
MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey, string metadataKey, bytes metadataValue)
NewFeedback(uint256 indexed agentId, address indexed clientAddress, uint64 feedbackIndex, int128 value,
            uint8 valueDecimals, string indexed indexedTag1, string tag1, string tag2, string endpoint,
            string feedbackURI, bytes32 feedbackHash)
FeedbackRevoked(uint256 indexed agentId, address indexed clientAddress, uint64 indexed feedbackIndex)
ValidationRequest(address indexed validatorAddress, uint256 indexed agentId, string requestURI, bytes32 indexed requestHash)
ValidationResponse(address indexed validatorAddress, uint256 indexed agentId, bytes32 indexed requestHash,
                   uint8 response, string responseURI, bytes32 responseHash, string tag)`}</code></pre>

      <h2>A query worth running</h2>
      <pre><code>{`{
  agents(first: 20, orderBy: distinctClients, orderDirection: desc, where: { feedbackCount_gt: 0 }) {
    agentId owner feedbackCount distinctClients uriUpdates
    name { label live }
    feedback(first: 3, orderBy: createdAt, orderDirection: desc) { client value valueDecimals tag1 revoked }
  }
}`}</code></pre>
      <p>Agents whose feedback all comes from one wallet and agents whose feedback comes from many are different things; <code>distinctClients</code> is how to tell them apart.</p>
    </>
  );
}
