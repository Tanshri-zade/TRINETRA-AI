#!/usr/bin/env python3
"""
Trinetra-AI Voice Bridge
========================
Listens to voice events on an MQTT topic (published by Mosquitto + the
existing voice server) and forwards any "help me / distress" detection
directly to the Trinetra-AI backend as a hardware telemetry event.

Setup:
  pip install -r requirements.txt
  # Set WEARER_ID below to the MongoDB _id of the registered wearer.
  # Then run:  python voice_bridge.py

Requirements: Mosquitto broker must be running on the same machine (or
edit MQTT_HOST to point to it).  The Trinetra-AI backend must be running
on port 4000.
"""

import json
import time
import requests
import paho.mqtt.client as mqtt

# ── Configuration ──────────────────────────────────────────────────────────
MQTT_HOST   = "localhost"                # Mosquitto broker host
MQTT_PORT   = 1883                       # Default MQTT port (no TLS)
MQTT_TOPIC  = "safety/+/voice"          # Wildcard: any device voice topic
# Also subscribes to the legacy SOS topic:
MQTT_SOS_TOPIC = "safety/ESP32_001/sos"

BACKEND     = "http://localhost:4000/api/v1/hardware/telemetry"
WEARER_ID   = "6ac48a19beed5a7402908fa1"   # VED (Child Profile)
DEVICE_ID   = "VOICE_BRIDGE_PC"

# Keywords that trigger a distress event (case-insensitive)
DISTRESS_KEYWORDS = [
    "help me", "help!", "bachao", "help",
    "danger", "emergency", "leave me", "let me go",
    "scream", "fire", "chodo"
]

HTTP_TIMEOUT = 5   # seconds for backend POST

# ── Helpers ─────────────────────────────────────────────────────────────────

def is_distress(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in DISTRESS_KEYWORDS)


def send_distress(speech: str, sos: bool = False):
    payload = {
        "wearerId":      WEARER_ID,
        "deviceId":      DEVICE_ID,
        "sos":           sos,
        "voiceStatus":   "Distress",
        "detectedSpeech": speech,
        "heartRate":     0,
        "battery":       100,
        "gpsStatus":     "Disconnected",
        "gsmStatus":     "Connected",
        "microphoneStatus": "Connected",
    }
    try:
        r = requests.post(BACKEND, json=payload, timeout=HTTP_TIMEOUT)
        status = "✅" if r.ok else "❌"
        print(f"  {status} Backend {r.status_code}: {r.text[:120]}")
    except requests.exceptions.ConnectionError:
        print("  ❌ Cannot reach backend – is it running on port 4000?")
    except Exception as e:
        print(f"  ❌ Error posting to backend: {e}")


# ── MQTT callbacks ────────────────────────────────────────────────────────

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[MQTT] Connected to broker at {MQTT_HOST}:{MQTT_PORT}")
        client.subscribe(MQTT_TOPIC)
        client.subscribe(MQTT_SOS_TOPIC)
        print(f"[MQTT] Subscribed to: {MQTT_TOPIC}  and  {MQTT_SOS_TOPIC}")
    else:
        print(f"[MQTT] Connection failed with code {rc}")


def on_message(client, userdata, msg):
    topic = msg.topic
    raw   = msg.payload.decode("utf-8", errors="replace")
    print(f"\n[MQTT] {topic} → {raw[:120]}")

    # Try parsing JSON; fall back to treating raw as plain text
    try:
        data = json.loads(raw)
    except Exception:
        data = {"text": raw}

    speech = str(data.get("text", "") or data.get("speech", "") or "")
    sos    = bool(data.get("sos") or data.get("voice_trigger"))

    if sos or is_distress(speech):
        print(f"  🚨 DISTRESS DETECTED: '{speech}' – forwarding to backend…")
        send_distress(speech or "Voice distress event", sos=sos)
    else:
        print(f"  ℹ️  Not a distress signal – ignored.")


def on_disconnect(client, userdata, rc):
    if rc != 0:
        print(f"[MQTT] Unexpected disconnect (rc={rc}) – reconnecting in 5s…")
        time.sleep(5)


# ── Entry point ──────────────────────────────────────────────────────────

def main():
    print("=" * 55)
    print("   TRINETRA-AI  Voice Bridge")
    print("=" * 55)
    print(f"  MQTT broker : {MQTT_HOST}:{MQTT_PORT}")
    print(f"  Backend     : {BACKEND}")
    print(f"  Wearer ID   : {WEARER_ID}")
    print(f"  Distress KW : {', '.join(DISTRESS_KEYWORDS)}")
    print("=" * 55)
    print("Listening for voice events… (Ctrl+C to stop)\n")

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)
    client.on_connect    = on_connect
    client.on_message    = on_message
    client.on_disconnect = on_disconnect

    try:
        client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
        client.loop_forever()
    except KeyboardInterrupt:
        print("\n[VoiceBridge] Stopped by user.")
    except Exception as e:
        print(f"[VoiceBridge] Fatal error: {e}")


if __name__ == "__main__":
    main()
