export const PORTFOLIO_DATA = {
  profile: {
    name: "Gabriel",
    title: "Art Director & Penulis Visual",
    location: "Yogyakarta, Daerah Istimewa Yogyakarta",
    email: "halo@gabriel-jogja.id",
    phone: "+62 274 388 920",
    booking: "Musim Kemarau 2026/2027",
    instagram: "@gabriel.jogja",
    tagline: "Sebuah platform naskah & artikel interaktif berbasis game 3D. Terbangkan kapal udara melintasi langit Yogyakarta untuk menyelami kisah sejarah, arsitektur, dan rahasia tanah Mataram.",
    bio: "Halo, saya Gabriel — penjelajah visual dan kurator cerita yang berbasis di Yogyakarta. Melalui format game eksplorasi 3D ini, saya mengajak Anda menikmati artikel budaya dan arsitektur Jawa dengan cara baru yang menyenangkan: terbang bebas di langit, berlabuh di pulau-pulau bersejarah, dan membaca kisah di balik setiap peninggalan adiluhung.",
    stats: [
      { number: "7", label: "Destinasi Ikonik Jogja" },
      { number: "15 km", label: "Panjang Sumbu Filosofi" },
      { number: "Abad VIII", label: "Awal Warisan Mataram" }
    ],
    clients: [
      "Balai Pelestarian Kebudayaan DIY",
      "Kraton Ngayogyakarta Hadiningrat",
      "Taman Wisata Candi (Borobudur, Prambanan & Ratu Boko)",
      "Amanjiwo",
      "Plataran Heritage Borobudur",
      "Manual Magazine",
      "Kinfolk Asia",
      "Kemenparekraf RI"
    ],
    services: [
      { title: "Penulisan Esai & Artikel Visual", desc: "Narasi mendalam seputar sejarah arsitektur nusantara, filosofi ruang, dan lanskap kultural Jawa." },
      { title: "Dokumentasi Heritage & Candi", desc: "Kajian fotografi medium-format untuk pelestarian situs purbakala dan bangunan cagar budaya." },
      { title: "Interactive Storytelling", desc: "Perancangan pengalaman membaca digital inovatif yang memadukan 3D WebGL, audio spasial, dan esai naratif." },
      { title: "Kurasi Arsip Budaya", desc: "Digitalisasi manuskrip lontar, batik klasik, dan tradisi lisan menjadi konten multimedia kontemporer." }
    ]
  },

  islands: [
    {
      id: "about",
      label: "Keraton",
      title: "Sumbu Filosofi",
      chapter: "Bab I",
      subtitle: "Poros Kosmis Mataram",
      x: -58,
      z: -12,
      r: 16,
      dockAngle: -0.6,
      dockDistance: 32,
      readTime: "5 menit baca",
      badge: "Warisan Dunia UNESCO",
      description: "Pendopo Joglo berselimut kayu jati kuno. Mengungkap garis lurus imajiner antara Merapi, Keraton, dan Laut Selatan."
    },
    {
      id: "work",
      label: "Prambanan",
      title: "Candi Prambanan",
      chapter: "Bab II",
      subtitle: "Mahakarya Siwa Abad ke-9",
      x: 66,
      z: -22,
      r: 18,
      dockAngle: 3.6,
      dockDistance: 34,
      readTime: "6 menit baca",
      badge: "Arkeologi Hindu Terbesar",
      description: "Menara Shikhara setinggi 47 meter yang menjulang ke angkasa. Rahasia akustik andesit dan mitos seribu candi Roro Jonggrang."
    },
    {
      id: "ratuboko",
      label: "Ratu Boko",
      title: "Candi Ratu Boko",
      chapter: "Bab III",
      subtitle: "Gerbang Istana di Atas Bukit",
      x: 95,
      z: -90,
      r: 16,
      dockAngle: 2.8,
      dockDistance: 32,
      readTime: "5 menit baca",
      badge: "Kraton Megah Abad ke-8",
      description: "Gerbang Paduraksa kembar andesit megah di atas perbukitan kapur Prambanan dengan panorama senja terindah di Yogyakarta."
    },
    {
      id: "journal",
      label: "Tamansari",
      title: "Istana Air",
      chapter: "Bab IV",
      subtitle: "Umbul Pasiraman & Sumur Gumuling",
      x: -24,
      z: -78,
      r: 15,
      dockAngle: 1.9,
      dockDistance: 28,
      readTime: "5 menit baca",
      badge: "Labirin Rahasia Air",
      description: "Oase peristirahatan para putri raja dan masjid bawah tanah dengan lima tangga melingkar tanpa pengeras suara."
    },
    {
      id: "breksi",
      label: "Breksi & Mangunan",
      title: "Tebing Breksi",
      chapter: "Bab V",
      subtitle: "Pahatan Purba & Hutan Pinus",
      x: 0,
      z: -160,
      r: 16,
      dockAngle: 1.5,
      dockDistance: 32,
      readTime: "4 menit baca",
      badge: "Geowisata Batuan Abu Merapi",
      description: "Tebing kapur breksi vulkanik berukir naga raksasa dan gardu pandang kayu di atas kabut hutan pinus Mangunan."
    },
    {
      id: "parangtritis",
      label: "Parangtritis",
      title: "Gumuk Pasir",
      chapter: "Bab VI",
      subtitle: "Ujung Selatan Sumbu Filosofi",
      x: -85,
      z: -120,
      r: 16,
      dockAngle: 0.8,
      dockDistance: 32,
      readTime: "5 menit baca",
      badge: "Fenomena Alam Barchan Langka",
      description: "Hamparan gumuk pasir barchan langka di Asia Tenggara, deburan ombak mistis Segara Kidul, dan pura pesisir Parangkusumo."
    },
    {
      id: "contact",
      label: "Titik Nol",
      title: "Tugu & Titik Nol",
      chapter: "Bab VII",
      subtitle: "Jiwa & Romansa Senja",
      x: 34,
      z: -100,
      r: 14,
      dockAngle: 1.6,
      dockDistance: 26,
      readTime: "4 menit baca",
      badge: "Simbol Golong Gilig",
      description: "Episentrum romantisme Yogyakarta: Monumen Tugu, beringin kembar alun-alun, dan obrolan kopi jos di tikar angkringan."
    }
  ],

  // Full Rich Narrative Articles for Each Island
  articles: {
    about: {
      id: "about",
      chapter: "Bab I dari VII",
      category: "Filosofi Tata Ruang Kerajaan",
      badge: "Sumbu Filosofi Yogyakarta (UNESCO Heritage)",
      title: "Sumbu Filosofi: Poros Kosmis Merapi, Keraton, hingga Segara Kidul",
      subtitle: "Menyingkap garis imajiner sepanjang 15 kilometer yang menjadi kompas spiritual dan arsitektur adiluhung peradaban Mataram.",
      readTime: "5 menit baca",
      author: "Gabriel",
      date: "Edisi Khusus Tanah Jawa",
      heroImage: "/images/keraton-pendopo.jpg",
      leadParagraph: "Ketika Sri Sultan Hamengkubuwono I meletakkan batu pertama berdirinya Kasultanan Ngayogyakarta Hadiningrat pada tahun 1755, beliau tidak sekadar mendirikan pusat pemerintahan kota. Beliau menggambar poros spiritual yang menghubungkan unsur api, kehidupan manusia, dan samudra tak berujung.",
      sections: [
        {
          heading: "1. Garis Lurus Tak Kasat Mata",
          content: [
            "Tariklah garis lurus dari kawah Gunung Merapi di utara, melintasi Tugu Golong Gilig, Keraton Yogyakarta, Panggung Krapyak, hingga berakhir di deburan ombak Pantai Parangkusumo. Garis lurus sepanjang 15 kilometer ini berjejak sempurna tanpa meleset walau satu derajat.",
            "Bagi masyarakat Jawa, garis ini bukan sekadar peta geografis, melainkan jalur kosmologis yang menyeimbangkan unsur api (Gunung Merapi), angin dan air (Laut Selatan), dengan manusia sebagai khalifah di tengah-tengahnya (Keraton)."
          ],
          quote: "Garis ini bukan buatan kompas kolonial, melainkan rajutan batin antara bumi yang berpijak dan langit yang menaungi.",
          trivia: "Pada tahun 2023, Sumbu Filosofi Yogyakarta secara resmi ditetapkan sebagai Situs Warisan Dunia (World Heritage) oleh UNESCO."
        },
        {
          heading: "2. Sangkan Paraning Dumadi: Perjalanan Asal dan Tujuan Hidup",
          content: [
            "Perjalanan melintasi sumbu ini melambangkan siklus hidup manusia. Dari Panggung Krapyak menuju Keraton ke arah utara melambangkan 'Sangkan' — kelahiran, proses penciptaan benih manusia, hingga masa akil baligh.",
            "Sebaliknya, perjalanan dari Tugu Pal Putih menuju ke selatan melambangkan 'Paran' — perjalanan batin menuju kedewasaan, melepaskan nafsu duniawi, hingga kembali menyatu dengan Sang Pencipta (Manunggaling Kawula Gusti)."
          ]
        },
        {
          heading: "3. Arsitektur Joglo: Keseimbangan Empat Soko Guru",
          content: [
            "Di tengah pulau ini berdiri Pendopo Joglo. Struktur atap bertingkat Tajug Sinom ditopang oleh empat tiang kayu jati utama yang disebut Soko Guru. Tanpa menggunakan paku besi satu pun, konstruksi purus dan tumpangsari ini fleksibel menyerap getaran gempa bumi.",
            "Empat tiang utama ini melambangkan empat arah mata angin serta empat nafsu manusia (lawwamah, amarah, supiah, mutmainnah) yang harus dijaga keseimbangannya di bawah naungan ketenangan batin (Hamemayu Hayuning Bawana)."
          ],
          quote: "Kayu jati tidak menolak angin ribut; ia bergoyang lembut bersamanya lalu kembali tegak dalam hening."
        }
      ],
      photoGallery: [
        {
          url: "/images/keraton-pendopo.jpg",
          caption: "Keseimbangan gerak lambat penari Bedhaya di pelataran Bangsal Kencana Keraton."
        },
        {
          url: "/images/tamansari-watercastle.jpg",
          caption: "Bukaan cahaya alami menerobos kisi-kisi kayu jati pendopo tradisional."
        }
      ],
      nextIsland: "work",
      nextLabel: "Lanjut Terbang ke Bab II: Candi Prambanan"
    },

    work: {
      id: "work",
      chapter: "Bab II dari VII",
      category: "Mahakarya Arkeologi Abad ke-9",
      badge: "Kompleks Candi Hindu Terbesar di Nusantara",
      title: "Mahakarya Siwa: Misteri 1000 Candi & Mahligai Cinta Roro Jonggrang",
      subtitle: "Menyelami teknik arsitektur batu andesit Merapi, relief epik Ramayana, dan resonansi suara di dalam bilik Shikhara setinggi 47 meter.",
      readTime: "6 menit baca",
      author: "Gabriel",
      date: "Edisi Eksplorasi Arkeologi",
      heroImage: "/images/prambanan-temple.jpg",
      leadParagraph: "Menjulang tegak menembus awan di perbatasan Sleman dan Klaten, kompleks Candi Prambanan berdiri sebagai persembahan agung Wangsa Sanjaya kepada Trimurti: Brahma sang Pencipta, Wisnu sang Pemelihara, dan Siwa sang Pelebur.",
      sections: [
        {
          heading: "1. Keajaiban Shikhara 47 Meter Tanpa Semen Perekat",
          content: [
            "Candi Siwa yang berdiri di tengah kompleks menjulang setinggi 47 meter — lima meter lebih tinggi dari Candi Borobudur. Seluruh struktur megah ini dibangun pada abad ke-9 menggunakan jutaan balok batu andesit vulkanik sisa muntahan Gunung Merapi purba.",
            "Teknik kuncian batu interlocking (dovetail joinery) membuat setiap bongkahan batu saling mengunci satu sama lain. Relief pahatan batu tidak dibuat setelah candi berdiri, melainkan dipahat langsung pada balok yang telah disusun rapat di ketinggian."
          ],
          quote: "Batu-batu Merapi yang mematikan diubah oleh para empu menjadi bait-bait doa abadi yang menembus langit.",
          trivia: "Prasasti Shivagrha yang berangka tahun 856 M mencatat bahwa untuk membangun kompleks suci ini, aliran Sungai Opak sengaja dialihkan oleh ribuan pekerja Mataram Kuno."
        },
        {
          heading: "2. Mitos Seribu Candi vs Catatan Sejarah",
          content: [
            "Legenda rakyat menceritakan tentang Bandung Bondowoso yang dituntut oleh Roro Jonggrang untuk membangun seribu candi dalam satu malam. Ketika ayam berkokok karena tipu daya api jerami, candi ke-1000 belum usai, dan Jonggrang pun dikutuk menjadi arca Durga Mahisasuramardini yang rupawan.",
            "Secara arkeologis, kompleks Prambanan memang memiliki 240 candi utama dan perwara. Arca Durga bertangan delapan yang anggun di bilik utara Candi Siwa hingga kini tetap memancarkan pesona magis bagi siapa pun yang memandangnya."
          ]
        },
        {
          heading: "3. Akustik Bilik Suci & Relief Kalpataru",
          content: [
            "Cobalah melangkah ke dalam bilik utama Candi Siwa saat sepi. Bentuk kubah kerucut batu di ruang dalam didesain sedemikian rupa sehingga gumaman mantra atau hembusan napas terkecil akan memantul dan beresonansi di seluruh ruangan.",
            "Di dinding luar, relief pohon hayat Kalpataru dipagari oleh burung-burung surgawi Kinara-Kinari dan singa penjaga, melambangkan keabadian dan kesuburan tanah Jawa yang diberkahi oleh abu vulkanis Merapi."
          ],
          quote: "Di Prambanan, arsitektur bukan sekadar dinding pelindung; ia adalah instrumen musik yang memainkan kidung keheningan semesta."
        }
      ],
      photoGallery: [
        {
          url: "/images/prambanan-temple.jpg",
          caption: "Siluet Shikhara Candi Siwa menjulang di atas kabut fajar Prambanan."
        },
        {
          url: "/images/breksi-cliff.jpg",
          caption: "Detail kuncian batu andesit purba dan pahatan relief Kalpataru."
        },
        {
          url: "/images/kotagede-silver.jpg",
          caption: "Kilau cahaya temaram menyinari arca pelindung di relung candi."
        }
      ],
      nextIsland: "ratuboko",
      nextLabel: "Lanjut Terbang ke Bab III: Candi Ratu Boko"
    },

    ratuboko: {
      id: "ratuboko",
      chapter: "Bab III dari VII",
      category: "Kraton Kuno di Puncak Perbukitan",
      badge: "Situs Istana Megah Abad ke-8",
      title: "Kemegahan Istana di Atas Awan: Jejak Keraton Ratu Boko & Senja Keemasan",
      subtitle: "Menapaki gerbang Paduraksa kembar andesit, kolam pemandian permaisuri, dan altar pembakaran di ketinggian 196 mdpl.",
      readTime: "5 menit baca",
      author: "Gabriel",
      date: "Edisi Arkeologi Istana Mataram",
      heroImage: "/images/ratuboko-sunset.jpg",
      leadParagraph: "Berbeda dengan Borobudur dan Prambanan yang merupakan bangunan keagamaan murni, Situs Ratu Boko adalah bekas kompleks istana kerajaan terlengkap dari abad ke-8. Terletak di atas perbukitan kapur selatan Prambanan, tempat ini memadukan fungsi benteng militer, tempat tinggal bangsawan, dan oase meditasi spiritual.",
      sections: [
        {
          heading: "1. Gerbang Paduraksa Kembar yang Menatap Cakrawala",
          content: [
            "Ikon paling abadi dari Ratu Boko adalah Gerbang Utama (Paduraksa) bertingkat tiga yang tersusun dari batu andesit padat. Ketika matahari perlahan tergelincir ke ufuk barat, bulatan sang surya akan tepat berada di tengah bingkai gerbang batu ini.",
            "Pemandangan siluet gerbang hitam dengan latar belakang langit jingga keemasan dan hamparan sawah Prambanan di bawahnya diakui sebagai salah satu panorama matahari terbenam terindah di dunia."
          ],
          quote: "Di gerbang Ratu Boko, waktu seolah berhenti berdetik saat matahari menyapa batu-batu berusia 1.200 tahun.",
          trivia: "Prasasti Abhayagiriwihara berangka tahun 792 M menyebut tempat ini sebagai vihara damai di atas bukit yang didirikan oleh Rakai Panangkaran."
        },
        {
          heading: "2. Candi Pembakaran & Misteri Abu Tulang",
          content: [
            "Di pelataran kedua berdiri struktur teras batu persegi setinggi 3 meter dengan ceruk di tengahnya yang dinamakan Candi Pembakaran. Di tempat inilah para arkeolog menemukan sisa abu pembakaran serta lempengan emas bertuliskan mantra suci.",
            "Sebagian peneliti meyakini tempat ini digunakan untuk upacara perabuan jenazah raja, sementara yang lain memandangnya sebagai tempat upacara kurban api suci (Homa) pemuja Siwa."
          ]
        },
        {
          heading: "3. Kolam Pemandian Gua & Sistem Saluran Air Kuno",
          content: [
            "Di bagian selatan kompleks terdapat puluhan kolam batu persegi dan lingkaran yang dipahat langsung ke dalam batuan kapur bukit. Sistem pipa terakota kuno mengalirkan air hujan yang disaring untuk kebutuhan istana sehari-hari.",
            "Berjalan di antara reruntuhan Paseban dan Pendopo Ratu Boko di sore hari menghadirkan rasa takzim yang mendalam atas kejayaan peradaban nenek moyang kita."
          ],
          quote: "Istana boleh runtuh termakan zaman, namun keanggunan tata ruangnya tetap abadi di puncak bukit ini."
        }
      ],
      photoGallery: [
        {
          url: "/images/ratuboko-sunset.jpg",
          caption: "Siluet gerbang Paduraksa kembar Ratu Boko kala senja menjemput."
        },
        {
          url: "/images/ratuboko-gate.jpg",
          caption: "Teras batu andesit Paseban dengan latar belakang lembah Prambanan."
        }
      ],
      nextIsland: "journal",
      nextLabel: "Lanjut Terbang ke Bab IV: Istana Air Tamansari"
    },

    journal: {
      id: "journal",
      chapter: "Bab IV dari VII",
      category: "Arsitektur Air & Labirin Rahasia",
      badge: "The Water Castle of Yogyakarta",
      title: "Misteri Lorong Bawah Air: Labirin Rahasia & Pesona Umbul Pasiraman",
      subtitle: "Menyusuri oase peristirahatan Sultan Hamengkubuwono I, menara intip tiga tingkat, dan masjid melingkar Sumur Gumuling.",
      readTime: "5 menit baca",
      author: "Gabriel",
      date: "Edisi Arsip Arsitektur Air",
      heroImage: "/images/tamansari-watercastle.jpg",
      leadParagraph: "Dibangun pada pertengahan abad ke-18, Tamansari bukan hanya tempat peristirahatan keluarga kerajaan (pesanggrahan). Kompleks seluas 10 hektar ini dirancang sebagai benteng pertahanan bawah air dengan jaringan terowongan rahasia (urung-urung) yang menghubungkan Keraton dengan pesisir selatan.",
      sections: [
        {
          heading: "1. Umbul Pasiraman: Oase Tiga Kolam Permata",
          content: [
            "Inti dari Tamansari adalah Umbul Pasiraman — kolam pemandian berdinding terakota dengan air berwarna pirus berkilauan. Tiga kolam memiliki peruntukan khusus: Umbul Kawitan untuk para putri raja, Umbul Pamuncar untuk para selir, dan Umbul Pangrancap khusus untuk Sri Sultan.",
            "Pancuran air berbentuk naga dan bunga teratai mengalirkan mata air alami tanpa henti, menciptakan suara gemericik air yang menenangkan jiwa di tengah teriknya siang kota Yogyakarta."
          ],
          quote: "Air di Tamansari tidak pernah diam; ia menyerap panas duniawi dan mengembalikan kejernihan rasa batin."
        },
        {
          heading: "2. Menara Penginap: Sudut Pandang Sang Sultan",
          content: [
            "Menjulang di antara kolam adalah Menara Penginap — menara tiga tingkat bergaya paduan barok Portugis dan ukiran Jawa. Dari jendela lengkung di lantai teratas, Sultan dapat memandang luas ke seluruh kolam sembari menikmati semilir angin dan aroma bunga kantil yang mengapung di permukaan air.",
            "Arsitekturnya yang kokoh dengan plester semen kuno berbahan putih telur dan pasir vulkanik mampu bertahan dari berbagai guncangan gempa bumi besar selama lebih dari dua setengah abad."
          ],
          trivia: "Konon arsitek Tamansari adalah seorang berkebangsaan Portugis bernama Demang Tegis, yang memadukan teknik hidrolika Eropa dengan cita rasa seni Mataram."
        },
        {
          heading: "3. Sumur Gumuling: Akustik Masjid Bawah Tanah",
          content: [
            "Melewati lorong bawah tanah yang lembap dan temaram, Anda akan tiba di Sumur Gumuling — masjid bawah tanah melingkar dua tingkat. Di tengah ruangan, lima tangga bertingkat bertemu di satu platform melayang di atas kolam air suci.",
            "Arsitektur lingkaran ini memiliki akustik luar biasa. Ketika imam mengumandangkan azan di tengah tangga, suaranya terpantul merata ke seluruh lorong melingkar tanpa bantuan alat pengeras suara apa pun."
          ],
          quote: "Ketiadaan jendela luar di Sumur Gumuling bukan untuk mengurung, melainkan memfokuskan pandangan jiwa hanya ke satu titik: langit yang terbuka di atas kubah."
        }
      ],
      photoGallery: [
        {
          url: "/images/tamansari-watercastle.jpg",
          caption: "Pertemuan lima tangga melingkar di Sumur Gumuling, masjid bawah tanah Tamansari."
        },
        {
          url: "/images/tamansari-pool.jpg",
          caption: "Bukaan lengkung gerbang panggung pemandian Umbul Pasiraman."
        }
      ],
      nextIsland: "breksi",
      nextLabel: "Lanjut Terbang ke Bab V: Tebing Breksi & Mangunan"
    },

    breksi: {
      id: "breksi",
      chapter: "Bab V dari VII",
      category: "Geowisata & Mahakarya Pahatan Purba",
      badge: "Kars Endapan Abu Vulkanis Merapi Purba",
      title: "Pahatan Purba Tebing Breksi & Heningnya Kabut Pinus Mangunan",
      subtitle: "Dari bekas tambang batu kapur yang disulap menjadi kanvas seni raksasa, hingga semilir angin hutan pinus di perbukitan Dlingo.",
      readTime: "4 menit baca",
      author: "Gabriel",
      date: "Edisi Alam & Geowisata Jogja",
      heroImage: "/images/breksi-cliff.jpg",
      leadParagraph: "Di perbukitan Sambirejo, Prambanan, menjulang dinding tebing batu kapur putih setinggi puluhan meter yang dinamakan Tebing Breksi. Batuan ini terbentuk dari endapan debu vulkanis erupsi dahsyat Gunung Nglanggeran dan Merapi purba jutaan tahun silam.",
      sections: [
        {
          heading: "1. Kanvas Raksasa Pahat Naga & Relief Pewayangan",
          content: [
            "Ketika aktivitas tambang dihentikan demi konservasi geologi, para seniman lokal Yogyakarta mengubah tebing cadas ini menjadi karya seni raksasa. Dinding tebing dipahat dengan ukiran naga mahkota Jawa dan tokoh pewayangan yang megah.",
            "Tangga berundak dipahat langsung di sisi tebing, membawa para pengunjung menuju puncak bukit dengan pemandangan terbuka ke arah Gunung Merapi, Candi Prambanan, dan gemerlap lampu kota Yogyakarta di malam hari."
          ],
          quote: "Di tangan para perupa Jogja, batu cadas bekas tambang diubah menjadi kidung pemujaan keindahan alam.",
          trivia: "Tebing Breksi ditetapkan sebagai Geoheritage karena menyimpan jejak abu vulkanik purba berusia lebih dari 20 juta tahun."
        },
        {
          heading: "2. Hutan Pinus Mangunan: Katedral Alam di Atas Kabut",
          content: [
            "Melanjutkan perjalanan ke arah selatan menuju Dlingo, Bantul, udara berubah menjadi dingin berselimut aroma getah pinus yang khas. Di Hutan Pinus Mangunan dan Puncak Becici, ratusan pohon pinus menjulang rapat menembus kabut putih pagi.",
            "Gardu pandang kayu yang dibangun di antara dahan pinus menawarkan sensasi melayang di atas 'negeri di atas awan', tempat terbaik untuk menghirup napas kedamaian dan melepas penat hiruk-pikuk kehidupan modern."
          ],
          quote: "Di antara desau angin pohon pinus, kita belajar bahwa keheningan adalah musik alam yang paling murni."
        }
      ],
      photoGallery: [
        {
          url: "/images/breksi-cliff.jpg",
          caption: "Detail pahatan naga raksasa pada dinding batu kapur putih Tebing Breksi."
        },
        {
          url: "/images/prambanan-temple.jpg",
          caption: "Deretan pohon pinus menjulang tinggi di kawasan perbukitan Mangunan Dlingo."
        }
      ],
      nextIsland: "parangtritis",
      nextLabel: "Lanjut Terbang ke Bab VI: Gumuk Pasir & Parangtritis"
    },

    parangtritis: {
      id: "parangtritis",
      chapter: "Bab VI dari VII",
      category: "Bentang Alam Pesisir & Mistis Segara Kidul",
      badge: "Satu-satunya Gumuk Pasir Barchan di Asia Tenggara",
      title: "Ujung Poros Kosmis: Mistis Laut Kidul & Keajaiban Gumuk Pasir Parangkusumo",
      subtitle: "Menatap deburan ombak Samudra Hindia di batas selatan Sumbu Filosofi dan fenomena langka bukit pasir barchan.",
      readTime: "5 menit baca",
      author: "Gabriel",
      date: "Edisi Samudra & Angin Selatan",
      heroImage: "/images/ratuboko-sunset.jpg",
      leadParagraph: "Di ujung selatan garis lurus Sumbu Filosofi Yogyakarta, daratan tanah Jawa berakhir dan menyatu dengan deburan ombak dahsyat Samudra Hindia. Di sinilah terbentang Pantai Parangtritis dan Pantai Parangkusumo — tempat bertemunya mitos suci pendiri Mataram dengan keajaiban geologi dunia.",
      sections: [
        {
          heading: "1. Gumuk Pasir Barchan: Gurun Pasir di Pesisir Tropis",
          content: [
            "Yogyakarta memiliki fenomena alam yang luar biasa langka: Gumuk Pasir Parangkusumo. Ini adalah formasi bukit pasir bertipe barchan (berbentuk bulan sabit) yang sangat langka di daerah beriklim tropis basah seperti Asia Tenggara.",
            "Pasir halus ini berasal dari abu vulkanis Gunung Merapi yang terbawa oleh aliran Sungai Opak dan Progo hingga ke samudra, lalu dihantam ombak besar dan ditiup oleh angin laut kencang selama ribuan tahun hingga membentuk bukit-bukit pasir bergelombang."
          ],
          quote: "Dari puncak api Merapi hingga butiran pasir di bibir samudra, tanah ini terhubung oleh tarian angin dan air abadi.",
          trivia: "Gumuk pasir barchan di daerah tropis basah di dunia hanya dapat ditemukan di Indonesia (Yogyakarta), Meksiko, dan Filipina."
        },
        {
          heading: "2. Cepuri Parangkusumo & Perjanjian Suci Panembahan Senopati",
          content: [
            "Di balik gumuk pasir terdapat situs keramat Cepuri Parangkusumo, dua batu karang hitam tempat Panembahan Senopati (pendiri Mataram Islam) bertapa dan bertemu dengan Kanjeng Ratu Kidul, penguasa Laut Selatan.",
            "Pertemuan mistis inilah yang melahirkan perjanjian perlindungan spiritual antara penguasa samudra dengan raja-raja Yogyakarta, yang hingga kini diperingati melalui upacara Labuhan tahunan dengan melarung sesaji ke laut lepas."
          ]
        },
        {
          heading: "3. Sunset Magis di Tebing Parangndog",
          content: [
            "Menjelang petang, naiklah ke tebing Parangndog / Watugupit di sisi timur pantai. Dari ketinggian tebing karst, Anda dapat menyaksikan matahari terbenam tenggelam lurus ke garis horizon samudra dengan bias cahaya jingga keunguan yang memukau.",
            "Angin laut selatan yang bertiup kencang membawa aroma garam dan ketenangan batin, menyadarkan kita betapa kecilnya manusia di hadapan kemegahan semesta."
          ],
          quote: "Di tepi Segara Kidul, semua kebanggaan luluh menjadi rasa syukur yang hening."
        }
      ],
      photoGallery: [
        {
          url: "/images/ratuboko-sunset.jpg",
          caption: "Pola gelombang angin pada bukit pasir barchan Gumuk Pasir Parangkusumo."
        },
        {
          url: "/images/ratuboko-gate.jpg",
          caption: "Deburan ombak senja di Pantai Parangtritis menghadap Samudra Hindia."
        }
      ],
      nextIsland: "contact",
      nextLabel: "Lanjut Terbang ke Bab VII: Tugu & Titik Nol"
    },

    contact: {
      id: "contact",
      chapter: "Bab VII dari VII",
      category: "Kultur Kota & Romantisme Malam",
      badge: "Pusat Gravitasi Emosional Jogja",
      title: "Romansa Titik Nol: Mengapa Setiap Sudut Jogja Selalu Membawa Rindu",
      subtitle: "Menatap puncak emas Tugu Golong Gilig, rahasia beringin kembar alun-alun, dan obrolan hangat beraroma arang di tikar angkringan tengah malam.",
      readTime: "4 menit baca",
      author: "Gabriel",
      date: "Edisi Senja & Malam Mataram",
      heroImage: "/images/ratuboko-sunset.jpg",
      leadParagraph: "Ada satu pepatah yang tak pernah usang: 'Jogja itu terbuat dari rindu, pulang, dan angkringan.' Ketika malam merayap turun di Titik Nol Kilometer dan lentera Malioboro mulai menyala kuning temaram, kota ini berubah menjadi ruang berbagi cerita yang paling ramah di bumi.",
      sections: [
        {
          heading: "1. Tugu Pal Putih & Simbol Kesatuan Tekad",
          content: [
            "Monumen Tugu di persimpangan jalan utama Yogyakarta bukan sekadar tugu penanda kota. Dibangun pertama kali pada tahun 1755 oleh Sri Sultan HB I dengan bentuk tiang silinder (golong) dan puncak bola (gilig), ia adalah simbol persatuan bulat antara rakyat dan raja (Golong Gilig).",
            "Meskipun bentuknya diubah pascagempa 1867 menjadi obelisk meruncing dengan mahkota emas berundak, maknanya tetap sama: pengingat manusia untuk selalu menyatukan niat hanya kepada Yang Maha Kuasa."
          ],
          quote: "Tugu Jogja berdiri bukan untuk dipuja, melainkan sebagai kompas pengingat kemana langkah hidup harus berpulang."
        },
        {
          heading: "2. Beringin Kembar & Ujian Ketulusan Masangin",
          content: [
            "Di Alun-Alun Kidul, berdiri dua pohon beringin kembar raksasa yang dipagari sasak putih. Tradisi Masangin — berjalan menutup mata melintasi celah sempit di antara dua pohon beringin ini — telah melegenda puluhan generasi.",
            "Banyak orang yang yakin telah melangkah lurus namun justru berbelok jauh ke samping. Para sesepuh bertutur bahwa hanya mereka yang hatinya bersih dari ambisi dan ego yang mampu melangkah lurus tanpa tersesat."
          ],
          trivia: "Pohon beringin (Ficus benjamina) di lingkungan keraton melambangkan pengayoman dan perlindungan raja kepada seluruh rakyatnya."
        },
        {
          heading: "3. Angkringan, Kopi Jos, dan Kehangatan Egaliter",
          content: [
            "Di bawah lampu teplok minyak tanah yang temaram, di atas gerobak kayu sederhana beralas terpal, tersaji sego kucing bungkus daun pisang, sate telur puyuh, dan kopi jos — kopi tubruk hitam yang dicelup arang membara mendesis.",
            "Di tikar angkringan, kasta dan jabatan lenyap. Seorang guru besar universitas, seniman jalanan, mahasiswa perantauan, dan kusir andong duduk bersila berdampingan, tertawa membicarakan hidup hingga fajar menyingsing."
          ],
          quote: "Di Jogja, persahabatan sejati tidak diikat oleh kemewahan, melainkan oleh kehangatan wedang jahe dan tawa lepas di pinggir jalan."
        }
      ],
      photoGallery: [
        {
          url: "/images/ratuboko-sunset.jpg",
          caption: "Senja keemasan menerangi sudut Malioboro dan Titik Nol Yogyakarta."
        },
        {
          url: "/images/ratuboko-gate.jpg",
          caption: "Lentera jalan klasik bergaya Belanda dan siluet pohon beringin tua."
        }
      ],
      nextIsland: "about",
      nextLabel: "Terbang Kembali ke Bab I: Keraton Yogyakarta"
    }
  },

  projects: [
    {
      id: "merapi-mist",
      title: "Kabut Merapi",
      year: "2026",
      category: "Fotografi Kampanye",
      tag: "Campaign",
      client: "Plataran Merapi & Heritage",
      image: "/images/prambanan-temple.jpg",
      secondaryImage: "/images/breksi-cliff.jpg",
      description: "Eksplorasi sensorik di lereng Kaliurang dan lautan pasir vulkanik Kaliadem saat fajar. Menangkap pertemuan antara selimut kabut putih, batu andesit purba, dan busana tenun lurik modern.",
      details: "Dibidik menggunakan kamera medium format pada jam 05.00–06.15 WIB sebelum matahari naik tinggi, mempertahankan palet warna abu vulkanis dan siluet alami."
    },
    {
      id: "kotagede-silver",
      title: "Kilau Kotagede",
      year: "2025",
      category: "Kriya & Still Life",
      tag: "Still Life",
      client: "Perak Mataram Atelier",
      image: "/images/kotagede-silver.jpg",
      secondaryImage: "/images/heritage-craft.jpg",
      description: "Dokumentasi keindahan kerajinan perak filigri Kotagede di dalam rumah tradisional Kalang abad ke-18. Kontras bayangan gelap dan kilau logam mulia hasil tempaan tangan pengrajin turun-temurun.",
      details: "Tata cahaya tunggal diffused softbox di studio Tirtodipuran, menonjolkan tekstur halus tanpa pantulan buatan yang berlebihan."
    },
    {
      id: "gumuk-pasir",
      title: "Garis Parangkusumo",
      year: "2025",
      category: "Lanskap Editorial",
      tag: "Travel",
      client: "Manual Magazine",
      image: "/images/ratuboko-sunset.jpg",
      secondaryImage: "/images/ratuboko-gate.jpg",
      description: "Perjalanan visual menelusuri Gumuk Pasir Barchan di pesisir selatan Yogyakarta. Garis angin pada gumuk pasir pantai dan bayangan pohon cemara udang kala rembang petang.",
      details: "Seri foto 35mm film analog yang menangkap gradasi warna oranye senja Samudra Hindia dan butiran pasir keemasan."
    },
    {
      id: "tamansari-shadows",
      title: "Hening Tamansari",
      year: "2025",
      category: "Arsitektur Heritage",
      tag: "Interiors",
      client: "Amanjiwo Luxury Resorts",
      image: "/images/tamansari-watercastle.jpg",
      secondaryImage: "/images/tamansari-pool.jpg",
      description: "Kajian arsitektur lorong bawah tanah Sumur Gumuling dan kolam pemandian Umbul Pasiraman. Merekam ritme geometris lengkung bata kuno dan pantulan cahaya dari langit-langit kubah.",
      details: "Pencahayaan alami 100% tanpa lampu tambahan untuk merekam keheningan mistis dan tekstur lumut pada dinding bersejarah."
    },
    {
      id: "kraton-dancers",
      title: "Gendhing Bedhaya",
      year: "2024",
      category: "Dokumentasi Budaya",
      tag: "Editorial",
      client: "Vogue Scandinavia / Asia Special",
      image: "/images/keraton-pendopo.jpg",
      secondaryImage: "/images/prambanan-temple.jpg",
      description: "Gerak lambat dan postur meditatif penari Bedhaya Ketawang di Bangsal Kencana. Keseimbangan antara tenun prada emas, selendang sutra, dan lantai marmer peninggalan Sultan terdahulu.",
      details: "Eksklusif pencahayaan alami lilin dan sinar sore yang menerobos kisi-kisi kayu jati."
    }
  ],

  journal: [
    {
      id: "menunggu-kabut-merapi",
      category: "Proses Visual",
      title: "Menunggu Kabut Merapi",
      date: "Oktober 2025",
      readTime: "4 menit baca",
      summary: "Mengapa 15 menit sebelum mentari terbit di Selo dan Kaliurang selalu menghasilkan tangkapan lensa yang paling berjiwa.",
      content: [
        "Di lereng Merapi, pagi tidak datang tergesa-gesa. Ia merayap perlahan dalam wujud kabut dingin yang menyelimuti dedaunan pakis dan bebatuan hitam sisa erupsi.",
        "Dulu saya sering memburu momen dengan terburu-buru, membawa lensa gonta-ganti di tengah dingin yang menusuk tulang. Seiring waktu, alam Jogja mengajarkan saya tentang 'eling lan waspada' — kesabaran untuk duduk hening dan membiarkan cahaya yang menemukan lensa kita.",
        "Foto yang paling bernyawa jarang sekali yang direncanakan secara kaku; ia adalah hadiah dari kesabaran kita menyatu dengan heningnya gunung."
      ]
    },
    {
      id: "palet-abu-dan-kuningan",
      category: "Kriya",
      title: "Palet Abu Vulkanis & Kuningan",
      date: "Agustus 2025",
      readTime: "5 menit baca",
      summary: "Pelajaran tentang batasan warna saat berkarya bersama empu perak Kotagede dan perajin gerabah Kasongan.",
      content: [
        "Warna tanah Yogyakarta sangat jujur: abu-abu gelap andesit, terakota merah bata tanah liat Kasongan, dan kilau hangat kuningan tua.",
        "Bekerja di bengkel para pengrajin tua di gang-gang sempit Kotagede menyadarkan saya bahwa kemewahan sejati (luxury) bukanlah kilau plastik modern, melainkan jejak ketukan martil tangan manusia yang berulang ribuan kali.",
        "Kamera tidak sekadar memotret benda, tetapi mengabadikan waktu dan keringat yang mengalir ke dalam setiap lekuk ukiran."
      ]
    },
    {
      id: "cahaya-temaram-tamansari",
      category: "Arsitektur",
      title: "Cahaya Temaram Tamansari",
      date: "Juni 2025",
      readTime: "3 menit baca",
      summary: "Menerjemahkan bayangan lorong bawah tanah dan pantulan air menjadi kedalaman rasa dalam foto arsitektur.",
      content: [
        "Banyak fotografer menghindari bayangan gelap, namun arsitektur keraton justru hidup di dalam keremangan (chiaroscuro).",
        "Di lorong Sumur Gumuling, berkas sinar matahari hanya masuk dari celah atap kubah bundar. Cahaya itu memotong kegelapan seperti pedang keheningan. Bayangan di sini bukan kekosongan, melainkan kanvas yang memberi arti pada cahaya itu sendiri.",
        "Belajarlah mencintai kegelapan, karena di sanalah cahaya memperlihatkan keagungannya."
      ]
    },
    {
      id: "jalan-kaliurang-di-kala-senja",
      category: "Perjalanan",
      title: "Jalan Kaliurang di Kala Senja",
      date: "Maret 2025",
      readTime: "6 menit baca",
      summary: "Catatan lapangan dan potret analog dari pesona jalan menanjak di bawah bayang-bayang pohon mahoni tua.",
      content: [
        "Ada rasa melankolia yang manis saat berkendara ke utara menyusuri Jalan Kaliurang menjelang Maghrib. Udara mulai dingin, aroma bakaran kayu arang dan wedang ronde mulai tercium di pinggir jalan.",
        "Jogja di malam hari adalah ruang di mana waktu berjalan lebih lambat. Setiap warung sederhana dan lampu teplok pinggir jalan memiliki cerita tentang persahabatan dan kehangatan yang tak lekang oleh zaman."
      ]
    }
  ]
};
