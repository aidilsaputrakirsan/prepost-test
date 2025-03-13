// README.md
# PrePostTEST

Aplikasi quiz yang mirip dengan Quizizz untuk pretest dan posttest. Aplikasi ini memungkinkan admin membuat quiz dan peserta untuk menjawab soal secara online.

## Fitur

### User
- Membuat nama peserta
- Menunggu di ruang tunggu
- Menjawab soal quiz
- Melihat hasil jawaban yang benar/salah langsung setelah menjawab
- Waktu menjawab 15 detik per soal
- Melihat hasil quiz dan peringkat

### Admin
- Login sebagai admin
- Membuat soal quiz
- Melihat jumlah peserta secara real-time
- Memulai quiz
- Menghentikan quiz
- Mereset quiz
- Menghapus peserta
- Melihat leaderboard

## Teknologi

- Frontend: React.js
- Backend: Node.js dengan Express
- Database: MongoDB Atlas
- Real-time: Socket.io
- Hosting: Vercel atau GitHub Pages

## Instalasi dan Penggunaan

### Prasyarat
- Node.js dan npm
- MongoDB Atlas account

### Langkah-langkah

1. Clone repository ini

```
git clone https://github.com/username/PREPOST-TEST.git
cd PREPOST-TEST
```

2. Install dependensi

```
npm run install-all
```

3. Buat file .env di folder server

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://aidilsaputrakirsan:<password>@preposttest.p3ovm.mongodb.net/?retryWrites=true&w=majority&appName=PrePostTEST
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
```

4. Jalankan aplikasi dalam mode development

```
npm run dev
```

5. Buat akun admin

Buka http://localhost:3000/admin/register untuk membuat akun admin.

## Deployment

Aplikasi ini dapat di-deploy ke Vercel dengan menggunakan konfigurasi yang sudah disediakan dalam file vercel.json.

## Kontribusi

Kontribusi untuk pengembangan aplikasi ini sangat diterima. Silakan buat issue atau pull request.

## Lisensi

MIT