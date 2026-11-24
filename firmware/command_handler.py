# command_handler.py — Command Ingestion & Safety Dispatcher
import time
import config

class CommandHandler:
    def __init__(self, pump_ctrl, cloud_client, ai_classifier):
        self.pump_ctrl = pump_ctrl
        self.cloud_client = cloud_client
        self.ai_classifier = ai_classifier

    def process_command(self, cmd, cup_detected, reservoir_pct, spill_detected):
        """
        Processes a cloud command dictionary:
        {
            "id": "cmd_123",
            "action": "START_DISPENSE" | "STOP_DISPENSE",
            "volume_ml": 200,
            "user_id": "student_01",
            "expires_at": 1732338000000
        }
        """
        cmd_id = cmd.get("id")
        action = cmd.get("action")
        volume_ml = cmd.get("volume_ml", 0)
        user_id = cmd.get("user_id", "unknown")

        print(f"[CMD] Memproses perintah: {action} (ID: {cmd_id})")

        if action == "STOP_DISPENSE":
            measured = self.pump_ctrl.stop_dispensing(reason="REMOTE_STOP")
            self.cloud_client.acknowledge_command(
                command_id=cmd_id,
                status="COMPLETED",
                actual_volume_ml=measured,
                message="Perintah STOP diterima, pompa dimatikan."
            )
            return

        if action == "START_DISPENSE":
            # Safety Pre-conditions Check:
            # 1. Cup must be physically present
            if not cup_detected:
                print(f"[CMD REJECTED] Cangkir tidak terdeteksi! (ID: {cmd_id})")
                self.cloud_client.acknowledge_command(
                    command_id=cmd_id,
                    status="REJECTED",
                    message="Cangkir tidak terdeteksi pada dispenser."
                )
                return

            # 2. Reservoir water must not be depleted
            if reservoir_pct <= config.RESERVOIR_CRITICAL_PCT:
                print(f"[CMD REJECTED] Air tandon habis/kritis! (ID: {cmd_id})")
                self.cloud_client.acknowledge_command(
                    command_id=cmd_id,
                    status="REJECTED",
                    message=f"Air tandon di bawah batas kritis ({reservoir_pct:.1f}%)."
                )
                return

            # 3. Drip tray must not be flooded
            if spill_detected:
                print(f"[CMD REJECTED] Baki tetesan tergenang tumpahan air! (ID: {cmd_id})")
                self.cloud_client.acknowledge_command(
                    command_id=cmd_id,
                    status="REJECTED",
                    message="Baki tetesan basah/tergenang tumpahan air."
                )
                return

            # Accept command and start physical pump
            self.cloud_client.acknowledge_command(
                command_id=cmd_id,
                status="ACKNOWLEDGED",
                message="Kondisi fisik aman. Dispensing dimulai."
            )

            success, msg = self.pump_ctrl.start_dispensing(
                volume_ml=volume_ml,
                user_id=user_id,
                command_id=cmd_id
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
