"""
TRINETRA-AI - Machine Learning Inference Engine
===============================================
Loads the trained Random Forest model and predicts safety state from real-time telemetry.
Specifically isolates "help me" voice commands into a separate Voice Distress alert.

Usage:
  python predict.py '{"profile":"Child","heart_rate":74,"voice_status":"Distress","geofence_status":"Inside","detected_speech":"help me"}'

Output:
  JSON diagnostic line + final output line: 'ALERT' or 'NO ALERT'
"""

import sys
import os
import json
import re
import warnings
warnings.filterwarnings("ignore")
import pandas as pd

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(MODEL_DIR, "safety_model.joblib")

FEATURE_NAMES = ["profile", "heart_rate", "voice_status", "geofence_status"]

PROFILE_MAP  = {"child": 0, "woman": 1, "women": 1}
VOICE_MAP    = {"normal": 0, "cry": 1, "distress": 2, "help me": 2, "scream": 2, "panic": 2}
GEOFENCE_MAP = {"inside": 0, "outside": 1, "not configured": 0}

CLASS_TO_ALERT = {
    0: {"status": "NO ALERT", "alertRequired": False, "triggeredBy": None},
    1: {"status": "ALERT", "alertRequired": True, "triggeredBy": "Voice Distress", "type": "Automatic"},
    2: {"status": "ALERT", "alertRequired": True, "triggeredBy": "High Heart Rate", "type": "Automatic"},
    3: {"status": "ALERT", "alertRequired": True, "triggeredBy": "Geofence Alert", "type": "Automatic"},
    4: {"status": "ALERT", "alertRequired": True, "triggeredBy": "Emergency", "type": "Automatic"}
}

def parse_input(args):
    """Extract telemetry dictionary from CLI args or stdin."""
    raw = ""
    if not sys.stdin.isatty():
        try:
            raw = sys.stdin.read().strip()
        except Exception:
            pass
    if not raw and len(args) > 1:
        raw = " ".join(args[1:]).strip()

    if raw:
        try:
            return json.loads(raw)
        except Exception:
            pass
        try:
            import ast
            parsed = ast.literal_eval(raw)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
        # Try fixing unquoted keys or values like {profile:Child, heart_rate:140}
        try:
            fixed = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', raw)
            fixed = re.sub(r':\s*([a-zA-Z_]+)\s*([,}])', r':"\1"\2', fixed)
            return json.loads(fixed)
        except Exception:
            pass
        match = re.search(r'(\{.*\})', raw)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
    return {}

def rule_based_fallback(profile_code, hr, voice_code, geofence_code, raw_speech):
    """Zero-failure fallback if model file is unavailable."""
    speech_lower = str(raw_speech or "").lower()
    has_help_me = "help me" in speech_lower or "distress" in speech_lower or "bachao" in speech_lower or "scream" in speech_lower
    
    if voice_code == 2 or has_help_me:
        return 1  # VOICE_DISTRESS
    if hr is not None and (hr > 120 or (hr > 0 and hr < 50)):
        return 2  # HIGH_HEART_RATE
    if geofence_code == 1:
        return 3  # GEOFENCE_BREACH
    return 0  # SAFE

def predict_safety(input_data):
    # 1. Normalize features
    raw_profile = str(input_data.get("profile", "Child")).strip().lower()
    profile_code = PROFILE_MAP.get(raw_profile, 0)

    raw_hr = input_data.get("heart_rate")
    try:
        hr = int(float(raw_hr)) if raw_hr is not None else 75
    except Exception:
        hr = 75

    raw_voice = str(input_data.get("voice_status", "Normal")).strip().lower()
    raw_speech = str(input_data.get("detected_speech", "") or input_data.get("detectedSpeech", "")).strip().lower()

    if "help" in raw_voice or "distress" in raw_voice or "scream" in raw_voice or "help me" in raw_speech or "distress" in raw_speech:
        voice_code = 2
    elif "cry" in raw_voice or "sob" in raw_voice:
        voice_code = 1
    else:
        voice_code = 0

    raw_geo = str(input_data.get("geofence_status", "Inside")).strip().lower()
    geofence_code = GEOFENCE_MAP.get(raw_geo, 0)

    # 2. Check if trained model file exists
    pred_class = None
    if os.path.isfile(MODEL_FILE):
        try:
            import joblib
            model = joblib.load(MODEL_FILE)
            X = pd.DataFrame([[profile_code, hr, voice_code, geofence_code]], columns=FEATURE_NAMES)
            pred_class = int(model.predict(X)[0])
        except Exception as e:
            pred_class = rule_based_fallback(profile_code, hr, voice_code, geofence_code, raw_speech)
    else:
        pred_class = rule_based_fallback(profile_code, hr, voice_code, geofence_code, raw_speech)

    result_info = CLASS_TO_ALERT.get(pred_class, CLASS_TO_ALERT[0])
    
    # Generate human-readable alert message
    if result_info["triggeredBy"] == "Voice Distress":
        msg = f'Voice distress detected: "{raw_speech or "help me"}"'
    elif result_info["triggeredBy"] == "High Heart Rate":
        msg = f"Abnormal heart rate detected: {hr} BPM"
    elif result_info["triggeredBy"] == "Geofence Alert":
        msg = "Wearer moved outside the configured safe zone."
    elif result_info["triggeredBy"] == "Emergency":
        msg = "Critical multi-sensor emergency detected."
    else:
        msg = "Wearer is safe."

    diagnostic = {
        "prediction": result_info["status"],
        "alertRequired": result_info["alertRequired"],
        "triggeredBy": result_info["triggeredBy"],
        "alertType": result_info["type"] if result_info["alertRequired"] else None,
        "message": msg,
        "features": {
            "profile": "Child" if profile_code == 0 else "Woman",
            "heartRate": hr,
            "voiceStatus": "Distress" if voice_code == 2 else ("Cry" if voice_code == 1 else "Normal"),
            "detectedSpeech": raw_speech,
            "geofenceStatus": "Outside" if geofence_code == 1 else "Inside"
        }
    }

    # Print JSON diagnostic
    print(json.dumps(diagnostic))
    # Print final line for caller regex/split compatibility
    print(result_info["status"])

if __name__ == "__main__":
    args = sys.argv
    data = parse_input(args)
    if not data:
        # Default test payload
        data = {
            "profile": "Child",
            "heart_rate": 78,
            "voice_status": "Normal",
            "geofence_status": "Inside"
        }
    predict_safety(data)
