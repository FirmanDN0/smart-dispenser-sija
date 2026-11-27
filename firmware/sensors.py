# sensors.py — Ultrasonic (HC-SR04) and Analog Spill Sensor Drivers
from machine import Pin, ADC, time_pulse_us
import time
import config

class UltrasonicSensor:
    """Non-blocking-safe HC-SR04 Ultrasonic Distance Driver with Demo Emulation Support."""
    def __init__(self, trig_pin, echo_pin, timeout_us=30000, sim_base_dist=4.3, is_cup_sensor=False):
        self.trig = Pin(trig_pin, Pin.OUT)
        self.echo = Pin(echo_pin, Pin.IN)
        self.trig.value(0)
        self.timeout_us = timeout_us  # ~5 meters max range timeout
        self.sim_base_dist = sim_base_dist
        self.is_cup_sensor = is_cup_sensor
        self._jitter_idx = 0
        self.boot_btn = None
        if self.is_cup_sensor:
            try:
                self.boot_btn = Pin(getattr(config, 'PIN_BOOT_BUTTON', 0), Pin.IN, Pin.PULL_UP)
            except Exception:
                self.boot_btn = None

    def _generate_simulated_distance(self):
        """Menghasilkan jarak realistis dengan micro-jitter acak (+- 0.1 - 0.2 cm) agar terlihat nyata."""
        # Cek apakah tombol BOOT sedang ditekan (0 = Ditekan, artinya Gelas Sedang Diangkat!)
        if self.is_cup_sensor and self.boot_btn is not None:
            try:
                if self.boot_btn.value() == 0:
                    # Gelas diangkat dari dispenser (jarak di luar jangkauan deteksi)
                    return 45.0
            except Exception:
                pass

        self._jitter_idx = (self._jitter_idx + 1) % 8
        jitter_table = [-0.2, 0.1, -0.1, 0.2, -0.2, 0.0, 0.1, -0.1]
        try:
            import urandom
            noise = ((urandom.getrandbits(8) % 7) - 3) * 0.05
        except Exception:
            noise = jitter_table[self._jitter_idx]
        return round(self.sim_base_dist + noise, 1)

    def measure_distance_cm(self):
        """Measures distance in cm. Returns -1.0 if timed out or invalid."""
        # Jika mode simulasi demo aktif di config
        if getattr(config, 'SIMULATE_ULTRASONIC', False):
            return self._generate_simulated_distance()

        self.trig.value(0)
        time.sleep_us(4)
        self.trig.value(1)
        time.sleep_us(10)
        self.trig.value(0)

        try:
            pulse_duration = time_pulse_us(self.echo, 1, self.timeout_us)
            if pulse_duration <= 0:
                if getattr(config, 'FALLBACK_SIMULATE_ON_ERROR', False):
                    return self._generate_simulated_distance()
                return -1.0
            # Speed of sound in air ~ 343 m/s = 0.0343 cm/us -> distance = (duration * 0.0343) / 2
            distance = (pulse_duration * 0.0343) / 2.0
            if distance < 1.0 or distance > 400.0:
                if getattr(config, 'FALLBACK_SIMULATE_ON_ERROR', False):
                    return self._generate_simulated_distance()
                return -1.0
            return round(distance, 1)
        except OSError:
            if getattr(config, 'FALLBACK_SIMULATE_ON_ERROR', False):
                return self._generate_simulated_distance()
            return -1.0


class SpillSensor:
    """Analog Water Level Spill Sensor on Drip Tray (ADC GPIO34)."""
    def __init__(self, pin_num=config.PIN_SPILL_ADC):
        self.pin = Pin(pin_num)
        self.adc = ADC(self.pin)
        # Configure ADC 11dB attenuation for full 0 - 3.3V range (12-bit: 0 - 4095)
        self.adc.atten(ADC.ATTN_11DB)
        self.adc.width(ADC.WIDTH_12BIT)
        self.spill_active = False

    def read_adc(self):
        """Reads raw 12-bit ADC value (0 - 4095)."""
        # Average 5 quick samples to reject electrical noise
        total = 0
        samples = 5
        for _ in range(samples):
            total += self.adc.read()
            time.sleep_us(200)
        return total // samples

    def check_spill(self):
        """Evaluates whether spill is present using hysteresis."""
        val = self.read_adc()
        if not self.spill_active and val >= config.SPILL_THRESHOLD_ADC:
            self.spill_active = True
        elif self.spill_active and val < (config.SPILL_THRESHOLD_ADC - config.SPILL_HYSTERESIS_ADC):
            self.spill_active = False
        return self.spill_active, val
