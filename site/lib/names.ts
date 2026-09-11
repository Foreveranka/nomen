import { parseAbiItem, type PublicClient } from "viem";
import { AGLAR } from "./aglar";
import { REGISTRAR_ABI } from "./registrar";

export type IssuedName = { label: string; agentId: number; owner: string; blok: bigint; canli: boolean; sebep?: string };
export async function readNames(client: PublicClient): Promise<IssuedName[]> {
  const z = AGLAR.sepolia;
  if (!z.registrar) throw new Error("Registrar is not configured");
  const latest = await client.getBlockNumber();
  const names = new Map<string, IssuedName>();
  for (let from = z.registrarBlok; from <= latest; from += BigInt(5000)) {
    const to = from + BigInt(4999) < latest ? from + BigInt(4999) : latest;
    const [claims, revokes] = await Promise.all([
      client.getLogs({ address: z.registrar, event: parseAbiItem("event NameClaimed(uint256 indexed agentId, address indexed owner, string label, uint256 tokenId)"), fromBlock: from, toBlock: to, strict: true }),
      client.getLogs({ address: z.registrar, event: parseAbiItem("event NameRevoked(uint256 indexed agentId, string label, string reason)"), fromBlock: from, toBlock: to, strict: true }),
    ]);
    const events = [...claims.map((l) => ({ ...l, kind: "claim" as const })), ...revokes.map((l) => ({ ...l, kind: "revoke" as const }))].sort((a, b) => a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : a.blockNumber < b.blockNumber ? -1 : 1);
    for (const event of events) {
      if (event.kind === "claim") names.set(event.args.label, { label: event.args.label, agentId: Number(event.args.agentId), owner: event.args.owner, blok: event.blockNumber, canli: false });
      else { const name = names.get(event.args.label); if (name) { name.canli = false; name.sebep = event.args.reason; } }
    }
  }
  const result = [...names.values()];
  for (let i = 0; i < result.length; i += 10) {
    await Promise.all(result.slice(i, i + 10).map(async (name) => {
      const state = await client.readContract({ address: z.registrar!, abi: REGISTRAR_ABI, functionName: "isNamed", args: [BigInt(name.agentId)], blockNumber: latest });
      name.canli = state[0] && state[1] === name.label;
      if (!name.canli && !name.sebep) name.sebep = "expired or no longer endorsed";
    }));
  }
  return result.sort((a, b) => a.blok > b.blok ? -1 : a.blok < b.blok ? 1 : 0);
}
