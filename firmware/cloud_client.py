# cloud_client.py — Next.js Cloud API REST Client for ESP32
import urequests
import ujson
import time
import config

class CloudClient:
    def __init__(self, base_url, device_token, device_id=config.DEVICE_ID):
        # Remove trailing slash if present
        self.base_url = base_url.rstrip("/")
        self.device_token = device_token
        self.device_id = device_id
        self.headers = {
            "Content-Type": "application/json",
            "X-Device-Token": self.device_token,
            "X-Device-ID": self.device_id
        }

    def send_telemetry(self, telemetry_payload):
        """Sends periodic sensor telemetry to POST /api/device/telemetry."""
        url = f"{self.base_url}/api/device/telemetry"
        payload = {
            "deviceId": self.device_id,
            "timestamp": time.time(),
            "telemetry": telemetry_payload
        }
        try:
            res = urequests.post(url, data=ujson.dumps(payload), headers=self.headers, timeout=5)
            status = res.status_code
            res.close()
            return (status == 200 or status == 201)
        except Exception as e:
            print(f"[CLOUD] Error kirim telemetri: {e}")
            return False

    def get_pending_commands(self):
        """Polls for pending commands from GET /api/device/commands."""
        url = f"{self.base_url}/api/device/commands?deviceId={self.device_id}"
        try:
            res = urequests.get(url, headers=self.headers, timeout=5)
            if res.status_code == 200:
                data = res.json()
                res.close()
                return data.get("commands", [])
            res.close()
            return []
        except Exception as e:
            # Silent fallback during offline/disconnected state
            return []

    def acknowledge_command(self, command_id, status, actual_volume_ml=0, duration_ms=0, message=""):
        """Sends command status acknowledgment to POST /api/device/ack."""
        url = f"{self.base_url}/api/device/ack"
        payload = {
            "deviceId": self.device_id,
            "commandId": command_id,
            "status": status,  # "ACKNOWLEDGED", "RUNNING", "COMPLETED", "REJECTED", "FAILED"
            "actualVolumeMl": actual_volume_ml,
            "durationMs": duration_ms,
            "message": message,
            "timestamp": time.time()
        }
        try:
            res = urequests.post(url, data=ujson.dumps(payload), headers=self.headers, timeout=5)
            code = res.status_code
            res.close()
            return (code == 200 or code == 201)
        except Exception as e:
            print(f"[CLOUD] Error kirim acknowledgment: {e}")
            return False

    def send_events(self, events_list):
        """Sends security/safety violation events to POST /api/device/events."""
        if not events_list:
            return True
        url = f"{self.base_url}/api/device/events"
        payload = {
            "deviceId": self.device_id,
            "events": events_list
        }
        try:
            res = urequests.post(url, data=ujson.dumps(payload), headers=self.headers, timeout=5)
            code = res.status_code
            res.close()
            return (code == 200 or code == 201)
        except Exception as e:
            print(f"[CLOUD] Error kirim event pelanggaran: {e}")
            return False
