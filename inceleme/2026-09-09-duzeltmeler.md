# NOMEN — düzeltmeler ve kalan teslim koşulları

9 Eylül 2026. Önceki hazırlık raporunun ardından kod düzeltmeleri, yerel testler ve Vercel üretim yayını yapıldı. Ürün henüz tam hackathon teslimine hazır değil.

Canlı dizin: https://nomen-beta.vercel.app

## Tamamlananlar

- Next.js üretim derlemesi düzeltildi. Wagmi 3.7.7 geçişiyle site üretim bağımlılık denetimi 0 bilinen zafiyete indi. ESLint ve TypeScript/production build geçti.
- Bilinmeyen id, RPC hatası ve filtre sonucu ayrıldı. Bilinmeyenler yeşil kontrol veya kesin kayıt yokluğu göstermiyor.
- Toplu API null, boolean, kesirli ve taşan id değerlerini reddediyor; 64 KiB ve 2.000 id sınırı var. CSV formül enjeksiyonuna karşı kaçırılıyor. Ağ değişiminde eski yanıt yeni ağa aitmiş gibi gösterilmiyor.
- Sahip sorgusu sayfalandırıldı. Filtre parametreleri prototip alanlarını kabul etmiyor. İsim profili güncel isNamed sonucunu kontrol ediyor.
- Tarama ayrı snapshot oluşturuyor; ownership/URI okumaları sabit blokta. Başarısız RPC verisi boş metadata veya bozuk adrese dönüşmüyor. HTTP fetch özel ağları engelliyor; boyut, redirect, socket ve toplam süreç süresi sınırlı.
- Sepolia 1–10.105 aralığı yeniden tarandı: blok 0xb1ffdd, 1.420 geçen kayıt, çözülemeyen RPC id sayısı 0. Boş URI görülen 367 kayıt sıkı ABI çözümleyicisiyle aynı bloktan ayrıca doğrulandı.
- Ethereum ve Arc eski tarama tarihleri doğrulanmamış olarak işaretli. Arc'taki 10 hatalı sahiplik kaydı uygun listelerden çıkarıldı. Ethereum 3.709 + Sepolia 1.420 + Arc 249 = 5.378 uygun id için dizin/API/Merkle setleri eşleşiyor; her kanıt bağımsız viem hash uygulamasıyla doğrulandı.
- Kontrat: güncel root/owner/registration kontrolleri, proof gerektiren renewal, süre ve etiket sınırları, resolver yazma hatasında rollback. Geri alma sonrası explicit reinstatement olmadan aynı proof tekrar kullanılamıyor.
- Yeni NomenResolver kayıtları registration tokenına göre ayırıyor; expiry/revoke/root veya owner değişiminde text döndürmüyor. Eski tokenla geri alma yeni label sahibinin kaydını iptal etmiyor.
- Graph sayaç/idempotency ve isim ilişkilendirme hataları düzeltildi. Canlı sorgu adaptörü var; yapılandırma yoksa 503/unavailable döndürüyor.
- Docs, README, demo akışı, başvuru taslağı ve gizli ortam dosyalarını içermeyen kaynak ZIP'i hazırlandı. Public GitHub deposu olduğu iddia edilmiyor.

## Güvenlik bulgularının kapanış kontrolü

Standart güvenlik taraması 6 bulgu üretti: 3 orta, 3 düşük. Bu sayı tüm olası açıkların tüketildiği anlamına gelmez. Generated/vendor kodu ve gerçek ENS altyapısı tam incelenmediği için kapsam kısmi olarak kaydedildi. Tarama raporu düzeltme öncesi değişmez kayıttır; bu belge düzeltme sonrasını açıklar.

| Bulgu | Düzeltme | Doğrulama / sınır |
|---|---|---|
| revoke sonrası aynı proof ile reclaim | suspended + yönetici reinstate | Foundry replay reddi, reinstatement sonrası claim |
| Açıklamada regex DoS | sınırlı deterministik tam metin tekrar kontrolü | adversarial punctuation regression testi |
| Yavaş HTTP yanıtıyla worker tutma | 20 saniyede sonlandırılan child process | TimeoutExpired yolu ve deadline ayarı; gerçek saldırı trafiği üretilmedi |
| İsim profilinde eski endorsement yeşil | isNamed ile güncel root/owner kontrolü | site typecheck/build; canlı replacement claim henüz yok |
| Eski revoke olayı yeni label sahibini bozuyor | subgraph agent eşleşmesi; kontratta generation guard | Graph derlemesi + token alias davranışlı registry mock testi; canlı indexer testi yok |
| Eski resolver attestation kalıyor | generation-scoped NomenResolver ve canlı endorsement read gate | expiry, label reuse, eski/yeni revoke testleri; resolver henüz zincire dağıtılmadı |

25 Foundry testi (fuzz 256 örnek), 10 Python testi, ESLint, Next production build, Graph codegen/build ve 5.378 bağımsız Merkle doğrulaması geçti. Bunlar gerçek ENS uçtan uca testinin yerini tutmaz.

## Kalan dış koşullar

1. Yeni güvenli yönetici cüzdanı ve replacement ENS dağıtımı. Önceki deployer kullanılmıyor. Parent/subregistry yetkileri, yeni resolver, root ve gerçek claim/receipt/text/isNamed akışı doğrulanmalı. Claims bu nedenle kapalı.
2. The Graph: deploy hesabı ve senkronize endpoint gerekli. Graph ödül uygunluğu henüz kanıtlanmadı.
3. Arc: Circle Agent Stack kullanan gerçek karar/USDC harcama akışı yok. Arc verisi veya Base Sepolia x402 bu track'i tamamlamıyor. Bu yeni entegrasyon olmadan Arc agentic ödülü için hazır denemez.
4. Public GitHub yayını için kullanıcı yanıtı bekleniyor. From Scratch/Continuity ve önceden yapılan çalışma sınırı kullanıcıca doğrulanmalı. İnsan sesli demo videosu ve gerçek başvuru formu tamamlanmalı.

ENS en güçlü eşleşme. Ödül garantisi veya dayanaksız kazanma yüzdesi verilmiyor. Resmi kaynaklar submission-draft.md ve ilk hazırlık raporunda.

Canlı doğrulama: Üretim deployment dpl_ELCdMy7n4QZAhNNWB6vLUSP3Q4ac READY. Altı API negatif/pozitif kontrol geçti; Graph eksik yapılandırması 503, prototip filtre girişi 400. Tarayıcıda toplu sonuçların 1 pass / 0 filtered / 1 unknown ayrımı, Sepolia claim kapısı ve 9 Eylül tarihli 1.420 kayıt sayacı doğrulandı.
