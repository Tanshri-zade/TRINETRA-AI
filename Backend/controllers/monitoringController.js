import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

import { Monitoring } from "../models/monitoringModel.js";
import { Alert } from "../models/alertModel.js";
import { SafeZone } from "../models/safeZoneModel.js";
import { Location } from "../models/locationModel.js";
import { DeviceStatus } from "../models/deviceStatusModel.js";

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


const safetyModel =
    path.join(
        __dirname,
        "../../ml_model/predict.py"
    );


// =========================================================
// HELPERS
// =========================================================

function normalizeProfile(profile) {

    if (!profile) {
        return "";
    }


    const value =
        String(profile)
            .trim()
            .toLowerCase();


    if (value === "child") {
        return "Child";
    }


    if (
        value === "woman" ||
        value === "women"
    ) {

        return "Woman";
    }


    return profile;
}


// =========================================================
// NORMALIZE VOICE STATUS
// =========================================================

function normalizeVoiceStatus(
    voiceStatus
) {

    if (!voiceStatus) {
        return "Normal";
    }


    const value =
        String(voiceStatus)
            .trim()
            .toLowerCase();


    if (
        value.includes("potential") ||
        value.includes("distress") ||
        value.includes("scream") ||
        value.includes("shout") ||
        value.includes("panic") ||
        value.includes("help")
    ) {

        return "Distress";
    }


    if (
        value.includes("cry") ||
        value.includes("sob") ||
        value.includes("wail")
    ) {

        return "Cry";
    }


    return "Normal";
}


// =========================================================
// NORMALIZE DETECTED SPEECH
// =========================================================

function normalizeDetectedSpeech(
    detectedSpeech
) {

    if (
        detectedSpeech === undefined ||
        detectedSpeech === null
    ) {

        return "";
    }


    return String(
        detectedSpeech
    ).trim();
}


// =========================================================
// NORMALIZE MICROPHONE STATUS
// =========================================================

function normalizeMicrophoneStatus(
    microphoneStatus
) {

    if (
        microphoneStatus === undefined ||
        microphoneStatus === null ||
        String(microphoneStatus).trim() === ""
    ) {

        return "Not Available";
    }


    return String(
        microphoneStatus
    ).trim();
}


// =========================================================
// CONVERT TO BOOLEAN
// =========================================================

function toBoolean(value) {

    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        String(value)
            .toLowerCase() === "true"
    );
}


// =========================================================
// CONVERT TO NUMBER
// =========================================================

function toNumberOrNull(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return null;
    }


    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : null;
}


// =========================================================
// DISTANCE
// HAVERSINE FORMULA
// RESULT IN METERS
// =========================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius =
        6371000;


    const toRadians =
        value =>
            value *
            Math.PI /
            180;


    const latitude1 =
        toRadians(lat1);


    const latitude2 =
        toRadians(lat2);


    const latitudeDifference =
        toRadians(
            lat2 - lat1
        );


    const longitudeDifference =
        toRadians(
            lon2 - lon1
        );


    const a =

        Math.sin(
            latitudeDifference / 2
        ) ** 2

        +

        Math.cos(latitude1) *

        Math.cos(latitude2) *

        Math.sin(
            longitudeDifference / 2
        ) ** 2;


    const c =

        2 *

        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(
                1 - a
            )

        );


    return (
        earthRadius *
        c
    );
}


// =========================================================
// GEOFENCE
//
// SAFE ZONE IS AVAILABLE FOR:
//
// 1. WOMAN
// 2. CHILD
//
// Both profiles use their own wearerId.
// Therefore each wearer can have their own Safe Zone.
// =========================================================

async function calculateGeofenceStatus(
    wearerId,
    profile,
    latitude,
    longitude
) {

    // -----------------------------------------------------
    // Only supported profiles
    // -----------------------------------------------------

    if (
        profile !== "Child" &&
        profile !== "Woman"
    ) {

        return {

            status:
                "Not Configured",

            distance:
                null,

            safeZone:
                null

        };
    }


    // -----------------------------------------------------
    // GPS NOT AVAILABLE
    // -----------------------------------------------------

    if (
        latitude === null ||
        longitude === null
    ) {

        return {

            status:
                "Not Configured",

            distance:
                null,

            safeZone:
                null

        };
    }


    // -----------------------------------------------------
    // FIND SAFE ZONE FOR CURRENT WEARER
    // -----------------------------------------------------

    const safeZone =
        await SafeZone.findOne({

            wearerId,

            active:
                true

        });


    // -----------------------------------------------------
    // SAFE ZONE NOT CREATED
    // -----------------------------------------------------

    if (!safeZone) {

        return {

            status:
                "Not Configured",

            distance:
                null,

            safeZone:
                null

        };
    }


    // -----------------------------------------------------
    // SAFE ZONE VALUES
    // -----------------------------------------------------

    const centerLatitude =
        Number(
            safeZone.latitude
        );


    const centerLongitude =
        Number(
            safeZone.longitude
        );


    const radius =
        Number(
            safeZone.radius
        );


    // -----------------------------------------------------
    // VALIDATE SAFE ZONE
    // -----------------------------------------------------

    if (
        !Number.isFinite(
            centerLatitude
        ) ||
        !Number.isFinite(
            centerLongitude
        ) ||
        !Number.isFinite(
            radius
        )
    ) {

        return {

            status:
                "Not Configured",

            distance:
                null,

            safeZone

        };
    }


    // -----------------------------------------------------
    // CALCULATE DISTANCE FROM SAFE ZONE CENTER
    // -----------------------------------------------------

    const distance =
        calculateDistance(

            centerLatitude,

            centerLongitude,

            latitude,

            longitude

        );


    // -----------------------------------------------------
    // INSIDE / OUTSIDE
    // -----------------------------------------------------

    return {

        status:

            distance <= radius

                ? "Inside"

                : "Outside",

        distance,

        safeZone

    };
}


// =========================================================
// PYTHON SAFETY MODEL
// =========================================================

function runSafetyModel(input) {

    return new Promise(

        (
            resolve,
            reject
        ) => {

            execFile(

                "py",

                [

                    "-3.14",

                    safetyModel,

                    JSON.stringify(
                        input
                    )

                ],

                {

                    maxBuffer:
                        1024 *
                        1024 *
                        5

                },

                (
                    error,
                    stdout,
                    stderr
                ) => {

                    if (error) {

                        console.log(
                            "Safety Model Error:",
                            error
                        );


                        console.log(
                            "Python Error:",
                            stderr
                        );


                        reject(error);

                        return;
                    }


                    const lines =
                        stdout
                            .trim()
                            .split(/\r?\n/)
                            .filter(Boolean);


                    const prediction =

                        lines.length

                            ? lines[
                                lines.length - 1
                            ]
                                .trim()
                                .toUpperCase()

                            : "NO ALERT";


                    resolve(
                        prediction
                    );

                }

            );

        }

    );
}


// =========================================================
// UPDATE MONITORING
//
// ONE REQUEST SYNCS:
//
// Monitoring
// Location
// Safe Zone
// ML Prediction
// Emergency Alert
// =========================================================

export const updateMonitoring =
    async (req, res) => {

        try {

            console.log(
                "Incoming Monitoring Data:",
                req.body
            );


            // =================================================
            // REQUEST DATA
            // =================================================

            const {

                guardianId,

                wearerId,

                profile,

                heart_rate,

                heartRate,

                latitude,

                longitude,

                voice_status,

                voiceStatus,

                detected_speech,

                detectedSpeech,

                microphone_status,

                microphoneStatus,

                battery,

                gsm_status,

                gsmStatus,

                sos,

                deviceId,

                speed

            } = req.body || {};


            // =================================================
            // REQUIRED VALUES
            // =================================================

            if (
                !guardianId ||
                !wearerId ||
                !profile
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Guardian ID, wearer ID and profile are required."

                    });
            }


            // =================================================
            // NORMALIZE PROFILE
            // =================================================

            const normalizedProfile =
                normalizeProfile(
                    profile
                );


            // =================================================
            // NORMALIZE VOICE
            // =================================================

            const normalizedVoice =
                normalizeVoiceStatus(

                    voice_status ??

                    voiceStatus

                );


            // =================================================
            // DETECTED SPEECH
            // =================================================

            const finalDetectedSpeech =
                normalizeDetectedSpeech(

                    detected_speech ??

                    detectedSpeech

                );


            // =================================================
            // MICROPHONE STATUS
            // =================================================

            const finalMicrophoneStatus =
                normalizeMicrophoneStatus(

                    microphone_status ??

                    microphoneStatus

                );


            // =================================================
            // NORMALIZE HEART RATE
            // =================================================

            const heartRateValue =
                toNumberOrNull(

                    heart_rate ??

                    heartRate

                );


            // =================================================
            // NORMALIZE LATITUDE
            // =================================================

            const latitudeValue =
                toNumberOrNull(
                    latitude
                );


            // =================================================
            // NORMALIZE LONGITUDE
            // =================================================

            const longitudeValue =
                toNumberOrNull(
                    longitude
                );


            // =================================================
            // NORMALIZE BATTERY
            // =================================================

            const batteryValue =
                toNumberOrNull(
                    battery
                );


            // =================================================
            // NORMALIZE SPEED
            // =================================================

            const speedValue =
                toNumberOrNull(
                    speed
                );


            // =================================================
            // GSM STATUS
            // =================================================

            const finalGsmStatus =

                gsm_status ??

                gsmStatus ??

                "Disconnected";


            // =================================================
            // SOS
            // =================================================

            const sosActive =
                toBoolean(
                    sos
                );


            // =================================================
            // VALIDATE GPS LATITUDE
            // =================================================

            if (
                latitudeValue !== null &&
                (
                    latitudeValue < -90 ||
                    latitudeValue > 90
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Invalid latitude."

                    });
            }


            // =================================================
            // VALIDATE GPS LONGITUDE
            // =================================================

            if (
                longitudeValue !== null &&
                (
                    longitudeValue < -180 ||
                    longitudeValue > 180
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Invalid longitude."

                    });
            }


            // =================================================
            // GEOFENCE
            //
            // NOW WORKS FOR:
            // WOMAN + CHILD
            // =================================================

            const geofenceResult =
                await calculateGeofenceStatus(

                    wearerId,

                    normalizedProfile,

                    latitudeValue,

                    longitudeValue

                );


            const calculatedGeofenceStatus =
                geofenceResult.status;


            console.log(
                "GEOFENCE STATUS:",
                {
                    profile:
                        normalizedProfile,

                    status:
                        calculatedGeofenceStatus,

                    distance:
                        geofenceResult.distance,

                    radius:
                        geofenceResult.safeZone
                            ?.radius ??
                        null
                }
            );


            // =================================================
            // 1. UPDATE CURRENT MONITORING
            //
            // Dashboard
            // Device Status
            // Voice Monitoring
            // Safe Zone Status
            // =================================================

            const monitoring =
                await Monitoring.findOneAndUpdate(

                    {

                        wearerId

                    },

                    {

                        $set: {

                            guardianId,

                            wearerId,

                            profile:
                                normalizedProfile,

                            heartRate:
                                heartRateValue,

                            latitude:
                                latitudeValue,

                            longitude:
                                longitudeValue,

                            geofenceStatus:
                                calculatedGeofenceStatus,

                            voiceStatus:
                                normalizedVoice,

                            detectedSpeech:
                                finalDetectedSpeech,

                            microphoneStatus:
                                finalMicrophoneStatus,

                            battery:
                                batteryValue,

                            gsmStatus:
                                finalGsmStatus,

                            sos:
                                sosActive,

                            safetyStatus:
                                "Safe"

                        }

                    },

                    {

                        new:
                            true,

                        upsert:
                            true,

                        runValidators:
                            true,

                        setDefaultsOnInsert:
                            true

                    }

                );


            console.log(
                "MONITORING UPDATED:",
                {

                    wearerId,

                    profile:
                        normalizedProfile,

                    heartRate:
                        heartRateValue,

                    battery:
                        batteryValue,

                    voiceStatus:
                        normalizedVoice,

                    detectedSpeech:
                        finalDetectedSpeech,

                    microphoneStatus:
                        finalMicrophoneStatus,

                    geofenceStatus:
                        calculatedGeofenceStatus,

                    gsmStatus:
                        finalGsmStatus,

                    sos:
                        sosActive

                }
            );

            // =========================================================
            // UPDATE DEVICE STATUS
            //
            // Keeps Device Status page synchronized with
            // the same hardware/monitoring request.
            // =========================================================

            const deviceStatusUpdate = {

                wearerId,

                battery:
                    batteryValue,

                heartRate:
                    heartRateValue,

                gpsStatus:
                    latitudeValue !== null &&
                        longitudeValue !== null
                        ? "Connected"
                        : "Not Available",

                gsmStatus:
                    finalGsmStatus,

                microphoneStatus:
                    finalMicrophoneStatus,

                sosButtonStatus:
                    sosActive
                        ? "Pressed"
                        : "Normal",

                lastSeen:
                    new Date()

            };


            if (deviceId) {

                deviceStatusUpdate.deviceId =
                    deviceId;

            }


            const deviceStatus =
                await DeviceStatus.findOneAndUpdate(

                    {
                        wearerId
                    },

                    {
                        $set:
                            deviceStatusUpdate
                    },

                    {
                        new:
                            true,

                        upsert:
                            true,

                        runValidators:
                            true,

                        setDefaultsOnInsert:
                            true
                    }

                );


            console.log(
                "DEVICE STATUS UPDATED:",
                {
                    wearerId,
                    heartRate:
                        deviceStatus.heartRate,
                    battery:
                        deviceStatus.battery,
                    gpsStatus:
                        deviceStatus.gpsStatus,
                    gsmStatus:
                        deviceStatus.gsmStatus,
                    microphoneStatus:
                        deviceStatus.microphoneStatus,
                    sosButtonStatus:
                        deviceStatus.sosButtonStatus
                }
            );


            // =================================================
            // 2. UPDATE LOCATION
            //
            // Live Location
            // Safe Zone
            // =================================================

            let location =
                null;


            if (
                latitudeValue !== null &&
                longitudeValue !== null
            ) {

                const locationData = {

                    wearerId,

                    latitude:
                        latitudeValue,

                    longitude:
                        longitudeValue,

                    insideSafeZone:

                        calculatedGeofenceStatus ===
                        "Inside"

                };


                if (deviceId) {

                    locationData.deviceId =
                        deviceId;

                }


                location =
                    await Location.findOneAndUpdate(

                        {

                            wearerId

                        },

                        {

                            $set:
                                locationData

                        },

                        {

                            new:
                                true,

                            upsert:
                                true,

                            runValidators:
                                true,

                            setDefaultsOnInsert:
                                true

                        }

                    );


                console.log(
                    "LOCATION SYNCED:",
                    {

                        latitude:
                            location.latitude,

                        longitude:
                            location.longitude,

                        insideSafeZone:
                            location.insideSafeZone

                    }
                );
            }


            // =================================================
            // 3. SAFETY PREDICTION
            // =================================================

            let prediction =
                "NO ALERT";


            // =================================================
            // MANUAL SOS
            // =================================================

            if (sosActive) {

                // SOS always triggers emergency

                prediction =
                    "ALERT";

            }


            // =================================================
            // AUTOMATIC ML DETECTION
            // =================================================

            else {

                const modelInput = {

                    profile:
                        normalizedProfile,

                    heart_rate:
                        heartRateValue,

                    voice_status:
                        normalizedVoice,

                    geofence_status:

                        calculatedGeofenceStatus ===
                            "Outside"

                            ? "Outside"

                            : "Inside"

                };


                console.log(
                    "ML MODEL INPUT:",
                    modelInput
                );


                try {

                    prediction =
                        await runSafetyModel(
                            modelInput
                        );

                }

                catch (modelError) {

                    console.log(
                        "MODEL FAILED - CONTINUING MONITORING:",
                        modelError.message
                    );


                    prediction =
                        "NO ALERT";

                }
            }


            console.log(
                "SAFETY PREDICTION:",
                prediction
            );


            // =================================================
            // 4. ALERT HANDLING
            // =================================================

            let alert =
                null;


            if (
                prediction ===
                "ALERT"
            ) {

                // -------------------------------------------------
                // CURRENT MONITORING STATUS = EMERGENCY
                // -------------------------------------------------

                monitoring.safetyStatus =
                    "Emergency";


                await monitoring.save();


                // -------------------------------------------------
                // CHECK CURRENT ACTIVE ALERT
                // -------------------------------------------------

                const existingAlert =
                    await Alert.findOne({

                        wearerId,

                        status:
                            "Active"

                    })

                        .sort({

                            createdAt:
                                -1

                        });


                // =================================================
                // ALERT MESSAGE & TRIGGER CATEGORY (SEPARATE VOICE & SOS)
                // =================================================

                let calculatedTriggeredBy = "Emergency";
                let alertMessage;

                if (sosActive) {
                    calculatedTriggeredBy = "SOS";
                    alertMessage = "Manual SOS emergency triggered.";
                } else if (normalizedVoice === "Distress" || /help me|distress|scream|panic|cry/i.test(`${normalizedVoice} ${finalDetectedSpeech}`)) {
                    calculatedTriggeredBy = "Voice Distress";
                    alertMessage = `Voice distress detected${finalDetectedSpeech ? `: "${finalDetectedSpeech}"` : ': "help me"'}`;
                } else if (heartRateValue !== null && (heartRateValue > 120 || (heartRateValue > 0 && heartRateValue < 50))) {
                    calculatedTriggeredBy = "High Heart Rate";
                    alertMessage = `Abnormal heart rate detected: ${heartRateValue} BPM`;
                } else if (calculatedGeofenceStatus === "Outside") {
                    calculatedTriggeredBy = "Geofence Alert";
                    alertMessage = "Wearer moved outside the configured safe zone.";
                } else {
                    alertMessage = `Emergency detected. Heart Rate: ${heartRateValue}, Voice: ${normalizedVoice}, Geofence: ${calculatedGeofenceStatus}`;
                    if (finalDetectedSpeech) {
                        alertMessage += `, Detected Speech: "${finalDetectedSpeech}"`;
                    }
                }

                // =================================================
                // ACTIVE ALERT ALREADY EXISTS
                // UPDATE IT
                // =================================================

                if (existingAlert) {

                    existingAlert.guardianId =
                        guardianId;

                    existingAlert.type =
                        sosActive
                            ? "SOS"
                            : "Automatic";

                    existingAlert.triggeredBy =
                        calculatedTriggeredBy;

                    existingAlert.sos =
                        sosActive;


                    existingAlert.heartRate =
                        heartRateValue;


                    existingAlert.voiceStatus =
                        normalizedVoice;


                    existingAlert.detectedSpeech =
                        finalDetectedSpeech;


                    existingAlert.microphoneStatus =
                        finalMicrophoneStatus;


                    existingAlert.geofenceStatus =
                        calculatedGeofenceStatus;


                    existingAlert.battery =
                        batteryValue;


                    existingAlert.gsmStatus =
                        finalGsmStatus;


                    existingAlert.latitude =
                        latitudeValue;


                    existingAlert.longitude =
                        longitudeValue;


                    existingAlert.speed =
                        speedValue;


                    existingAlert.message =
                        alertMessage;


                    await existingAlert.save();


                    alert =
                        existingAlert;


                    console.log(
                        "ACTIVE ALERT UPDATED:",
                        alert._id
                    );

                }


                // =================================================
                // NO ACTIVE ALERT
                // CREATE NEW ALERT
                // =================================================

                else {

                    alert =
                        await Alert.create({

                            guardianId,

                            wearerId,

                            type:

                                sosActive

                                    ? "SOS"

                                    : "Automatic",

                            status:
                                "Active",

                            triggeredBy:
                                calculatedTriggeredBy,

                            sos:
                                sosActive,

                            heartRate:
                                heartRateValue,

                            voiceStatus:
                                normalizedVoice,

                            detectedSpeech:
                                finalDetectedSpeech,

                            microphoneStatus:
                                finalMicrophoneStatus,

                            geofenceStatus:
                                calculatedGeofenceStatus,

                            battery:
                                batteryValue,

                            gsmStatus:
                                finalGsmStatus,

                            latitude:
                                latitudeValue,

                            longitude:
                                longitudeValue,

                            speed:
                                speedValue,

                            message:
                                alertMessage

                        });


                    console.log(
                        "NEW ACTIVE ALERT CREATED:",
                        alert._id
                    );

                }

            }


            // =================================================
            // RESPONSE
            // =================================================

            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Monitoring, location and safety data synchronized successfully.",

                    prediction,

                    alertRequired:

                        prediction ===
                        "ALERT",

                    monitoring,

                    location,

                    geofence: {

                        status:
                            calculatedGeofenceStatus,

                        distance:

                            geofenceResult.distance !==
                                null

                                ? Math.round(
                                    geofenceResult.distance
                                )

                                : null,

                        radius:

                            geofenceResult.safeZone
                                ?.radius ??

                            null

                    },

                    alert

                });

        }


        // =====================================================
        // ERROR
        // =====================================================

        catch (error) {

            console.log(
                "MONITORING UPDATE ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to update monitoring data.",

                    error:
                        error.message

                });

        }

    };


// =========================================================
// GET LATEST MONITORING
// =========================================================

export const getLatestMonitoring =
    async (req, res) => {

        try {

            const {
                wearerId
            } = req.params;


            if (!wearerId) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Wearer ID is required."

                    });

            }


            let monitoring =
                await Monitoring.findOne({
                    wearerId
                })
                    .sort({
                        updatedAt:
                            -1
                    })
                    .lean();

            // Fallback: If not found for specific ID, get the freshest live hardware record
            if (!monitoring) {
                monitoring = await Monitoring.findOne()
                    .sort({ updatedAt: -1 })
                    .lean();
            }

            res.set(
                "Cache-Control",
                "no-store"
            );

            if (!monitoring) {
                return res
                    .status(404)
                    .json({
                        success:
                            false,
                        message:
                            "Monitoring data not found."
                    });
            }


            return res
                .status(200)
                .json({

                    success:
                        true,

                    monitoring

                });

        }


        catch (error) {

            console.log(
                "MONITORING FETCH ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to fetch monitoring data.",

                    error:
                        error.message

                });

        }

    };