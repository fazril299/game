# Langit Mataram — 3D Interactive Cultural Journey

Sebuah platform web 3D interaktif dan jurnal kultural karya **Gabriel**, memadukan simulasi penerbangan kapal udara (airship) WebGL dengan penjelajahan naskah sejarah serta arsitektur adiluhung Yogyakarta.

## 🌟 Fitur Utama

- **Penerbangan Kapal Udara 3D (WebGL / Three.js)**:
  - Kemudi manual aerodinamis (Maju/Mundur, Belok Kiri/Kanan, Naik/Turun, dan Turbo Boost).
  - Mode Autopilot cerdas menuju dermaga berlabuh.
  - Kamera orbit 360° dengan peredaman gerak halus (*cinematic damping*).
- **Fisika Tabrakan & Hambatan Bangunan (*Solid Collisions*)**:
  - Deteksi benturan fisik dengan bangunan candi (Prambanan, Ratu Boko), atap Pendopo Joglo Keraton, tebing purba Breksi, dan tugu monumen.
  - Efek audio haptic benturan lambung kayu (*procedural hull bump audio*).
- **Pembatas Wilayah Udara Mataram (*Celestial Flight Boundary*)**:
  - Cincin angin pusaka bercahaya keemasan berdiameter 350 unit dengan 28 awan cakrawala.
  - Arus angin aerodinamis yang membelokkan kapal secara natural kembali ke gugusan kepulauan.
  - Peringatan instan pada HUD navigasi.
- **7 Pulau Destinasi Kultural & 8 Kampung Warga**:
  - Keraton Yogyakarta (Sumbu Filosofi)
  - Candi Prambanan (Trimurti Siwa)
  - Situs Ratu Boko (Gerbang Paduraksa)
  - Istana Air Tamansari (Sumur Gumuling)
  - Tebing Breksi & Mangunan (Pahatan Purba)
  - Gumuk Pasir Parangtritis (Segara Kidul)
  - Titik Nol & Monumen Tugu Pal Putih
  - 8 Pulau Kampung Warga & Warung Tradisional (Kopi Klotok, pos ronda, limasan, sumur timba)
- **Kompas Astrolabe Radar (Mini-Map)**:
  - Mini radar terinspirasi astrolabe Jawa dengan penunjuk arah mata angin Jawa (*Lor, Kidul, Kulon, Wetan*), kalkulasi jarak, dan visualisasi cincin pembatas.
- **Drawer Naskah Editorial Majalah**:
  - Naskah kajian sejarah dengan mode pembaca hening (*Zen Reader fullscreen*), tipografi mewah, galeri visual, dan progress bar membaca.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite
- **3D Graphics**: Three.js (Procedural geometries, low-poly andesite shaders, dynamic daytime/night lighting)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Audio Engine**: Web Audio API (procedural engine drone, wind ambiance, chime, and hull bump effects)

## 🚀 Menjalankan Proyek

```bash
# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Build untuk produksi
npm run build
```

## 📜 Lisensi & Hak Cipta

Dirancang dan dikembangkan oleh **Gabriel** ([@fazril299](https://github.com/fazril299)).
