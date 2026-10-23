import { Alert }
from "../models/alertModel.js";

import { Monitoring }
from "../models/monitoringModel.js";

import * as locationModule
from "../models/locationModel.js";

import { execFile }
from "child_process";

import path
from "path";

import { fileURLToPath }
from "url";


const LocationModel =
    locationModule.Location ||
    locationModule.LocationModel ||
    locationModule.WearerLocation ||
    locationModule.default;


const __filename =
    fileURLToPath(
        import.meta.url
    );


const __dirname =
    path.dirname(
        __filename
    );


function toBoolean(value) {

    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        String(value).toLowerCase() === "true"
    );

}


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


function getInsideSafeZone(
    geofenceStatus
) {

    const value =
        String(
            geofenceStatus || ""
        ).toLowerCase();

    if (value === "inside") {
        return true;
    }

    if (value === "outside") {
        return false;
    }

    return undefined;

}


async function syncLocationFromAlert({
    wearerId,
    latitude,
    longitude,
    deviceId,
    geofenceStatus
}) {

    try {

        if (!LocationModel) {

            console.log(
                "Location model not available."
            );

            return;
        }

        const lat =
            toNumberOrNull(
                latitude
            );

        const lng =
            toNumberOrNull(
                longitude
            );

        if (
            lat === null ||
            lng === null
        ) {

            return;
        }

        const locationUpdate = {

            wearerId,

            latitude:
                lat,

            longitude:
                lng

        };

        if (deviceId) {

            locationUpdate.deviceId =
                deviceId;

        }

        const insideSafeZone =
            getInsideSafeZone(
                geofenceStatus
            );

        if (
            insideSafeZone !==
            undefined
        ) {

            locationUpdate.insideSafeZone =
                insideSafeZone;

        }

        await LocationModel.findOneAndUpdate(

            {
                wearerId
            },

            {
                $set:
                    locationUpdate
            },

            {
                new:
                    true,

                upsert:
                    true,

                setDefaultsOnInsert:
                    true
            }

        );

        console.log(
            "Location synced from alert:",
            wearerId,
            lat,
            lng
        );

    }

    catch (error) {

        console.log(
            "ALERT LOCATION SYNC ERROR:",
            error
        );

    }

}


// =========================================================
// CHECK ALERT USING ML MODEL
// =========================================================

export const checkAlert =
    async (req, res) => {

        try {

            console.log(
                "Received Alert Body:",
                req.body
            );

            const {

                guardianId,

                wearerId,

                profile,

                heart_rate,

                voice_status,

                geofence_status,

                sos,

                battery,

                gsm_status,

                gsmStatus,

                latitude,

                longitude,

                deviceId,

                speed

            } = req.body || {};


            if (
                !guardianId ||
                !wearerId
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Guardian and wearer are required."

                    });

            }


            const sosActive =
                toBoolean(
                    sos
                );


            // MANUAL SOS - ML NOT REQUIRED
            if (sosActive) {

                const alert =
                    await Alert.create({

                        guardianId,

                        wearerId,

                        type:
                            "SOS",

                        status:
                            "Active",

                        triggeredBy:
                            "Emergency",

                        sos:
                            true,

                        heartRate:
                            toNumberOrNull(
                                heart_rate
                            ),

                        voiceStatus:
                            voice_status ||
                            "Normal",

                        geofenceStatus:
                            geofence_status ||
                            "Inside",

                        battery:
                            toNumberOrNull(
                                battery
                            ),

                        gsmStatus:
                            gsmStatus ||
                            gsm_status ||
                            "Not Available",

                        latitude:
                            toNumberOrNull(
                                latitude
                            ),

                        longitude:
                            toNumberOrNull(
                                longitude
                            ),

                        speed:
                            toNumberOrNull(
                                speed
                            ),

                        message:
                            "Manual SOS emergency alert triggered."

                    });


                await syncLocationFromAlert({

                    wearerId,

                    latitude,

                    longitude,

                    deviceId,

                    geofenceStatus:
                        geofence_status

                });


                console.log(
                    "SOS alert saved:",
                    alert._id
                );


                return res
                    .status(201)
                    .json({

                        success:
                            true,

                        alertRequired:
                            true,

                        alertType:
                            "SOS",

                        prediction:
                            "ALERT",

                        alert

                    });

            }


            if (
                !profile ||
                heart_rate === undefined ||
                !voice_status ||
                !geofence_status
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Profile, heart rate, voice status and geofence status are required."

                    });

            }


            const inputData =
                JSON.stringify({

                    profile,

                    heart_rate:
                        Number(
                            heart_rate
                        ),

                    voice_status,

                    geofence_status

                });


            const pythonFile =
                path.join(

                    __dirname,

                    "../../ml_model/predict.py"

                );


            execFile(

                "python",

                [
                    pythonFile,
                    inputData
                ],

                async (
                    error,
                    stdout,
                    stderr
                ) => {

                    if (error) {

                        console.log(
                            "ML ERROR:",
                            error
                        );

                        console.log(
                            "PYTHON STDERR:",
                            stderr
                        );

                        return res
                            .status(500)
                            .json({

                                success:
                                    false,

                                message:
                                    "ML prediction failed.",

                                error:
                                    error.message

                            });

                    }


                    try {

                        const output =
                            stdout
                                .trim()
                                .split("\n")
                                .filter(Boolean);


                        const prediction =
                            output[
                                output.length - 1
                            ]
                                .trim()
                                .toUpperCase();


                        console.log(
                            "ML Prediction:",
                            prediction
                        );


                        if (
                            prediction ===
                            "ALERT"
                        ) {
                            let diagnostic = null;
                            try {
                                if (output.length > 1) {
                                    diagnostic = JSON.parse(output[0]);
                                }
                            } catch (_) {}

                            const isVoiceDistress = /help|distress|scream|panic|cry/i.test(String(voice_status || ""));
                            const alertTriggeredBy = diagnostic?.triggeredBy || (isVoiceDistress ? "Voice Distress" : "Emergency");
                            const alertMessage = diagnostic?.message || (isVoiceDistress ? `Voice distress detected: "${voice_status}"` : `Automatic emergency detected. Heart Rate: ${heart_rate}, Voice: ${voice_status}, Geofence: ${geofence_status}`);

                            const alert =
                                await Alert.create({

                                    guardianId,

                                    wearerId,

                                    type:
                                        "Automatic",

                                    status:
                                        "Active",

                                    triggeredBy:
                                        alertTriggeredBy,

                                    sos:
                                        false,

                                    heartRate:
                                        toNumberOrNull(
                                            heart_rate
                                        ),

                                    voiceStatus:
                                        isVoiceDistress ? "Distress" : voice_status,

                                    geofenceStatus:
                                        geofence_status,

                                    battery:
                                        toNumberOrNull(
                                            battery
                                        ),

                                    gsmStatus:
                                        gsmStatus ||
                                        gsm_status ||
                                        "Not Available",

                                    latitude:
                                        toNumberOrNull(
                                            latitude
                                        ),

                                    longitude:
                                        toNumberOrNull(
                                            longitude
                                        ),

                                    speed:
                                        toNumberOrNull(
                                            speed
                                        ),

                                    message:
                                        alertMessage

                                });


                            await syncLocationFromAlert({

                                wearerId,

                                latitude,

                                longitude,

                                deviceId,

                                geofenceStatus:
                                    geofence_status

                            });


                            console.log(
                                "Automatic alert saved:",
                                alert._id
                            );


                            return res
                                .status(201)
                                .json({

                                    success:
                                        true,

                                    alertRequired:
                                        true,

                                    alertType:
                                        "Automatic",

                                    prediction:
                                        "ALERT",

                                    alert

                                });

                        }


                        await syncLocationFromAlert({

                            wearerId,

                            latitude,

                            longitude,

                            deviceId,

                            geofenceStatus:
                                geofence_status

                        });


                        return res
                            .status(200)
                            .json({

                                success:
                                    true,

                                alertRequired:
                                    false,

                                prediction:
                                    "NO ALERT",

                                message:
                                    "No emergency detected."

                            });

                    }

                    catch (dbError) {

                        console.log(
                            "DATABASE ALERT ERROR:",
                            dbError
                        );


                        return res
                            .status(500)
                            .json({

                                success:
                                    false,

                                message:
                                    "Prediction worked but alert could not be saved.",

                                error:
                                    dbError.message

                            });

                    }

                }

            );

        }

        catch (error) {

            console.log(
                "CHECK ALERT ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to check emergency condition.",

                    error:
                        error.message

                });

        }

    };


// =========================================================
// CREATE ALERT DIRECTLY
// =========================================================

export const createAlert =
    async (req, res) => {

        try {

            const {

                guardianId,

                wearerId,

                type,

                triggeredBy,

                heartRate,

                heart_rate,

                voiceStatus,

                voice_status,

                geofenceStatus,

                geofence_status,

                sos,

                battery,

                gsmStatus,

                gsm_status,

                latitude,

                longitude,

                speed,

                deviceId,

                message

            } = req.body || {};


            if (
                !guardianId ||
                !wearerId ||
                !type
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Guardian, wearer and alert type are required."

                    });

            }


            const normalizedType =
                String(type)
                    .trim();


            const isSOS =
                normalizedType
                    .toLowerCase() ===
                    "sos" ||
                toBoolean(
                    sos
                );


            const finalHeartRate =
                heartRate !== undefined
                    ? heartRate
                    : heart_rate;


            const finalVoiceStatus =
                voiceStatus ||
                voice_status ||
                "Normal";


            const finalGeofenceStatus =
                geofenceStatus ||
                geofence_status ||
                "Inside";


            const finalGsmStatus =
                gsmStatus ||
                gsm_status ||
                "Not Available";


            const alert =
                await Alert.create({

                    guardianId,

                    wearerId,

                    type:
                        normalizedType,

                    status:
                        "Active",

                    triggeredBy:
                        triggeredBy ||
                        "Emergency",

                    sos:
                        isSOS,

                    heartRate:
                        toNumberOrNull(
                            finalHeartRate
                        ),

                    voiceStatus:
                        finalVoiceStatus,

                    geofenceStatus:
                        finalGeofenceStatus,

                    battery:
                        toNumberOrNull(
                            battery
                        ),

                    gsmStatus:
                        finalGsmStatus,

                    latitude:
                        toNumberOrNull(
                            latitude
                        ),

                    longitude:
                        toNumberOrNull(
                            longitude
                        ),

                    speed:
                        toNumberOrNull(
                            speed
                        ),

                    message:
                        message ||
                        (
                            isSOS
                                ? "Emergency SOS detected"
                                : `${normalizedType} emergency detected`
                        )

                });


            await syncLocationFromAlert({

                wearerId,

                latitude,

                longitude,

                deviceId,

                geofenceStatus:
                    finalGeofenceStatus

            });


            console.log(
                "Alert created:",
                alert._id
            );


            return res
                .status(201)
                .json({

                    success:
                        true,

                    message:
                        "Alert created successfully.",

                    alert

                });

        }

        catch (error) {

            console.log(
                "CREATE ALERT ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to create alert.",

                    error:
                        error.message

                });

        }

    };


// =========================================================
// GET ALL ACTIVE ALERTS FOR GUARDIAN
// NEW - USED BY CARETAKER REACT APP
// =========================================================

export const getActiveAlerts =
    async (req, res) => {

        try {

            const {
                guardianId
            } = req.params;


            if (!guardianId) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Guardian ID is required."

                    });

            }


            let alerts =
                await Alert.find({
                    guardianId,
                    status:
                        "Active"
                })
                    .sort({
                        updatedAt: -1,
                        createdAt: -1
                    });

            if (!alerts || alerts.length === 0) {
                alerts = await Alert.find({ status: "Active" }).sort({ updatedAt: -1, createdAt: -1 });
            }


            res.set(
                "Cache-Control",
                "no-store"
            );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    alerts

                });

        }

        catch (error) {

            console.log(
                "ACTIVE ALERTS ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to fetch active alerts.",

                    error:
                        error.message

                });

        }

    };


// =========================================================
// GET LATEST ACTIVE ALERT FOR ONE WEARER
// =========================================================

export const getLatestAlert =
    async (req, res) => {

        try {

            const {
                wearerId
            } = req.params;


            const alert =
                await Alert.findOne({

                    wearerId,

                    status:
                        "Active"

                })
                    .sort({

                        createdAt:
                            -1

                    });


            res.set(
                "Cache-Control",
                "no-store"
            );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    alert:
                        alert || null

                });

        }

        catch (error) {

            console.log(
                "LATEST ALERT ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to fetch latest alert.",

                    error:
                        error.message

                });

        }

    };


// =========================================================
// ACKNOWLEDGE ALERT
// =========================================================

export const acknowledgeAlert =
    async (req, res) => {

        try {

            const {
                alertId
            } = req.params;


            const alert =
                await Alert.findById(
                    alertId
                );


            if (!alert) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Alert not found."

                    });

            }


            if (
                alert.status === "Acknowledged" ||
                alert.status === "Resolved"
            ) {
                return res
                    .status(200)
                    .json({
                        success: true,
                        message: "Alert is already resolved and marked safe.",
                        alert
                    });
            }

            alert.status = "Resolved";
            alert.acknowledgedAt = new Date();

            await alert.save();

            // Automatically reset Monitoring safety status if all alerts resolved
            try {
                const activeCount = await Alert.countDocuments({
                    wearerId: alert.wearerId,
                    status: "Active"
                });
                if (activeCount === 0) {
                    await Monitoring.updateOne(
                        { wearerId: alert.wearerId },
                        {
                            $set: {
                                safetyStatus: "Safe",
                                sos: false,
                                voiceStatus: "Normal"
                            }
                        }
                    );
                }
            } catch (_) {}

            return res
                .status(200)
                .json({
                    success: true,
                    message: "Alert marked as resolved and safe successfully.",
                    alert
                });

        }

        catch (error) {

            console.log(
                "ACKNOWLEDGE ALERT ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to acknowledge alert.",

                    error:
                        error.message

                });

        }

    };


// =========================================================
// GET COMPLETE ALERT HISTORY
// =========================================================

export const getAlertHistory =
    async (req, res) => {

        try {

            const {
                wearerId
            } = req.params;


            const alerts =
                await Alert.find({
                    $or: [
                        { wearerId: wearerId },
                        { guardianId: wearerId }
                    ]
                })
                    .sort({

                        createdAt:
                            -1

                    });


            res.set(
                "Cache-Control",
                "no-store"
            );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    alerts

                });

        }

        catch (error) {

            console.log(
                "ALERT HISTORY ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to fetch alert history.",

                    error:
                        error.message

                });

        }

    };


// =========================================================
// DELETE ONE ALERT
// =========================================================

export const deleteAlert =
    async (req, res) => {

        try {

            const {
                alertId
            } = req.params;


            const alert =
                await Alert.findById(
                    alertId
                );


            if (!alert) {

                return res
                    .status(404)
                    .json({

                        success:
                            false,

                        message:
                            "Alert not found."

                    });

            }


            if (
                alert.status ===
                "Active"
            ) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Active alert cannot be deleted. Acknowledge it first."

                    });

            }


            await Alert.findByIdAndDelete(
                alertId
            );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Alert deleted successfully."

                });

        }

        catch (error) {

            console.log(
                "DELETE ALERT ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to delete alert.",

                    error:
                        error.message

                });

        }

    };


// =========================================================
// DELETE COMPLETE ALERT HISTORY
// =========================================================

export const deleteAlertHistory =
    async (req, res) => {

        try {

            const {
                guardianId
            } = req.params;


            if (!guardianId) {

                return res
                    .status(400)
                    .json({

                        success:
                            false,

                        message:
                            "Guardian ID is required."

                    });

            }


            const result =
                await Alert.deleteMany({

                    guardianId

                });


            console.log(
                "ALL ALERTS DELETED:",
                result.deletedCount
            );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "All alert history deleted successfully.",

                    deletedCount:
                        result.deletedCount

                });

        }

        catch (error) {

            console.log(
                "DELETE ALL ALERTS ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to delete alert history.",

                    error:
                        error.message

                });

        }

    };


// =========================================================
// DELETE ALL ALERTS FOR ONE WEARER
// =========================================================

export const deleteWearerAlertHistory =
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


            const result =
                await Alert.deleteMany({
                    $or: [
                        { wearerId: wearerId },
                        { guardianId: wearerId }
                    ]
                });


            console.log(
                "WEARER ALERTS DELETED:",
                result.deletedCount
            );


            return res
                .status(200)
                .json({

                    success:
                        true,

                    message:
                        "Wearer alert history deleted successfully.",

                    deletedCount:
                        result.deletedCount

                });

        }

        catch (error) {

            console.log(
                "DELETE WEARER ALERTS ERROR:",
                error
            );


            return res
                .status(500)
                .json({

                    success:
                        false,

                    message:
                        "Unable to delete wearer alert history.",

                    error:
                        error.message

                });

        }

    };


    