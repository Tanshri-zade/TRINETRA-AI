import { Guardian } from "../models/guardianModel.js";
import { DeviceStatus } from "../models/deviceStatusModel.js";
import { Monitoring } from "../models/monitoringModel.js";
import { Location } from "../models/locationModel.js";
import { LocationHistory } from "../models/locationHistoryModel.js";
import { Alert } from "../models/alertModel.js";
import { SafeZone } from "../models/safeZoneModel.js";

const num = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const bool = (v) => v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true";

function distance(a, b, c, d) {
  const R = 6371000, r = x => x * Math.PI / 180;
  const dLat = r(c - a), dLon = r(d - b), x = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export const receiveHardwareTelemetry = async (req, res, next) => {
  try {
    let { wearerId, deviceId, heartRate, battery, latitude, longitude, gpsStatus, gsmStatus,
      microphoneStatus, sos, voiceStatus, detectedSpeech, speed } = req.body || {};

    let guardian = null;
    let wearer = null;

    // 1. Try finding wearer by provided wearerId
    if (wearerId && typeof wearerId === 'string' && wearerId.match(/^[0-9a-fA-F]{24}$/)) {
      guardian = await Guardian.findOne({ "wearers._id": wearerId });
      if (guardian) {
        wearer = guardian.wearers.id(wearerId);
      }
    }

    // 2. Fallback: If wearerId is missing, invalid, or not found in DB, auto-map to first registered wearer
    if (!guardian || !wearer) {
      guardian = await Guardian.findOne({ "wearers.0": { $exists: true } });
      if (guardian && guardian.wearers.length > 0) {
        wearer = guardian.wearers[0];
        wearerId = wearer._id.toString();
        console.log(`[HARDWARE API] Mapped incoming telemetry to registered wearer: ${wearer.name} (${wearerId})`);
      }
    }

    if (!guardian || !wearer) {
      return res.status(404).json({
        success: false,
        message: "No registered wearer found in database. Please register a wearer in the dashboard first."
      });
    }

    const hr = num(heartRate);
    const lat = num(latitude);
    const lng = num(longitude);
    const bat = num(battery);

    // Calculate Geofence status if coordinates exist
    let insideSafeZone = null;
    let geofenceStatus = "Not Configured";
    const zone = await SafeZone.findOne({ wearerId: wearer._id, active: true });
    if (zone && lat !== null && lng !== null) {
      const dist = distance(Number(zone.latitude), Number(zone.longitude), lat, lng);
      insideSafeZone = dist <= Number(zone.radius);
      geofenceStatus = insideSafeZone ? "Inside" : "Outside";
    }

    const voice = String(voiceStatus || "Normal");
    const speech = String(detectedSpeech || "");
    const sosActive = bool(sos);
    const abnormalHR = hr !== null && hr > 0 && (hr < 50 || hr > 120);
    const distressVoice = /help me|distress|scream|panic|shout/i.test(`${voice} ${speech}`);

    let triggeredBy = null;
    if (sosActive) triggeredBy = "SOS";
    else if (abnormalHR) triggeredBy = "High Heart Rate";
    else if (distressVoice) triggeredBy = "Voice Distress";
    else if (geofenceStatus === "Outside") triggeredBy = "Geofence Alert";

    // 1. Update DeviceStatus
    const status = await DeviceStatus.findOneAndUpdate(
      { wearerId: wearer._id },
      {
        wearerId: wearer._id,
        deviceId: deviceId || "ESP32_TRINETRA_01",
        battery: bat,
        heartRate: hr,
        gpsStatus: gpsStatus || (lat !== null ? "Connected" : "Searching"),
        gsmStatus: gsmStatus || "Connected",
        microphoneStatus: microphoneStatus || "Connected",
        sosButtonStatus: sosActive ? "Pressed" : "Ready",
        tamperStatus: "Not Available",
        lastSeen: new Date()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // 2. Update Monitoring
    const monitoring = await Monitoring.findOneAndUpdate(
      { wearerId: wearer._id },
      {
        guardianId: guardian._id,
        wearerId: wearer._id,
        profile: wearer.type === "child" ? "Child" : "Woman",
        heartRate: hr,
        latitude: lat,
        longitude: lng,
        geofenceStatus,
        voiceStatus: distressVoice ? "Distress" : voice,
        detectedSpeech: speech,
        microphoneStatus: microphoneStatus || "Connected",
        battery: bat,
        gsmStatus: gsmStatus || "Connected",
        sos: sosActive,
        safetyStatus: triggeredBy ? "Alert" : "Safe"
      },
      { new: true, upsert: true, runValidators: true }
    );

    // 3. Update Location and LocationHistory
    let locationDoc = null;
    if (lat !== null && lng !== null) {
      locationDoc = await Location.findOneAndUpdate(
        { wearerId: wearer._id },
        {
          wearerId: wearer._id,
          latitude: lat,
          longitude: lng,
          deviceId: deviceId || "ESP32_TRINETRA_01",
          insideSafeZone: insideSafeZone,
          updatedAt: new Date()
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Track location history for Live Location page
      const now = new Date();
      let currentHistory = await LocationHistory.findOne({ wearerId: wearer._id, isCurrent: true }).sort({ createdAt: -1 });
      if (!currentHistory) {
        await LocationHistory.create({
          wearerId: wearer._id,
          latitude: lat,
          longitude: lng,
          deviceId: deviceId || "ESP32_TRINETRA_01",
          arrivedAt: now,
          lastSeenAt: now,
          durationSeconds: 0,
          isCurrent: true
        });
      } else {
        const distMeters = distance(currentHistory.latitude, currentHistory.longitude, lat, lng);
        if (distMeters < 25) {
          const arrivedTime = new Date(currentHistory.arrivedAt).getTime();
          currentHistory.lastSeenAt = now;
          currentHistory.durationSeconds = Math.max(0, Math.floor((now.getTime() - arrivedTime) / 1000));
          await currentHistory.save();
        } else {
          currentHistory.isCurrent = false;
          currentHistory.leftAt = now;
          await currentHistory.save();
          await LocationHistory.create({
            wearerId: wearer._id,
            latitude: lat,
            longitude: lng,
            deviceId: deviceId || "ESP32_TRINETRA_01",
            arrivedAt: now,
            lastSeenAt: now,
            durationSeconds: 0,
            isCurrent: true
          });
        }
      }
    }

    // 4. Create, update, or auto-resolve Emergency Alerts
    let alert = null;
    if (triggeredBy) {
      const existingAlert = await Alert.findOne({
        wearerId: wearer._id,
        triggeredBy,
        status: "Active"
      });

      if (!existingAlert) {
        alert = await Alert.create({
          guardianId: guardian._id,
          wearerId: wearer._id,
          type: triggeredBy === "SOS" ? "SOS" : "Automatic",
          status: "Active",
          triggeredBy,
          heartRate: hr,
          voiceStatus: distressVoice ? "Distress" : voice,
          detectedSpeech: speech,
          microphoneStatus: microphoneStatus || "Connected",
          geofenceStatus,
          sos: sosActive,
          battery: bat,
          gsmStatus: gsmStatus || "Connected",
          latitude: lat,
          longitude: lng,
          message: triggeredBy === "High Heart Rate" ? `Abnormal heart rate detected: ${hr} BPM` :
            triggeredBy === "Voice Distress" ? `Voice distress detected${speech ? `: "${speech}"` : "."}` :
            triggeredBy === "Geofence Alert" ? "Wearer moved outside the configured safe zone." : "Emergency SOS triggered by wearable device."
        });
      } else {
        existingAlert.heartRate = hr;
        existingAlert.latitude = lat;
        existingAlert.longitude = lng;
        existingAlert.battery = bat;
        if (speech) existingAlert.detectedSpeech = speech;
        existingAlert.updatedAt = new Date();
        await existingAlert.save();
        alert = existingAlert;
      }
    }

    // Auto-resolve specific alert types if their specific trigger cleared
    if (!sosActive) {
      await Alert.updateMany(
        {
          $or: [{ wearerId: wearer._id }, { guardianId: guardian._id }],
          $and: [
            { $or: [{ triggeredBy: "SOS" }, { type: "SOS" }, { triggeredBy: "Emergency" }] },
            { status: "Active" }
          ]
        },
        { status: "Resolved", updatedAt: new Date() }
      );
    }

    if (!distressVoice) {
      await Alert.updateMany(
        {
          $or: [{ wearerId: wearer._id }, { guardianId: guardian._id }],
          triggeredBy: "Voice Distress",
          status: "Active"
        },
        { status: "Resolved", updatedAt: new Date() }
      );
    }

    if (!abnormalHR) {
      await Alert.updateMany(
        {
          $or: [{ wearerId: wearer._id }, { guardianId: guardian._id }],
          triggeredBy: "High Heart Rate",
          status: "Active"
        },
        { status: "Resolved", updatedAt: new Date() }
      );
    }

    if (!triggeredBy) {
      // All emergency conditions cleared! Automatically resolve all active alerts for this wearer/guardian
      await Alert.updateMany(
        {
          $or: [{ wearerId: wearer._id }, { guardianId: guardian._id }],
          status: "Active"
        },
        { status: "Resolved", updatedAt: new Date() }
      );
    }

    res.status(200).json({
      success: true,
      message: "Hardware telemetry received and mapped to wearer successfully.",
      wearerId: wearer._id,
      wearerName: wearer.name,
      deviceStatus: status,
      monitoring,
      location: locationDoc,
      geofenceStatus,
      alertCreated: !!alert,
      alert
    });
  } catch (e) {
    next(e);
  }
};

export const hardwareHealth = (req, res) => res.json({
  success: true,
  service: "Trinetra-AI hardware API",
  time: new Date().toISOString()
});

export const getLatestHardwareTelemetry = async (req, res, next) => {
  try {
    let { wearerId } = req.query || {};

    let query = {};
    if (wearerId && typeof wearerId === "string" && wearerId.match(/^[0-9a-fA-F]{24}$/)) {
      query = { wearerId };
    }

    let deviceStatus = await DeviceStatus.findOne(query).sort({ updatedAt: -1, lastSeen: -1 }).lean();
    if (!deviceStatus && Object.keys(query).length > 0) {
      deviceStatus = await DeviceStatus.findOne().sort({ updatedAt: -1, lastSeen: -1 }).lean();
    }

    const activeWearerId = deviceStatus?.wearerId ? deviceStatus.wearerId.toString() : (wearerId || null);

    const [monitoring, location, activeAlerts, guardian, recentLocation] = await Promise.all([
      Monitoring.findOne(activeWearerId ? { wearerId: activeWearerId } : {}).sort({ updatedAt: -1 }).lean()
        .then(m => m || Monitoring.findOne().sort({ updatedAt: -1 }).lean()),
      Location.findOne(activeWearerId ? { wearerId: activeWearerId } : {}).sort({ updatedAt: -1 }).lean()
        .then(l => l || Location.findOne().sort({ updatedAt: -1 }).lean()),
      Alert.find({ status: "Active" }).sort({ updatedAt: -1, createdAt: -1 }).lean(),
      activeWearerId 
        ? Guardian.findOne({ "wearers._id": activeWearerId }).lean() 
        : Guardian.findOne({ "wearers.0": { $exists: true } }).lean(),
      LocationHistory.findOne(activeWearerId ? { wearerId: activeWearerId, isCurrent: false } : { isCurrent: false })
        .sort({ leftAt: -1, updatedAt: -1, createdAt: -1 }).lean()
    ]);

    let wearer = null;
    if (guardian && guardian.wearers) {
      wearer = guardian.wearers.find(w => activeWearerId && String(w._id) === String(activeWearerId)) || guardian.wearers[0];
    }

    res.set("Cache-Control", "no-store");
    return res.status(200).json({
      success: true,
      wearerId: activeWearerId || (wearer ? wearer._id : null),
      wearerName: wearer ? wearer.name : "Active Wearer",
      guardianId: guardian ? guardian._id : null,
      deviceStatus: deviceStatus || null,
      monitoring: monitoring || null,
      location: location || null,
      recentLocation: recentLocation || null,
      activeAlerts: activeAlerts || [],
      isOnline: deviceStatus && deviceStatus.lastSeen ? (Date.now() - new Date(deviceStatus.lastSeen).getTime() < 35000) : false,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    next(e);
  }
};
