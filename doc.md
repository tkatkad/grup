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
