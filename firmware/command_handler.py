# command_handler.py — Command Ingestion & Safety Dispatcher
import time
import config

class CommandHandler:
    def __init__(self, pump_ctrl, cloud_client, ai_classifier, buzzer=None):
        self.pump_ctrl = pump_ctrl
        self.cloud_client = cloud_client
        self.ai_classifier = ai_classifier
        self.buzzer = buzzer
        self.processed_command_ids = []  # Cache de-duplikasi ID perintah agar tidak jalan 2x
        self.armed_command = None        # Menyimpan perintah yang siaga menunggu cangkir didekatkan

    def is_armed(self):
        """Mengembalikan True jika sedang menunggu cangkir diletakkan."""
        return self.armed_command is not None

    def check_armed_trigger(self, cup_detected, reservoir_pct, spill_detected):
        """
        Dipanggil terus-menerus di loop utama.
        Jika pengguna sudah memilih takaran di web, dan baru saja meletakkan cangkir,
        sistem akan mendeteksi kestabilan cangkir (~1 detik) lalu OTOMATIS MENYALAKAN POMPA!
        """
        if not self.armed_command:
            return

        now = time.ticks_ms()
        cmd_info = self.armed_command

        # 1. Batas waktu tunggu (Timeout 45 detik)
        if time.ticks_diff(now, cmd_info["armed_at"]) >= 45000:
            print("\n[AUTO-DISPENSE] Batas waktu meletakkan cangkir habis (Timeout 45s). Dibatalkan.")
            self.cloud_client.acknowledge_command(
                command_id=cmd_info["id"],
                status="FAILED",
                message="Waktu tunggu meletakkan cangkir telah habis."
            )
            if self.buzzer:
                self.buzzer.beep_error()
            self.armed_command = None
            return

        # 2. Cek bahaya fisik saat siaga
        if not cmd_info["bypass"]:
            if reservoir_pct <= config.RESERVOIR_CRITICAL_PCT or spill_detected:
                print("\n[AUTO-DISPENSE] Dibatalkan: Air tandon habis atau baki limpasan tergenang air.")
                self.cloud_client.acknowledge_command(
                    command_id=cmd_info["id"],
                    status="REJECTED",
                    message="Kondisi tandon kosong atau baki basah."
                )
                if self.buzzer:
                    self.buzzer.beep_alarm()
                self.armed_command = None
                return

        # 3. Deteksi Penempatan Cangkir
        if cup_detected:
            if cmd_info["cup_stable_since"] == 0:
                cmd_info["cup_stable_since"] = now
                print(f"[AUTO-DISPENSE] Cangkir terdeteksi! Memastikan posisi stabil (1 detik)...")
                if self.buzzer:
                    self.buzzer.beep_short()
            elif time.ticks_diff(now, cmd_info["cup_stable_since"]) >= 1000:
                # Cangkir stabil selama 1 detik penuh -> NYALAKAN POMPA OTOMATIS!
                print(f"\n>>> [AUTO-DISPENSE] CANGKIR STABIL! OTOMATIS MENUANG {cmd_info['volume_ml']} ML AIR <<<")
                if self.buzzer:
                    self.buzzer.beep_success()

                active_cmd = cmd_info
                self.armed_command = None  # Selesai masa tunggu

                self.cloud_client.acknowledge_command(
                    command_id=active_cmd["id"],
                    status="ACKNOWLEDGED",
                    message="Cangkir terdeteksi stabil. Dispensing dimulai otomatis."
                )

                success, msg = self.pump_ctrl.start_dispensing(
                    volume_ml=active_cmd["volume_ml"],
                    user_id=active_cmd["user_id"],
                    command_id=active_cmd["id"],
                    bypass_safety=active_cmd["bypass"]
                )

                if success:
                    self.cloud_client.acknowledge_command(
                        command_id=active_cmd["id"],
                        status="RUNNING",
                        message="Pompa aktif mengalirkan air."
                    )
        else:
            # Cangkir sempat terdeteksi tapi goyang/ditarik lagi
            cmd_info["cup_stable_since"] = 0

    def process_command(self, cmd, cup_detected, reservoir_pct, spill_detected):
        cmd_id = cmd.get("id")
        action = cmd.get("action")
        volume_ml = cmd.get("volume_ml", 0)
        user_id = cmd.get("user_id", "unknown")

        # Cek De-Duplikasi
        if cmd_id in self.processed_command_ids:
            return

        if cmd_id:
            self.processed_command_ids.append(cmd_id)
            if len(self.processed_command_ids) > 20:
                self.processed_command_ids.pop(0)

        print(f"[CMD] Memproses perintah: {action} (ID: {cmd_id})")

        # Perintah STOP DARURAT
        if action in ("STOP_DISPENSE", "STOP", "EMERGENCY_STOP"):
            if self.armed_command:
                print(f"[AUTO-DISPENSE] Mode siaga cangkir dibatalkan oleh perintah STOP.")
                self.armed_command = None
            measured = self.pump_ctrl.stop_dispensing(reason="REMOTE_STOP")
            self.cloud_client.acknowledge_command(
                command_id=cmd_id,
                status="COMPLETED",
                actual_volume_ml=measured,
                message="Perintah STOP diterima, pompa dimatikan."
            )
            return

        # Perintah MULAI PENUANGAN
        if action == "START_DISPENSE":
            bypass = cmd.get("bypass_safety", False) or getattr(config, "BYPASS_SAFETY_FOR_TEST", False)

            if not bypass:
                # 1. Cek air tandon
                if reservoir_pct <= config.RESERVOIR_CRITICAL_PCT:
                    print(f"[CMD REJECTED] Air tandon habis/kritis! (ID: {cmd_id})")
                    self.cloud_client.acknowledge_command(
                        command_id=cmd_id,
                        status="REJECTED",
                        message=f"Air tandon di bawah batas kritis ({reservoir_pct:.1f}%)."
                    )
                    return

                # 2. Cek baki tetesan
                if spill_detected:
                    print(f"[CMD REJECTED] Baki tetesan tergenang tumpahan air! (ID: {cmd_id})")
                    self.cloud_client.acknowledge_command(
                        command_id=cmd_id,
                        status="REJECTED",
                        message="Baki tetesan basah/tergenang tumpahan air."
                    )
                    return

                # 3. Cek Cangkir: Jika BELUM ada cangkir, MASUK KE MODE SIAGA OTOMATIS!
                if not cup_detected:
                    self.armed_command = {
                        "id": cmd_id,
                        "volume_ml": volume_ml,
                        "user_id": user_id,
                        "bypass": bypass,
                        "armed_at": time.ticks_ms(),
                        "cup_stable_since": 0
                    }
                    print(f"\n[AUTO-DISPENSE SIAGA] Takaran {volume_ml} ml siap! Silakan letakkan cangkir di bawah corong...")
                    if self.buzzer:
                        self.buzzer.beep_short()
                    self.cloud_client.acknowledge_command(
                        command_id=cmd_id,
                        status="ARMED",
                        message=f"Takaran {volume_ml} ml siap. Dekatkan cangkir ke corong dispenser untuk mulai otomatis."
                    )
                    return

            # Jika cangkir SUDAH ada (atau bypass aktif), langsung jalankan pompa!
            self.armed_command = None
            print(f"[CMD] Cangkir sudah terpasang. Langsung menuang {volume_ml} ml...")
            self.cloud_client.acknowledge_command(
                command_id=cmd_id,
                status="ACKNOWLEDGED",
                message="Kondisi fisik aman. Dispensing dimulai."
            )

            success, msg = self.pump_ctrl.start_dispensing(
                volume_ml=volume_ml,
                user_id=user_id,
                command_id=cmd_id,
                bypass_safety=bypass
            )

            if success:
                self.cloud_client.acknowledge_command(
                    command_id=cmd_id,
                    status="RUNNING",
                    message="Pompa aktif mengalirkan air."
                )
            else:
                self.cloud_client.acknowledge_command(
                    command_id=cmd_id,
                    status="FAILED",
                    message=msg
                )
