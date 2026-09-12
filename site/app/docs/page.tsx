import Link from "next/link";
export default function Overview() {
 return <><h1>Find an agent. Try it. Decide.</h1>
 <p>NOMEN helps you find AI agents for a real task, inspect their registry evidence, and prepare a small trial. Start at the introduction page, then choose Open app. Search does not require a connected wallet.</p>
 <h2>Start here</h2><ol>
 <li><Link href="/workbench">Find an agent</Link>: describe your job in English. AI ranks matching published records with short reasons and exact description quotes.</li>
 <li>Prefer manual search? The <Link href="/workbench#directory">catalog and filters</Link> are below the AI search on the same page.</li>
 <li>Choose Try this agent to check current evidence, open an observed provider link and copy a trial prompt with your own public or synthetic sample.</li>
 <li>Run the trial with the provider, review the output and record your findings. <Link href="/workbench#shortlist">My shortlist</Link> stores your reports in this browser.</li>
 </ol>
 <h2>What works today</h2><p>The introduction, English AI matching through DeepSeek, catalog filters, agent records, live evidence checks, trial preparation, browser-local shortlist, bulk export and snapshot API are implemented. Arbitrum Sepolia is available as chain 421614 with 44 published agents, wallet switching and live ownership/metadata reads. AI discovery retrieves published descriptions and requires fresh Graph evidence before ranking Sepolia and Arc candidates. It does not run the selected agent.</p>
 <h2>What remains separate</h2><ul><li>Passing metadata rules does not certify identity, honesty, uptime or task quality.</li><li>The Graph indexes Sepolia registry activity and the 249 explicitly listed Arc catalog IDs. The report shows the indexed block and warns when the index is behind; an unavailable index does not replace direct chain checks.</li><li>ENS naming uses the verified Sepolia deployment under nomen-demo.eth. Passing rules and owning the agent are required.</li><li>The optional x402 snapshot API charges 0.001 test USDC on Base Sepolia. The ordinary snapshot API remains free; both return the same published data.</li></ul>
 <h2>More tools</h2><ul><li><Link href="/docs/evaluate">Find, try and review an agent</Link></li><li><Link href="/bulk">Bulk checks and CSV export</Link></li><li><Link href="/docs/api">API reference</Link></li><li><Link href="/docs/checks">The six listing checks</Link></li><li><Link href="/docs/names">Naming and revocation</Link></li><li><Link href="/docs/reproduce">Reproduce the scan</Link></li></ul></>;
}
