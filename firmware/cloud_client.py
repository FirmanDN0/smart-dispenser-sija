# cloud_client.py — Next.js Cloud API REST Client for ESP32
import urequests
import ujson
import time
import config

class CloudClient:
    def __init__(self, base_url, device_token, device_id=config.DEVICE_ID):
        # Remove trailing slash if present
        clean_url = base_url.strip().rstrip("/")
        if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            clean_url = "https://" + clean_url
        self.base_url = clean_url
        self.device_token = device_token
        self.device_id = device_id
        self._fail_count = 0
        self.headers = {
            "Content-Type": "application/json",
            "X-Device-Token": self.device_token,
            "X-Device-ID": self.device_id
        }

    def set_base_url(self, new_url):
        """Dynamically updates gateway URL (e.g. when moving between Kos & School Wi-Fi)."""
        clean_url = new_url.strip().rstrip("/")
        if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            clean_url = "https://" + clean_url
        if self.base_url != clean_url:
            self.base_url = clean_url
            self._fail_count = 0
            print(f"[GATEWAY] Target URL diubah ke: {self.base_url}")

    def _try_alternate_url(self):
        """Auto-failover to backup gateway URL if current IP is unreachable."""
        try:
            import secrets
            endpoints = getattr(secrets, "GATEWAY_ENDPOINTS", {})
            for ssid, ep in endpoints.items():
                clean_ep = ep.strip().rstrip("/")
                if clean_ep != self.base_url:
                    print(f"[AUTO-FAILOVER] Gateway {self.base_url} timeout. Mencoba alternatif: {clean_ep}")
                    self.set_base_url(clean_ep)
                    self._fail_count = 0
                    break
        except Exception:
            pass

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
            if status in (200, 201):
                # Feedback visual di Thonny agar terlihat jelas data masuk ke web
                self._fail_count = 0
                print(f"[GATEWAY] Data sensor terkirim ke Web ({status} OK)")
                return True
            else:
                print(f"[GATEWAY] Respon server: status {status}")
                return False
        except Exception as e:
            print(f"[GATEWAY] Gagal kirim ke web ({url}): {e}")
            self._fail_count += 1
            if self._fail_count >= 3:
                self._try_alternate_url()
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
