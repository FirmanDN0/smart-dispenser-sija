# main.py — Main Firmware Entrypoint for Smart Dispenser IoT
# Grade XII SIJA UKL 3 - SMK Telkom Sidoarjo
import time
import gc
import config

try:
    import secrets
except ImportError:
    print("[ERROR] File 'secrets.py' belum dibuat! Salin 'secrets.example.py' menjadi 'secrets.py'.")
    import secrets_example as secrets

from wifi_manager import WiFiManager
from sensors import UltrasonicSensor, SpillSensor
from flow_meter import FlowMeter
from relay_controller import RelayController
from buzzer import BuzzerController
from pump_controller import PumpController
from ai_classifier import AIClassifier
from safety_controller import SafetyController
from cloud_client import CloudClient
from command_handler import CommandHandler
from event_logger import EventLogger

print("=" * 50)
print("  SMART DISPENSER IoT — SMK TELKOM SIDOARJO")
print("  UKL 3 KELAS XII SIJA (TA 2026/2027)")
print("=" * 50)

# Initialize Hardware Actuators (PUMP IS DEFAULT OFF!)
relay = RelayController(config.PIN_RELAY_IN, active_low=config.RELAY_ACTIVE_LOW)
relay.off()
buzzer = BuzzerController(config.PIN_BUZZER_PWM)
flow_meter = FlowMeter(config.PIN_FLOW_SIGNAL, config.FLOW_PULSES_PER_ML)
pump_ctrl = PumpController(relay, flow_meter, buzzer)
pump_ctrl.stop_dispensing("BOOT_SAFETY_LOCK")

# Initialize Sensors (dengan dukungan base jarak simulasi aman saat demo & tombol BOOT untuk simulasi angkat gelas)
cup_sensor = UltrasonicSensor(config.PIN_CUP_TRIG, config.PIN_CUP_ECHO, sim_base_dist=getattr(config, 'SIM_CUP_DISTANCE_BASE', 4.3), is_cup_sensor=True)
reservoir_sensor = UltrasonicSensor(config.PIN_RESERVOIR_TRIG, config.PIN_RESERVOIR_ECHO, sim_base_dist=getattr(config, 'SIM_RESERVOIR_DISTANCE_BASE', 6.8), is_cup_sensor=False)
spill_sensor = SpillSensor(config.PIN_SPILL_ADC)

# Initialize Core Services
event_logger = EventLogger()
safety_ctrl = SafetyController(pump_ctrl, event_logger)
ai_engine = AIClassifier()
wifi_list = getattr(secrets, 'WIFI_NETWORKS', [(secrets.WIFI_SSID, secrets.WIFI_PASSWORD)])
wifi = WiFiManager(networks=wifi_list)
cloud = CloudClient(secrets.API_BASE_URL, secrets.DEVICE_SECRET_TOKEN, config.DEVICE_ID)
cmd_handler = CommandHandler(pump_ctrl, cloud, ai_engine, buzzer=buzzer)

# Connect to Wi-Fi for local web gateway communication
wifi.connect(timeout_sec=12)

# AUTO-GATEWAY: Otomatis pilih IP Laptop sesuai Wi-Fi yang aktif (Kos vs Sekolah)
if wifi.is_connected():
    active_ssid = wifi.active_ssid
    gateway_map = getattr(secrets, "GATEWAY_ENDPOINTS", {})
    if active_ssid in gateway_map:
        target_url = gateway_map[active_ssid]
        cloud.set_base_url(target_url)
        print(f"[AUTO-GATEWAY] Terhubung ke '{active_ssid}' -> Otomatis pakai Gateway: {target_url}")
    else:
        print(f"[MAIN] Gateway aktif: {cloud.base_url}")

# Buang perintah antrean lama yang mungkin tertinggal dari sesi pengujian sebelumnya
if wifi.is_connected():
    try:
        old_cmds = cloud.get_pending_commands()
        if old_cmds:
            print(f"[MAIN] Mengabaikan {len(old_cmds)} antrean perintah lama...")
            for ocmd in old_cmds:
                cloud.acknowledge_command(ocmd.get("id"), "FAILED", message="Dibatalkan saat boot.")
    except Exception:
        pass
else:
    print("[WARN] Belum terhubung ke Wi-Fi. Cek Wi-Fi 'Indihome' di secrets.py.")

# Play system ready beep
buzzer.beep_success()

def calculate_reservoir_pct(distance_cm):
    """Calculates water container volume percentage based on calibrated levels."""
    if distance_cm < 0:
        return 0.0
    full_cm = config.RESERVOIR_FULL_DISTANCE_CM
    empty_cm = config.RESERVOIR_EMPTY_DISTANCE_CM
    if distance_cm <= full_cm:
        return 100.0
    if distance_cm >= empty_cm:
        return 0.0
    pct = ((empty_cm - distance_cm) / (empty_cm - full_cm)) * 100.0
    return round(pct, 1)

# Timers for non-blocking cooperative scheduling
last_telemetry_time = time.ticks_ms()
last_command_poll_time = time.ticks_ms()
last_gc_time = time.ticks_ms()

print("[MAIN] Loop kontrol keselamatan hardware aktif.")

while True:
    now = time.ticks_ms()

    # 1. READ SENSORS
    cup_dist_cm = cup_sensor.measure_distance_cm()
    cup_detected = (0 < cup_dist_cm <= config.CUP_DETECTED_MAX_CM)

    res_dist_cm = reservoir_sensor.measure_distance_cm()
    res_pct = calculate_reservoir_pct(res_dist_cm)

    spill_active, tray_adc = spill_sensor.check_spill()
    flow_pulses = flow_meter.get_session_pulses()
    no_flow_ms = flow_meter.get_no_pulse_duration_ms()

    # AUTO-DISPENSE TRIGGER: Cek apakah sistem sedang menunggu cangkir didekatkan
    cmd_handler.check_armed_trigger(cup_detected, res_pct, spill_active)

    sensor_validity = (cup_dist_cm >= 0 and res_dist_cm >= 0)

    # 2. RUN AI CLASSIFICATION (Local on ESP32)
    sensor_snapshot = {
        "cup_distance_cm": cup_dist_cm,
        "cup_detected": cup_detected,
        "reservoir_distance_cm": res_dist_cm,
        "reservoir_percentage": res_pct,
        "tray_adc": tray_adc,
        "flow_pulses": flow_pulses,
        "pump_running": pump_ctrl.is_dispensing,
        "no_flow_duration_ms": no_flow_ms,
        "sensor_validity": sensor_validity
    }
    ai_class, ai_risk, ai_exp, ai_act = ai_engine.classify(sensor_snapshot)

    # Jika sedang dalam mode Siaga (Armed) menunggu cangkir diletakkan pengguna
    if cmd_handler.is_armed() and not pump_ctrl.is_dispensing:
        armed_vol = cmd_handler.armed_command.get("volume_ml", 0) if cmd_handler.armed_command else 0
        ai_class = "MENUNGGU_CANGKIR"
        ai_risk = "LOW"
        ai_exp = f"Takaran {armed_vol} ml SIAGA. Silakan letakkan cangkir di bawah corong untuk menuang otomatis."

    # 3. SAFETY INTERLOCK (Instant local execution, millisecond response!)
    is_safe, violation = safety_ctrl.check_safety_and_enforce(
        cup_detected=cup_detected,
        spill_detected=spill_active,
        tray_adc=tray_adc,
        flow_pulses=flow_pulses,
        no_flow_ms=no_flow_ms
    )

    # 4. UPDATE ACTIVE DISPENSING LIFECYCLE
    if pump_ctrl.is_dispensing:
        status = pump_ctrl.update()
        if status == "COMPLETED" and pump_ctrl.active_command_id:
            final_vol = pump_ctrl.target_volume_ml
            cloud.acknowledge_command(
                command_id=pump_ctrl.active_command_id,
                status="COMPLETED",
                actual_volume_ml=final_vol,
                message="Target volume selesai terisi."
            )
            # Kirim telemetri final agar web menerima status selesai 100%
            if wifi.is_connected():
                wifi_info = wifi.get_info()
                cloud.send_telemetry({
                    "cup_distance_cm": cup_dist_cm,
                    "cup_detected": cup_detected,
                    "reservoir_distance_cm": res_dist_cm,
                    "reservoir_percentage": res_pct,
                    "tray_adc": tray_adc,
                    "spill_detected": spill_active,
                    "flow_pulses": flow_meter.get_session_pulses(),
                    "measured_volume_ml": final_vol,
                    "pump_running": False,
                    "buzzer_active": False,
                    "ai_classification": ai_class,
                    "ai_risk_level": ai_risk,
                    "ai_explanation": ai_exp,
                    "wifi_rssi": wifi_info.get("rssi", -60),
                    "ip_address": wifi_info.get("ip", "0.0.0.0")
                })
            pump_ctrl.active_command_id = None
        elif status == "TIMEOUT" and pump_ctrl.active_command_id:
            cloud.acknowledge_command(
                command_id=pump_ctrl.active_command_id,
                status="FAILED",
                actual_volume_ml=flow_meter.get_measured_volume_ml(),
                message="Dispensing dihentikan karena batas waktu pengisian terlampaui."
            )
            pump_ctrl.active_command_id = None
            flow_meter.reset_session()

    # 5. SINKRONISASI KE WEB LAPTOP (VIA WI-FI LOKAL)
    # Saat pompa aktif menyedot air, kirim data setiap 250ms agar bar di web bergerak realtime!
    send_interval = 250 if pump_ctrl.is_dispensing else config.TELEMETRY_INTERVAL_MS
    if time.ticks_diff(now, last_telemetry_time) >= send_interval:
        last_telemetry_time = now
        flow_curr_pulses = flow_meter.get_session_pulses()
        flow_curr_ml = flow_meter.get_measured_volume_ml()

        if not pump_ctrl.is_dispensing:
            print(f"[SENSOR] Cangkir: {cup_dist_cm} cm | Tandon: {res_dist_cm} cm ({res_pct}%) | Baki ADC: {tray_adc} | AI: {ai_class}")
        else:
            print(f"[FLOW REALTIME] Mengisi: {flow_curr_ml} ml / {pump_ctrl.target_volume_ml} ml ({flow_curr_pulses} pulses)")

        # Kirim telemetri (Bisa saat standby maupun saat pompa sedang menyedot air!)
        wifi.maintain_connection()
        if wifi.is_connected():
            wifi_info = wifi.get_info()
            telemetry_payload = {
                "cup_distance_cm": cup_dist_cm,
                "cup_detected": cup_detected,
                "reservoir_distance_cm": res_dist_cm,
                "reservoir_percentage": res_pct,
                "tray_adc": tray_adc,
                "spill_detected": spill_active,
                "flow_pulses": flow_curr_pulses,
                "measured_volume_ml": flow_curr_ml,
                "pump_running": pump_ctrl.is_dispensing,
                "buzzer_active": buzzer.is_active(),
                "ai_classification": ai_class,
                "ai_risk_level": ai_risk,
                "ai_explanation": ai_exp,
                "wifi_rssi": wifi_info.get("rssi", -60),
                "ip_address": wifi_info.get("ip", "0.0.0.0")
            }
            cloud.send_telemetry(telemetry_payload)

            # Flush pending violation events if any
            pending_events = event_logger.pop_pending_events()
            if pending_events:
                cloud.send_events(pending_events)

    # Ambil perintah tombol dari Web Laptop jika Wi-Fi terhubung
    # PENTING: Tetap polling saat pompa aktif (setiap 300ms) agar tombol STOP DARURAT langsung direspons!
    if wifi.is_connected():
        cmd_poll_interval = 300 if pump_ctrl.is_dispensing else config.COMMAND_POLL_INTERVAL_MS
        if time.ticks_diff(now, last_command_poll_time) >= cmd_poll_interval:
            last_command_poll_time = now
            commands = cloud.get_pending_commands()
            for cmd in commands:
                cmd_handler.process_command(cmd, cup_detected, res_pct, spill_active)

    # Periodic garbage collection to maintain heap stability
    if time.ticks_diff(now, last_gc_time) >= 30000:
        last_gc_time = now
        gc.collect()

    # Yield briefly (30ms) for CPU and sensor stability
    time.sleep_ms(30)
