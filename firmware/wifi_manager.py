# wifi_manager.py — Wi-Fi Network Handler with Multi-AP & Auto-Reconnection
# Fixes 'Wifi Internal State Error' by properly managing radio states and disconnects
import network
import time

class WiFiManager:
    def __init__(self, ssid=None, password=None, networks=None):
        self.ssid = ssid
        self.password = password
        self.networks = networks or []
        if ssid:
            if (ssid, password) not in self.networks:
                self.networks.insert(0, (ssid, password))

        self.wlan = network.WLAN(network.STA_IF)
        self.reset_radio()
        self._last_attempt = 0
        self.active_ssid = None

    def reset_radio(self):
        """Resets the ESP32 Wi-Fi radio interface to clear internal driver errors."""
        try:
            if self.wlan.isconnected():
                self.wlan.disconnect()
        except Exception:
            pass

        try:
            self.wlan.active(False)
            time.sleep_ms(150)
            self.wlan.active(True)
            time.sleep_ms(150)
        except Exception as e:
            print(f"[WIFI] Error reset radio: {e}")

    def connect(self, timeout_sec=12):
        if self.is_connected():
            return True

        for net_ssid, net_pass in self.networks:
            print(f"[WIFI] Mencoba menghubungkan ke SSID: '{net_ssid}'...")
            
            # Reset driver state before each attempt to prevent 'Wifi Internal State Error'
            self.reset_radio()

            try:
                if net_pass:
                    self.wlan.connect(net_ssid, net_pass)
                else:
                    self.wlan.connect(net_ssid)
            except Exception as e:
                print(f"[WIFI] Gagal inisiasi koneksi ke {net_ssid}: {e}")
                continue

            start = time.time()
            while not self.wlan.isconnected():
                if time.time() - start > timeout_sec:
                    print(f"[WIFI] Timeout pada SSID '{net_ssid}'.")
                    try:
                        self.wlan.disconnect()
                    except Exception:
                        pass
                    break
                time.sleep_ms(300)

            if self.wlan.isconnected():
                self.active_ssid = net_ssid
                ip, subnet, gateway, dns = self.wlan.ifconfig()
                print(f"[WIFI] Terhubung ke '{net_ssid}'! IP: {ip}, Gateway: {gateway}")
                return True

        print("[WIFI] Gagal terhubung ke semua jaringan Wi-Fi yang dikonfigurasi.")
        return False

    def is_connected(self):
        try:
            return self.wlan.isconnected()
        except Exception:
            return False

    def get_info(self):
        if not self.is_connected():
            return {"connected": False, "ip": None, "rssi": None, "ssid": None}
        try:
            ip, _, _, _ = self.wlan.ifconfig()
        except Exception:
            ip = "0.0.0.0"
        try:
            rssi = self.wlan.status('rssi')
        except Exception:
            rssi = -60
        return {"connected": True, "ip": ip, "rssi": rssi, "ssid": self.active_ssid}

    def maintain_connection(self):
        """Checks connection and attempts clean background reconnect if dropped."""
        if not self.is_connected():
            now = time.ticks_ms()
            if time.ticks_diff(now, self._last_attempt) > 10000:
                print("[WIFI] Koneksi terputus. Mencoba menghubungkan kembali...")
                self._last_attempt = now
                self.connect(timeout_sec=8)
