/* =====================================================================
   DAFTAR KUIS – satu-satunya tempat untuk menambah/mengubah soal.
   File ini ada di netlify/functions/lib, BUKAN di folder "public",
   jadi tidak pernah ikut ter-hosting dan tidak bisa dibuka lewat URL.

   Format satu soal:
     { q: 'Pertanyaan?', options: ['A', 'B', 'C', 'D'], answer: 1 }
   - options : harus tepat 4 pilihan
   - answer  : nomor jawaban benar, dihitung dari 0 (0 = pilihan pertama)

   Semua soal memakai waktu yang sama (lihat QUESTION_SECONDS di game.js)
   supaya sederhana. Setelah mengubah file ini, deploy ulang ke Netlify.
   ===================================================================== */
module.exports = [
  { id: 'umum', title: 'Pengetahuan Umum Indonesia', questions: [
    { q: 'Apa ibu kota negara Indonesia saat ini (sebelum IKN berfungsi penuh)?', options: ['Bandung', 'Jakarta', 'Surabaya', 'Medan'], answer: 1 },
    { q: 'Pulau terbesar di Indonesia adalah…', options: ['Jawa', 'Sumatra', 'Kalimantan', 'Papua'], answer: 2 },
    { q: 'Siapa yang membacakan teks Proklamasi Kemerdekaan Indonesia?', options: ['Moh. Hatta', 'Sutan Sjahrir', 'Soekarno', 'Ki Hajar Dewantara'], answer: 2 },
    { q: 'Tari Kecak berasal dari daerah…', options: ['Bali', 'Aceh', 'Sulawesi Selatan', 'Sumatra Barat'], answer: 0 },
    { q: 'Danau vulkanik terbesar di Indonesia adalah…', options: ['Danau Batur', 'Danau Poso', 'Danau Toba', 'Danau Singkarak'], answer: 2 },
    { q: 'Lambang sila pertama Pancasila adalah…', options: ['Rantai', 'Bintang', 'Pohon beringin', 'Kepala banteng'], answer: 1 }
  ]},
  { id: 'mtk', title: 'Matematika Kilat', questions: [
    { q: '12 × 8 = …', options: ['86', '96', '108', '88'], answer: 1 },
    { q: 'Akar kuadrat dari 144 adalah…', options: ['11', '12', '13', '14'], answer: 1 },
    { q: '25% dari 240 adalah…', options: ['50', '60', '48', '70'], answer: 1 },
    { q: 'Jumlah sudut dalam segitiga adalah…', options: ['90°', '270°', '180°', '360°'], answer: 2 },
    { q: '7² + 3² = …', options: ['58', '49', '52', '64'], answer: 0 },
    { q: 'Hasil dari 1/2 + 1/4 adalah…', options: ['2/6', '3/4', '1/8', '2/4'], answer: 1 }
  ]},
  { id: 'sains', title: 'Sains & Teknologi', questions: [
    { q: 'Planet terdekat dari Matahari adalah…', options: ['Venus', 'Bumi', 'Merkurius', 'Mars'], answer: 2 },
    { q: 'Rumus kimia air adalah…', options: ['CO₂', 'H₂O', 'O₂', 'NaCl'], answer: 1 },
    { q: 'HTML adalah singkatan dari…', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'HyperText Machine Logic'], answer: 0 },
    { q: 'Gas yang paling banyak di atmosfer Bumi adalah…', options: ['Oksigen', 'Karbon dioksida', 'Nitrogen', 'Hidrogen'], answer: 2 },
    { q: 'Organ yang memompa darah ke seluruh tubuh adalah…', options: ['Paru-paru', 'Hati', 'Ginjal', 'Jantung'], answer: 3 }
  ]}
  // Tambahkan kuis baru di sini, contoh:
  // , { id: 'sejarah', title: 'Sejarah Kelas 8', questions: [ { q: '...', options: ['A','B','C','D'], answer: 0 } ] }
];
