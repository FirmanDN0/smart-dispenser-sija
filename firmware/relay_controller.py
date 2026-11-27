# relay_controller.py — Low-Level Relay Switch Controller
# Pin: GPIO 26
from machine import Pin

class RelayController:
    def __init__(self, pin_num=26, active_low=True):
        self.pin_num = pin_num
        self.active_low = active_low
        self._is_energized = False
        self.pin = Pin(pin_num, Pin.OUT)
        # CRITICAL SAFETY REQUIREMENT:
        # Default pump relay to OFF immediately upon controller instantiation.
        self.off()

    def on(self):
        """Activate the relay (turns pump ON)."""
        self.pin = Pin(self.pin_num, Pin.OUT)
        if self.active_low:
            self.pin.value(0)
        else:
            self.pin.value(1)
        self._is_energized = True

    def activate(self):
        """Alias for on()"""
        self.on()

    def off(self):
        """Deactivate the relay (turns pump OFF)."""
        if self.active_low:
            # Pada modul relay 5V Active-Low, output HIGH 3.3V ESP32 terkadang masih membocorkan arus
            # karena tegangan beda (5V - 3.3V = 1.7V) yang cukup untuk menyalakan optocoupler.
            # Mengubah pin menjadi Pin.IN (Hi-Z Tri-state) memastikan arus 0 mA dan relay 100% PASTI MATI!
            self.pin = Pin(self.pin_num, Pin.OUT)
            self.pin.value(1)
            self.pin = Pin(self.pin_num, Pin.IN)
        else:
            self.pin = Pin(self.pin_num, Pin.OUT)
            self.pin.value(0)
        self._is_energized = False

    def deactivate(self):
        """Alias for off()"""
        self.off()

    def is_on(self):
        """Returns True if the relay is currently energized."""
        return self._is_energized
