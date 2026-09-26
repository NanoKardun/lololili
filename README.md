# KuisKu Online (versi sederhana) – untuk Netlify + GitHub

Game kuis online dengan **ruang tunggu (lobi)**: game baru bisa dimulai kalau
pemain sudah **minimal 2 orang**. Kunci jawaban tidak pernah dikirim ke browser
selagi soal berlangsung.

Ini versi ringkas: **tanpa** Tailwind/CDN (murni HTML + CSS polos), **tanpa**
bonus kecepatan/streak (skor tetap: 100 poin per jawaban benar), **tanpa**
konsep host (begitu pemain minimal terpenuhi, siapa pun boleh menekan "Mulai
game"), dan **tanpa** fitur main-ulang otomatis (kalau ingin main lagi, buat
ruang baru).

## Struktur proyek

```
kuisku-simple/
├─ public/
│  └─ index.html            ← satu-satunya file yang di-hosting (HTML+CSS+JS)
├─ netlify/functions/
│  ├─ quizzes.js             ← daftar kuis (tanpa jawaban) untuk beranda
│  ├─ create.js               ← membuat ruang baru
│  ├─ join.js                 ← bergabung dengan kode
│  ├─ state.js                ← diambil klien tiap ±1 detik untuk status terbaru
│  ├─ start.js                ← memulai game (menolak jika pemain < 2)
│  ├─ answer.js                ← mengirim jawaban
│  └─ lib/
│     ├─ quiz-data.js          ← DI SINI tempat menambah/mengubah soal
│     ├─ game.js               ← aturan main (lobi, soal, skor)
│     └─ store.js              ← penyimpanan ruang (Netlify Blobs)
├─ netlify.toml
└─ package.json
```

`public/index.html` tidak berisi soal atau jawaban apa pun — semuanya ada di
`netlify/functions/lib/quiz-data.js`, yang letaknya di luar folder `public`
sehingga tidak pernah ter-hosting dan tidak bisa dibuka lewat URL.

## Deploy: GitHub + Netlify (langkah lengkap)

1. **Unggah folder ini ke GitHub.**
   - Buat repo baru di GitHub (boleh kosong).
   - Di komputer, di dalam folder `kuisku-simple`:
     ```bash
     git init
     git add .
     git commit -m "KuisKu Online"
     git branch -M main
     git remote add origin https://github.com/<username>/<nama-repo>.git
     git push -u origin main
     ```

2. **Hubungkan ke Netlify.**
   - Buka [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
   - Pilih GitHub, lalu pilih repo yang baru dibuat.
   - Pengaturan build otomatis terbaca dari `netlify.toml` (publish: `public`,
     functions: `netlify/functions`, build command: `npm install`). Tidak perlu
     diubah — klik **Deploy site**.

3. Setelah selesai (biasanya 1–2 menit), Netlify memberi alamat seperti
   `nama-acak.netlify.app`. Itu sudah bisa langsung dipakai untuk main bareng.

4. **Update selanjutnya** (misalnya menambah soal): edit filenya, lalu
   `git add . && git commit -m "update soal" && git push`. Netlify otomatis
   men-deploy ulang setiap ada push ke GitHub.

## Cara main
1. Pemain pertama memilih kuis lalu menekan **Buat ruang**.
2. Bagikan **kode 5 karakter** ke teman.
3. Teman membuka situsnya, memasukkan kode di kolom **Gabung dengan kode**.
4. Begitu pemain terkumpul minimal 2, tombol **Mulai game** aktif dan siapa
   saja boleh menekannya.
5. Semua pemain menjawab soal yang sama secara bersamaan (15 detik per soal,
   100 poin tiap jawaban benar). Di akhir tampil hasil akhir.

## Kenapa jawaban tidak bisa dilihat lewat Inspect
- Kunci jawaban hanya ada di `quiz-data.js`, dibaca oleh fungsi backend, tidak
  pernah dikirim ke browser dan tidak bisa diunduh lewat URL.
- Selama soal berlangsung, respons `/api/state` hanya berisi teks soal dan 4
  pilihan, tanpa penanda mana yang benar. Kunci baru dikirim setelah semua
  pemain menjawab atau waktu habis.
- Skor dihitung di backend, bukan di browser.

## Batasan versi sederhana ini (dengan sengaja, supaya kodenya ringkas)
- **Bukan realtime murni** — ada jeda sampai ±1 detik karena klien mengambil
  status terbaru secara berkala (polling), bukan didorong langsung dari server.
- **Tidak ada konsep host** — siapa pun di ruang tunggu bisa menekan "Mulai
  game" begitu pemain minimal terpenuhi.
- **Tidak ada penanganan khusus jika pemain keluar di tengah game** — game
  tetap berjalan; skor pemain yang terputus berhenti bertambah, tapi game
  tidak otomatis berhenti seperti versi yang lebih lengkap.
- **Skor tetap** (100 per jawaban benar), tidak ada bonus kecepatan atau
  bonus streak berturut-turut.
- **Tidak ada tombol main-ulang** — untuk main lagi, buat ruang baru.

Kalau nanti butuh salah satu fitur di atas, bilang saja — bisa ditambahkan
belakangan tanpa menulis ulang semuanya.

## Pengaturan (opsional)
Atur di Netlify: **Site settings → Environment variables**.

| Variabel      | Default | Fungsi                              |
|----------------|---------|--------------------------------------|
| `MIN_PLAYERS`  | 2       | Minimal pemain untuk memulai game    |

## Catatan jujur
Kode ini disusun mengikuti dokumentasi resmi Netlify Blobs, dan logika
permainannya sudah diuji dengan simulasi (bukan lewat Netlify sungguhan,
karena keterbatasan lingkungan saat menulis kode ini). Kalau ada error
setelah deploy, kirim pesan errornya untuk diperbaiki.
