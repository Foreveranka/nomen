import { Resolver } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { request } from "node:https";

const excluded = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  excluded.addSubnet(network, prefix, "ipv4");
export function publicIPv4(address: string) {
  return isIP(address) === 4 && !excluded.check(address, "ipv4");
}
export function checkedURL(value: string) {
  if (value.length > 4096) throw new Error("URL too long");
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    (url.port && url.port !== "443") ||
    url.username ||
    url.password ||
    url.hash ||
    url.hostname.startsWith("[")
  )
    throw new Error("Only public HTTPS on port 443 is supported");
  if (isIP(url.hostname) && !publicIPv4(url.hostname))
    throw new Error("Non-public destination");
  return url;
}
/** Read-only GET. Pin DNS to a vetted IPv4 address, preserve TLS hostname, never follow redirects. */
export async function publicGet(
  value: string,
  timeout = 6000,
): Promise<{ status: number; body: Buffer; latencyMs: number }> {
  const start = Date.now();
  const url = checkedURL(value);
  const resolver = new Resolver({ timeout: Math.min(timeout, 2000), tries: 1 });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelRequest: (() => void) | undefined;
  try {
    return await Promise.race([
      (async () => {
        const addresses = isIP(url.hostname)
          ? [url.hostname]
          : await resolver.resolve4(url.hostname);
        if (!addresses.length || addresses.some((a) => !publicIPv4(a)))
          throw new Error("Non-public destination");
        if (Date.now() - start >= timeout) throw new Error("Deadline exceeded");
        return new Promise<{ status: number; body: Buffer; latencyMs: number }>(
          (resolve, reject) => {
            const req = request(
              url,
              {
                agent: false,
                family: 4,
                lookup: (_host, _options, cb) => cb(null, addresses[0], 4),
                headers: {
                  Accept: "application/json, text/plain;q=0.5",
                  "Accept-Encoding": "identity",
                  "User-Agent": "NOMEN-read-only-check/1.0",
                },
              },
              (res) => {
                const chunks: Buffer[] = [];
                let size = 0;
                res.on("error", reject);
                res.on("data", (chunk: Buffer) => {
                  size += chunk.length;
                  if (size > 200_000)
                    req.destroy(new Error("Body limit exceeded"));
                  else chunks.push(chunk);
                });
                res.on("end", () =>
                  resolve({
                    status: res.statusCode ?? 0,
                    body: Buffer.concat(chunks),
                    latencyMs: Date.now() - start,
                  }),
                );
              },
            );
            cancelRequest = () => req.destroy(new Error("Deadline exceeded"));
            req.on("error", reject);
            req.end();
          },
        );
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          resolver.cancel();
          cancelRequest?.();
          reject(new Error("Deadline exceeded"));
        }, timeout);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
