# pump_controller.py — High-Level Water Dispensing Manager
import time
import config

class PumpController:
    """
    Manages dispensing sessions, monitors volume targets via FlowMeter,
    and coordinates with RelayController.
    """
    def __init__(self, relay, flow_meter, buzzer):
        self.relay = relay
        self.flow_meter = flow_meter
        self.buzzer = buzzer

        self.is_dispensing = False
        self.target_volume_ml = 0
        self.session_start_ms = 0
        self.current_user_id = None
        self.active_command_id = None
        self.bypass_safety = False

    def start_dispensing(self, volume_ml, user_id=None, command_id=None, bypass_safety=False):
        """Initiates water dispensing."""
        if self.is_dispensing:
            return False, "Pompa sudah dalam keadaan aktif."

        self.target_volume_ml = volume_ml
        self.current_user_id = user_id
        self.active_command_id = command_id
        self.session_start_ms = time.ticks_ms()
        self.bypass_safety = bypass_safety

        # Pastikan sesi flow meter di-reset ke 0 sebelum memulai pengisian baru!
        self.flow_meter.reset_session()
        self.flow_meter.start_session()
        self.relay.on()
        self.is_dispensing = True

        # Audible confirmation tone
        self.buzzer.beep_start()
        print(f"[PUMP] Dispensing dimulai: Target {volume_ml} ml.")
        return True, "Dispensing dimulai."

    def stop_dispensing(self, reason="NORMAL"):
        """Stops dispensing immediately."""
        if not self.is_dispensing and not self.relay.is_on():
            return 0.0

        # Physical safety: Relay turned off immediately!
        self.relay.off()
        self.is_dispensing = False
        self.flow_meter.stop_session()

        measured_ml = self.flow_meter.get_measured_volume_ml()
        pulses = self.flow_meter.get_session_pulses()
        print(f"[PUMP STOP] Alasan: {reason} | Pulsa: {pulses} | Volume: {measured_ml} ml.")

        if reason == "COMPLETED":
            self.buzzer.beep_success()
        elif reason in ("EMERGENCY_CUP_REMOVED", "EMERGENCY_SPILL", "FLOW_ERROR"):
            self.buzzer.beep_alarm()

        return measured_ml

    def update(self):
        """
        Called in the high-frequency control loop during dispensing.
        Checks target volume and hard duration cutoffs.
        Returns: status_code ("RUNNING", "COMPLETED", "TIMEOUT", "NONE")
        """
        if not self.is_dispensing:
            return "NONE"

        measured_ml = self.flow_meter.get_measured_volume_ml()
        elapsed_ms = time.ticks_diff(time.ticks_ms(), self.session_start_ms)

        # Target volume reached (dengan kompensasi inersia / sisa kucuran air)
        cutoff_threshold = max(10, self.target_volume_ml - getattr(config, "FLOW_CUTOFF_OFFSET_ML", 0))
        if measured_ml >= cutoff_threshold:
            self.stop_dispensing(reason="COMPLETED")
            return "COMPLETED"

        # Hard timeout cutoff (prevent infinite run in case of sensor disconnect)
        if elapsed_ms >= config.MAX_DISPENSE_DURATION_MS:
            self.stop_dispensing(reason="TIMEOUT_HARD_LIMIT")
            return "TIMEOUT"

        return "RUNNING"
