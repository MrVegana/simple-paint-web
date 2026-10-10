# P5 Studio Paint 🎨

Aplikasi web menggambar interaktif dan manipulasi grafis berbasis **p5.js**, **HTML5**, **CSS3**, dan **Vanilla JavaScript**. Dirancang khusus untuk tugas/UTS Grafika Komputer dengan dukungan lengkap untuk transformasi geometri 2D, bentuk primitif, pemuatan gambar, dan siap dideploy langsung ke **GitHub Pages**.

---

## 🌟 Fitur Utama

### 1. 📷 Muat Gambar (Load Image)
- **Unggah dari Perangkat**: Tombol "Pilih Gambar Perangkat" untuk memuat file gambar lokal (PNG, JPG, SVG, WebP).
- **Drag & Drop**: Seret file gambar langsung dari file manager ke area kanvas atau dropzone.
- **Muat via URL**: Masukkan tautan gambar eksternal untuk langsung dimuat ke kanvas.
- **Dukungan Transformasi Penuh**: Gambar yang dimuat diperlakukan sebagai objek grafis yang dapat digeser (translate), diputar (rotate), dan diubah skalanya (scale).

### 2. 📐 Bentuk Primitif p5.js (Shape Primitives)
Aplikasi mendukung pembuatan bentuk geometri standar p5.js:
- `Line`: Garis lurus dengan ketebalan dan warna stroke.
- `Rect`: Persegi / persegi panjang.
- `Ellipse`: Lingkaran atau lonjong elips.
- `Triangle`: Segitiga 3 titik.
- `Quad`: Poligon segiempat 4 titik (`quad()` di p5.js).
- `Point`: Titik presisi dengan kontrol ukuran.
- `Kuas Bebas (Brush)`: Menggambar kurva bebas (freehand drawing).

### 3. 🎨 Kustomisasi Warna Datar (Flat Color)
- **Warna Isi (Fill)**: Color picker + input kode Hex `#RRGGBB` + toggle aktif/nonaktif fill.
- **Warna Garis (Stroke)**: Color picker + input kode Hex + toggle aktif/nonaktif stroke.
- **Ketebalan Garis (Stroke Weight)**: Slider interaktif dari 1px hingga 40px.
- **Palet Warna Cepat**: 10 swatch warna datar siap pakai untuk efisiensi pemilihan warna.

### 4. 🔄 Transformasi Geometri Objek (2D Transformations)
Mengimplementasikan matriks transformasi grafis komputer p5.js (`push()`, `translate()`, `rotate()`, `scale()`, `pop()`):
- **Pergeseran (Translation)**:
  - Interaktif: Klik & tarik (drag) objek pada kanvas.
  - Input Presisi: Masukkan nilai koordinat X dan Y pada sidebar.
  - Tombol cepat: "Tengahkan Objek" ke tengah kanvas.
- **Rotasi (Rotation)**:
  - Interaktif: Tarik tuas lingkaran (gizmo handle) di atas bounding box objek.
  - Slider & Angka: Rentang -180° s/d 180° atau input derajat.
  - Tombol cepat: `-90°`, `+90°`, dan `Reset (0°)`.
- **Pengubahan Ukuran (Scaling)**:
  - Interaktif: Tarik 4 handle sudut (corner handles) pada bounding box.
  - Slider & Angka: Skala dari `0.1×` (10%) hingga `5.0×` (500%).
  - Tombol cepat: `0.5×` (setengah), `1.0×` (normal), `2.0×` (dua kali lipat).

### 5. 🛠️ Fitur Tambahan & Produktivitas
- **Bounding Box & Gizmo Transform**: Kotak seleksi visual modern dengan garis putus-putus dan tuas interaktif.
- **Undo & Redo**: Riwayat aksi kanvas (`Ctrl+Z` / `Ctrl+Y`).
- **Manajemen Lapisan**: Lapisan Atas (Bring to Front), Lapisan Bawah (Send to Back).
- **Duplikasi & Hapus**: Duplikat objek (`Ctrl+D`) atau hapus (`Delete`/`Backspace`).
- **Ukuran Kanvas Kustom**: Pilihan preset Default (850×550), HD (1000×600), dan Persegi 1:1 (600×600).
- **Ekspor Gambar**: Simpan hasil karya langsung ke format **PNG** (transparan/berlatar) atau **JPG**.

---

## 📁 Struktur Berkas

```
uts-harriz/
├── index.html        # Struktur antarmuka dan panel kontrol
├── style.css         # Desain studio modern (Dark Mode, responsive)
├── script.js         # Logika p5.js, matematika transformasi, event handling
└── README.md         # Dokumentasi dan panduan deployment
```

> **Catatan:** Aplikasi ini bersifat murni static web tanpa dependensi build (zero-build setup). P5.js dimuat langsung melalui CDN terpercaya.

---

## ⌨️ Pintasan Papan Ketik (Keyboard Shortcuts)

| Tombol | Fungsi |
|---|---|
| <kbd>V</kbd> | Beralih ke Mode Seleksi & Transformasi |
| <kbd>B</kbd> | Beralih ke Kuas Bebas (Freehand Brush) |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | Hapus objek terpilih |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo (Batalkan aksi) |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Redo (Ulangi aksi) |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Duplikasi objek terpilih |

---

## 🚀 Panduan Menjalankan Secara Lokal

1. Buka folder proyek di editor (VS Code atau Antigravity IDE).
2. Anda dapat langsung membuka file `index.html` dengan cara:
   - Dobel klik file `index.html` di browser Anda (Chrome, Edge, Firefox), **ATAU**
   - Menggunakan ekstensi **Live Server** di VS Code (klik kanan `index.html` -> *Open with Live Server*), **ATAU**
   - Menjalankan server lokal sederhana via terminal:
     ```bash
     # Menggunakan Python 3:
     python -m http.server 8000
     # Lalu buka di browser: http://localhost:8000
     ```

---

## 🌐 Panduan Deploy ke GitHub Pages

Aplikasi ini sudah dioptimalkan dan siap 100% untuk dideploy ke GitHub Pages gratis:

### Langkah 1: Buat Repositori Baru di GitHub
1. Masuk ke akun [GitHub](https://github.com/).
2. Buat repositori baru (misalnya dengan nama `p5-paint-studio` atau `uts-grafika`).
3. Biarkan repositori disetel sebagai **Public**.

### Langkah 2: Unggah Berkas ke GitHub
Di terminal folder proyek ini:
```bash
# Inisialisasi git jika belum
git init

# Tambahkan semua berkas
git add .

# Buat commit pertama
git commit -m "Initial commit: P5 Studio Paint App"

# Ubah branch utama menjadi main
git branch -M main

# Hubungkan ke repository GitHub Anda (ganti username dan nama repo)
git remote add origin https://github.com/USERNAME/p5-paint-studio.git

# Unggah berkas
git push -u origin main
```

### Langkah 3: Aktifkan GitHub Pages
1. Di halaman repositori GitHub Anda, klik tab **Settings**.
2. Pada menu sidebar kiri, pilih menu **Pages**.
3. Di bagian **Build and deployment** -> **Source**, pilih **Deploy from a branch**.
4. Di bagian **Branch**, pilih branch `main` dan folder `/(root)`, kemudian klik tombol **Save**.
5. Tunggu sekitar 1–2 menit hingga proses build selesai.
6. Halaman web Anda akan aktif di alamat:
   ```
   https://USERNAME.github.io/p5-paint-studio/
   ```

---

## 🧠 Konsep Grafika Komputer yang Diterapkan

Aplikasi ini mendemonstrasikan implementasi matematika grafika 2D:

1. **Model Objek Berbasis Vektor (Object-Based Graphics)**:
   Setiap bentuk disimpan sebagai struktur data terpisah dengan properti transformasi lokal:
   $$\text{Objek} = \{x, y, \theta, s, w, h, \dots\}$$
2. **Matriks Transformasi Hirarkis**:
   Menggunakan tumpukan matriks p5.js:
   ```javascript
   push();
   translate(obj.x, obj.y);  // Translasi ke titik pusat objek
   rotate(obj.rotation);     // Rotasi terhadap titik pusat objek
   scale(obj.scale);         // Penskalaan proporsional
   // Gambar primitif terpusat di (0, 0)
   pop();
   ```
3. **Inversi Transformasi untuk Hit Testing**:
   Saat pengguna mengklik kanvas di posisi $(x_m, y_m)$, titik tersebut ditransformasikan secara terbalik ke dalam sistem koordinat lokal objek:
   $$\begin{bmatrix} x_{local} \\ y_{local} \end{bmatrix} = \frac{1}{s} \begin{bmatrix} \cos(-\theta) & -\sin(-\theta) \\ \sin(-\theta) & \cos(-\theta) \end{bmatrix} \begin{bmatrix} x_m - x \\ y_m - y \end{bmatrix}$$
   Hal ini memungkinkan penentuan klik objek yang akurat meskipun objek telah diputar dan diskalakan dalam berbagai sudut.
