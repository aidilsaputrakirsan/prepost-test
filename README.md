# PrePostTEST - Interactive Quiz Platform

![PrePostTEST Banner](https://i.imgur.com/XyPZCnL.png)

PrePostTEST adalah platform kuis interaktif modern yang dirancang untuk pendidik, pelatih, dan penyelenggara acara untuk membuat sesi kuis interaktif. Dengan dukungan untuk kuis langsung dan penilaian mandiri, PrePostTEST menawarkan platform fleksibel untuk pengujian pengetahuan di berbagai lingkungan.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fpreposttest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## ✨ Fitur

- **Pengalaman Kuis Real-time**: Sesi kuis langsung dengan hasil instan
- **Dashboard Admin**: Buat, kelola, dan kontrol kuis dengan mudah
- **Manajemen Peserta**: Lacak keterlibatan dan kinerja peserta
- **Papan Peringkat Dinamis**: Peringkat dan metrik kinerja real-time
- **Bank Soal**: Buat dan gunakan kembali pertanyaan di beberapa kuis
- **Mode Gelap/Terang**: Antarmuka menarik dengan dukungan tema
- **Desain Responsif**: Berfungsi sempurna di desktop, tablet, dan perangkat mobile
- **Analisis Hasil**: Wawasan mendetail tentang kinerja kuis
- **Pertanyaan Multi-format**: Dukungan untuk berbagai jenis pertanyaan (segera hadir)
- **Timer yang Dapat Disesuaikan**: Tetapkan batas waktu untuk pertanyaan
- **Perpindahan Otomatis**: Dukungan dua mode perpindahan otomatis:
  - **Mode Berbasis Waktu**: Otomatis pindah ketika timer habis
  - **Mode Berbasis Partisipasi**: Otomatis pindah ketika semua peserta telah menjawab

## 🚀 Demo

Coba aplikasi: [https://prepost-test-v3.vercel.app/](https://prepost-test-v3.vercel.app/)

**Kredensial Admin Demo:**
- Email: admin@example.com
- Password: admin123

## 🛠️ Teknologi

- **Frontend**:
  - Next.js 15.x (React 19.x)
  - TailwindCSS untuk styling
  - React Context API untuk manajemen state
  - Pembaruan real-time dengan Pusher

- **Backend**:
  - Next.js API Routes
  - MongoDB dengan Mongoose ODM
  - NextAuth.js untuk autentikasi
  - Pusher untuk komunikasi real-time

- **Infrastruktur**:
  - Vercel untuk hosting dan deployment
  - MongoDB Atlas untuk database

## 📋 Prasyarat

- Node.js 18.x atau lebih tinggi
- npm atau yarn
- Database MongoDB (lokal atau MongoDB Atlas)
- Akun Pusher untuk fungsionalitas real-time

## 🔧 Instalasi

1. **Clone repositori**

```bash
git clone https://github.com/yourusername/preposttest.git
cd preposttest
```

2. **Instal dependensi**

```bash
npm install
# atau
yarn install
```

3. **Siapkan variabel lingkungan**

Buat file `.env.local` di direktori root dengan variabel berikut:

```
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Pusher
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

4. **Buat pengguna admin**

```bash
npm run create-admin
# atau
yarn create-admin
```

5. **Jalankan server pengembangan**

```bash
npm run dev
# atau
yarn dev
```

6. **Buka browser Anda**

Buka [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi.

## 📱 Panduan Penggunaan

### Untuk Pembuat Kuis (Admin)

1. **Login ke panel admin**
   - Buka `/login`
   - Masukkan kredensial admin Anda

2. **Buat kuis baru**
   - Dari panel admin, klik "Create New Quiz"
   - Secara opsional tentukan ID kuis kustom

3. **Tambahkan pertanyaan**
   - Tambahkan pertanyaan dengan opsi pilihan ganda
   - Tetapkan jawaban yang benar dan batas waktu untuk setiap pertanyaan

4. **Bagikan kuis**
   - Dapatkan ID kuis atau tautan langsung untuk dibagikan dengan peserta

5. **Mulai dan kontrol kuis**
   - Gunakan panel kontrol untuk memulai kuis ketika siap
   - Pantau peserta secara real-time
   - Pilih mode perpindahan otomatis (berbasis waktu, berbasis partisipasi, atau keduanya)
   - Pindah pertanyaan secara manual jika diinginkan

6. **Lihat hasil**
   - Akses analitik mendetail setelah kuis selesai
   - Ekspor hasil sebagai CSV jika diperlukan

### Untuk Peserta

1. **Bergabung dengan kuis**
   - Masukkan ID kuis di halaman utama
   - Berikan nama Anda untuk bergabung

2. **Tunggu kuis dimulai**
   - Anda akan ditempatkan di ruang tunggu sampai admin memulai kuis

3. **Jawab pertanyaan**
   - Setiap pertanyaan memiliki batas waktu
   - Pilih jawaban Anda sebelum waktu habis

4. **Lihat hasil Anda**
   - Lihat skor dan jawaban benar Anda setelah kuis
   - Bandingkan peringkat Anda di papan peringkat

## 🏗️ Arsitektur

PrePostTEST menggunakan arsitektur modern berbasis Next.js dengan App Router:

```
app/                    # Direktori App Router
├── admin/              # Rute panel admin
│   ├── panel/          # Dashboard admin utama
│   ├── control/        # Antarmuka kontrol kuis
│   ├── create-question/# Pembuatan pertanyaan
│   ├── participants/   # Manajemen peserta
│   └── leaderboard/    # Tampilan papan peringkat admin
├── api/                # Rute API
│   ├── auth/           # Endpoint autentikasi
│   ├── quiz/           # Endpoint manajemen kuis
│   ├── pusher/         # Endpoint autentikasi Pusher
│   └── user/           # Endpoint manajemen pengguna
├── components/         # Komponen React
│   ├── common/         # Komponen bersama
│   └── quiz/           # Komponen spesifik kuis
├── context/            # Penyedia konteks React
├── hooks/              # Hook React kustom
├── lib/                # Fungsi dan pustaka utilitas
├── models/             # Model data Mongoose
├── join/               # Halaman bergabung dengan kuis
├── leaderboard/        # Halaman papan peringkat
├── login/              # Halaman login
├── quiz/               # Halaman kuis aktif
├── register/           # Halaman pendaftaran
├── results/            # Halaman hasil kuis
├── waiting-room/       # Halaman ruang tunggu
├── page.js             # Halaman beranda
└── layout.js           # Layout root
```

### Aliran Data

1. **Autentikasi**: NextAuth.js menangani autentikasi pengguna dengan token JWT
2. **Pembuatan Kuis**: Admin membuat kuis yang disimpan di MongoDB
3. **Bergabung dengan Peserta**: Peserta bergabung melalui ID kuis unik
4. **Pembaruan Real-time**: Saluran Pusher mengelola komunikasi real-time
5. **Manajemen State**: Context API mengelola state aplikasi
6. **Pemrosesan Hasil**: Server menghitung skor dan menghasilkan papan peringkat

## 🌐 Endpoint API

Aplikasi ini mengekspos beberapa endpoint API:

### Manajemen Kuis
- `GET /api/quiz` - Dapatkan semua kuis (hanya admin)
- `POST /api/quiz` - Buat kuis baru (hanya admin)
- `GET /api/quiz/[id]` - Dapatkan kuis berdasarkan ID
- `DELETE /api/quiz/[id]` - Hapus kuis (hanya admin)

### Manajemen Pertanyaan
- `GET /api/quiz/[id]/questions` - Dapatkan pertanyaan kuis
- `POST /api/quiz/[id]/questions` - Tambahkan pertanyaan ke kuis (hanya admin)
- `GET /api/quiz/[id]/current-question` - Dapatkan pertanyaan saat ini

### Kontrol Kuis
- `POST /api/quiz/[id]/start` - Mulai kuis (hanya admin)
- `POST /api/quiz/[id]/stop` - Hentikan kuis (hanya admin)
- `POST /api/quiz/[id]/next-question` - Pindah ke pertanyaan berikutnya (hanya admin)
- `POST /api/quiz/[id]/auto-advance` - Pengaturan kemajuan otomatis
- `POST /api/quiz/[id]/check-all-answered` - Periksa jika semua peserta telah menjawab
- `GET /api/quiz/[id]/timer-update` - Dapatkan informasi timer terbaru

### Manajemen Peserta
- `POST /api/user` - Buat peserta
- `GET /api/user/quiz/[quizId]` - Dapatkan peserta untuk kuis
- `DELETE /api/quiz/[quizId]/participants/[userId]` - Hapus peserta (hanya admin)

### Jawaban
- `POST /api/quiz/answer` - Kirim jawaban untuk pertanyaan
- `GET /api/quiz/[id]/user-answers` - Dapatkan jawaban pengguna untuk kuis
- `GET /api/quiz/[id]/answer-count/[questionId]` - Dapatkan jumlah jawaban untuk pertanyaan

### Papan Peringkat
- `GET /api/quiz/[id]/leaderboard` - Dapatkan papan peringkat untuk kuis

## 📊 Skema Database

Aplikasi ini menggunakan MongoDB dengan koleksi utama berikut:

- **Users**: Menyimpan pengguna admin dan peserta
- **QuizState**: Mengelola konfigurasi dan status kuis
- **Questions**: Menyimpan pertanyaan dan opsi kuis
- **Answers**: Mencatat jawaban peserta
- **Leaderboard**: Menyimpan hasil dan peringkat kuis

## 🚀 Deployment

### Deploy ke Vercel

1. Push kode Anda ke GitHub
2. Impor repositori Anda di Vercel
3. Konfigurasi variabel lingkungan di dashboard Vercel
4. Deploy

### Variabel Lingkungan untuk Produksi

Pastikan Anda mengatur variabel lingkungan berikut di lingkungan produksi:

- `MONGODB_URI`: String koneksi MongoDB Anda
- `NEXTAUTH_SECRET`: Secret untuk NextAuth.js
- `NEXTAUTH_URL`: URL produksi Anda
- `PUSHER_APP_ID`: ID aplikasi Pusher
- `PUSHER_SECRET`: Secret key Pusher
- `NEXT_PUBLIC_PUSHER_KEY`: Public key Pusher
- `NEXT_PUBLIC_PUSHER_CLUSTER`: Region cluster Pusher

## 🧪 Testing

Jalankan tes menggunakan Jest dan React Testing Library:

```bash
npm test
# atau
yarn test
```

## 🔄 Peningkatan Performa

### Optimasi Timer

Untuk mendapatkan performa timer yang lebih baik, terutama pada lingkungan Vercel:

1. **Gunakan timer hybrid client-server**:
   - Timer berbasis server melalui Pusher untuk akurasi
   - Timer berbasis klien sebagai fallback untuk responsivitas UI

2. **Optimasi Pusher**:
   - Pertimbangkan upgrade ke paket Pusher berbayar untuk throughput lebih baik
   - Batasi frekuensi update timer (hanya kirim di detik-detik tertentu)

3. **Versi Berbayar Vercel**:
   - Untuk aplikasi produksi, pertimbangkan upgrade ke paket Vercel Pro
   - Fungsi serverless pada paket Pro memiliki cold-start time yang lebih baik

## 🔄 Roadmap

- [ ] Dukungan multi-bahasa
- [ ] Lebih banyak jenis pertanyaan (pencocokan, isi-titik-titik, dll.)
- [ ] Tema dan branding kuis kustom
- [ ] Integrasi dengan platform LMS
- [ ] Mode offline dengan sinkronisasi
- [ ] Kuis berbasis tim
- [ ] Analisis jawaban yang lebih lengkap

## 👥 Kontribusi

Kontribusi sangat diterima! Silakan kirimkan Pull Request.

1. Fork repositori
2. Buat branch fitur Anda (`git checkout -b feature/amazing-feature`)
3. Commit perubahan Anda (`git commit -m 'Add some amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buka Pull Request

## 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT - lihat file [LICENSE](LICENSE) untuk detailnya.

## 🙏 Pengakuan

- Dibuat oleh Aidil Saputra Kirsan
- Desain ikon oleh [Heroicons](https://heroicons.com/)
- Animasi terinspirasi oleh [Framer Motion](https://www.framer.com/motion/)

---

## 📞 Kontak

Aidil Saputra Kirsan - [your-email@example.com](mailto:your-email@example.com)

Link Proyek: [https://github.com/yourusername/preposttest](https://github.com/yourusername/preposttest)