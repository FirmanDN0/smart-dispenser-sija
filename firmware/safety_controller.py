# safety_controller.py — Local Physical Safety Interlock
# The ESP32 is the ultimate authority for physical pump safety.
# Emergency shutdown must execute within milliseconds without waiting for cloud/Wi-Fi.
import time
import config

class SafetyController:
    def __init__(self, pump_controller, event_logger):
        self.pump_ctrl = pump_controller
        self.event_logger = event_logger
        self.cup_missing_streak = 0

    def check_safety_and_enforce(self, cup_detected, spill_detected, tray_adc, flow_pulses, no_flow_ms):
        """
        Evaluates physical safety invariants.
        If pump is active and an emergency condition occurs:
        1. Instantly turns OFF relay.
        2. Logs violation event locally (with deduplication).
        3. Returns (is_safe, violation_type)
        """
        if not self.pump_ctrl.is_dispensing:
            self.cup_missing_streak = 0
            return True, None

        # Jika mode bypass safety aktif, jangan potong pengisian di tengah jalan
        if getattr(self.pump_ctrl, 'bypass_safety', False):
            return True, None

        # Critical Invariant 1: Cup removal during active dispense (dengan debouncing 3x agar tahan glitch sensor)
        if not cup_detected:
            self.cup_missing_streak += 1
            if self.cup_missing_streak >= 3:
                measured_ml = self.pump_ctrl.stop_dispensing(reason="EMERGENCY_CUP_REMOVED")
                self.event_logger.record_violation(
                    violation_type="CUP_REMOVED_DURING_FILL",
                    severity="HIGH",
                    description="Cangkir diangkat saat pompa sedang aktif mengisi air.",
                    sensor_snapshot={
                        "tray_adc": tray_adc,
                        "flow_pulses": flow_pulses,
                        "measured_volume_ml": measured_ml
                    },
                    user_id=self.pump_ctrl.current_user_id
                )
                return False, "CUP_REMOVED_DURING_FILL"
        else:
            self.cup_missing_streak = 0

        # Critical Invariant 2: Spill on drip tray
        if spill_detected:
            measured_ml = self.pump_ctrl.stop_dispensing(reason="EMERGENCY_SPILL")
            self.event_logger.record_violation(
                violation_type="TRAY_SPILL_DETECTED",
                severity="CRITICAL",
                description=f"Genangan air terdeteksi pada baki tetesan (ADC {tray_adc}).",
                sensor_snapshot={
                    "tray_adc": tray_adc,
                    "flow_pulses": flow_pulses,
                    "measured_volume_ml": measured_ml
                },
                user_id=self.pump_ctrl.current_user_id
            )
            return False, "TRAY_SPILL_DETECTED"

        # Invariant 3: Dry run / Flow sensor blockage
        if no_flow_ms > config.FLOW_NO_PULSE_TIMEOUT_MS:
            self.pump_ctrl.stop_dispensing(reason="FLOW_ERROR")
            return False, "NO_FLOW_BLOCKAGE"

        return True, None
