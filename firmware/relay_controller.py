# relay_controller.py — Low-Level Relay Switch Controller
# Pin: GPIO 26
from machine import Pin

class RelayController:
    def __init__(self, pin_num=26, active_low=True):
        self.pin_num = pin_num
        self.active_low = active_low
        self.pin = Pin(pin_num, Pin.OUT)
        # CRITICAL SAFETY REQUIREMENT:
        # Default pump relay to OFF immediately upon controller instantiation.
        self.off()

    def on(self):
        """Activate the relay (turns pump ON)."""
        if self.active_low:
            self.pin.value(0)
        else:
            self.pin.value(1)

    def activate(self):
        """Alias for on()"""
        self.on()

    def off(self):
        """Deactivate the relay (turns pump OFF)."""
        if self.active_low:
            self.pin.value(1)
        else:
            self.pin.value(0)

    def deactivate(self):
        """Alias for off()"""
        self.off()

    def is_on(self):
        """Returns True if the relay is currently energized."""
        val = self.pin.value()
        return (val == 0) if self.active_low else (val == 1)
