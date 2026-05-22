# Direktori Grup WhatsApp

Website statis mobile-first untuk direktori grup WhatsApp dengan fitur keamanan anti-scraper sederhana.

## Fitur
- ✅ Mobile First UI (TailwindCSS)
- ✅ Dark Mode Otomatis
- ✅ Enkripsi Link (XOR) - Link tidak terlihat di source code
- ✅ CAPTCHA Matematika & Countdown Redirect
- ✅ Admin Panel Tersembunyi (Tanpa Backend)
- ✅ Data Driven (groups.json)

## Cara Deploy ke GitHub Pages
1. Buat repository baru di GitHub (misal: `grup-wa`).
2. Upload file `index.html`, `app.js`, dan `groups.json` ke repository tersebut.
3. Masuk ke **Settings** > **Pages**.
4. Pada bagian **Source**, pilih `main` branch dan folder `/ (root)`.
5. Klik Save. Tunggu beberapa menit, website akan online.

## Cara Mengelola Data (Admin Mode)
1. Buka website yang sudah di-deploy.
2. Klik teks kecil **"Admin Login"** di footer sebanyak 5 kali.
3. Masukkan password: `admin123`.
4. Ikon Gear (⚙️) akan muncul di pojok kanan atas.
5. Klik ikon tersebut untuk tambah/edit/hapus grup.
6. Setelah selesai, klik **"Copy JSON Result"**.
7. Buka file `groups.json` di GitHub, paste hasilnya, lalu Commit changes.

## Cara Encode Link Manual
Jika ingin mengedit `groups.json` secara manual di GitHub tanpa login admin:
1. Ambil link WA: `https://chat.whatsapp.com/ABC123`
2. Gunakan tool online atau console browser untuk encode (XOR key 123).
3. Atau gunakan fitur Admin Panel di website untuk otomatisasi.

## Keamanan
- Link dienkripsi menggunakan XOR sederhana.
- Redirect hanya terjadi setelah interaksi user (klik + captcha).
- Mencegah bot scraper sederhana mengambil link secara massal.


Kamu tidak perlu menginstal apa pun! Emoji adalah karakter teks standar yang sudah ada di semua perangkat (HP, Laptop, Mac).
Berikut 3 cara termudah untuk mendapatkan emoji seperti yang saya gunakan:


Cara 1: Pakai Keyboard Bawaan (Paling Cepat)
Hampir semua device punya shortcut untuk membuka panel emoji:
Windows: Tekan tombol Windows + . (titik) secara bersamaan.
Mac: Tekan Control + Command + Spasi.
HP (Android/iPhone): Klik tombol ikon wajah/smile di keyboard saat mengetik.


Cara 2: Copy-Paste dari Daftar Ini (Siap Pakai)
Saya sudah buatkan daftar emoji yang cocok untuk kategori grup pendidikan/komunitas. Kamu tinggal blok, copy, dan paste ke dalam file groups.json:
🎓 Pendidikan & Sekolah
text
1
👶 Parenting & Anak
text
1
💻 Teknologi & Umum
text
1
🗣️ Bahasa & Komunikasi
text
1
🏆 Kegiatan & Prestasi
text
1
✨ Status/Badge (Untuk kolom status)
text
1



Cara 3: Situs Koleksi Emoji
Jika ingin mencari emoji spesifik lainnya, buka situs:
Emojipedia.org (Paling lengkap, ada deskripsi arti)
GetEmoji.com (Tinggal copy)
Contoh Cara Memasang di groups.json
Misalnya kamu mau buat grup "Komunitas Kucing", cari emoji kucing di keyboard (atau copy dari sini: 🐱), lalu masukkan ke JSON:
json
123456789
Tips: Dalam satu baris icon, cukup masukkan satu emoji saja agar tampilan di HP rapi dan tidak berantakan.

