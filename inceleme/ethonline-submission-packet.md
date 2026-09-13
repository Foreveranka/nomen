# ETHOnline 2026 — NOMEN submission packet

Prepared September 13, 2026. Solo builder: Ömer Metehan. Pool: Building from Scratch, based on the owner's confirmation that project-specific work began after September 4. This packet is prepared material, not a submitted entry. Video is intentionally excluded from this preparation task.

## Project name
NOMEN

## Short description
Find AI agents with live registry evidence, ENSv2 identities and transparent complaint records.

## Project description
NOMEN helps people answer a practical question: which AI agent should I try for this job?

A user describes a task in plain English. NOMEN retrieves relevant ERC-8004 agent records and uses DeepSeek to produce a short list with grounded reasons and explicit unknowns. On Sepolia and Arc, live data from The Graph checks current ownership and metadata-URI continuity before candidates reach the model. The AI also cites supplied registry facts in its recommendations.

Users can inspect an agent, check its published service endpoints and prepare a small trial to run with the provider. Eligible agent owners can claim expiring, non-transferable ENSv2 subnames under nomen-demo.eth on Sepolia. These identities connect a readable name to an eligible registry record and its current owner.

Orders lets users publish a structured complaint for a one-time 5 test USDC fee. Payment commits the original statement; signed edits, registered-owner responses and author-controlled resolution remain visible in the record history. A fee is evidence of publication payment, not proof that someone bought a service or that a complaint is true. Synthetic demonstrations are labeled and excluded from complaint counts.

The application runs on testnets. It does not execute agent tasks or guarantee agent performance.

## How it is made
A Python scanner creates scoped ERC-8004 snapshots, deterministic eligibility results and Merkle proofs. Next.js, React, wagmi and viem provide the application and wallet interactions. DeepSeek extracts task requirements and ranks retrieved records; strict validation rejects fabricated IDs and unsupported source quotes.

Custom The Graph subgraphs index identity and reputation events on Sepolia and Arc. The discovery backend pins a fresh indexed block and checks owner/URI continuity against each record's snapshot baseline. Changed or unavailable evidence withholds candidates. Surviving registry facts are passed to the model and cited in its output. Arbitrum Sepolia discovery separately uses published capabilities and live historical trial receipts.

Solidity contracts integrate with the ENSv2 Sepolia registry hierarchy. A policy-controlled registrar verifies current ERC-8004 ownership and Merkle eligibility. Subnames expire, cannot be transferred and can be revoked under the documented administrator policy. Resolver records are scoped to the current registration generation and endorsement state.

Complaint publication verifies a canonical successful payment and its original-draft commitment. Arc uses 5 native test USDC. New Sepolia and Arbitrum Sepolia drafts use Circle ERC-20 test USDC, with exact transfer calldata and Transfer-log verification. Legacy drafts preserve their original Arc policy. Neon Postgres stores statements and versioned signed updates. Payments cannot be reused for another complaint, and only the author can resolve or reopen it.

## Challenges and decisions
Live registry data and archived metadata answer different questions. A current owner or unchanged URI cannot establish the quality of an agent or the current contents of a mutable URL. NOMEN therefore separates task matching, identity continuity, endpoint checks and user-reported experience.

Historical Graph state also needs an explicit baseline. Immutable identity checkpoints preserve event-based owner/URI history when mutable entity versions are unavailable. If the required evidence is missing or stale, the affected candidates are withheld.

Publication retries must not charge users again. The system reserves an immutable signed draft, binds payment to its content, verifies the receipt and publishes idempotently. Later changes are separate signed history entries.

## Solo contribution and AI disclosure
I built NOMEN as a solo participant with AI-assisted development. I defined and iterated the product requirements, including task-first agent discovery, a dedicated landing page, testnet-only use, trial preparation, ENS naming access and the complaint-and-resolution model. I reviewed the user flows and tested wallet interactions, including Arc publication payment.

Claude and Codex assisted code implementation, debugging, tests, UI changes, documentation and review. Assistance spans tarayici/, kontratlar/, subgraph/, site/ and inceleme/. DeepSeek is also an application dependency for request interpretation and ranking. Open-source dependencies include Next.js, React, wagmi, viem, Foundry, ENSv2, The Graph tooling and Neon. Relevant source, tests, architecture and sanitized product specifications are public in this repository. No claim is made that the source was written entirely by hand.

## Partner 1 — The Graph
Target: Best AI Tooling or AI Use Case with The Graph (From Scratch).

NOMEN uses live Graph data to decide which agents can reach AI ranking. Sepolia and Arc candidates must have fresh indexed evidence matching their snapshot owner and metadata URI. The model receives indexed feedback and change facts and cites the registry signals it used. This makes Graph data part of recommendation eligibility and reasoning, rather than a separate analytics panel. The implementation is in site/lib/graph-discovery.ts, site/lib/discovery-ranking.ts and subgraph/.

Integration feedback: immutable identity checkpoints made comparisons against snapshot blocks reproducible even when historical mutable entity versions were unavailable. Explicit freshness and coverage indicators help avoid presenting incomplete indexing as a complete current registry.

## Partner 2 — ENS
Target: Best Use of ENSv2.

NOMEN uses ENSv2 on Sepolia to issue policy-controlled agent identities under nomen-demo.eth. The registrar checks current ERC-8004 ownership and Merkle eligibility; names are expiring and non-transferable, with explicit administrator revocation and renewal controls. Resolver records are tied to the current registration and endorsement state. reader.nomen-demo.eth is a real claimed test name for agent #10226, not a hard-coded UI label. Source and checks are in kontratlar/ and inceleme/ens-live-evidence.json.

Integration feedback: ENSv2's registry hierarchy and role separation allow the namespace to enforce agent-specific claim and transfer policy. Correct permission setup and resolver behavior after expiration, revocation and root changes are important for communicating the limits of an endorsement.

## Partner 3 — Arc
Target: Best DeFi/Onchain Finance Application — payment infrastructure.

NOMEN uses Arc Testnet's native USDC for a 5 test USDC complaint-publication payment. The wallet transaction includes an original-draft commitment. The backend checks sender, treasury, amount, commitment and successful canonical inclusion before publishing in Neon. The payment provides an independently inspectable record of publication funding, while later signed responses and resolution history remain offchain. A completed Arc payment and published record are linked below.

Integration feedback: using native USDC for the fee and gas simplifies the payment balance model. Reserving the draft before payment and preserving the transaction hash makes interrupted publication recoverable without a second charge.

Scope: this is a user-initiated payment application. It does not use Circle Agent Stack or autonomous agent spending. Arc finance-prize fit is not guaranteed. The published prize conditions include a later mainnet deployment condition for part of the award; no mainnet deployment is claimed here.

## Links to paste
- Website: https://nomen-beta.vercel.app
- Public source: https://github.com/Foreveranka/nomen
- Documentation: https://nomen-beta.vercel.app/docs
- Application: https://nomen-beta.vercel.app/workbench
- ENS example: https://nomen-beta.vercel.app/name/reader
- ENS claim: https://sepolia.etherscan.io/tx/0x29904930ef63e6c79cf99aa6b9da4fe007e0d2261d5f54a691cbcb8c65570139
- Arc publication example: https://nomen-beta.vercel.app/orders?id=7cf75f6c-45b0-49dd-9758-5a831053c145
- Arc payment: https://testnet.arcscan.app/tx/0x9c77932e458387476c8b79cada52a71e8fc61441a8ae3a7cf032e76e50265605
- Provider response/resolution demo: https://nomen-beta.vercel.app/orders?id=2e55e112-65a8-4d59-abbe-5b268c5a7fd0
- Architecture: https://github.com/Foreveranka/nomen#how-it-works
- Judge walkthrough: https://github.com/Foreveranka/nomen/blob/main/inceleme/judge-walkthrough.md
- Product specification: https://github.com/Foreveranka/nomen/blob/main/inceleme/product-specification.md
- Brand icon: submission/nomen-logo.png (512×512) and submission/nomen-logo.svg; same artwork as the application icon.
- Screenshots: submission/landing.png, submission/ens-name.png and submission/orders.png. These are actual application screenshots; Orders shows an explicitly labeled synthetic test record.
- Cover: submission/landing.png can also be used for the cover field.

## Honest verification status
Arc payment-to-publication is verified with a real testnet transaction. Sepolia and Arbitrum's newly added payment paths have passed unit tests, live 5-USDC eth_call simulations and signed production draft reservations; complete funded payment-to-publication tests remain pending. Do not describe those simulations as completed payments. The existing ENS claim and Graph/AI checks have dated evidence in inceleme/; public endpoints should be checked at judging time for current availability.

## Form settings and remaining delivery
Authenticated form status on September 13: NOMEN was created under Artificial Intelligence. Project details, public repository (Foreveranka/nomen, Monorepo), live website, technology selections and the AI contribution disclosure were saved. Logo, cover and screenshots are prepared locally; automated upload was blocked by the Chrome extension's file-access setting. They have not been confirmed uploaded.

The form requires a short description of at most 100 characters, a square logo (512×512 suggested), a cover (16:9 preferred), and at least three screenshots. Prize selection and Future Opportunities remain disabled until those images and the real demo video are provided. The partner texts above are prepared content, not saved prize selections. Final Submit has not been clicked.

Solo entry: only Ömer Metehan. Keep Building from Scratch. The owner's stated start date is provenance, not a replacement for genuine source history. Preserve actual Git dates and planning evidence. If the form requires a team container, it should contain only the solo participant.

Finalist + Partner Prizes versus Partner Prizes Only is a remaining user choice: the former requires availability for live judging if shortlisted. Prepared content does not choose or submit that preference.

Video is not supplied in this packet. Do not enter a fake video URL or mark the project as submitted. After the real video is attached, verify all fields and complete final Submit before the official deadline.

The final form also states that this project will not be submitted to another hackathon. Do not attest to that statement while planning a duplicate submission of this same entry. Any subsequent Arbitrum buildathon proposal needs its eligibility and distinct scope resolved with the organizers; a later Git baseline alone does not override ETHGlobal's terms.

## Official references
- https://ethglobal.com/events/ethonline2026/info/details
- https://ethglobal.com/events/ethonline2026/prizes/the-graph
- https://ethglobal.com/events/ethonline2026/prizes/ens
- https://ethglobal.com/events/ethonline2026/prizes/arc
