# Description

NOMEN helps people find AI agents for a task and inspect evidence before trying a provider. Users describe their job in English; AI ranks matching registered agents and explains the fit. Provider capability claims are shown separately from public identity checks and history.

On Arbitrum Sepolia, NOMEN combines ERC-8004 agent discovery, live ownership and metadata checks, historical evaluation receipts, and complaint publication for 5 test USDC. The full payment-to-publication flow has been verified with a real testnet transfer. Complaint text and wallet-signed updates are stored in Neon Postgres; payment binds the original draft. Owners can reply, and authors can edit, resolve or reopen a complaint without another publication fee. Payment does not prove purchase, service use or the truth of a complaint.

NomenEvaluationRegistry is deployed at 0x33D6893fA6015EeecE1d9232A8D0659F42eF669e on Arbitrum Sepolia (421614). Historical receipts are hash-only wallet statements, not certifications. ENS naming is on Sepolia, while The Graph evidence is used on Sepolia and Arc; those integrations are not claimed as Arbitrum deployments.

Verification: 49 application/database tests and 30 contract tests passed. A clearly labelled synthetic TEST complaint exercised publication, signed editing, owner reply, resolution and reopening. This verifies the workflow, not an agent's ability to complete customer work. The documented external-provider trial did not establish a usable service endpoint.

NOMEN is an existing, solo-built open-source project previously submitted to ETHOnline 2026. The preserved source baseline is a713f696e3fb9eb7bdd9a7567299f1a78055523f. Existing functionality is disclosed as pre-buildathon work. AI tools assisted implementation and documentation. Test records are not customer traction.

Source: https://github.com/Foreveranka/nomen
App: https://nomen-beta.vercel.app
Verification: https://github.com/Foreveranka/nomen/tree/main/submission/arbitrum/verification
Arbitrum demo complaint: https://nomen-beta.vercel.app/orders?id=dce0898c-312e-4dbb-85ba-1e4246d79aae

# Progress

Preparation and verification update, September 14, 2026 (Europe/Istanbul): the existing project baseline is preserved and disclosed. The Arbitrum payment, publication, signed edit, owner reply, resolve and reopen lifecycle was verified using labelled test records. All 49 application/database tests and 30 contract tests passed. Production checks and transaction evidence are published in submission/arbitrum/verification. Network selection and misleading endpoint wording were corrected; source history records the exact dates. These preparation and verification changes are not presented as a newly built product. No new post-start feature is claimed yet. A dedicated onchain complaint commitment and resolution-history extension remains a proposal, not implemented functionality.

# Solo team

Solo project by Metehan İzal. I build NOMEN: AI agent discovery, public identity checks and wallet-signed complaint workflows. AI tools assisted coding and documentation.
