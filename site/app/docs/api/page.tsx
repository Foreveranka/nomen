export default function Api() {
  return (
    <>
      <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--cok-soluk)]">API reference</p>
      <h1 className="mt-2">Discover, inspect and integrate</h1>
      <h2>AI discovery</h2>
      <pre><code>{`POST /api/discover
Content-Type: application/json

{"request":"Find an agent for weather forecasts and air quality","chain":"all"}`}</code></pre>
      <p>request accepts 15–500 characters; use English. chain is all (default), sepolia, arbitrum or arc. DeepSeek ranks published candidates. The response includes request, matches, conclusion, searched, considered, generatedAt, model and registry. registry contains status (live, partial, stale, unavailable or not_applicable), indexedBlock, indexedAt, checked, eligible and withheld candidate reasons. A Graph failure may return HTTP 200 with zero recommendations on the affected network and an explicit unavailable/stale status; it is not a successful recommendation. Each match contains key, chain, agentId, name, description, reason, evidenceQuote, gaps, category and serviceCount. Sepolia and Arc matches also contain registryEvidence (pinned current block, snapshot baseline block, owner, historical counters and server-derived signals) and registrySignals (IDs selected by the AI). Only fresh evidence with matching ownership and metadata URI passes. An empty matches array is a valid no-match result. The compatibility brief field contains extracted requirements and search terms; its former narrative fields are empty.</p>
      <p>Reasons are limited to 180 characters. Each exact description quote is 12–300 characters, with at most two unknowns of 120 characters each. The conclusion is a fixed interface message, not a generated essay. These limits concern model output, not the 500-character user request.</p>
      <p>Errors: 400 invalid input, 403 cross-origin rejection, 413 oversized body, 429 throttling/provider quota, 503 generation or provider failure. Searches share a 45-second deadline; client integrations should allow for this latency. Results are not cached. Throttling is per instance, not a global spending cap.</p>
      <h2>Current evidence</h2>
      <pre><code>{`POST /api/evaluate
Content-Type: application/json

{"chain":"sepolia","agentId":1194,"job":"custom","request":"Weather forecasts and air quality"}`}</code></pre>
      <p>Use custom with the original task, or wallet_report, research or payments. Responses include decision, checks, services, checkedAt, expiresAt, owner, block, metadataHash and fingerprint. Service observations report URL, status, protocol, HTTP status when available and latency. automaticExecutionAllowed is always false. Reports expire after 15 minutes. See <a href="/docs/evaluate">the trial workflow</a> for manual reviews and their limits.</p>
      <h2>Complaint publication records</h2>
      <pre><code>GET /api/complaints?chain=sepolia&amp;agentId=10226&amp;status=all&amp;page=1</code></pre><p>Filters: chain (sepolia, arbitrum or arc), agentId, author wallet and status (all, open, resolved or flagged). Returns at most 20 published records per page, open/resolved/flagged counts excluding demo records, and fee configuration. Use id for a detail and eventPage for its signed history (20 events per page). Pending drafts are not public. Unavailable storage returns 503 rather than empty statistics.</p>
      <pre><code>POST /api/complaints</code></pre><p>Send action and signature. The strict action schemas and exact consent message are defined in lib/complaints.ts. Sign complaintMessage(action); timestamps expire after 15 minutes. Actions: prepare (signed structured draft), publish (draft ID and Arc payment transaction), edit (new fields), reply (provider response) and status (open/resolved with explanation). Edits, replies and status changes include the current record version, preventing stale updates and signature replay. Initial publication is idempotent.</p><p>The publication fee is exactly 5 native test USDC on Arc Testnet (chain 5042002, 18-decimal native units). The transaction sender must be the draft author, recipient the configured NOMEN treasury, value the exact fee, and input the complaintCommitment(draft). The server checks successful canonical inclusion. This commits the original statement only; subsequent signed edits are stored in the versioned database history. Author signatures are checked on Arc for contract wallets; direct EOA wallets are supported. Agent ownership for provider replies is checked on the agent’s registry network.</p><p>Errors: 400 malformed fields, 401 expired/invalid signature, 403 wrong actor or origin, 404 missing published record, 409 version conflict or update limit, 413 oversized body, 422 mismatched payment and 503 unavailable RPC/storage. Requests are bounded to 32 KB; updates are limited to ten signed events per actor per minute. Reuse the original payment hash after a storage failure; never charge again merely to retry publication.</p>
      <h2>Archived ratings</h2><pre><code>GET /api/reviews?chain=sepolia&amp;agentId=1194</code></pre><p>Historical reviews and their evidence downloads remain read-only. POST /api/reviews now returns 410 and directs clients to Orders. Existing ratings are not converted into paid complaints or purchase verification.</p>
      <h2>Arbitrum evaluation history</h2>
      <pre><code>GET /api/evaluations?chain=arbitrum&amp;agentId=205</code></pre>
      <p>Reads <code>EvaluationRecorded</code> events from the live NomenEvaluationRegistry deployment on Arbitrum Sepolia. The response includes individual hash-only receipts and totals for passed, failed and inconclusive outcomes plus distinct reviewer wallets. A wallet count is not a person count or proof of independent users. An RPC failure returns 503 with status unavailable; it is never converted as zero reviews.</p>
      <h2>Indexed registry activity</h2><pre><code>GET /api/activity?chain=sepolia&amp;agentId=10226</code></pre><p>Reads the selected network from The Graph; chain accepts sepolia or arc. Arc covers the 249 explicitly listed catalog IDs, not all registered agents. The discovery registry.networks array reports status, scope and block independently for each requested supported network. The response includes indexedBlock, freshness and indexed agent events. Missing records may not have been indexed yet. A stale flag means the indexed block is over 15 minutes old or its timestamp is unknown. Indexed name events do not establish current endorsement; call registrar.isNamed. Errors: 400 unsupported chain or invalid ID, 503 no configured endpoint, 502 unavailable index.</p><h2>Snapshot verification</h2>
      <p>The API exists for callers that are themselves agents. It answers which of the six checks a record passed or failed and why, and lets the caller decide. It never says &ldquo;trustworthy&rdquo;.</p>

      <h2>Request</h2>
      <pre><code>GET /api/snapshot?chain=&lt;ethereum|sepolia|arbitrum|arc&gt;&amp;agentId=&lt;id&gt;</code></pre>
      <p>Results use published scan data and include provenance. This endpoint has no NOMEN payment requirement. A snapshot lookup is not a fresh service or task-performance check.</p>

      <h2>Response</h2>
      <table>
        <thead><tr><th>Field</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><code>status</code></td><td>One of <code>passes</code>, <code>no_metadata_uri</code>, <code>metadata_unreachable</code>, <code>metadata_not_json</code>, <code>required_field_missing</code>, <code>duplicate_of_earlier_record</code>, <code>no_describable_purpose</code>, <code>not_registered</code>, <code>not_scanned</code>, <code>rpc_error</code>. Unknown and failed reads are not evidence of absence.</td></tr>
          <tr><td><code>passes</code></td><td>Boolean shortcut for <code>status == &quot;passes&quot;</code>.</td></tr>
          <tr><td><code>reason</code></td><td>One sentence a human or a model can read.</td></tr>
          <tr><td><code>agent</code></td><td>Present only when it passes: name, type, description, owner, endpoints, category, metadata source and hash, labels.</td></tr>
          <tr><td><code>scan</code></td><td>Published snapshot provenance, coverage, scan timestamp when verified, pinned ownership block and counts. This is not a live metadata check.</td></tr>
        </tbody>
      </table>

      <h2>Payment</h2>
      <p>/api/snapshot and POST /api/toplu are free. /api/dogrula serves the same snapshot and optionally demonstrates x402 v2 payments when NOMEN_PAY_TO is configured. That optional path uses Base Sepolia USDC; it is not an Arc integration or a premium live verification service. A real 0.001 test USDC payment through the production endpoint was verified on September 11, 2026, including invalid-signature and replay rejection. See /x402-evidence.json for the transaction. The public testnet facilitator occasionally rejects settlement; a failed payment must not be treated as a successful lookup.</p>

      <h3>From an agent, in six lines</h3>
      <pre><code>{`import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";

const fetchPaid = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [{ network: "eip155:*", client: new ExactEvmScheme(privateKeyToAccount(KEY)) }],
});
const verdict = await (await fetchPaid(URL)).json();`}</code></pre>

      <h2>Why an agent would call this</h2>
      <p>Before paying another agent for work, before routing a job to it, before quoting its identity to a user. The registry answers &ldquo;does this id exist&rdquo;; NOMEN answers &ldquo;does this id mean anything&rdquo;. Try it on the <a href="/developers">developers page</a>.</p>
    </>
  );
}
