# NOMEN submission readiness — 13 September 2026 (Türkiye)

This review separates working functionality, event eligibility and uncompleted submission steps. It does not submit either entry or promise a prize. Earlier reports are historical evidence, not the current feature specification.

## Latest update — multi-network payments and solo entry

An authenticated ETHGlobal project draft named NOMEN has now been created in Artificial Intelligence. Project details, live app, AI disclosure, Foreveranka/nomen repository (Monorepo) and the technology selections were saved with Save & Continue. This supersedes earlier observations of an empty project form. A square logo and three actual application screenshots are in submission/. Upload remains blocked by the Chrome extension's file-access setting. Prize and Future Opportunities steps are disabled until images and the real demo video are present. Partner texts are prepared in the packet but have not been saved as prize selections. Creation is not submission.

Current documentation deployment: dpl_23iTrkeWqQUCtEdq72YnpKAU2EBH, aliased to https://nomen-beta.vercel.app. Build, TypeScript and ESLint passed; the live docs include the multi-network and legacy-reservation payment policy. Source/docs were pushed in e90a56f; the following asset/status commit adds the remaining preparation materials.

The owner is entering alone. GitHub main was verified at 2ee2e05 against the local checkout before this documentation update. New v2 complaint payments follow the agent network; Sepolia and Arbitrum Sepolia use Circle ERC-20 test USDC, while Arc uses native test USDC. Existing v1 reservations remain Arc. The new-network full transfer tests still await funding; real-contract RPC simulations and production signed reservations passed. All 49 Node tests passed including both database fixtures. See [payment verification](2026-09-13-multichain-complaint-payments.md). The latest form-ready materials are in [submission packet](ethonline-submission-packet.md). Video is excluded from this preparation task. The sections below retain earlier point-in-time checks, with superseded payment statements corrected.

Fresh check at 2026-09-13T14:35Z: Sepolia and Arc Graph endpoints returned HTTP 200 with fresh indexed blocks (11-second and 5-second lag respectively). The Sepolia registrar returned isNamed(10226) = true, reader. Evidence: submission-live-check-2026-09-13.json.

## Earlier evidence

- Public GitHub repository exists: https://github.com/Foreveranka/nomen. At the start of this review its HEAD was 3b031d4; Orders, recent trial improvements and wallet fixes were still only local/deployed. The requested publication update includes those changes with their actual commit date.
- Live Sepolia Graph response: block 11,691,609, indexed 2026-09-12T21:43:12Z, eight seconds behind at observation. Live Arc Graph response: block 61,794,546, indexed 2026-09-12T21:43:18Z, two seconds behind. These are point-in-time observations, not an uptime guarantee.
- Live DeepSeek Sepolia search returned AlphaShark42 (#1194) with fresh Graph identity, URI and feedback evidence. Live Arbitrum search returned Orbital Oracle (#205) with one inconclusive historical trial and trialHistoryConsidered=true.
- Orders API returned both labeled synthetic complaints. No real customer service use was inferred. The prior payment/response/resolution smoke evidence is retained in complaints-smoke-2026-09-12.
- Last wallet repair verified a successful Rabby connection on production; Claim a name is now in the application header. Full reloads intentionally require reconnecting.
- Current run: 46 Node tests passed, two database tests skipped without DATABASE_URL; 30 Solidity tests and ten scanner tests passed. Both database tests subsequently passed against transaction-isolated fixtures: all 48 Node tests passed across the two runs. ESLint, TypeScript and subgraph codegen/build also passed. No exhaustive security audit is represented by these checks.
- Sepolia ENS claim evidence: reader.nomen-demo.eth, agent #10226, claim 0x29904930ef63e6c79cf99aa6b9da4fe007e0d2261d5f54a691cbcb8c65570139. Historical live verification is in ens-live-evidence.json.

## ETHOnline 2026

Official rules: https://ethglobal.com/events/ethonline2026/info/details and https://ethglobal.com/rules.

Deadline: Sunday September 13, 12:00 EDT, which is 19:00 Türkiye. Required demo: 2–4 minutes, at least 720p, human narration; the published instructions prohibit AI voiceover, speed-up and phone filming. The form allows up to three partner choices. AI-assisted implementation must be disclosed, along with meaningful owner contributions. Include specification/planning artifacts where applicable, after removing secrets and private conversations.

The ETHGlobal project page initially showed a Cloudflare check, then opened in the signed-in account. It displays **Create Project** with empty name/category/emoji fields: no project entry has been created in this account for the event. The authenticated dashboard says the participant is **fully confirmed**, **Building from Scratch is selected**, and **not currently in a team**. It repeats that no project has been created. Stake-return details were not separately inspected. The owner subsequently confirmed that NOMEN-specific code and design began after September 4, 2026; Building from Scratch remains selected. This is owner-provided provenance, not independently recovered pre-import Git history. No finished video was found in the repository; an external video may exist but was not verified. Continuity is available as a separate radio option but was not selected or changed in this review. The owner answered that no project-specific code or design existed before September 4. Older August references alone do not establish pre-event project work. Preserve genuine source/planning evidence; do not fabricate historical commits.

### Partner fit

| Partner | Working integration | Remaining qualification/demo issue |
| --- | --- | --- |
| The Graph | Live Sepolia/Arc owner and URI continuity gates before ranking; history passed to DeepSeek | Strongest current AI fit. Show actual ranked output and Graph-derived decision. The owner confirmed From Scratch. Show the AI use case in that pool; a raw history panel alone is insufficient. |
| ENS | Functional ENSv2 Sepolia subregistry, registrar, resolver and claimed test name | Show actual naming and resolving as useful agent identity, including eligibility and expiry/revocation behavior. The prize requires central use, not a cosmetic name. Correct pool affects available ENS prize. |
| Arc | Exact 5 test USDC publication payments on Arc with draft commitment and canonical verification | This is a human-operated publication flow, not an autonomous agent payment system. No Circle Agent Stack integration was found. Do not claim the Agent Stack/agentic criteria are met. Assess finance/payment-infrastructure fit honestly; it is weaker than Graph/ENS. |

Graph source: https://ethglobal.com/events/ethonline2026/prizes/the-graph. The AI tracks require live provider data, meaningful reasoning/decisions and public runnable source plus a short video. Do not claim the separate composable-products track merely because one custom subgraph schema is used on two chains.

ENS source: https://ethglobal.com/events/ethonline2026/prizes/ens. Best Use of ENSv2 has a $4,500 pool; the existing-project integration prize is $500 and explicitly Continuity-only. The owner’s confirmed From Scratch entry targets Best Use of ENSv2, not the Continuity-only integration prize.

Arc source: https://ethglobal.com/events/ethonline2026/prizes/arc. The current agentic description expects autonomous USDC flows and Agent Stack. Functional frontend/backend, architecture diagram, demonstration and repository are required. Of each $3,500 non-Continuity prize, $2,500 is conditional on deploying the same project to Arc mainnet by September 30; the $3,000 Continuity prize has a $2,000 mainnet condition. These are not entirely unconditional testnet payouts. No mainnet deployment is authorized or performed by this review.

### Work still needed before ETHGlobal submission

1. Preserve the owner’s confirmation that NOMEN began after September 4 and retain genuine dated planning/source evidence for the period before the September 11 initial repository import. Building from Scratch is the confirmed intended pool. Disclose reused libraries and AI assistance; never manufacture missing commit history.
2. Record/upload the final human-narrated demo using demo-script.md. Include Graph matching, the real ENS test name and the current Orders flow. Do not demonstrate the retired rating publication UI.
3. Verify the sole participant and stake, choose the eligible partner/pool options, link public code and live app, include AI/tool disclosure, and click final Submit. The code update is not a form submission.
4. Keep the submission description aligned with the current scope. No verified purchases, customer success rate, autonomous agent execution or Agent Stack is claimed.

## Arbitrum Open House Singapore

Official event and prize tabs: https://arbitrum-singapore.hackquest.io/buildathons/Arbitrum-Open-House-Singapore-Online-Buildathon.
Dashboard: https://arbitrum-singapore.hackquest.io/dashboard.

Authenticated dashboard observation: **Registered**, but **You don't have any projects yet** and **Create or Join a Project** remain. Registration is not a project submission.

Schedule tab displayed submission Sep 13, 2026 20:01 through Oct 4, 2026 18:59; registration closes Oct 2, 2026 20:01 and rewards are displayed Oct 12, 2026 09:00. The UI did not label the timezone. Preserve these as displayed values and confirm timezone/official build-start cutoff before attributing work to the event; do not assume a timezone from a secondary calendar.

Prize tab explicitly accepts deployment on **Arbitrum Sepolia**, Arbitrum One, Robinhood Chain or another Arbitrum chain. Mainnet is not required by that displayed criterion. It lists Overall $70,000, Promising Products $15,000 and discretionary Grants $30,000. Judging emphasizes contract quality, product-market fit, innovation and solving real problems. Overall awards are tied to development milestones. The linked terms PDF returned 403 through the web reader; detailed legal conditions, exact milestone release terms and media requirements remain unverified.

The event overview allows existing projects. Preserve the baseline tag arbitrum-open-house-baseline-2026-09-12 and disclose all additions through this review as pre-window work. Public trust history, historical receipt ranking and the latest Orders model already exist; they cannot be advertised as fresh buildathon work later.

### Current technical limitation for Arbitrum

The app reads Arbitrum ownership and historical trial receipts and uses that history in matching. The previous new-receipt UI was replaced by Orders. **Superseded by the September 13 payment update:** new v2 Arbitrum-agent complaints now settle in Circle test USDC on Arbitrum Sepolia. Older reserved drafts still settle on Arc. Actual Arbitrum payment-to-publication testing awaits funding. This addition predates the buildathon window and must remain part of the disclosed baseline. Complaint bodies and signed follow-up history remain in Neon.

### Recommended post-start scope (not yet implemented)

Build complaint commitment and resolution history on Arbitrum Sepolia: bind the author, agent and original statement hash, append signed owner replies/status transitions, expose transaction-backed history, and feed the bounded, honestly labeled history into agent comparison. Keep statement bodies offchain, separate paid publication from purchase proof, and preserve existing Arc records and payments. Demonstrate one complete new flow after the official build-start cutoff with normal commits and tests. Agree on fee/settlement semantics before adding another payment network; do not silently charge existing Arc publishers again.

### Arbitrum remaining steps

- Resolve the ETHGlobal final-form statement against submitting the same project to another hackathon before proceeding. A disclosed baseline or new feature does not itself establish permission under that statement. Do not make an inaccurate final attestation.
- Create the NOMEN project in the dashboard and connect it to the registered buildathon.
- Confirm terms/timezone and document pre-existing work.
- Implement and demonstrate a substantive post-start Arbitrum feature; do not count this readiness update as that feature.
- Supply event-required repository, deployment/contract/transaction links and media once the project form is accessible. Arbiscan source-code verification was not independently confirmed in this review; include verified source where possible and distinguish it from deployment/runtime verification.
- Establish real user evidence or structured user feedback for product-market fit. Synthetic test complaints are not traction.

## Publication update

Current docs deployed successfully as dpl_7xEBhrTmgnLV8P998rr4VWqpftr4 at https://nomen-beta.vercel.app. Production build passed; updated overview, names, contracts and Orders pages were checked. The public repository update includes the previously deployed code and the current docs; final event forms and videos remain outstanding.
