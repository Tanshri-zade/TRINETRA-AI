"""
TRINETRA-AI - Machine Learning Safety & Voice Distress Model Training
=====================================================================
Trains a multi-class Random Forest Classifier that recognizes:
  1. SAFE (Normal condition)
  2. VOICE_DISTRESS ("help me" / distress voice command detected) -> SEPARATE ALERT
  3. HIGH_HEART_RATE (Abnormal pulse > 120 or < 50 BPM)
  4. GEOFENCE_BREACH (Wearer moved outside safe zone)
  5. CRITICAL_EMERGENCY (Multiple concurrent triggers)

Outputs:
  - safety_model.joblib
  - model_metadata.json
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(MODEL_DIR, "safety_model.joblib")
METADATA_FILE = os.path.join(MODEL_DIR, "model_metadata.json")

# Category mapping
PROFILE_MAP = {"child": 0, "woman": 1}
VOICE_MAP   = {"normal": 0, "cry": 1, "distress": 2, "help me": 2, "scream": 2, "panic": 2}
GEOFENCE_MAP= {"inside": 0, "outside": 1, "not configured": 0}

CLASS_NAMES = {
    0: "SAFE",
    1: "VOICE_DISTRESS",
    2: "HIGH_HEART_RATE",
    3: "GEOFENCE_BREACH",
    4: "CRITICAL_EMERGENCY"
}

def generate_synthetic_dataset(num_samples=6000, random_seed=42):
    np.random.seed(random_seed)
    data = []

    for _ in range(num_samples):
        # 1. Profile: 0 = Child, 1 = Woman
        profile = np.random.choice([0, 1])

        # Decide scenario type
        scenario = np.random.choice(
            ["safe", "voice_distress", "heart_rate", "geofence", "critical"],
            p=[0.40, 0.25, 0.15, 0.10, 0.10]
        )

        if scenario == "safe":
            hr = int(np.random.normal(loc=76 if profile == 0 else 72, scale=8))
            hr = max(55, min(100, hr))
            voice = 0  # normal
            geofence = 0  # inside
            label = 0  # SAFE

        elif scenario == "voice_distress":
            # "help me" or distress voice detected while other vitals may be normal or slightly elevated
            hr = int(np.random.normal(loc=85 if profile == 0 else 80, scale=12))
            hr = max(50, min(115, hr))
            voice = 2  # distress / "help me"
            geofence = 0  # inside
            label = 1  # VOICE_DISTRESS (SEPARATE ALERT)

        elif scenario == "heart_rate":
            # High heart rate or panic pulse
            is_high = np.random.rand() > 0.1
            if is_high:
                hr = int(np.random.uniform(125, 175))
            else:
                hr = int(np.random.uniform(35, 48))
            voice = 0  # normal voice
            geofence = 0  # inside
            label = 2  # HIGH_HEART_RATE

        elif scenario == "geofence":
            hr = int(np.random.normal(loc=78, scale=8))
            voice = 0  # normal
            geofence = 1  # outside
            label = 3  # GEOFENCE_BREACH

        elif scenario == "critical":
            # Multiple concurrent triggers (e.g. Help me voice + Outside or High HR + Help me)
            hr = int(np.random.uniform(130, 180))
            voice = 2  # distress / help me
            geofence = np.random.choice([0, 1])
            label = 4  # CRITICAL_EMERGENCY

        data.append({
            "profile": profile,
            "heart_rate": hr,
            "voice_status": voice,
            "geofence_status": geofence,
            "label": label
        })

    return pd.DataFrame(data)

def train_and_export():
    print("=" * 60)
    print("TRINETRA-AI: Training Multi-Class Safety & Voice Model")
    print("=" * 60)

    df = generate_synthetic_dataset(num_samples=8000)
    X = df[["profile", "heart_rate", "voice_status", "geofence_status"]]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"Dataset Size: {len(df)} samples | Train: {len(X_train)} | Test: {len(X_test)}")

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=4,
        random_state=42,
        class_weight="balanced"
    )

    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {acc * 100:.2f}%\n")
    print("Classification Report:")
    target_names = [CLASS_NAMES[i] for i in sorted(CLASS_NAMES.keys())]
    print(classification_report(y_test, y_pred, target_names=target_names))

    # Save model and metadata
    joblib.dump(clf, MODEL_FILE)
    print(f"Model saved to: {MODEL_FILE}")

    metadata = {
        "model_type": "RandomForestClassifier",
        "num_classes": len(CLASS_NAMES),
        "classes": CLASS_NAMES,
        "features": ["profile", "heart_rate", "voice_status", "geofence_status"],
        "accuracy": float(acc),
        "voice_alert_trigger": "VOICE_DISTRESS",
        "voice_keywords": ["help me", "distress", "scream", "bachao", "emergency", "panic"]
    }

    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Metadata saved to: {METADATA_FILE}")
    print("\nTraining complete! Model is ready for standalone and backend inference.")

if __name__ == "__main__":
    train_and_export()
