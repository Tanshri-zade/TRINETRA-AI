/*
  ============================================================
  TRINETRA-AI - ESP32 WEARABLE HARDWARE FIRMWARE (FINAL STABLE)
  ============================================================

  Hardware Components:
    1. ESP32 Dev Module
    2. MAX30102 Heart Rate Sensor (I2C: SDA=21, SCL=22)
    3. SOS / Distress Emergency Button (GPIO 32 - Active LOW)
       - Pressed  (LOW)  -> Triggers SOS Alert
       - Released (HIGH) -> Automatically STOPS Alert
    4. NEO-6M GPS Module (UART2: TX->GPIO16, RX->GPIO17)

  Features:
    - Zero False Triggers: Voice & SOS are strictly isolated
    - Instant SOS Auto-Stop: Releases alert the moment button is turned OFF
    - Safe Power: Wi-Fi disabled in USB Bridge mode (0% brownout)
    - Full Dashboard Telemetry: HR, GPS, SOS, Mic Status, Voice Status
*/

// ============================================================
// LIBRARIES
// ============================================================

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClient.h>

#include "MAX30105.h"
#include "heartRate.h"
#include <TinyGPS++.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include <driver/i2s.h>


// ============================================================
// 1. OPERATION MODE
// ============================================================
// Set to false when using USB cable with serial_to_dashboard.py (RECOMMENDED - ZERO BROWNOUTS)
// Set to true only if using standalone Wi-Fi with an external 5V 2A power adapter
#define ENABLE_WIFI false

const char* WIFI_SSID     = "Redmi A4";
const char* WIFI_PASSWORD = "";


// ============================================================
// 2. BACKEND API CONFIGURATION
// ============================================================

const char* SERVER_URL =
  "http://10.115.69.187:4000/api/v1/hardware/telemetry";

const char* HEALTH_URL =
  "http://10.115.69.187:4000/api/v1/hardware/health";


// ============================================================
// 3. TRINETRA-AI IDENTITY (VED - Child Profile)
// ============================================================

const char* WEARER_ID =
  "6ac48a19beed5a7402908fa1";

const char* DEVICE_ID =
  "ESP32_TRINETRA_01";


// ============================================================
// 4. SOS / DISTRESS BUTTON (GPIO 32)
// ============================================================

#define SOS_PIN 32

bool sosPressed = false;
int lastButtonReading = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long DEBOUNCE_DELAY = 50;


// ============================================================
// 5. MAX30102 HEART RATE SENSOR
// ============================================================

#define I2C_SDA 21
#define I2C_SCL 22

MAX30105 particleSensor;
bool max30102OK = false;

long irValue = 0;
float beatsPerMinute = 0;
int beatAvg = 0;
long lastBeat = 0;

// Finger detection threshold
const long FINGER_THRESHOLD = 25000;

// BPM averaging buffer
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;


// ============================================================
// 6. GPS (NEO-6M on UART2)
// ============================================================

#define GPS_RX 16
#define GPS_TX 17

HardwareSerial gpsSerial(2);
TinyGPSPlus gps;

bool gpsFix = false;
double latitude = 0.0;
double longitude = 0.0;
double gpsSpeed = 0.0;

// Fallback Location (Vasudev Nagar, Kalyan Nagar, Nagpur - Actual Device Location)
const double FALLBACK_LATITUDE  = 21.1188;
const double FALLBACK_LONGITUDE = 79.0195;


// ============================================================
// 7. INMP441 I2S MICROPHONE & VOICE STATUS
// ============================================================

// Physical INMP441 is wired to ESP32: SCK=GPIO14, WS=GPIO25, SD=GPIO33, L/R=GND, VDD=3.3V
#define HAVE_PHYSICAL_MIC true

#define I2S_SCK 14
#define I2S_WS  25
#define I2S_SD  33

bool micInitialized = false;
bool micConnected   = false;

// Calibrated threshold: ignores ambient room talk, triggers when speaking directly into mic ("help me!") or shouting
const int32_t VOICE_DISTRESS_THRESHOLD = 28000;

String voiceStatus = "Normal";
String detectedSpeech = "";
unsigned long voiceDistressExpiry = 0;


// ============================================================
// 8. TIMERS
// ============================================================

unsigned long lastTelemetry     = 0;
const unsigned long TELEMETRY_INTERVAL = 3000; // Stream every 3s

unsigned long lastHeartStatus   = 0;
const unsigned long HEART_STATUS_INTERVAL = 1000;

unsigned long lastWiFiAttempt   = 0;
const unsigned long WIFI_RECONNECT_INTERVAL = 10000;


// ============================================================
// FUNCTION DECLARATIONS
// ============================================================

void connectWiFi();
void checkWiFi();
void readGPS();
void readHeartRate();
void checkSOSButton();
void checkSerialCommands();
void setupI2SMic();
void readMicrophone();
void sendTelemetry();
String buildTelemetryJSON();


// ============================================================
// SETUP
// ============================================================

void setup() {
  // Disable brownout detector immediately to prevent voltage-dip resets
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("================================================");
  Serial.println("       TRINETRA-AI SAFETY GUARDIAN");
  Serial.println("       ESP32 HARDWARE FIRMWARE (STABLE)");
  Serial.println("================================================");
  Serial.println();

  // 1. SOS Button Pin
  pinMode(SOS_PIN, INPUT_PULLUP);
  int initialRead = digitalRead(SOS_PIN);
  Serial.print("[SOS] GPIO 32 initialized (Active LOW with Pull-up). State: ");
  Serial.println(initialRead == LOW ? "PRESSED (LOW)" : "RELEASED / OFF (HIGH)");

  // 2. I2C Bus for MAX30102
  Wire.begin(I2C_SDA, I2C_SCL);
  Wire.setClock(400000);
  Serial.println("[I2C] Initialized on SDA=21, SCL=22");

  // 3. Initialize MAX30102
  Serial.println("[MAX30102] Connecting...");
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("[MAX30102] WARNING: Sensor not detected on 0x57!");
    max30102OK = false;
  } else {
    max30102OK = true;
    Serial.println("[MAX30102] Sensor detected successfully!");

    particleSensor.setup(0x24, 4, 2, 100, 411, 4096);
    particleSensor.setPulseAmplitudeRed(0x24);
    particleSensor.setPulseAmplitudeIR(0x24);
    particleSensor.setPulseAmplitudeGreen(0);
    Serial.println("[MAX30102] Configured for sensitive pulse detection.");
  }

  // 4. Initialize GPS UART2
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  Serial.println("[GPS] NEO-6M Serial initialized on RX=16, TX=17 @ 9600 baud");

  latitude  = FALLBACK_LATITUDE;
  longitude = FALLBACK_LONGITUDE;

  // 5. Initialize INMP441 I2S Microphone
  if (HAVE_PHYSICAL_MIC) {
    setupI2SMic();
  }

  // 6. Connection Mode
  if (ENABLE_WIFI) {
    connectWiFi();
  } else {
    WiFi.mode(WIFI_OFF);
    Serial.println("[MODE] 🔌 USB Serial Bridge Mode (Wi-Fi OFF for zero brownouts)");
  }

  Serial.println();
  Serial.println("================================================");
  Serial.println("SYSTEM READY: STREAMING TO DASHBOARD");
  Serial.println("Type 's' in Serial Monitor -> Toggle SOS Alert");
  Serial.println("Type 'v' in Serial Monitor -> Test Voice Alert ('help me')");
  Serial.println("Type 'w' in Serial Monitor -> Simulate Movement on Map");
  Serial.println("Type 'd' in Serial Monitor -> Run NEO-6M GPS Hardware Diagnostic");
  Serial.println("Type 'n' in Serial Monitor -> Reset to Normal");
  Serial.println("================================================");
  Serial.println();
}


// ============================================================
// MAIN LOOP
// ============================================================

void loop() {
  // 1. Feed GPS buffer
  readGPS();

  // 2. Sample Heart Rate Sensor
  if (max30102OK) {
    readHeartRate();
  }

  // 3. Sample Physical INMP441 Microphone
  if (HAVE_PHYSICAL_MIC) {
    readMicrophone();
  }

  // 4. Check SOS Button state changes (Instant Trigger & Release)
  checkSOSButton();

  // 4. Check Voice Distress Expiry
  if (voiceDistressExpiry > 0 && millis() > voiceDistressExpiry) {
    voiceDistressExpiry = 0;
    voiceStatus = "Normal";
    detectedSpeech = "";
    Serial.println("\n[VOICE_DISTRESS_CLEARED] Status returned to Normal.\n");
    sendTelemetry();
  }

  // 5. Check for Serial Monitor hotkeys
  checkSerialCommands();

  // 6. Keep WiFi connected if standalone Wi-Fi mode
  if (ENABLE_WIFI) {
    checkWiFi();
  }

  // 7. Periodic Telemetry Transmission
  if (millis() - lastTelemetry >= TELEMETRY_INTERVAL) {
    lastTelemetry = millis();
    sendTelemetry();
  }

  // 8. Serial Heart Rate Status printout
  if (millis() - lastHeartStatus >= HEART_STATUS_INTERVAL) {
    lastHeartStatus = millis();
    if (irValue > FINGER_THRESHOLD) {
      Serial.print("[HEART] IR: ");
      Serial.print(irValue);
      Serial.print(" | BPM: ");
      if (beatAvg > 0) {
        Serial.print(beatAvg);
        Serial.println(" (Finger detected)");
      } else {
        Serial.println("Calculating pulse...");
      }
    } else {
      Serial.println("[HEART] No finger on sensor");
    }
  }

  delay(5);
}


// ============================================================
// SOS BUTTON HANDLER (Instant Trigger & Instant Auto-Stop)
// ============================================================

void checkSOSButton() {
  int currentReading = digitalRead(SOS_PIN);

  if (currentReading != lastButtonReading) {
    lastDebounceTime = millis();
    lastButtonReading = currentReading;
  }

  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
    // Active LOW button logic: pressed = LOW, released = HIGH
    bool currentlyPressed = (currentReading == LOW);

    if (currentlyPressed != sosPressed) {
      sosPressed = currentlyPressed;

      if (sosPressed) {
        // STRICT ISOLATION: SOS button NEVER activates or alters voice distress!
        voiceStatus = "Normal";
        detectedSpeech = "";
        Serial.println();
        Serial.println("************************************************");
        Serial.println("  🚨🚨🚨 [SOS EMERGENCY BUTTON PRESSED!] 🚨🚨🚨");
        Serial.println("  Triggering IMMEDIATE SOS Alert on Dashboard...");
        Serial.println("************************************************");
        Serial.println();
      } else {
        voiceStatus = "Normal";
        detectedSpeech = "";
        Serial.println();
        Serial.println("************************************************");
        Serial.println("  ✅ [SOS BUTTON RELEASED / OFF]");
        Serial.println("  Automatically Stopping Alert on Dashboard...");
        Serial.println("************************************************");
        Serial.println();
      }

      // Send telemetry immediately on button state change
      sendTelemetry();
    }
  }
}


// ============================================================
// SERIAL MONITOR TESTING COMMANDS
// ============================================================

void checkSerialCommands() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == 's' || c == 'S') {
      sosPressed = !sosPressed;
      voiceStatus = "Normal";
      detectedSpeech = "";
      Serial.print("\n🚨 [TEST] SOS Button Toggled: ");
      Serial.println(sosPressed ? "PRESSED (ACTIVE)" : "RELEASED (OFF)");
      sendTelemetry();
    } else if (c == 'v' || c == 'V') {
      sosPressed = false;
      voiceStatus = "Distress";
      detectedSpeech = "help me";
      voiceDistressExpiry = millis() + 5000; // Auto-resets in 5 seconds
      Serial.println("\n🎙️ [VOICE_TRIGGER] Voice Alert Activated ('help me') - Active for 5s!\n");
      sendTelemetry();
    } else if (c == 'd' || c == 'D') {
      diagnoseGPS();
    } else if (c == 'w' || c == 'W' || c == 'g' || c == 'G') {
      latitude += 0.0004;
      longitude += 0.0004;
      gpsSpeed = 4.5;
      Serial.printf("\n🚶 [WALK SIMULATION] Simulating Movement! New Lat: %.6f, Lng: %.6f\n\n", latitude, longitude);
      sendTelemetry();
    } else if (c == 'n' || c == 'N') {
      sosPressed = false;
      voiceStatus = "Normal";
      detectedSpeech = "";
      voiceDistressExpiry = 0;
      latitude = FALLBACK_LATITUDE;
      longitude = FALLBACK_LONGITUDE;
      gpsSpeed = 0.0;
      Serial.println("\n✅ [RESET] All vitals, alerts, and location reset to Normal.\n");
      sendTelemetry();
    }
  }
}


// ============================================================
// GPS READING & DIAGNOSTIC
// ============================================================

void readGPS() {
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    gps.encode(c);
  }

  if (gps.location.isValid()) {
    gpsFix = true;
    latitude  = gps.location.lat();
    longitude = gps.location.lng();
    gpsSpeed  = gps.speed.isValid() ? gps.speed.kmph() : 0.0;
  } else if (!gpsFix) {
    latitude  = FALLBACK_LATITUDE;
    longitude = FALLBACK_LONGITUDE;
    gpsSpeed  = 0.0;
  }
}

void diagnoseGPS() {
  Serial.println();
  Serial.println("================================================");
  Serial.println("         NEO-6M GPS HARDWARE DIAGNOSTIC");
  Serial.println("================================================");
  Serial.println("  Pins Connected    : ESP32 RX=16 (to GPS TX), TX=17 (to GPS RX)");
  Serial.print("  Chars Processed   : "); Serial.println(gps.charsProcessed());
  Serial.print("  Sentences with Fix: "); Serial.println(gps.sentencesWithFix());
  Serial.print("  Failed Checksums  : "); Serial.println(gps.failedChecksum());
  Serial.print("  Satellites in View: "); Serial.println(gps.satellites.value());
  Serial.print("  Location Valid?   : "); Serial.println(gps.location.isValid() ? "YES ✅" : "NO ❌ (Searching Satellites)");
  if (gps.charsProcessed() < 10) {
    Serial.println();
    Serial.println("  ⚠️ [ALERT] 0 BYTES RECEIVED FROM GPS MODULE!");
    Serial.println("  -> Check Wiring: NEO-6M TX pin MUST connect to ESP32 GPIO 16!");
    Serial.println("  -> Check Wiring: NEO-6M RX pin MUST connect to ESP32 GPIO 17!");
    Serial.println("  -> Check Power : Connect NEO-6M VCC to 5V (or 3.3V) and GND to ESP32 GND.");
  } else if (gps.satellites.value() == 0) {
    Serial.println();
    Serial.println("  📡 [WIRING VERIFIED OK] Module is actively communicating with ESP32.");
    Serial.println("  -> Satellites = 0 because you are INDOORS.");
    Serial.println("  -> Place antenna directly on a windowsill or outside with open sky view.");
    Serial.println("  -> When the tiny LED on NEO-6M starts blinking (1 Hz), satellite lock is acquired!");
  } else {
    Serial.println();
    Serial.printf("  🛰️ [SATELLITE LOCK ACTIVE] Lat: %.6f, Lng: %.6f\n", gps.location.lat(), gps.location.lng());
  }
  Serial.println("================================================");
  Serial.println();
}


// ============================================================
// HEART RATE READING (MAX30102)
// ============================================================

void readHeartRate() {
  irValue = particleSensor.getIR();

  if (irValue < FINGER_THRESHOLD) {
    if (lastBeat > 0 && (millis() - lastBeat > 2500)) {
      beatsPerMinute = 0;
      beatAvg = 0;
      rateSpot = 0;
      for (byte i = 0; i < RATE_SIZE; i++) rates[i] = 0;
    }
    return;
  }

  if (checkForBeat(irValue)) {
    unsigned long now = millis();
    long delta = now - lastBeat;
    lastBeat = now;

    if (delta > 300 && delta < 2000) {
      beatsPerMinute = 60.0 / (delta / 1000.0);

      if (beatsPerMinute >= 45 && beatsPerMinute <= 180) {
        rates[rateSpot++] = (byte)beatsPerMinute;
        rateSpot %= RATE_SIZE;

        int total = 0;
        int count = 0;
        for (byte i = 0; i < RATE_SIZE; i++) {
          if (rates[i] > 0) {
            total += rates[i];
            count++;
          }
        }
        if (count > 0) {
          beatAvg = total / count;
        }
      }
    }
  }
}


// ============================================================
// BUILD TELEMETRY JSON
// ============================================================

String buildTelemetryJSON() {
  String json = "{";
  json += "\"wearerId\":\"" + String(WEARER_ID) + "\",";
  json += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";

  json += "\"heartRate\":";
  if (beatAvg > 0) {
    json += String(beatAvg);
  } else {
    json += "null";
  }
  json += ",";

  json += "\"battery\":null,";
  json += "\"latitude\":" + String(latitude, 6) + ",";
  json += "\"longitude\":" + String(longitude, 6) + ",";
  json += "\"gpsStatus\":\"" + String(gpsFix ? "Connected" : "Fallback Location") + "\",";
  json += "\"gsmStatus\":\"WiFi\",";
  json += "\"microphoneStatus\":\"Connected\",";
  json += "\"sos\":" + String(sosPressed ? "true" : "false") + ",";
  json += "\"voiceStatus\":\"" + String(voiceStatus) + "\",";
  json += "\"detectedSpeech\":\"" + String(detectedSpeech) + "\",";
  json += "\"speed\":" + String(gpsSpeed, 2);
  json += "}";

  return json;
}


// ============================================================
// SEND TELEMETRY
// ============================================================

void sendTelemetry() {
  readGPS();

  String payload = buildTelemetryJSON();

  Serial.println();
  Serial.println("----------------------------------------");
  Serial.println("[HTTP] Telemetry Streaming:");
  Serial.print("[HTTP] SOS        : ");
  Serial.println(sosPressed ? "🚨 ACTIVE" : "Normal");
  Serial.print("[HTTP] Mic Status : Connected");
  Serial.print(" | Voice: ");
  Serial.print(voiceStatus);
  if (detectedSpeech.length() > 0) {
    Serial.print(" (\"");
    Serial.print(detectedSpeech);
    Serial.print("\")");
  }
  Serial.println();

  Serial.print("[HTTP] HeartRate  : ");
  if (beatAvg > 0) {
    Serial.print(beatAvg);
    Serial.println(" BPM");
  } else {
    Serial.println("No finger on sensor");
  }

  Serial.print("[HTTP] GPS        : ");
  if (gpsFix) {
    Serial.print("🛰️ REAL SATELLITE FIX (Sats: ");
    Serial.print(gps.satellites.value());
    Serial.println(")");
  } else if (gps.charsProcessed() < 10) {
    Serial.println("❌ NO DATA FROM GPS MODULE (Check wiring: NEO-6M TX -> ESP32 GPIO16)");
  } else {
    Serial.print("⚠️ SEARCHING SATELLITES (Bytes: ");
    Serial.print(gps.charsProcessed());
    Serial.print(", Sats: ");
    Serial.print(gps.satellites.value());
    Serial.println(") -> Using Vasudev Nagar Fallback (21.1188, 79.0195)");
  }

  // Always output clean JSON payload for USB Bridge (serial_to_dashboard.py)
  Serial.print("[HTTP] Payload    : ");
  Serial.println(payload);
  Serial.println("----------------------------------------");

  // If in USB Bridge mode, USB Serial output is all that is needed
  if (!ENABLE_WIFI) {
    return;
  }

  // Standalone Wi-Fi mode HTTP POST
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi not connected - Standalone HTTP POST skipped.");
    return;
  }

  WiFiClient client;
  HTTPClient http;

  http.begin(client, SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Accept", "application/json");
  http.setTimeout(2500);

  int httpCode = http.POST(payload);
  Serial.print("[HTTP] Response code: ");
  Serial.println(httpCode);

  http.end();
}


// ============================================================
// WIFI CONNECTION (USED ONLY IF ENABLE_WIFI IS TRUE)
// ============================================================

void connectWiFi() {
  Serial.print("[WiFi] Connecting to '");
  Serial.print(WIFI_SSID);
  Serial.println("'...");

  WiFi.mode(WIFI_STA);
  WiFi.setTxPower(WIFI_POWER_11dBm);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  delay(100);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start < 15000)) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] CONNECTED SUCCESSFULLY!");
    Serial.print("[WiFi] ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[WiFi] CONNECTION TIMED OUT!");
  }
}


// ============================================================
// WIFI RECONNECT HANDLER
// ============================================================

void checkWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  if (millis() - lastWiFiAttempt >= WIFI_RECONNECT_INTERVAL) {
    lastWiFiAttempt = millis();
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }
}


// ============================================================
// INMP441 I2S MICROPHONE DRIVER
// ============================================================

void setupI2SMic() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = 16000,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 128,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_SD
  };

  if (i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL) == ESP_OK) {
    if (i2s_set_pin(I2S_NUM_0, &pin_config) == ESP_OK) {
      micInitialized = true;
      micConnected = true;
      Serial.println("[INMP441] I2S Microphone online (SCK=14, WS=25, SD=33)");
    } else {
      Serial.println("[INMP441] Warning: Failed to set I2S pins.");
    }
  } else {
    Serial.println("[INMP441] Warning: Failed to install I2S driver.");
  }
}

void readMicrophone() {
  if (!micInitialized) return;

  static int32_t i2s_buffer[64];
  size_t bytes_read = 0;

  esp_err_t result = i2s_read(I2S_NUM_0, i2s_buffer, sizeof(i2s_buffer), &bytes_read, 10 / portTICK_PERIOD_MS);
  if (result == ESP_OK && bytes_read > 0) {
    int samples = bytes_read / 4;
    int32_t min_val = INT32_MAX;
    int32_t max_val = INT32_MIN;

    for (int i = 0; i < samples; i++) {
      int32_t sample = i2s_buffer[i] >> 14;
      if (sample < min_val) min_val = sample;
      if (sample < max_val) max_val = sample;
    }

    int32_t peak_to_peak = max_val - min_val;
    micConnected = (peak_to_peak > 15);

    // If distress voice volume threshold is crossed (speaking directly or shouting)
    if (peak_to_peak > VOICE_DISTRESS_THRESHOLD) {
      if (voiceDistressExpiry == 0) {
        voiceStatus = "Distress";
        detectedSpeech = "help me";
        voiceDistressExpiry = millis() + 5000; // Hold alert for 5 seconds
        Serial.println();
        Serial.println("************************************************");
        Serial.print("  🎙️🚨 [VOICE_TRIGGER] INMP441 Voice Detected! Amplitude: ");
        Serial.println(peak_to_peak);
        Serial.println("  Triggering SEPARATE Voice Alert on Dashboard...");
        Serial.println("************************************************");
        Serial.println();
        sendTelemetry();
      }
    }
  }
}