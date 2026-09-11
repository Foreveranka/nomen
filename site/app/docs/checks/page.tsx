export default function Kontroller() {
  return (
    <>
      <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--cok-soluk)]">The six checks</p>
      <h1 className="mt-2">Every check is a fact about the record</h1>
      <p>Checks 1–5 inspect document structure and duplication. Check 6 uses a disclosed dictionary and text heuristics, which can misclassify purpose. Each one can be re-run by anyone with the same inputs and will give the same answer. These results do not establish that an agent is safe, honest or capable.</p>

      <h2>The checks</h2>
      <ol>
        <li><strong>Metadata URI is set.</strong> A record minted with an empty <code>tokenURI</code> describes nothing and cannot be called. On Ethereum this is 38.6% of the registry; on Arc testnet, 71%.</li>
        <li><strong>The document loads.</strong> The URI resolved at scan time. IPFS URIs are tried against three public gateways. One attempt per scan; a link that needs luck is not a link.</li>
        <li><strong>The document is JSON.</strong> It parses to an object. Parked domains that answer with an HTML page fail here, not at check 2.</li>
        <li><strong>Required fields are present.</strong> ERC-8004 marks <code>type</code>, <code>name</code>, <code>description</code> and <code>image</code> as MUST. NOMEN requires the first three; a missing image does not stop a record from being described or called.</li>
        <li><strong>It is not a byte-identical copy.</strong> The hash is taken over the full metadata bytes. The lowest id with a given hash keeps it; later ones are folded into it and labelled as its copy. The biggest group on Ethereum is a &ldquo;test&rdquo; agent minted 2,043 times from two wallets.</li>
        <li><strong>The description states a purpose.</strong> Keyboard noise, a phrase repeated four times, and generated character cards with no service behind them cannot be classified or searched. Most of this is decided by a published dictionary of descriptions; the only automatic rule is repetition.</li>
      </ol>

      <h2>Field spellings</h2>
      <p>Check 4 accepts documented spellings of the same field. Arc&rsquo;s own &ldquo;Register your first AI Agent&rdquo; tutorial writes <code>agent_type</code>; the EIP says <code>type</code>. The field is there either way, so the record passes and carries a label saying which spelling it used. Only a small number of records are affected; most Arc records fail check 4 because they carry plain NFT metadata with no type field at all.</p>

      <h2>Labels that are not checks</h2>
      <table>
        <thead><tr><th>Label</th><th>Meaning</th><th>Why it does not filter</th></tr></thead>
        <tbody>
          <tr><td>template family</td><td>The same description is reused by more than five distinct records.</td><td>A product deployed once per user is legitimate. Zyfai has hundreds of such agents, each with a different owner and endpoint.</td></tr>
          <tr><td>no public endpoint</td><td>The document declares no service address.</td><td>An agent with no public address can still be real, and its reputation still counts.</td></tr>
          <tr><td>self-described as test or demo</td><td>The name or description says so.</td><td>On a testnet that is expected. It is shown, not hidden.</td></tr>
          <tr><td>field spelled X instead of Y</td><td>A documented alias was accepted.</td><td>Transparency about check 4.</td></tr>
        </tbody>
      </table>

      <h2>Categories</h2>
      <p>Every passing record gets one of eight categories: Trading &amp; DeFi, Data &amp; research, Infrastructure, Assistant, NFT &amp; character, Social &amp; content, DAO &amp; governance, Other. Categories come from a dictionary keyed by description, built by hand and extended by pattern rules; the dictionary is part of the published output.</p>
    </>
  );
}
