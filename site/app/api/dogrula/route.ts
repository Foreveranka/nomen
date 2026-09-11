import { handler } from "@/lib/snapshot";
import { withX402 } from "@x402/next";
import { server, payTo, AG, FIYAT } from "@/lib/x402";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bir ajanın son taramada ne durumda olduğunu söyler.
 * Çağıran taraf çoğunlukla başka bir ajan olduğu için cevap kısa, makine okunur
 * ve her alanı gerekçeli. "Güvenilir mi" demiyoruz; kaydın hangi olgusal kontrolü
 * geçip geçmediğini söylüyoruz, kararı çağıran verir.
 */

/**
 * Ödeme kapısı. NOMEN_PAY_TO tanımlı değilse (yerel geliştirme, ilk kurulum)
 * uç ücretsiz cevap verir; tanımlıysa x402 v2 ile 0,001 USDC ister.
 */
export const GET = payTo
  ? withX402(
      handler,
      {
        "/api/dogrula": {
          accepts: [{ scheme: "exact", price: FIYAT, network: AG, payTo }],
          description: "One ERC-8004 agent, checked against NOMEN's published rules.",
          mimeType: "application/json",
        },
      },
      server
    )
  : handler;
