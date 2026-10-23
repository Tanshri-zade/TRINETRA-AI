/**
 * =====================================================
 *  TRINETRA-AI  –  Hardware Telemetry Simulator v2
 * =====================================================
 *
 * Simulates an ESP32 wearable sending telemetry to the
 * Trinetra-AI Node.js backend.
 *
 * USAGE:
 *   node simulate_telemetry.js <wearerId> [mode] [lat] [lng]
 *
 * MODES:
 *   normal   – Normal vitals (HR: 72-78 BPM, battery: 92%, inside safe-zone)
 *   sos      – Emergency SOS button press  (HR: 115, Distress voice)
 *   high-hr  – Abnormal high heart rate   (138-155 BPM)
 *   low-hr   – Abnormal low heart rate    (37-44 BPM)
 *   voice    – Voice distress "Help me! I am in danger!"
 *   outside  – GPS coordinates outside typical geofence (~5 km drift)
 *   stream   – Continuous live telemetry every 3 seconds (with GPS jitter)
 *   child    – Normal child profile telemetry (HR: 82-90 BPM)
 *   woman    – Normal woman profile telemetry (HR: 70-76 BPM)
 *
 * EXAMPLES:
 *   node simulate_telemetry.js 65f2a1b9c3d4e5f678901234 stream
 *   node simulate_telemetry.js 65f2a1b9c3d4e5f678901234 sos
 *   node simulate_telemetry.js 65f2a1b9c3d4e5f678901234 stream 19.0760 72.8777
 *
 * ENV OVERRIDES:
 *   BACKEND_HOST=192.168.1.42  node simulate_telemetry.js <id> stream
 */

const http = require("http");

const BACKEND_HOST = process.env.BACKEND_HOST || "localhost";
const BACKEND_PORT = process.env.BACKEND_PORT || 4000;
const BACKEND_PATH = "/api/v1/hardware/telemetry";

const wearerId = process.argv[2] || process.env.WEARER_ID;
const mode     = (process.argv[3] || "normal").toLowerCase();

// Optional custom base coordinates from CLI
let currentLat = parseFloat(process.argv[4]) || 19.0760; // Mumbai default
let currentLng = parseFloat(process.argv[5]) || 72.8777;

// ── Validation ───────────────────────────────────────────────────
if (!wearerId) {
    console.error("\n❌ Error: wearerId is required!");
    console.log("Usage: node simulate_telemetry.js <wearerId> [mode]");
    console.log("Modes: normal | sos | high-hr | low-hr | voice | outside | stream | child | woman\n");
    process.exit(1);
}

// ── Payload builder ──────────────────────────────────────────────
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildPayload(modeType) {
    let hr       = rand(72, 78);
    let battery  = rand(88, 96);
    let voice    = "Normal";
    let speech   = "";
    let sos      = false;
    let lat      = currentLat;
    let lng      = currentLng;
    let gpsOk    = true;

    switch (modeType) {
        case "sos":
            sos    = true;
            hr     = rand(110, 128);
            voice  = "Distress";
            speech = "SOS button pressed on device";
            break;

        case "high-hr":
            hr = rand(138, 156);
            break;

        case "low-hr":
            hr = rand(37, 44);
            break;

        case "voice":
            voice  = "Distress";
            speech = "Help me! I am in danger!";
            hr     = rand(95, 115);
            break;

        case "outside":
            lat += 0.055;   // ~6 km north
            lng += 0.042;   // ~4 km east
            break;

        case "child":
            hr      = rand(82, 92);    // Normal pediatric range
            battery = rand(75, 95);
            break;

        case "woman":
            hr      = rand(68, 78);
            battery = rand(80, 96);
            break;

        case "stream":
            // Subtle random walk to simulate movement
            currentLat += (Math.random() - 0.5) * 0.0003;
            currentLng += (Math.random() - 0.5) * 0.0003;
            lat = currentLat;
            lng = currentLng;
            hr  = rand(70, 80);
            break;

        default: // "normal"
            break;
    }

    return {
        wearerId,
        deviceId:         "ESP32_TRINETRA_SIM",
        heartRate:        hr,
        battery:          battery,
        latitude:         parseFloat(lat.toFixed(6)),
        longitude:        parseFloat(lng.toFixed(6)),
        gpsStatus:        gpsOk ? "Connected" : "Searching",
        gsmStatus:        "Connected",
        microphoneStatus: "Connected",
        sos:              sos,
        voiceStatus:      voice,
        detectedSpeech:   speech,
        speed:            parseFloat((Math.random() * 3.5).toFixed(1))
    };
}

// ── HTTP sender ──────────────────────────────────────────────────
function sendTelemetry(payload) {
    const body    = JSON.stringify(payload);
    const options = {
        hostname: BACKEND_HOST,
        port:     BACKEND_PORT,
        path:     BACKEND_PATH,
        method:   "POST",
        headers: {
            "Content-Type":   "application/json",
            "Content-Length": Buffer.byteLength(body)
        }
    };

    const req = http.request(options, (res) => {
        let responseData = "";
        res.on("data", chunk => { responseData += chunk; });
        res.on("end", () => {
            const time = new Date().toLocaleTimeString();
            if (res.statusCode >= 200 && res.statusCode < 300) {
                let parsed = {};
                try { parsed = JSON.parse(responseData); } catch (_) {}

                const hr      = payload.heartRate;
                const abnormal = hr > 0 && (hr < 50 || hr > 120);
                const hrColor  = abnormal ? "⚠️ " : "❤️ ";
                console.log(
                    `[${time}] ✅ OK  |  ${hrColor}HR=${hr} BPM  |  🔋${payload.battery}%  |` +
                    `  GPS(${payload.latitude.toFixed(4)},${payload.longitude.toFixed(4)})  |  SOS=${payload.sos}`
                );
                if (parsed.alertCreated) {
                    console.log(`          🚨 ALERT → ${parsed.alert?.triggeredBy}: ${parsed.alert?.message}`);
                }
                if (parsed.geofenceStatus) {
                    const geoIcon = parsed.geofenceStatus === "Inside" ? "🟢" : "🔴";
                    console.log(`          ${geoIcon} Geofence: ${parsed.geofenceStatus}`);
                }
            } else {
                console.error(`[${time}] ❌ Backend ${res.statusCode}: ${responseData.slice(0, 200)}`);
            }
        });
    });

    req.on("error", err => {
        console.error(`❌ Connection error: ${err.message}`);
        console.error(`   Is backend running? → http://${BACKEND_HOST}:${BACKEND_PORT}`);
    });

    req.write(body);
    req.end();
}

// ── Banner ────────────────────────────────────────────────────────
console.log("╔══════════════════════════════════════════════╗");
console.log("║    TRINETRA-AI  Hardware Simulator  v2       ║");
console.log("╠══════════════════════════════════════════════╣");
console.log(`║  Target   : http://${BACKEND_HOST}:${BACKEND_PORT}${BACKEND_PATH}`);
console.log(`║  Wearer   : ${wearerId}`);
console.log(`║  Mode     : ${mode.toUpperCase()}`);
console.log(`║  GPS base : ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`);
console.log("╚══════════════════════════════════════════════╝\n");

// ── Run ───────────────────────────────────────────────────────────
if (mode === "stream") {
    console.log("📡 Streaming live telemetry every 3 s… (Ctrl+C to stop)\n");
    sendTelemetry(buildPayload("stream"));
    setInterval(() => sendTelemetry(buildPayload("stream")), 3000);
} else {
    sendTelemetry(buildPayload(mode));
}
