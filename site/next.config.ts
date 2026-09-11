import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Live evaluation compares current evidence with the published tables.
  /* /api/dogrula veri/ altındaki durum tablolarını dosya sisteminden okur; Vercel'in
     sunucusuz paketine girmeleri için izlemeye açıkça eklenir. */
  outputFileTracingIncludes: {
    "/api/discover": ["./veri/**"],
    "/api/evaluate": ["./veri/**"],
    "/api/snapshot": ["./veri/**"],
    "/api/dogrula": ["./veri/**"],
    "/api/toplu": ["./veri/**"],
    "/api/sahip": ["./veri/**"],
    "/api/elenen": ["./veri/**"],
  },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
