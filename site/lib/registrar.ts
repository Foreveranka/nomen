/** NomenRegistrar'ın arayüzün kullandığı kısmı. Tam ABI kontratlar/out altında. */
export const REGISTRAR_ABI = [
  { type: "function", name: "claim", stateMutability: "nonpayable",
    inputs: [{ name: "label", type: "string" }, { name: "agentId", type: "uint256" }, { name: "proof", type: "bytes32[]" }],
    outputs: [{ name: "tokenId", type: "uint256" }] },
  { type: "function", name: "isNamed", stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "live", type: "bool" }, { name: "label", type: "string" }, { name: "expiry", type: "uint64" }] },
  { type: "function", name: "isEligible", stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }, { name: "proof", type: "bytes32[]" }],
    outputs: [{ name: "", type: "bool" }] },
  { type: "function", name: "eligibilityRoot", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "bytes32" }] },
  { type: "function", name: "agentOfTokenId", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "labelOfAgent", stateMutability: "view", inputs: [{ name: "agentId", type: "uint256" }], outputs: [{ name: "", type: "string" }] },
  { type: "function", name: "eligibilitySource", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
  { type: "event", name: "NameRevoked", inputs: [
    { name: "agentId", type: "uint256", indexed: true }, { name: "label", type: "string", indexed: false }, { name: "reason", type: "string", indexed: false }] },
  { type: "event", name: "NameClaimed", inputs: [
    { name: "agentId", type: "uint256", indexed: true }, { name: "owner", type: "address", indexed: true },
    { name: "label", type: "string", indexed: false }, { name: "tokenId", type: "uint256", indexed: false }] },
] as const;

export const IDENTITY_ABI = [
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "tokenURI", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "string" }] },
] as const;

/** ENSv2 PermissionedRegistry: bir etiketin durumu. anyId = uint256(keccak256(label)). */
export const REGISTRY_ABI = [
  { type: "function", name: "getResolver", stateMutability: "view", inputs: [{ name: "label", type: "string" }], outputs: [{ name: "", type: "address" }] },
  { type: "function", name: "getState", stateMutability: "view", inputs: [{ name: "anyId", type: "uint256" }],
    outputs: [{ name: "state", type: "tuple", components: [
      { name: "status", type: "uint8" }, { name: "expiry", type: "uint64" }, { name: "latestOwner", type: "address" },
      { name: "tokenId", type: "uint256" }, { name: "resource", type: "uint256" }] }] },
] as const;

export const RESOLVER_ABI = [
  { type: "function", name: "text", stateMutability: "view", inputs: [{ name: "node", type: "bytes32" }, { name: "key", type: "string" }], outputs: [{ name: "", type: "string" }] },
] as const;
