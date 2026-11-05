# RetroTV — Proje Rote ve Analiz

> Durum: Geliştirme devam ediyor | Dil: Türkçe | Stack: Astro 5 + Svelte 5 + Tailwind 4 + TMDB API

---

## 1. Mevcut Durum (Tamamlanan)

### ✅ İnfra ve Kurulum
- Astro 5 + Svelte 5 + Tailwind 4 kurulumu tamamlandı
- `npm run build` başarıyla geçiyor (1 sayfa, 137 modül)
- `.env` yok; TMDB API anahtarı ortam değişkeni veya localStorage üzerinden yönetiliyor

### ✅ Tasarım Sistemi (Broadcast Standard)
- `src/styles/tokens.css` — tek akçam renk: `#00ff33` (fosforlu yeşil); `--c-bg`, `--c-surface`, `--c-border`, `--c-text`, `--c-green`, `--c-gold`, `--c-error` vb. tokenlar
- `src/styles/global.css` — tokenları içe aktarıyor
- Yazı tipleri: Space Grotesk (başlıklar), IBM Plex Mono (meta/veri), Inter/System UI (gövde), VT323 (CRT estetiği)
- 4px boşluk grid, düz katmanlı derinlik, glass morphism yok

### ✅ Bileşenler
- `src/components/ui/Button.svelte` — primary/ghost/danger varyantları, sm/md/lg boyutları, loading durumu
- `src/components/ui/Card.svelte` — üst-örnek / özellik kartı
- `src/components/ui/Input.svelte` — hata durumu, odaklanma stilleri, şifre görünürlüğü uygun
- `src/components/ui/Pill.svelte` — etiket / rozet bileşeni
- `src/components/TV/KeyGate.svelte` — API anahtarı kontrolü: yoksa `ApiKeyPrompt`, varsa uygulama içeriği
- `src/components/TV/Screen.svelte` — refactor edildi: `btn-primary` / `btn-ghost` hardcoded stilleri `Button` bileşenine geçti
- `src/components/TV/ApiKeyPrompt.svelte` — `Button` ve CSS tokenları kullanacak şekilde refactor edildi
- `src/components/TV/MediaDetail.svelte` — hata durumu, type guard, `as` cast temizliği
- `src/components/TV/ContentBrowser.svelte` — gereksiz `as` cast'ler kaldırıldı
- `src/components/TV/StaticNoise.svelte` — canvas gürültü, değişmeden kalabilir
- `src/components/Remote/RemoteControl.svelte` — kısmen hardcoded, refactor adayı
- `src/components/TV/TVFrame.astro` — tüm renkler hardcoded, refactor adayı

### ✅ API Entegrasyonu
- `src/lib/tmdbApi.ts` — TMDB trending endpoint'i
- `src/lib/types.ts` — `TMDBMediaItem`, `backdropUrl`, `getMediaTitle`, `getMediaYear`
- `src/stores/appStore.ts` — `loadApiKey()` tanımlı, `KeyGate` üzerinden mount sırasında çağrılıyor
- `src/stores/tvStore.ts` — TV güç durumu, kanal yönetimi

---

## 2. Rota Netleştirmesi

### Seçim: Seçenek A — Retro TV Akış Platformu

**Ana hedef:** TMDB keşfi + oynatma + CRT arayüz + uzaktan kumanda deneyimi.

**IPTV/M3U (Seçenek B):** İsteğe bağlı, sonradan eklenecek hibrit katman. Şu anki öncelik **değildir**. M3U dosyaları zaten `docs/` altında mevcut (`beinsport.m3u`, `efti.m3u`) ama bu, gelecek bir phase için not olarak tutuluyor.

**API Anahtarı Durumu:** Kullanıcı onayıyla engel sayılmıyor. TMDB'de sınır yok, `loadApiKey()` ortam değişkeni/localStorage üzerinden esnek şekilde yönetiliyor. Kullanıcıya gösterilen `ApiKeyPrompt` sadece tercih bağlamında görünür.

---

## 3. Roadmap

### Phase 1 — Temel Akış (Şu an)
| Adım | Açıklama | Durum |
|------|----------|-------|
| API anahtarı akışı | `loadApiKey()` mount時に çağrılmakta, `KeyGate` ile geçiş | ✅ Tamamlandı
| Shared UI bileşenleri | Button, Card, Input, Pill oluşturuldu | ✅ Tamamlandı
| Screen refactor | `Button` entegrasyonu, hardcoded renklerin tokenlara dönüşümü | 🔄 Devam ediyor
| RemoteControl refactor | Hardcoded renklerin CSS tokenlarına geçiş | ⏳ Planlandı
| TVFrame refactor | Hardcoded `#b8b8b8`, `#666`, `#999` renklerinin tokenlara geçiş | ⏳ Planlandı

### Phase 2 — İçerik Deneyimi
| Adım | Açıklama | Durum |
|------|----------|-------|
| MediaDetail iyileştirmeler | Oyuncu arayüzü, sezon/bölüm listesi, benzer içerikler | ⏳ Planlandı
| ContentBrowser filtreleme | Tür, yıl, puan filtreleri | ⏳ Planlandı
| Arama | TMDB arama entegrasyonu | ⏳ Planlandı
| Detay sayfası navigate | Screen → MediaDetail akışı mevcut | ✅ Var

### Phase 3 — CRT ve Arayüz Özelleştirmeleri
| Adım | Açıklama | Durum |
|------|----------|-------|
| CRT ekran katmanı | Tarama çizgileri, vignette, parlaklık efektleri mevcut | ✅ Var
| Uzaktan kumanda animasyonları | `RemoteControl` flash efektleri mevcut | ✅ Var
| Ses efekleri (isteğe bağlı) | Tuş basımı, güç açma/kapama sesleri | ⏳ Planlandı
| Karanlık tema varyantları | Tek renk akçamı üzerinden alternate paletler | ⏳ Planlandı

### Phase 4 — IPTV/M3U Hibrit (İsteğe Bağlı, Sonradan)
| Adım | Açıklama | Durum |
|------|----------|-------|
| M3U oynatma | `docs/beinsport.m3u`, `docs/efti.m3u` desteği | ⏳ İsteğe bağlı
| Kanal listesi | M3U'den kanal çekimi, gruplama | ⏳ İsteğe bağlı
| TV + IPTV geçişi | TMDB akışı ile M3U kanalları arasında geçiş | ⏳ İsteğe bağlı

---

## 4. Teknik Kararlar ve Nedenleri

| Karar | Neden |
|-------|-------|
| Tek akçam renk (`#00ff33`) | Retro CRT estetiği, net görsel kimlik, SLOP yok |
| Düz katmanlı derinlik | Glass morphism yok, performans ve okunabilirlik için |
| 4px spacing grid | Tutarlı boşluklar, hızlı geliştirme |
| Space Grotesk başlıklar | Retro ama modern okunabilirlik |
| IBM Plex Mono meta | Teknolojik, veri odaklı his |
| API anahtarı localStorage/env | Kullanıcıya esneklik, hardcoded yok |
| KeyGate komponenti | API anahtarı yoksa uygulama içeriğini engellemez, sadece uyarır |

---

## 5. Sonraki Adımlar (Öncelikli)

1. `RemoteControl.svelte` hardcoded renklerini CSS tokenlarına dönüştür
2. `TVFrame.astro` hardcoded renkleri (`#b8b8b8`, `#666`, `#999`) CSS tokenlarına dönüştür
3. `MediaDetail` oyuncu arayüzünü tamamla (video oynatıcı, progres bar)
4. `ContentBrowser` filtreleme ve arama ekle
5. Build ve test doğrulamasını tekrarlayın

---

## 6. Portföy Değerlendirmesi

Bu proje, açık kaynak ve profesyonel tasarım standartlarına uygun bir CRT TV akış platformu örneği olarak portföyde güçlü bir örnek teşkil edecek. Tasarım felsefesi (Broadcast Standard), tek renk akçamı ve düz katmanlı derinlik, projeyi benzersiz ve hatırlanabilir kılar.

---

*Son güncelleme: Geliştirme devam ediyor*