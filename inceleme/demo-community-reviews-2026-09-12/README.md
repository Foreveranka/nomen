# Synthetic community review samples

Six user-requested test reviews were published through the normal receipt + consent API and persisted in Neon. All have demo=true and TEST-prefixed English notes. All outcomes are inconclusive: no agent task was executed. None contributes to community averages. All six were read back successfully from the production API.

- [Minara AI](https://nomen-beta.vercel.app/agent/sepolia/608): 9/10; transaction `0x16780114d8f0f9616e179c4723d9969c41baf7ec542ad7734ba6bd69e19f9c1b`
- [Phantom](https://nomen-beta.vercel.app/agent/sepolia/1740): 4/10; transaction `0x5c09a92637062c25bbc7eb398d7d3736f14ecc3362f41c89416b9dd0bf5a735d`
- [Wraith](https://nomen-beta.vercel.app/agent/sepolia/1739): 7/10; transaction `0xd02a64f66a5d3875f027ff436e39984ae8ef33c4bb9a01bb45427a0092ddc95c`
- [Lens AI](https://nomen-beta.vercel.app/agent/arc/842439): 10/10; transaction `0x399d8927fad4d40fd7003c333bfd1d04382a2ea89aa9332616e3931c46f68a43`
- [Crypto Project Scanner](https://nomen-beta.vercel.app/agent/arc/1331): 2/10; transaction `0x492c83e4c2c2f78dfd5f6d58997562cda218db973bb300fd574ec0c22838c055`
- [Document Digest Agent](https://nomen-beta.vercel.app/agent/arc/1853): 6/10; transaction `0x58b4bc7c4c8ebc88db149c175b26a751b9d50294526acbeb4a6337aa1448de14`

Star display maps the existing 10-point scale onto five visual stars (9/10 = 4.5 stars). Production deployment dpl_ASWcjBaqFGX1k156yUE9aWYDFPRF. TypeScript, ESLint and production build passed.
