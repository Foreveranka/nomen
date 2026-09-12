# ETHOnline 2026 — current submission copy

Updated September 13, 2026 (Türkiye). This file is a draft, not a submitted entry. See 2026-09-13-submission-readiness.md for outstanding eligibility and delivery checks.

## Project

**NOMEN — Find an agent. Inspect the evidence.**

NOMEN helps people find AI agents for an English task, inspect current registry evidence and prepare a small provider-side trial. Agent owners can claim policy-controlled ENSv2 names. Users can publish structured complaints and follow provider responses without treating anonymous ratings as proof of service quality.

## Problem and solution

An onchain agent registration does not establish task suitability or successful service delivery. NOMEN keeps these questions separate: published capabilities suggest a match; live registry evidence checks owner/URI continuity; a user runs the actual trial with the provider. Public complaint records make reported problems and resolution visible without pretending that a publication payment proves a purchase.

## How it is built

A Python scanner produces bounded, reproducible ERC-8004 snapshots and Merkle proofs. Next.js serves the introduction, workbench, agent records, Orders, ENS naming and APIs. DeepSeek extracts requirements and ranks published candidates using grounded description quotes. Live The Graph data gates Sepolia and Arc candidates before ranking and supplies feedback/change facts to the model. Arbitrum candidates use snapshot capabilities and live historical trial receipts.

The Sepolia ENSv2 registrar checks current agent ownership and Merkle eligibility to issue expiring, non-transferable names under nomen-demo.eth. The resolver exposes current endorsement records; administrator revocation and renewal are explicit trust assumptions. The real reader.nomen-demo.eth claim demonstrates the deployed system.

Orders accepts signed structured drafts. A 5 native test USDC payment on Arc commits the original draft; the server checks sender, destination, exact amount, commitment and canonical receipt before publication in Neon. Signed edits and provider replies are versioned. Only the complaint author resolves/reopens. Payment is not purchase verification. Demo records are labeled and excluded from counts. Private 1–10 trial notes remain browser-local; older public ratings and onchain receipts are historical archives.

## Partner explanations

**The Graph:** Live owner/URI continuity is a prerequisite for Sepolia/Arc recommendations, and indexed facts inform AI ranking. Show the current indexed block and cited signals in a real search. Apply to Best AI Tooling or AI Use Case with The Graph (From Scratch), consistent with the owner’s confirmed start after September 4.

**ENS:** ENSv2 on Sepolia provides an owner-bound, policy-controlled agent identity rather than a UI-only badge. Demonstrate the claimed subname, resolver records, current ownership and expiry/revocation semantics. Apply to Best Use of ENSv2 for the confirmed From Scratch entry.

**Arc:** Arc provides native test USDC publication settlement with verifiable original-draft commitments. This is a user-initiated payment flow. NOMEN does not currently use Circle Agent Stack or autonomous spending; do not claim otherwise or claim guaranteed Arc prize qualification.

## Limitations

NOMEN does not run agent tasks, prove purchase, verify complaint truth, establish one wallet per person or guarantee agent performance. It has no production mainnet service, automated dispute adjudication or autonomous monitoring. An unchanged URI can serve changed contents. Metadata snapshots are scoped and timestamped, not the entire live registry. Complaint bodies and later signed updates rely on database availability; the original payment commits only the initial draft.

## AI disclosure

AI tools assisted implementation, tests, debugging, UI iteration, documentation and review across scanner, contracts, frontend and Graph mappings. The owner directed product decisions, including task-first discovery, a separate landing page, testnet-only operation and the complaint model. The owner must verify and describe their actual contribution accurately. This disclosure does not assert eligibility by itself. Publish relevant sanitized specs and planning artifacts; do not publish private chats, keys or credentials.

## Links and evidence

- App: https://nomen-beta.vercel.app
- Code: https://github.com/Foreveranka/nomen
- Naming: https://nomen-beta.vercel.app/name/reader
- Graph: /workbench on Sepolia; production evidence in graph-ai-evidence.json and current readiness report.
- Resolved synthetic complaint: https://nomen-beta.vercel.app/orders?id=2e55e112-65a8-4d59-abbe-5b268c5a7fd0
- Open synthetic complaint: https://nomen-beta.vercel.app/orders?id=21d6caeb-fe97-4952-ab2c-a163c21c7643
- Architecture diagram: repository README.
- Video: not verified/uploaded by this update; use demo-script.md.

## Owner checks before submitting

The dashboard shows the participant fully confirmed, no team, no project, and Building from Scratch selected. The owner confirmed on September 13 that NOMEN code/design began after September 4, so keep Building from Scratch. Preserve authentic planning/source evidence and disclose libraries and AI assistance; create/join a team if needed for the entry. Older August references do not establish pre-event project code. The owner’s start-date statement should be supported by genuine available work artifacts; do not fabricate missing pre-import commits. Record the required 2–4 minute human-narrated video at 720p or above. Submit by September 13 at 19:00 Türkiye. No final form submission is performed by updating this file.
