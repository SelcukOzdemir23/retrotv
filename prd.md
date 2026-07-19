# 📄 PRD: Project ChronoTV (Doğum Günü Özel)

**Vizyon:** Kullanıcıyı 90'ların sonundaki bir oturma odasına götüren, interaktif bir tüplü televizyon (CRT) aracılığıyla doğum günü sahibinin hayatındaki farklı dönemleri "kanal kanal" gezdiren nostaljik web deneyimi.

---

## 🛠 1. Teknoloji Yığını (Tech Stack)

* **Core Framework:** **Astro** (Performans, statik yapı ve bileşen mimarisi için).
* **Interactivity:** **Svelte** veya **Preact** (Astro "Islands" mimarisi içinde TV ekranı ve kumanda mantığı için. Svelte animasyonlarda çok rahattır).
* **Styling:** **Tailwind CSS** (Hızlı layout) + **Custom CSS** (CRT, Scanline, Flicker ve Glow efektleri için).
* **State Management:** **Nano Stores** (Astro içinde kumanda ve ekran arasındaki iletişimi -kanal değişimi, ses durumu vb.- yönetmek için en hafif çözüm).
* **Hosting:** **Vercel** veya **Netlify** (Sürdürülebilir, ücretsiz ve hızlı).

---

## 📺 2. İçerik ve Kanal Yapısı (Zaman Yolculuğu)

Televizyon açıldığında varsayılan olarak kapalıdır veya "AV" modunda başlar. Kumanda ile şu kanallar gezilecek:

* **Kanal 1: The Beginning (Çocukluk)**
    * *İçerik:* Bebeklik ve ilkokul videoları/foto slaytları.
    * *Atmosfer:* Arka planda 8-bit oyun müzikleri veya o dönemin çizgi film jeneriği.
    * *Ekran Yazısı (OSD):* `CH 01 - 199X`
* **Kanal 2: The Golden Age (Gençlik)**
    * *İçerik:* Lise/Üniversite anıları, komik videolar, arkadaş ortamı.
    * *Atmosfer:* O dönemin hit şarkısının "low-fi" veya "vaporwave" versiyonu.
    * *Ekran Yazısı (OSD):* `CH 02 - 20XX`
* **Kanal 3: Now Playing (Günümüz)**
    * *İçerik:* Güncel videolar, iş hayatı, bugünkü hali.
    * *Ekran Yazısı (OSD):* `CH 03 - BUGÜN`
* **Kanal 4: The Forecast (Gelecek/Dilekler)**
    * *İçerik:* Senin çektiğin "Hava Durumu Sunucusu" konseptli video. (Örn: "Önümüzdeki yıl yüksek basınçlı başarı dalgası bekleniyor.")
    * *Ekran Yazısı (OSD):* `CH 04 - GELECEK`
* **Kanal 0/AV:** Mavi ekran üzerinde "Sinyal Yok" veya "Mutlu Yıllar" yazısı.

---

## 🎨 3. UI/UX ve Tasarım Detayları

### A. Ortam (The Room)
* Sayfa tam ekran (`100vh`) olacak.
* Arka plan simsiyah değil; loş ışıklı, 90'lar estetiğine sahip bir oda (bir raf, eski posterler, belki yerde bir kasetçalar) illüstrasyonu veya flu fotoğrafı olacak.
* Merkezde odak noktası olarak TV duracak.

### B. TV Estetiği (CSS Art)
* **Kasa:** Plastik dokulu, gri veya siyah retro bir TV çerçevesi görseli.
* **Ekran:** Hafif bombeli (`border-radius`), köşeleri yumuşak.
* **Yansıma:** Ekranın üzerinde odanın hafif bir yansıması (`opacity: 0.1` civarı) olacak, video oynarken de üstte duracak.

### C. Kumanda (Remote)
* Ekranın sağında (mobilde aşağıda) yüzen, CSS veya SVG ile çizilmiş bir kumanda.
* **Tuşlar:** `POWER` (Kırmızı), `CH+`, `CH-`, `VOL+`, `VOL-`.
* *Mobil UX:* Mobilde kumanda yerine ekranın üzerine dokunmatik şeffaf alanlar konabilir.

---

## ✨ 4. Mikro-Detaylar (Mini Beautiful Details)

*Bu projeyi "basit bir video sitesinden" ayırıp "unutulmaz bir deneyime" dönüştürecek dokunuşlar:*

1.  **Açılış Sekansı (Boot Sequence):**
    * Site açıldığında TV kapalıdır (Siyah ekran, kırmızı "Standby" ışığı yanar).
    * `POWER` tuşuna basınca: Tok bir "ÇIT" sesi gelir, kırmızı ışık söner.
    * Ekran ortadan parlak beyaz bir çizgi olarak belirir ve yavaşça dikey olarak genişleyerek açılır (Eski tüplü TV açılış efekti).

2.  **Kanal Geçişi (Static Noise):**
    * Kanal değiştirirken video anında kesilmez (Hard cut yok).
    * 0.5 saniyelik yüksek sesli bir "HIŞŞT" sesiyle birlikte siyah-beyaz karıncalı ekran (static noise GIF/CSS) girer.
    * Yeni görüntü geldiğinde hafifçe yukarıdan aşağıya kayarak (vertical sync) oturur.

3.  **OSD (On Screen Display):**
    * Kanal değiştiğinde veya ses açıldığında ekranın köşesinde neon yeşil, piksel fontlu yazılar belirir: `VOLUME: ||||||||`, `CH 01`.
    * Bu yazı 3 saniye sonra `fade-out` ile kaybolur.

4.  **Tüp Eskimesi:**
    * Görüntü kenarlarında hafif bir renk ayrışması (**Chromatic Aberration**) ve köşelerde kararma (**Vignette**) olacak.
    * Hafif bir titreme (flicker) efekti.

5.  **Easter Egg (Sürpriz):**
    * Eğer kullanıcı olmayan bir kanala (örn: Kanal 99) gitmeye çalışırsa veya tuşlara rastgele çok basarsa; komik veya utanç verici bir fotoğraf anlık olarak belirip kaybolsun.

---

## 📂 5. Astro Bileşen Mimarisi (Öneri)

Proje klasör yapısı organizasyonu:

```text
src/
├── components/
│   ├── TV/
│   │   ├── TVFrame.astro      (Dış kasa görseli ve yerleşimi)
│   │   ├── Screen.svelte      (Video logic, efektler ve OSD state'i burada)
│   │   └── Effects.css        (Scanline, glow, flicker stilleri)
│   ├── Remote/
│   │   └── RemoteControl.svelte (Tuşlar ve Nano Store etkileşimi)
│   └── RoomBackground.astro   (Arka plan görseli)
├── stores/
│   └── tvStore.js             (Nano Store: currentChannel, volume, powerState)
├── data/
│   └── channels.json          (Video URL'leri, başlıklar ve meta veriler)
└── pages/
    └── index.astro            (Ana toplayıcı sayfa)