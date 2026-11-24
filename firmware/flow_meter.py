# flow_meter.py — YF-S201 Water Flow Sensor Interrupt & Pulse Meter
# Pin: GPIO 27
from machine import Pin
import time
import config

class FlowMeter:
    def __init__(self, pin_num=config.PIN_FLOW_SIGNAL, pulses_per_ml=config.FLOW_PULSES_PER_ML):
        self.pin = Pin(pin_num, Pin.IN, Pin.PULL_UP)
        self.pulses_per_ml = pulses_per_ml
        self.total_pulses = 0
        self.session_pulses = 0
        self.last_pulse_time = time.ticks_ms()
        self._dispensing_active = False

        # Attach hardware interrupt on falling edge
        self.pin.irq(trigger=Pin.IRQ_FALLING, handler=self._pulse_callback)

    def _pulse_callback(self, pin):
        self.total_pulses += 1
        if self._dispensing_active:
            self.session_pulses += 1
            self.last_pulse_time = time.ticks_ms()

    def start_session(self):
        """Reset session counter for a new dispensing task."""
        self.session_pulses = 0
        self.last_pulse_time = time.ticks_ms()
        self._dispensing_active = True

    def stop_session(self):
        """Stop session pulse counting."""
        self._dispensing_active = False

    def get_session_pulses(self):
        return self.session_pulses

    def get_measured_volume_ml(self):
        """Converts session pulses into measured milliliters."""
        if self.pulses_per_ml <= 0:
            return 0.0
        return round(self.session_pulses / self.pulses_per_ml, 1)

    def get_no_pulse_duration_ms(self):
        """Returns elapsed milliseconds since the last detected pulse."""
        if not self._dispensing_active:
            return 0
        return time.ticks_diff(time.ticks_ms(), self.last_pulse_time)

    def reset_total(self):
        self.total_pulses = 0
