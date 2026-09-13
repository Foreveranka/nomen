# NOMEN — judge walkthrough

Live app: https://nomen-beta.vercel.app. No wallet or account is needed for discovery, public agent records, public complaint history or viewing names. Wallet signing is required to claim names, reserve/publish complaints or post authorized updates. Use only test assets.

1. Open the landing page, then Open app. Select Sepolia and enter: `Find a crypto research agent that compares onchain metrics, explains risks, and summarizes findings from multiple sources.` Requests must be English, 15–500 characters.
2. Inspect the returned match and the live registry evidence used by the AI. Compare its capability reason with its description quote and registry signals. The particular match is not guaranteed; empty or unavailable results are explicitly reported. Graph evidence must be fresh.
3. Open Try this agent. Review ownership, metadata and service checks and prepare a small public/synthetic sample. The app prepares a trial; the actual task runs with the provider, not automatically inside NOMEN.
4. Open https://nomen-beta.vercel.app/name/reader. Inspect reader.nomen-demo.eth, agent #10226, the registrar and resolver records. Claim a name requires an eligible agent owner's wallet on Sepolia; judges do not need to mint a name to inspect the real deployment.
5. Open https://nomen-beta.vercel.app/orders?id=2e55e112-65a8-4d59-abbe-5b268c5a7fd0. Review the labeled synthetic complaint, registered-owner response, author resolution and signed record history. Follow the Arc payment explorer link. The example is a test, not customer traction.
6. To test a new complaint, choose the agent network and a valid agent ID, enter synthetic statements, mark TEST and consent to publication. Sign & prepare, review the reserved payment network, pay once, then Verify payment & publish. New Sepolia/Arbitrum drafts need 5 Circle test USDC plus test ETH for gas; Arc needs 5 native test USDC plus gas. Legacy reservations remain on Arc. Keep the payment hash and retry verification rather than paying again.

## Where to inspect implementation
- Ranking and evidence gate: site/lib/discovery-ranking.ts and site/lib/graph-discovery.ts.
- Graph schemas/mappings: subgraph/.
- ENS contracts and Foundry tests: kontratlar/.
- Payment commitments and negative tests: site/lib/complaints.ts and site/scripts/complaints.test.mjs.
- API authorization/persistence: site/app/api/complaints/route.ts and site/migrations/002-complaints.sql.
- Run instructions and architecture diagram: README.md and site/README.md.

Mainnet is excluded from app selection. Names, indexing and payment integrations have different chain-specific implementations. No fee or registry check proves service purchase, complaint truth or task success.
