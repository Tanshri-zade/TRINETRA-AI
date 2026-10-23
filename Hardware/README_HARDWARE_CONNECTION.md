# Trinetra-AI hardware connection

This project now has a hardware API at `POST /api/v1/hardware/telemetry`.
The ESP32 sends GPS, MAX30102 heart rate, SOS, microphone status and GSM status to the Node backend. The backend maps `wearerId` to the guardian/profile, updates DeviceStatus + Monitoring + Location, calculates safe-zone status, and creates an Active Alert for SOS, abnormal heart rate (<50 or >120 BPM), voice distress, or leaving a configured safe zone.

## 1. Install backend
Open `Major project/Backend`:
`npm install`
Then set `config/config.env` and run `npm start`.
Health check: `http://YOUR_LAPTOP_IP:4000/api/v1/hardware/health`

## 2. Arduino libraries
Install: TinyGPS++, Adafruit GFX, Adafruit SSD1306, SparkFun MAX3010x Sensor Library. The sketch also uses `heartRate.h` from the MAX3010x library.

## 3. Fill ESP32 settings
Edit `Trinetra_ESP32.ino`: WiFi SSID/password, laptop IPv4 address, and wearer MongoDB ObjectId. Do NOT use `localhost` in BACKEND_URL because localhost on ESP32 means the ESP32 itself.

## 4. Wiring
ESP32 -> OLED: SDA GPIO21, SCL GPIO22, VCC 3.3V, GND GND.
ESP32 -> MAX30102: SDA GPIO21, SCL GPIO22, VCC 3.3V, GND GND. Both share I2C.
GPS: TX -> GPIO16 (RX2), RX -> GPIO17 (TX2), VCC/GND according to module.
SIM800L: TX -> GPIO26 (RX1), RX -> GPIO27 (TX1), common GND; use a proper external supply suitable for the SIM800L module and level compatibility.
SOS button: one side GPIO32, other side GND (INPUT_PULLUP).
INMP441: VDD 3.3V, GND GND, L/R GND, SCK GPIO14, WS GPIO25, SD GPIO33. The existing laptop voice pipeline can remain responsible for speech recognition.

## 5. Get wearerId
Run backend, open the frontend, sign up, add the wearer, then inspect browser localStorage or the network response and copy that wearer's `_id`. Put it in the sketch.

## 6. Upload and test
Open Serial Monitor at 115200. Expected: WiFi connected -> Device ready -> periodic `POST 200`.
Press SOS: an Active alert should appear in Emergency Alerts.
Put a finger on MAX30102: BPM should appear. The backend treats <50 or >120 BPM as an abnormal-heart-rate event. This is a prototype threshold, not a medical diagnosis.

## 7. Voice “help me” bridge
The included `voice_bridge.py` listens to the MQTT topic used by the existing voice server and forwards a detected `help me` event to the hardware API. Install `pip install -r requirements.txt`, set WEARER_ID, then run `python voice_bridge.py` while Mosquitto and the existing voice server are running.
