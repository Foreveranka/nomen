# NOMEN testnet contracts

Current deployment: Ethereum Sepolia (11155111), parent `nomen-demo.eth`.

- Registrar: `0x481d5fbd6f7B955D34Dbe3069B30dFFd3C15E81C`
- Resolver: `0x8443a2C263e770C5180E533B7B571BA6eED029f7`
- ENSv2 subregistry: `0x01F0e0F27F30C445C3F5e48Fc9873849e06B76c8`
- Deployment block: 11678998
- Demo name: `reader.nomen-demo.eth`, ERC-8004 agent #10226

Run `forge test` and `forge build`. The live verification script is `../site/scripts/test-claims.mjs`; it compares deployed runtime bytecode, checks immutable configuration and permissions, publishes the reviewed Merkle root, and claims the demo name. It also checks rejected owner/admin/resolver writes and name transfer. Evidence and transaction hashes are in `../inceleme/ens-live-evidence.json`.

`script/Dagit.s.sol` is Sepolia-only. It rejects the old compromised deployer. It reads `DEPLOYER_PRIVATE_KEY`, `COMMIT_SECRET`, `PARENT_LABEL` and `ADIM` from the process environment. Keep credentials outside the repository. Never put keys in command arguments.

1. ADIM=1: check the selected parent is available, approve test MockUSDC and commit.
2. Wait until the chain timestamp satisfies MIN_COMMITMENT_AGE (60 seconds; wall-clock time alone is insufficient).
3. ADIM=2: register the parent, deploy the registry/registrar/resolver and grant permissions.
4. Verify bytecode, immutable configuration, registry attachment and roles before publishing a reviewed root. ADIM=3 reads REGISTRAR, KOK and KAYNAK.
5. Prove an actual claim and ENS text read before enabling the app's claim environment variables.

The old `nomen.eth` namespace and old registrar are retired from this app. They are not migrated or controlled by the new wallet. Testnet deployment checks are not an independent audit or a guarantee of service quality.
