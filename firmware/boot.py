# boot.py — SMART DISPENSER IoT
# Executed on ESP32 boot before main.py
import gc
import esp
esp.osdebug(None)
gc.collect()
print("[BOOT] ESP32 MicroPython Booted. Free Heap:", gc.mem_free())
