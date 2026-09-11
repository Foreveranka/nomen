import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

/** Testnet facilitator; x402 v2 destekliyor ve kurulum istemiyor. */
const facilitator = new HTTPFacilitatorClient({
  url: process.env.FACILITATOR_URL ?? "https://x402.org/facilitator",
});

export const server = new x402ResourceServer(facilitator);
server.register("eip155:84532", new ExactEvmScheme());

/** Ödemenin gideceği adres. Kurulmamışsa API ücretsiz çalışır (yerel geliştirme). */
const recipient = process.env.NOMEN_PAY_TO;
if (recipient && !/^0x[0-9a-fA-F]{40}$/.test(recipient)) throw new Error("Invalid NOMEN_PAY_TO");
export const payTo = recipient as `0x${string}` | undefined;

/** Base Sepolia; x402.org facilitator'ın v2'de desteklediği ağ. */
export const AG = "eip155:84532";
export const FIYAT = "$0.001";
