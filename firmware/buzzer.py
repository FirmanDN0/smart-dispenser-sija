# buzzer.py — Passive Buzzer PWM Tone Controller
# Pin: GPIO 25
from machine import Pin, PWM
import time

class BuzzerController:
    def __init__(self, pin_num=25):
        self.pin = Pin(pin_num, Pin.OUT)
        self.pwm = PWM(self.pin)
        self.pwm.duty(0) # Start silent
        self._is_active = False

    def tone(self, freq_hz, duration_ms, duty=512):
        """Play a single synchronous tone."""
        if freq_hz <= 0:
            self.stop()
            time.sleep_ms(duration_ms)
            return
        self.pwm.freq(freq_hz)
        self.pwm.duty(duty)
        self._is_active = True
        time.sleep_ms(duration_ms)
        self.stop()

    def stop(self):
        self.pwm.duty(0)
        self._is_active = False

    def is_active(self):
        return self._is_active

    def beep_success(self):
        """Pattern: Happy confirmation (Low to High beep)."""
        self.tone(1318, 80) # E6
        time.sleep_ms(40)
        self.tone(1760, 120) # A6

    def beep_start(self):
        """Pattern: Start filling beep."""
        self.tone(1046, 100) # C6

    def beep_warning(self):
        """Pattern: Medium caution (2 medium beeps)."""
        for _ in range(2):
            self.tone(880, 120)
            time.sleep_ms(80)

    def beep_alarm(self):
        """Pattern: Critical alarm for spills or cup removal during fill."""
        for _ in range(3):
            self.tone(2000, 100)
            time.sleep_ms(50)
            self.tone(1500, 100)
            time.sleep_ms(50)
