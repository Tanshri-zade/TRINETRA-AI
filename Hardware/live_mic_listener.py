"""
TRINETRA-AI - Real-Time Live Microphone Distress Listener
=========================================================
Listens continuously through your computer/headset microphone.
When you say "help me" (or "bachao", "emergency", "save me"):
  1. Speech is recognized in real time.
  2. Sends a separate Voice Distress telemetry alert to the Trinetra-AI Backend.
  3. Dashboard triggers the Voice Alert modal with Detected Speech: "help me".
  4. Automatically clears back to Normal after 6 seconds.

Usage:
  python Hardware/live_mic_listener.py
"""

import time
import requests
import speech_recognition as sr

BACKEND_URL = "http://127.0.0.1:4000/api/v1/hardware/telemetry"
WEARER_ID   = "6ac48a19beed5a7402908fa1"  # VED (Child Profile)
DEVICE_ID   = "ESP32_TRINETRA_01"

DISTRESS_PHRASES = [
    "help me", "help", "bachao", "save me",
    "emergency", "danger", "please help", "someone help"
]

def send_alert(detected_text, is_distress=True):
    payload = {
        "wearerId": WEARER_ID,
        "deviceId": DEVICE_ID,
        "heartRate": 82 if is_distress else 74,
        "battery": 95,
        "latitude": 21.1188,
        "longitude": 79.0195,
        "gpsStatus": "Connected",
        "gsmStatus": "Connected",
        "microphoneStatus": "Connected",
        "sos": False,  # STRICTLY SEPARATE FROM SOS BUTTON
        "voiceStatus": "Distress" if is_distress else "Normal",
        "detectedSpeech": detected_text if is_distress else "",
        "speed": 0.0
    }
    try:
        res = requests.post(BACKEND_URL, json=payload, timeout=3)
        if res.status_code == 200:
            if is_distress:
                print(f"\n🚨✨ [DASHBOARD 200 OK] Voice Distress Alert Triggered: '{detected_text}'")
            else:
                print("✅✨ [DASHBOARD 200 OK] Voice Status Reset to Normal.\n")
        else:
            print(f"⚠️ [BACKEND {res.status_code}] {res.text}")
    except Exception as e:
        print(f"❌ [POST ERROR] Could not reach backend: {e}")

def main():
    print("=" * 65)
    print("  TRINETRA-AI : REAL-TIME PC MICROPHONE DISTRESS LISTENER")
    print("=" * 65)
    print("  Target Wearer : VED (Child Profile)")
    print("  Listening for : 'help me', 'bachao', 'save me', 'emergency'...")
    print("=" * 65)

    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 300
    recognizer.dynamic_energy_threshold = True

    try:
        mic = sr.Microphone()
    except Exception as e:
        print(f"[ERROR] Could not access microphone: {e}")
        return

    print("\n[MIC] Calibrating for background noise (please remain quiet for 1s)...")
    with mic as source:
        recognizer.adjust_for_ambient_noise(source, duration=1.0)
    print("[MIC] Ready! Speak into your microphone now.\n")

    while True:
        try:
            print("🎧 Listening for voice commands... (say 'help me')")
            with mic as source:
                audio = recognizer.listen(source, timeout=6.0, phrase_time_limit=4.0)

            print("   Processing speech...")
            try:
                # Fast speech-to-text
                text = recognizer.recognize_google(audio).lower().strip()
                print(f"   🎙️ You said: \"{text}\"")

                matched = any(phrase in text for phrase in DISTRESS_PHRASES)
                if matched:
                    print("\n********************************************************")
                    print(f"  🚨🚨🚨 VOICE DISTRESS DETECTED: \"{text}\" 🚨🚨🚨")
                    print("  Sending SEPARATE Voice Distress Alert to Dashboard...")
                    print("********************************************************\n")

                    send_alert(text, is_distress=True)

                    # Keep alert active for 6 seconds, then automatically reset
                    print("   [TIMER] Keeping alert active for 6 seconds...")
                    time.sleep(6)
                    send_alert("", is_distress=False)
                else:
                    print("   (Non-distress speech - no alert triggered)\n")

            except sr.UnknownValueError:
                # Speech was not intelligible
                pass
            except sr.RequestError as e:
                print(f"   [Speech API Error]: {e}")

        except sr.WaitTimeoutError:
            # Silence timeout, continue loop
            pass
        except KeyboardInterrupt:
            print("\n[INFO] Microphone listener stopped by user.")
            break
        except Exception as err:
            print(f"   [Error]: {err}")
            time.sleep(1)

if __name__ == "__main__":
    main()
