#!/usr/bin/env python3
"""
AI Rule-Based Sensor Classifier Evaluation Script
Project: Smart Dispenser IoT (Grade XII SIJA UKL 3 - SMK Telkom Sidoarjo)
Author: SIJA Cloud & IoT Engineering Team

Evaluates the rule-based decision engine against simulated and actual datasets,
generating accuracy, precision, recall, confusion matrix, and explainability audits.
"""

import csv
import json
import os
import sys
from collections import defaultdict


def load_config(config_path="model_config.json"):
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def classify_sensor_reading(row, cfg):
    """
    Deterministic Explainable Rule Engine.
    Executes the exact same prioritization logic as MicroPython `ai_classifier.py`.
    """
    try:
        cup_distance_cm = float(row["cup_distance_cm"])
        cup_detected = bool(int(row["cup_detected"]))
        reservoir_distance_cm = float(row["reservoir_distance_cm"])
        reservoir_percentage = float(row["reservoir_percentage"])
        tray_adc = int(float(row["tray_adc"]))
        flow_pulses = int(float(row["flow_pulses"]))
        pump_running = bool(int(row["pump_running"]))
        no_flow_duration_ms = int(float(row["no_flow_duration_ms"]))
        sensor_validity = bool(int(row["sensor_validity"]))
    except (ValueError, KeyError) as e:
        return {
            "class": "SENSOR_ERROR",
            "risk_level": "HIGH",
            "explanation": f"Data sensor korup atau hilang: {e}",
            "evidence": {"raw_row": row},
            "action": "HALT_SYSTEM_CHECK_WIRING",
        }

    th = cfg["thresholds"]

    # Rule 1: SENSOR_ERROR (Hard sensor fault / invalid range)
    if (
        not sensor_validity
        or cup_distance_cm < 0
        or reservoir_distance_cm < 0
        or cup_distance_cm > 200
        or reservoir_distance_cm > 200
    ):
        return {
            "class": "SENSOR_ERROR",
            "risk_level": "HIGH",
            "explanation": "Sensor ultrasonik atau ADC membaca nilai di luar batas fisik valid.",
            "evidence": {
                "sensor_validity": sensor_validity,
                "cup_distance_cm": cup_distance_cm,
                "reservoir_distance_cm": reservoir_distance_cm,
            },
            "action": "HALT_SYSTEM_CHECK_WIRING",
        }

    # Rule 2: TUMPAHAN (Spill detected on drip tray)
    if tray_adc >= th["tray_spill"]["adc_spill_threshold"]:
        return {
            "class": "TUMPAHAN",
            "risk_level": "CRITICAL",
            "explanation": f"Baki tetesan mendeteksi genangan air (ADC {tray_adc} >= {th['tray_spill']['adc_spill_threshold']}).",
            "evidence": {
                "tray_adc": tray_adc,
                "threshold": th["tray_spill"]["adc_spill_threshold"],
            },
            "action": "EMERGENCY_SHUTDOWN_PUMP_BUZZER_ALARM",
        }

    # Rule 3: GELAS_TIDAK_ADA while pump is running (High risk violation / splash)
    if pump_running and not cup_detected:
        return {
            "class": "GELAS_TIDAK_ADA",
            "risk_level": "CRITICAL",
            "explanation": f"Cangkir tidak terdeteksi saat pompa aktif (jarak {cup_distance_cm} cm > batas {th['cup']['detected_max_cm']} cm).",
            "evidence": {
                "pump_running": True,
                "cup_detected": False,
                "cup_distance_cm": cup_distance_cm,
            },
            "action": "EMERGENCY_SHUTDOWN_PUMP_LOG_VIOLATION",
        }

    # Rule 4: ALIRAN_BERMASALAH (Pump running but no pulses after timeout)
    if pump_running and no_flow_duration_ms > th["flow"]["no_flow_timeout_ms"]:
        return {
            "class": "ALIRAN_BERMASALAH",
            "risk_level": "HIGH",
            "explanation": f"Pompa menyala tetapi tidak ada pulsa air selama {no_flow_duration_ms} ms (indikasi selang tersumbat/pompa macet).",
            "evidence": {
                "pump_running": True,
                "flow_pulses": flow_pulses,
                "no_flow_duration_ms": no_flow_duration_ms,
            },
            "action": "STOP_PUMP_CHECK_BLOCKAGE",
        }

    # Rule 5: AIR_RENDAH (Reservoir water depleted below safety mark)
    if reservoir_percentage <= th["reservoir"]["low_threshold_percent"]:
        return {
            "class": "AIR_RENDAH",
            "risk_level": "MEDIUM",
            "explanation": f"Volume tandon tinggal {reservoir_percentage:.1f}% (di bawah batas minimum {th['reservoir']['low_threshold_percent']}%).",
            "evidence": {
                "reservoir_percentage": reservoir_percentage,
                "reservoir_distance_cm": reservoir_distance_cm,
            },
            "action": "DISABLE_DISPENSE_PROMPT_REFILL",
        }

    # Rule 6: GELAS_TIDAK_ADA while idle (Standby waiting state)
    if not cup_detected and not pump_running:
        return {
            "class": "GELAS_TIDAK_ADA",
            "risk_level": "LOW",
            "explanation": f"Dispenser siaga menunggu cangkir diletakkan (jarak terukur {cup_distance_cm} cm).",
            "evidence": {
                "cup_detected": False,
                "cup_distance_cm": cup_distance_cm,
            },
            "action": "STANDBY_WAIT_FOR_CUP",
        }

    # Rule 7: AMAN (Default all conditions nominal)
    return {
        "class": "AMAN",
        "risk_level": "LOW",
        "explanation": "Semua sensor normal. Cangkir terpasang, level air mencukupi, baki kering.",
        "evidence": {
            "cup_distance_cm": cup_distance_cm,
            "reservoir_percentage": reservoir_percentage,
            "tray_adc": tray_adc,
        },
        "action": "READY_FOR_DISPENSE",
    }


def evaluate_dataset(csv_path, cfg):
    if not os.path.exists(csv_path):
        print(f"Error: Dataset {csv_path} tidak ditemukan.")
        return False

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(line for line in f if not line.startswith("#"))
        rows = list(reader)

    if not rows:
        print("Dataset kosong!")
        return False

    classes = cfg["classes"]
    confusion = {c1: {c2: 0 for c2 in classes} for c1 in classes}
    total = len(rows)
    correct = 0

    print(f"=== EVALUASI MODEL AI SMART DISPENSER ===")
    print(f"Dataset: {csv_path}")
    print(f"Jumlah sampel: {total}")
    print("=" * 45)

    for i, row in enumerate(rows, 1):
        gt = row["ground_truth_class"].strip()
        pred = classify_sensor_reading(row, cfg)
        pred_class = pred["class"]

        if gt in confusion and pred_class in confusion[gt]:
            confusion[gt][pred_class] += 1
        else:
            print(f"Warning: Label tidak dikenal (GT: {gt}, Pred: {pred_class})")

        is_match = (gt == pred_class)
        if is_match:
            correct += 1
        else:
            print(f"Sample {i} MISMATCH: Ground Truth '{gt}' != Prediksi '{pred_class}'")
            print(f"  Explanation: {pred['explanation']}")

    accuracy = (correct / total) * 100.0 if total > 0 else 0.0

    print("\n--- CONFUSION MATRIX ---")
    header = f"{'Actual \\ Predicted':<20}" + "".join(f"{c:>18}" for c in classes)
    print(header)
    print("-" * len(header))
    for actual in classes:
        row_str = f"{actual:<20}"
        for pred in classes:
            row_str += f"{confusion[actual][pred]:>18}"
        print(row_str)

    print("\n--- METRIK PER-KELAS ---")
    print(f"{'Class':<20}{'Precision (%)':>15}{'Recall (%)':>15}{'F1-Score (%)':>15}")
    print("-" * 65)

    for c in classes:
        tp = confusion[c][c]
        fp = sum(confusion[other][c] for other in classes if other != c)
        fn = sum(confusion[c][other] for other in classes if other != c)

        precision = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0.0
        recall = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

        print(f"{c:<20}{precision:>15.1f}{recall:>15.1f}{f1:>15.1f}")

    print("-" * 65)
    print(f"Overall Accuracy: {accuracy:.2f}% ({correct}/{total})")
    print("=" * 45)

    return accuracy >= 95.0


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    config_file = os.path.join(base_dir, "model_config.json")
    dataset_file = os.path.join(base_dir, "dataset_simulated.csv")

    config = load_config(config_file)
    success = evaluate_dataset(dataset_file, config)
    sys.exit(0 if success else 1)
