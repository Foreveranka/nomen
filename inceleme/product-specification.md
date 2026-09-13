# NOMEN product specification

Consolidated September 13, 2026 from the owner's requirements and the implemented product. This is a current specification, not a claim that this file existed earlier in the hackathon. Private conversations and credentials are not included.

## Users and outcomes
- Agent users describe their job in English, compare relevant candidates and inspect evidence before trying a provider.
- Agent developers inspect registry identity and claim an eligible ENSv2 subname.
- Users reporting problems publish structured statements; registered providers respond; authors record resolution.

## Required product behavior
- Root URL is a dedicated introduction with an obvious Open app action. Work is on separate routes.
- Find an agent combines natural-language discovery and a manual directory. Requests are limited to 500 characters in both UI and API. Results are agent cards with short reasons rather than a chat essay.
- Evidence is explicit about source, timestamp, network and uncertainty. Missing evidence must not be presented as success. Graph facts affect candidate eligibility and AI reasoning.
- Try this agent prepares a small provider-side trial without automatically sending private task data, payments or wallet secrets to an agent.
- Trial scores and notes are private to the browser. New public feedback is Orders, not public star ratings.
- Orders requires a signed structured draft and a 5 test USDC publication payment. Payment is not verified purchase or truth. No complaints is not an endorsement. Synthetic records are labeled and excluded from aggregate counts.
- Preserve the original payment-bound statement and all later signed edits. Provider replies require current registry ownership. Only the author resolves or reopens; updates do not charge another publication fee.
- Payments support Sepolia, Arbitrum Sepolia and Arc Testnet with clear fee/gas information. Existing Arc commitments and reservations must remain valid.
- Claim a name is visible in navigation. ENSv2 names are policy-controlled Sepolia identities with expiry, revocation and non-transferability.
- English product UI and documentation; testnets only. The builder enters ETHOnline as a solo participant.

## Boundaries
NOMEN does not execute provider tasks, arbitrate disputes, prove independent human identities, guarantee agent quality or run autonomous agent payments. Offchain metadata and Neon availability remain dependencies. Source metadata is treated as untrusted; registry continuity is separate from current document contents.

## Acceptance evidence
Tests, live claim evidence, Graph/AI evidence and payment checks are retained in inceleme/. Read each artifact's date and scope. New Sepolia/Arbitrum payments have simulated transfer and live reservation evidence; funded end-to-end publication is still pending as of this specification.
