# sensors.py — Ultrasonic (HC-SR04) and Analog Spill Sensor Drivers
from machine import Pin, ADC, time_pulse_us
import time
import config

class UltrasonicSensor:
    """Non-blocking-safe HC-SR04 Ultrasonic Distance Driver."""
    def __init__(self, trig_pin, echo_pin, timeout_us=30000):
        self.trig = Pin(trig_pin, Pin.OUT)
        self.echo = Pin(echo_pin, Pin.IN)
        self.trig.value(0)
        self.timeout_us = timeout_us  # ~5 meters max range timeout

    def measure_distance_cm(self):
        """Measures distance in cm. Returns -1.0 if timed out or invalid."""
        self.trig.value(0)
        time.sleep_us(4)
        self.trig.value(1)
        time.sleep_us(10)
        self.trig.value(0)

        try:
            pulse_duration = time_pulse_us(self.echo, 1, self.timeout_us)
            if pulse_duration <= 0:
                return -1.0
            # Speed of sound in air ~ 343 m/s = 0.0343 cm/us -> distance = (duration * 0.0343) / 2
            distance = (pulse_duration * 0.0343) / 2.0
            if distance < 1.0 or distance > 400.0:
                return -1.0
            return round(distance, 1)
        except OSError:
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
