# ai_classifier.py — Explainable Rule-Based Sensor Classifier for MicroPython
# Directly executes rule priorities matching ai/model_config.json
import config

class AIClassifier:
    def __init__(self):
        self.last_classification = "AMAN"
        self.last_risk_level = "LOW"
        self.last_explanation = "Sistem siap beroperasi."

    def classify(self, sensor_data):
        """
        Takes sensor readings dict:
        {
            "cup_distance_cm": float,
            "cup_detected": bool,
            "reservoir_distance_cm": float,
            "reservoir_percentage": float,
            "tray_adc": int,
            "flow_pulses": int,
            "pump_running": bool,
            "no_flow_duration_ms": int,
            "sensor_validity": bool
        }
        Returns: (classification, risk_level, explanation, action)
        """
        valid = sensor_data.get("sensor_validity", True)
        cup_cm = sensor_data.get("cup_distance_cm", -1)
        res_cm = sensor_data.get("reservoir_distance_cm", -1)
        res_pct = sensor_data.get("reservoir_percentage", 0.0)
        tray_adc = sensor_data.get("tray_adc", 0)
        cup_det = sensor_data.get("cup_detected", False)
        pump_on = sensor_data.get("pump_running", False)
        flow_pulses = sensor_data.get("flow_pulses", 0)
        no_flow_ms = sensor_data.get("no_flow_duration_ms", 0)

        # Rule 1: SENSOR_ERROR
        if not valid or cup_cm < 0 or res_cm < 0 or cup_cm > 200 or res_cm > 200:
            c, r = "SENSOR_ERROR", "HIGH"
            exp = "Sensor ultrasonik atau ADC membaca nilai di luar batas fisik valid."
            act = "HALT_SYSTEM_CHECK_WIRING"

        # Rule 2: TUMPAHAN (Drip tray spill detected)
        elif tray_adc >= config.SPILL_THRESHOLD_ADC:
            c, r = "TUMPAHAN", "CRITICAL"
            exp = f"Baki tetesan mendeteksi tumpahan air (ADC {tray_adc} >= {config.SPILL_THRESHOLD_ADC})."
            act = "EMERGENCY_SHUTDOWN_PUMP_BUZZER_ALARM"

        # Rule 3: GELAS_TIDAK_ADA while pump is running
        elif pump_on and not cup_det:
            c, r = "GELAS_TIDAK_ADA", "CRITICAL"
            exp = f"Cangkir terlepas saat pompa menyala (jarak {cup_cm} cm > {config.CUP_DETECTED_MAX_CM} cm)."
            act = "EMERGENCY_SHUTDOWN_PUMP_LOG_VIOLATION"

        # Rule 4: ALIRAN_BERMASALAH
        elif pump_on and no_flow_ms > config.FLOW_NO_PULSE_TIMEOUT_MS:
            c, r = "ALIRAN_BERMASALAH", "HIGH"
            exp = f"Pompa menyala tetapi tidak ada aliran air terdeteksi selama {no_flow_ms} ms."
            act = "STOP_PUMP_CHECK_BLOCKAGE"

        # Rule 5: AIR_RENDAH
        elif res_pct <= config.RESERVOIR_LOW_THRESHOLD_PCT:
            c, r = "AIR_RENDAH", "MEDIUM"
            exp = f"Level tandon air rendah ({res_pct:.1f}% <= {config.RESERVOIR_LOW_THRESHOLD_PCT}%)."
            act = "DISABLE_DISPENSE_PROMPT_REFILL"

        # Rule 6: GELAS_TIDAK_ADA while idle
        elif not cup_det and not pump_on:
            c, r = "GELAS_TIDAK_ADA", "LOW"
            exp = f"Dispenser siaga menunggu cangkir diletakkan (jarak {cup_cm} cm)."
            act = "STANDBY_WAIT_FOR_CUP"

        # Rule 7: AMAN
        else:
            c, r = "AMAN", "LOW"
            exp = "Kondisi dispenser normal. Cangkir terpasang, level air mencukupi, baki kering."
            act = "READY_FOR_DISPENSE"

        self.last_classification = c
        self.last_risk_level = r
        self.last_explanation = exp
        return c, r, exp, act
