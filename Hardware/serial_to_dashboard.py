"""
TRINETRA-AI - Universal Smart USB Serial Bridge (with Interactive Demo Triggers)
Streams live ESP32 hardware telemetry and provides keyboard triggers for live presentation demo!
"""

import sys
import io
import time
import json
import re
import threading

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

try:
    import serial
    import requests
    import serial.tools.list_ports
except ImportError:
    print("[!] Installing required packages: pyserial, requests...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pyserial", "requests"])
    import serial
    import requests
    import serial.tools.list_ports

BACKEND_URL = "http://127.0.0.1:4000/api/v1/hardware/telemetry"
BAUD_RATE   = 115200

# Default active wearer ID (VED - Child Profile)
DEFAULT_WEARER_ID = "6ac48a19beed5a7402908fa1"
DEVICE_ID = "ESP32_TRINETRA_01"

# Vasudev Nagar, Kalyan Nagar, Nagpur coordinates (Actual Location)
REAL_LAT = 21.1188
REAL_LNG = 79.0195
# Fallback coordinates to filter out (ESP32 defaults when offline or un-flashed)
FALLBACK_LAT = 19.0760
FALLBACK_LNG = 72.8777
OLD_FALLBACK_LAT = 21.1463
OLD_FALLBACK_LNG = 79.0849

telemetry_state = {
    "wearerId": DEFAULT_WEARER_ID,
    "deviceId": DEVICE_ID,
    "heartRate": 74,
    "battery": 94,
    "latitude": REAL_LAT,
    "longitude": REAL_LNG,
    "gpsStatus": "Connected",
    "gsmStatus": "Connected",
    "microphoneStatus": "Connected",
    "sos": False,
    "voiceStatus": "Normal",
    "detectedSpeech": "",
    "speed": 0.0
}

last_send_time = 0

def find_esp32_port():
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        desc = p.description.lower()
        if "cp210" in desc or "ch340" in desc or "usb" in desc or "serial" in desc:
            return p.device
    if len(ports) > 0:
        return ports[0].device
    return "COM5"

def fix_coordinates(payload):
    """Replace ESP32 Mumbai or old Sitabuldi fallback coords with real Vasudev Nagar coordinates."""
    try:
        lat = float(payload.get("latitude", 0) or 0)
        lng = float(payload.get("longitude", 0) or 0)
        # If ESP32 is sending Mumbai fallback or old Sitabuldi fallback, override with Vasudev Nagar
        if (abs(lat - FALLBACK_LAT) < 0.001 and abs(lng - FALLBACK_LNG) < 0.001) or \
           (abs(lat - OLD_FALLBACK_LAT) < 0.001 and abs(lng - OLD_FALLBACK_LNG) < 0.001):
            payload["latitude"] = REAL_LAT
            payload["longitude"] = REAL_LNG
            payload["gpsStatus"] = "Vasudev Nagar Fallback"
    except Exception:
        pass
    return payload

def send_to_backend(payload):
    global last_send_time
    try:
        # Always fix fallback coords before sending
        payload = fix_coordinates(payload)
        res = requests.post(BACKEND_URL, json=payload, timeout=3)
        if res.status_code == 200:
            data = res.json()
            w_name = data.get("wearerName", "Aanya")
            hr = payload.get("heartRate", 0)
            lat = payload.get("latitude", 0)
            lng = payload.get("longitude", 0)
            sos_str = "🚨 SOS ACTIVE!" if payload.get("sos") else "Normal"
            voice_str = f"🎙️ {payload.get('voiceStatus')}" if payload.get("voiceStatus") == "Distress" else ""
            gps_status = payload.get("gpsStatus", "")
            gps_tag = "🛰️ Real Sat Fix" if (gps_status == "Connected" and abs(float(lat) - REAL_LAT) > 0.0001) else "📍 Vasudev Nagar Fallback (Indoors/Searching)"
            print(f"  ✨ [DASHBOARD 200 OK] {w_name} | HR: {hr} BPM | GPS: ({lat:.4f}, {lng:.4f}) [{gps_tag}] | SOS: {sos_str} {voice_str}")
            last_send_time = time.time()
            # Synchronize telemetry_state with what was successfully posted
            telemetry_state["sos"] = bool(payload.get("sos", False))
            telemetry_state["voiceStatus"] = str(payload.get("voiceStatus", "Normal"))
            telemetry_state["detectedSpeech"] = str(payload.get("detectedSpeech", ""))
        else:
            print(f"  ⚠️ [BACKEND {res.status_code}] {res.text}")
    except Exception as e:
        print(f"  ❌ [POST ERROR] Could not reach backend: {e}")

# Live Microphone Listener state
mic_listening = False

def live_mic_worker():
    """Background thread that listens to computer microphone for distress speech."""
    global mic_listening
    try:
        import speech_recognition as sr
        r = sr.Recognizer()
        r.energy_threshold = 300
        r.dynamic_energy_threshold = True
        mic = sr.Microphone()
        with mic as src:
            r.adjust_for_ambient_noise(src, duration=1.0)
        print("\n  🎧 [PC MIC ACTIVE] Speak 'help me' or 'bachao' into your microphone anytime!\n")
    except Exception as e:
        print(f"\n  ⚠️ [MIC ERROR] Could not initialize microphone: {e}\n")
        mic_listening = False
        return

    distress_words = ["help me", "help", "bachao", "save me", "emergency", "danger"]

    while mic_listening:
        try:
            with mic as src:
                audio = r.listen(src, timeout=5.0, phrase_time_limit=4.0)
            text = r.recognize_google(audio).lower().strip()
            print(f"\n  🎙️ [MIC HEARD]: \"{text}\"")
            if any(w in text for w in distress_words):
                print("\n  🚨🚨🚨 [VOICE DISTRESS DETECTED LIVE VIA MICROPHONE!] 🚨🚨🚨")
                print(f"  Recognized: \"{text}\" -> Triggering Separate Voice Alert on Dashboard...")
                telemetry_state["voiceStatus"] = "Distress"
                telemetry_state["detectedSpeech"] = text
                telemetry_state["sos"] = False
                send_to_backend(telemetry_state)

                # Keep alert active for 6 seconds, then reset to normal
                time.sleep(6)
                if telemetry_state.get("voiceStatus") == "Distress":
                    telemetry_state["voiceStatus"] = "Normal"
                    telemetry_state["detectedSpeech"] = ""
                    send_to_backend(telemetry_state)
                    print("\n  ✅ [MIC] Voice distress alert cleared.\n")
        except Exception:
            pass

global_ser = None

def keyboard_listener():
    """Interactive hotkeys for presentation demo"""
    global mic_listening, global_ser
    time.sleep(1)
    print("\n" + "=" * 60)
    print("  ⌨️  LIVE PRESENTATION DEMO HOTKEYS:")
    print("      Type [s] + Enter  -> Toggle SOS Button (ON/OFF) 🚨")
    print("      Type [v] + Enter  -> Trigger Voice Distress ('help me') 🎙️")
    print("      Type [w] + Enter  -> Simulate Movement / Walk on Map 🚶")
    print("      Type [d] + Enter  -> Run NEO-6M GPS Hardware Diagnostic 📡")
    print("      Type [h] + Enter  -> Trigger High Heart Rate (148 BPM) 💓")
    print("      Type [n] + Enter  -> Reset to Normal Vitals (74 BPM) ✅")
    print("=" * 60 + "\n")

    while True:
        try:
            cmd = input().strip().lower()
            if global_ser and getattr(global_ser, 'is_open', False):
                try:
                    global_ser.write(f"{cmd}\n".encode())
                except Exception:
                    pass
            if cmd == 'd':
                print("\n📡 >>> [REQUESTED NEO-6M GPS HARDWARE DIAGNOSTIC FROM ESP32] <<<")
            elif cmd == 's':
                new_sos = not telemetry_state.get("sos", False)
                telemetry_state["sos"] = new_sos
                telemetry_state["voiceStatus"] = "Normal"
                telemetry_state["detectedSpeech"] = ""
                if new_sos:
                    print("\n🚨 >>> [MANUAL TRIGGER: SOS EMERGENCY BUTTON PRESSED!] <<<")
                else:
                    print("\n✅ >>> [MANUAL TRIGGER: SOS EMERGENCY BUTTON RELEASED / OFF] <<<")
                send_to_backend(telemetry_state)
            elif cmd == 'v':
                print("\n🎙️ >>> [MANUAL TRIGGER: VOICE DISTRESS DETECTED ('HELP ME')!] <<<")
                telemetry_state["voiceStatus"] = "Distress"
                telemetry_state["detectedSpeech"] = "help me"
                send_to_backend(telemetry_state)
            elif cmd == 'm':
                mic_listening = not mic_listening
                if mic_listening:
                    print("\n🎧 >>> [LIVE PC MICROPHONE LISTENER ENABLED] <<<")
                    mt = threading.Thread(target=live_mic_worker, daemon=True)
                    mt.start()
                else:
                    print("\n🛑 >>> [LIVE PC MICROPHONE LISTENER DISABLED] <<<")
            elif cmd == 'h':
                print("\n💓 >>> [MANUAL TRIGGER: HIGH HEART RATE ALERT (148 BPM)!] <<<")
                telemetry_state["heartRate"] = 148
                send_to_backend(telemetry_state)
            elif cmd in ('w', 'g'):
                telemetry_state["latitude"] = round(telemetry_state.get("latitude", REAL_LAT) + 0.0004, 6)
                telemetry_state["longitude"] = round(telemetry_state.get("longitude", REAL_LNG) + 0.0004, 6)
                telemetry_state["speed"] = 4.5
                print(f"\n🚶 >>> [SIMULATED LIVE MOVEMENT] New GPS: ({telemetry_state['latitude']:.4f}, {telemetry_state['longitude']:.4f}) | Speed: 4.5 km/h <<<")
                send_to_backend(telemetry_state)
            elif cmd.startswith("loc") or cmd.startswith("set") or cmd.startswith("gps"):
                parts = re.findall(r'[-+]?\d*\.\d+|\d+', cmd)
                if len(parts) >= 2:
                    new_lat = float(parts[0])
                    new_lng = float(parts[1])
                    REAL_LAT = new_lat
                    REAL_LNG = new_lng
                    telemetry_state["latitude"] = new_lat
                    telemetry_state["longitude"] = new_lng
                    print(f"\n📍 >>> [EXACT GPS LOCATION SET] Latitude: {new_lat:.6f}, Longitude: {new_lng:.6f} <<<")
                    send_to_backend(telemetry_state)
                else:
                    print("\n⚠️ Usage: loc <latitude> <longitude>  (e.g. loc 21.1458 79.0882)")
            elif cmd == 'n':
                print("\n✅ >>> [RESET: NORMAL VITALS & BASE LOCATION] <<<")
                telemetry_state["heartRate"] = 74
                telemetry_state["sos"] = False
                telemetry_state["voiceStatus"] = "Normal"
                telemetry_state["detectedSpeech"] = ""
                telemetry_state["latitude"] = REAL_LAT
                telemetry_state["longitude"] = REAL_LNG
                telemetry_state["speed"] = 0.0
                send_to_backend(telemetry_state)
        except Exception:
            break

def main():
    global last_send_time, mic_listening, global_ser, REAL_LAT, REAL_LNG
    port_args = [a for a in sys.argv[1:] if not a.startswith("--")]
    port = port_args[0] if port_args else find_esp32_port()

    if "--mic" in sys.argv:
        mic_listening = True
        threading.Thread(target=live_mic_worker, daemon=True).start()

    print("=" * 60)
    print("   TRINETRA-AI : UNIVERSAL HARDWARE-TO-DASHBOARD BRIDGE")
    print("=" * 60)
    print(f"  Port        : {port}")
    print(f"  Baud Rate   : {BAUD_RATE}")
    print(f"  Backend URL : {BACKEND_URL}")
    print(f"  Wearer ID   : {DEFAULT_WEARER_ID} (VED)")
    print("  Controls    : 's' = SOS | 'v' = Voice | 'w' = Walk | 'loc <lat> <lng>' | 'n' = Reset")
    if mic_listening:
        print("  PC Mic Mode : 🎧 ACTIVE (listening for 'help me')")
    print("=" * 60)

    try:
        ser = serial.Serial(port, BAUD_RATE, timeout=0.5)
        global_ser = ser
        # Toggle DTR/RTS to release ESP32 from reset
        ser.dtr = False
        ser.rts = False
        time.sleep(0.1)
        ser.dtr = True
        ser.rts = True
        time.sleep(0.1)
        ser.dtr = False
        ser.rts = False
        time.sleep(1)
        print(f"\n[OK] Connected to {port}! Hardware online and streaming...")
    except Exception as e:
        print(f"\n[ERROR] Could not open port {port}: {e}")
        print("Please close Arduino Serial Monitor or any other app using this port and run again.")
        sys.exit(1)

    # Start keyboard listener in background thread
    t = threading.Thread(target=keyboard_listener, daemon=True)
    t.start()

    while True:
        try:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if line:
                print(f"[ESP32 RAW] {line}")

                # 1. Direct JSON match
                json_match = re.search(r'(\{.*\})', line)
                if json_match and ("wearerId" in line or "heartRate" in line or "battery" in line or "latitude" in line):
                    try:
                        payload = json.loads(json_match.group(1))
                        if not payload.get("wearerId"):
                            payload["wearerId"] = DEFAULT_WEARER_ID

                        # Isolate SOS from Voice: if physical mic is disabled, prevent phantom voice distress
                        if payload.get("sos") is True and payload.get("voiceStatus") == "Distress" and payload.get("detectedSpeech") == "help me":
                            payload["voiceStatus"] = "Normal"
                            payload["detectedSpeech"] = ""

                        # Update telemetry_state tracking
                        telemetry_state["sos"] = bool(payload.get("sos", False))
                        telemetry_state["voiceStatus"] = str(payload.get("voiceStatus", "Normal"))
                        telemetry_state["detectedSpeech"] = str(payload.get("detectedSpeech", ""))
                        if payload.get("heartRate") is not None:
                            telemetry_state["heartRate"] = payload["heartRate"]
                        if payload.get("latitude") is not None:
                            telemetry_state["latitude"] = payload["latitude"]
                        if payload.get("longitude") is not None:
                            telemetry_state["longitude"] = payload["longitude"]

                        send_to_backend(payload)
                        continue
                    except Exception:
                        pass

                # 2. Smart text parsing for Heart Rate (Avg BPM, BPM, HR, HeartRate)
                hr_match = (
                    re.search(r'BPM\s*[:=]\s*(\d+)', line, re.IGNORECASE) or
                    re.search(r'HeartRate\s*[:=]\s*(\d+)', line, re.IGNORECASE) or
                    re.search(r'HR\s*[:=]\s*(\d+)', line, re.IGNORECASE) or
                    re.search(r'Avg BPM\s*[:=]\s*(\d+)', line, re.IGNORECASE)
                )
                if hr_match:
                    bpm_val = int(hr_match.group(1))
                    if 35 <= bpm_val <= 220:
                        telemetry_state["heartRate"] = bpm_val
                        print(f"  💓 [PULSE DETECTED: {bpm_val} BPM]")

                # 3. GPS Latitude / Longitude parsing
                lat_match = re.search(r'Latitude\s*:\s*([-\d\.]+)', line) or re.search(r'LAT:\s*([-\d\.]+)', line)
                if lat_match:
                    telemetry_state["latitude"] = float(lat_match.group(1))
                    telemetry_state["gpsStatus"] = "Connected"

                lng_match = re.search(r'Longitude\s*:\s*([-\d\.]+)', line) or re.search(r'LON:\s*([-\d\.]+)', line)
                if lng_match:
                    telemetry_state["longitude"] = float(lng_match.group(1))

                # 4. SOS Button detection (strict press trigger and instant release reset)
                if '"sos":true' in line.replace(" ", "").lower() or re.search(r'sos\s*button\s*pressed|\[sos emergency button pressed!\]', line, re.IGNORECASE):
                    telemetry_state["sos"] = True
                    telemetry_state["voiceStatus"] = "Normal"
                    telemetry_state["detectedSpeech"] = ""
                    print("  🚨🚨🚨 [SOS EMERGENCY BUTTON TRIGGERED!] 🚨🚨🚨")
                    send_to_backend(telemetry_state)
                    continue

                if '"sos":false' in line.replace(" ", "").lower() or re.search(r'sos\s*button\s*released|sos\s*button\s*off|\[sos button released', line, re.IGNORECASE):
                    telemetry_state["sos"] = False
                    telemetry_state["voiceStatus"] = "Normal"
                    telemetry_state["detectedSpeech"] = ""
                    print("  ✅ [SOS EMERGENCY BUTTON RELEASED / ALL ALERTS CLEARED]")
                    send_to_backend(telemetry_state)
                    continue

                # 5. Voice distress detection (explicit prefixes ONLY - no loose word matching)
                if re.search(r'\[voice_trigger\]|\[voice_distress_active\]', line, re.IGNORECASE):
                    telemetry_state["voiceStatus"] = "Distress"
                    telemetry_state["detectedSpeech"] = "help me"
                    print("  🎙️🚨 [VOICE DISTRESS / 'HELP ME' TRIGGERED!] 🎙️🚨")
                    send_to_backend(telemetry_state)
                    continue

                if re.search(r'\[voice_distress_cleared\]', line, re.IGNORECASE):
                    telemetry_state["voiceStatus"] = "Normal"
                    telemetry_state["detectedSpeech"] = ""
                    print("  ✅ [VOICE DISTRESS CLEARED / STATUS NORMAL]")
                    send_to_backend(telemetry_state)
                    continue

                # 6. Mic Level
                mic_match = re.search(r'MIC Level\s*:\s*(\d+)', line) or re.search(r'MIC:\s*(\d+)', line)
                if mic_match:
                    telemetry_state["microphoneStatus"] = "Connected"

            # Periodic update every 3s
            if time.time() - last_send_time >= 3.0:
                send_to_backend(telemetry_state)

        except KeyboardInterrupt:
            print("\n[INFO] Stopped by user.")
            break
        except Exception as err:
            print(f"[BRIDGE ERROR] {err}")
            time.sleep(1)

if __name__ == "__main__":
    main()
