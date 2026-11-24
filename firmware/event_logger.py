# event_logger.py — Event Logging & Deduplication Manager
import time

class EventLogger:
    def __init__(self):
        self.pending_events = []
        self._last_violation_type = None
        self._last_violation_time = 0

    def record_violation(self, violation_type, severity, description, sensor_snapshot, user_id=None):
        """
        Deduplicates violations so a single physical incident produces ONLY ONE event.
        Suppresses duplicate violations within a 5-second window.
        """
        now = time.ticks_ms()
        if (self._last_violation_type == violation_type and 
            time.ticks_diff(now, self._last_violation_time) < 5000):
            return  # Suppress duplicate event

        self._last_violation_type = violation_type
        self._last_violation_time = now

        event = {
            "type": violation_type,
            "severity": severity,
            "description": description,
            "sensor_snapshot": sensor_snapshot,
            "user_id": user_id,
            "timestamp": time.time()
        }
        self.pending_events.append(event)
        print(f"[EVENT] Pelanggaran dicatat: {violation_type} ({severity})")

    def pop_pending_events(self):
        """Retrieves and clears pending events for cloud sync."""
        events = self.pending_events[:]
        self.pending_events = []
        return events
