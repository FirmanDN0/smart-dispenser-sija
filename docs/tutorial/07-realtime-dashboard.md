# TUTORIAL 07: MENGHUBUNGKAN FIREBASE KE LIVE DASHBOARD
## Smart Dispenser IoT — Integrasi Web Realtime via WebSocket

Tutorial ini menjelaskan bagaimana angka-angka sensor dari Firebase Realtime Database mengalir ke dalam antarmuka web Next.js secara instan tanpa perlu memuat ulang (*refresh*) halaman browser.

---

### 1. Cara Kerja Listener Realtime Firebase (`onValue`)
Pada aplikasi web konvensional, halaman web harus melakukan permintaan berulang (*HTTP polling*) setiap detik untuk memeriksa apakah ada data baru. Hal ini memboroskan kuota internet dan membuat browser terasa lambat.

Firebase Realtime Database menggunakan teknologi **WebSocket**:
1. Saat browser membuka halaman `/dashboard`, hook React `useDeviceTelemetry` membuka satu koneksi WebSocket permanen yang ringan ke server Google Firebase.
2. Setiap kali ESP32 mengirim data sensor baru ke node:
   `/devices/dispenser01/telemetry/latest`
3. Server Firebase secara proaktif mendorong (*push*) data tersebut ke browser dalam hitungan milidetik.
4. Fungsi `onValue` menerima snapshot baru, memicu fungsi `setTelemetry` pada React, dan angka di layar langsung berubah secara halus.

---

### 2. Memahami Struktur Hook `useDeviceTelemetry.ts`
Buka file `web/src/hooks/useDeviceTelemetry.ts` di VS Code untuk melihat implementasinya:

```typescript
useEffect(() => {
  const { db } = getFirebaseClient();

  if (db) {
    // 1. Tentukan path database yang ingin dipantau
    const telemRef = ref(db, `devices/${deviceId}/telemetry/latest`);

    // 2. Pasang listener realtime onValue
    const unsubscribe = onValue(telemRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setTelemetry(val); // Perbarui state tampilan React
      }
    });

    // 3. Bersihkan listener saat pengguna berpindah halaman
    return () => off(telemRef);
  }
}, [deviceId]);
```

**Kaidah Penting (Clean-up Function):**
Perhatikan baris `return () => off(telemRef);`. Fungsi ini wajib ada untuk memutus listener saat siswa berpindah ke halaman lain, sehingga memori browser tidak bocor (*memory leak*).

---

### 3. Langkah Pengujian Tampilan Realtime di Browser

1. Pastikan server lokal Next.js menyala (`pnpm run dev` pada folder `web`).
2. Buka browser dan login ke **`http://localhost:3000/dashboard`**.
3. Di tab browser lain, buka **Firebase Console** $\rightarrow$ **Realtime Database** $\rightarrow$ tab **Data**.
4. Buka node: `devices` $\rightarrow$ `dispenser01` $\rightarrow$ `telemetry` $\rightarrow$ `latest`.
5. Ubah salah satu nilai secara manual di Firebase Console untuk menguji:
   - Klik pada nilai `reservoir_percentage`, ubah angkanya dari `78` menjadi `15`, lalu tekan Enter.
6. Lihat kembali tab browser Dashboard Next.js Anda:
   - **Tanpa Anda refresh**, indikator tandon air akan langsung berubah menjadi warna kuning peringatan!
   - Banner status di bagian atas otomatis berubah menjadi:
     *"PERINGATAN: AIR TANDON RENDAH - Level tandon air rendah (15.0% <= 20.0%)."*
7. Kembalikan nilai `reservoir_percentage` ke `78` di Firebase Console:
   - Dashboard seketika kembali berwarna hijau normal (*AMAN*).

Ini membuktikan bahwa integrasi reaktif antara cloud Google dan antarmuka web Anda telah bekerja 100%!

Lanjutkan ke: **[Tutorial 08: Kontrol Pompa Air dari Website](file:///c:/XII%20SIJA%202/IOT/smart-dispenser/docs/tutorial/08-kontrol-pompa-dari-web.md)**.
