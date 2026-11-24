# PANDUAN PINOUT & PENGKABELAN ELEKTRIKAL HARDWARE
## Smart Dispenser IoT — SMK Telkom Sidoarjo (XII SIJA UKL 3)

### 1. Tabel Alokasi Pin ESP32 DevKit V1 (MANDATORI)

| Komponen Hardware | Pin Perangkat | GPIO ESP32 | Mode Pin | Deskripsi Fungsi |
|---|---|---|---|---|
| **HC-SR04 Cangkir** | TRIG | **GPIO 13** | Output Digital | Trigger pulsa ultrasonik 10 µs |
| **HC-SR04 Cangkir** | ECHO | **GPIO 14** | Input Digital | Echo pulsa (wajib pembagi tegangan 5V ke 3.3V) |
| **HC-SR04 Tandon** | TRIG | **GPIO 16** | Output Digital | Trigger pulsa ultrasonik 10 µs |
| **HC-SR04 Tandon** | ECHO | **GPIO 17** | Input Digital | Echo pulsa (wajib pembagi tegangan 5V ke 3.3V) |
| **YF-S201 Flow Sensor** | SIGNAL (Kuning) | **GPIO 27** | Input Interrupt | Penghitung pulsa frekuensi aliran air |
| **Modul Relay 5V** | IN | **GPIO 26** | Output Digital | Pengendali on/off pompa air (Active-Low) |
| **Spill Sensor (Baki)** | S (Analog) | **GPIO 34** | Input ADC | Pembaca resistansi genangan air baki tetesan |
| **Passive Buzzer** | S / IN | **GPIO 25** | Output PWM | Nada audio peringatan dan alarm darurat |

---

### 2. Diagram Proteksi Sinyal ECHO (Voltage Divider 5V -> 3.3V)

Pin GPIO ESP32 **tidak toleran terhadap tegangan 5V** (maksimal 3.3V). Pin ECHO HC-SR04 mengeluarkan sinyal 5V sehingga WAJIB dipasang pembagi tegangan resistor:

```text
ECHO Pin (HC-SR04) [5V Sinyal]
       |
     [ 1kΩ Resistor R1 ]
       |
       +-----> Ke Pin GPIO 14 / GPIO 17 ESP32 [~3.3V Aman]
       |
     [ 2kΩ Resistor R2 ]
       |
      GND (Ground Bersama)
```

Perhitungan Rumus:
$$V_{out} = V_{in} \times \frac{R_2}{R_1 + R_2} = 5V \times \frac{2000}{1000 + 2000} = 3.33V$$

---

### 3. Catu Daya dan Isolasi Pompa Air

- **ESP32**: Diberi daya 5V melalui port Micro USB laptop atau adaptor 5V 1A terpisah.
- **Pompa Submersible 5V**: Diberi daya dari adaptor DC 5V 2A eksternal terpisah (JANGAN mengambil daya pompa langsung dari pin VIN/3V3 ESP32 karena lonjakan arus induktif pompa dapat me-reset mikrokontroler).
- **Grounding**: Hubungkan kabel **GND adaptor pompa** dengan **GND ESP32** (Common Ground).
- **Diode Flyback (1N4007)**: Disarankan dipasang paralel terbalik pada terminal motor pompa untuk meredam tegangan balik EMF saat relay memutus arus.

---

### 4. Konfigurasi 3 Sensor & 3 Aktuator untuk Aspek Penilaian UKL 3

Berdasarkan Buku Panduan UKL 3 SMK Telkom Sidoarjo 2026/2027:
- **Sensor yang diimplementasikan (Total 4 Sensor)**:
  1. Sensor Ultrasonik HC-SR04 Deteksi Cangkir
  2. Sensor Ultrasonik HC-SR04 Level Tandon Air
  3. Sensor Aliran Air Water Flow YF-S201
  4. Sensor Analog Level Tetesan Baki (Spill Tray)
- **Aktuator yang diimplementasikan**:
  1. Modul Relay 1-Channel 5V
  2. Pompa Air Submersible 5V (beban mekanik fluida)
  3. Passive Buzzer PWM (indikator nada akustik)

> *Catatan Pengujian UKL:* Sebagian guru penguji menganggap Modul Relay dan Pompa sebagai 1 kesatuan jalur aktuator. Jika penguji meminta 3 aktuator fisik terpisah, tambahkan 1 LED Indikator Status pada GPIO 33 atau konsultasikan bahwa Relay, Pompa, dan Buzzer telah memenuhi kriteria.
