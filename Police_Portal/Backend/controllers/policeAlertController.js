import { PoliceAlert } from "../models/policeAlertModel.js";
import { PoliceStation } from "../models/policeStationModel.js";


/* =========================================================
   HELPER - NORMALIZE WEARER TYPE
========================================================= */

function normalizeWearerType(value) {

    const type = String(value || "")
        .trim()
        .toLowerCase();

    if (type === "women") {
        return "woman";
    }

    if (type === "female") {
        return "woman";
    }

    if (type === "girl") {
        return "woman";
    }

    if (type === "boy") {
        return "child";
    }

    return type;
}


/* =========================================================
   HELPER - VALID GPS
========================================================= */

function isValidCoordinates(latitude, longitude) {

    const lat = Number(latitude);
    const lng = Number(longitude);

    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
}


/* =========================================================
   HELPER - CLEAN STRING
========================================================= */

function cleanString(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
}


/* =========================================================
   SEND POLICE ALERT
========================================================= */

export const sendPoliceAlert =
    async (req, res, next) => {

        try {

            const {

                guardianId,

                guardianName,
                guardianPhone,
                guardianMobile,
                mobileNumber,
                guardianEmail,

                wearerId,
                wearerName,
                wearerType,
                deviceId,

                policeStationId,

                latitude,
                longitude,

                alertType,

                distanceKm,
                recommended

            } = req.body;


            /* =================================================
               BASIC VALIDATION
            ================================================= */

            if (
                !guardianId ||
                !wearerId ||
                !wearerName ||
                !wearerType ||
                !policeStationId ||
                latitude === undefined ||
                longitude === undefined
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Required alert information is missing."

                });

            }


            /* =================================================
               WEARER TYPE
            ================================================= */

            const normalizedWearerType =
                normalizeWearerType(
                    wearerType
                );


            if (
                ![
                    "woman",
                    "child"
                ].includes(
                    normalizedWearerType
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid wearer type."

                });

            }


            /* =================================================
               GPS VALIDATION
            ================================================= */

            if (
                !isValidCoordinates(
                    latitude,
                    longitude
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid wearer GPS location."

                });

            }


            const wearerLat =
                Number(latitude);


            const wearerLng =
                Number(longitude);


            /* =================================================
               GUARDIAN DETAILS

               Police Portal does NOT query Guardian model.

               These values are received from
               Major Project Backend.
            ================================================= */

            const finalGuardianName =
                cleanString(
                    guardianName
                );


            const finalGuardianPhone =
                cleanString(
                    guardianPhone ||
                    guardianMobile ||
                    mobileNumber
                );


            const finalGuardianEmail =
                cleanString(
                    guardianEmail
                );


            const finalDeviceId =
                cleanString(
                    deviceId
                );


            /* =================================================
               POLICE STATION
            ================================================= */

            const cleanStationId =
                String(
                    policeStationId
                )
                    .trim()
                    .toUpperCase();


            const registeredStation =
                await PoliceStation.findOne({

                    stationId:
                        cleanStationId,

                    active:
                        true

                });


            if (!registeredStation) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Registered police station not found."

                });

            }


            /* =================================================
               DISTANCE
            ================================================= */

            let finalDistanceKm =
                null;


            if (
                distanceKm !== undefined &&
                distanceKm !== null &&
                distanceKm !== "" &&
                Number.isFinite(
                    Number(distanceKm)
                )
            ) {

                finalDistanceKm =
                    Number(distanceKm);

            }


            /* =================================================
               CHECK EXISTING ACTIVE ALERT

               Same wearer + same police station +
               Pending / Accepted alert

               If found, update instead of creating duplicates.
            ================================================= */

            const existingAlert =
                await PoliceAlert.findOne({

                    wearerId,

                    policeStationId:
                        registeredStation.stationId,

                    status: {

                        $in: [
                            "Pending",
                            "Accepted"
                        ]

                    }

                });


            if (existingAlert) {

                /* ---------------------------------------------
                   SOURCE
                --------------------------------------------- */

                existingAlert.guardianId =
                    guardianId;


                /* ---------------------------------------------
                   GUARDIAN
                --------------------------------------------- */

                existingAlert.guardianName =
                    finalGuardianName ||
                    existingAlert.guardianName ||
                    "";


                existingAlert.guardianPhone =
                    finalGuardianPhone ||
                    existingAlert.guardianPhone ||
                    "";


                existingAlert.guardianEmail =
                    finalGuardianEmail ||
                    existingAlert.guardianEmail ||
                    "";


                /* ---------------------------------------------
                   WEARER
                --------------------------------------------- */

                existingAlert.wearerName =
                    cleanString(
                        wearerName
                    );


                existingAlert.wearerType =
                    normalizedWearerType;


                existingAlert.deviceId =
                    finalDeviceId ||
                    existingAlert.deviceId ||
                    null;


                /* ---------------------------------------------
                   LIVE EMERGENCY LOCATION
                --------------------------------------------- */

                existingAlert.latitude =
                    wearerLat;


                existingAlert.longitude =
                    wearerLng;


                /* ---------------------------------------------
                   ALERT INFORMATION
                --------------------------------------------- */

                existingAlert.alertType =
                    cleanString(
                        alertType
                    ) ||
                    existingAlert.alertType ||
                    "Emergency Alert";


                if (
                    finalDistanceKm !== null
                ) {

                    existingAlert.distanceKm =
                        finalDistanceKm;

                }


                if (
                    recommended !== undefined
                ) {

                    existingAlert.recommended =
                        Boolean(
                            recommended
                        );

                }


                existingAlert.repeatAlertCount =
                    Number(
                        existingAlert.repeatAlertCount ||
                        1
                    ) + 1;


                existingAlert.lastAlertAt =
                    new Date();


                await existingAlert.save();


                return res.status(200).json({

                    success: true,

                    message:
                        "Existing emergency alert updated successfully.",

                    policeAlert:
                        existingAlert

                });

            }


            /* =================================================
               CREATE NEW POLICE ALERT
            ================================================= */

            const policeAlert =
                await PoliceAlert.create({

                    /* SOURCE */

                    guardianId,

                    wearerId,


                    /* GUARDIAN */

                    guardianName:
                        finalGuardianName,

                    guardianPhone:
                        finalGuardianPhone,

                    guardianEmail:
                        finalGuardianEmail,


                    /* WEARER */

                    wearerName:
                        cleanString(
                            wearerName
                        ),

                    wearerType:
                        normalizedWearerType,

                    deviceId:
                        finalDeviceId ||
                        null,


                    /* POLICE STATION */

                    policeStationId:
                        registeredStation.stationId,

                    externalPlaceId:
                        registeredStation.externalPlaceId ||
                        null,

                    policeStationName:
                        registeredStation.name ||
                        "",

                    policeStationAddress:
                        registeredStation.address ||
                        "",

                    policeStationPhone:
                        registeredStation.phone ||
                        "",


                    /* EMERGENCY LOCATION */

                    latitude:
                        wearerLat,

                    longitude:
                        wearerLng,

                    distanceKm:
                        finalDistanceKm,


                    /* ALERT */

                    alertType:
                        cleanString(
                            alertType
                        ) ||
                        "Emergency Alert",

                    recommended:
                        Boolean(
                            recommended
                        ),

                    repeatAlertCount:
                        1,

                    lastAlertAt:
                        new Date(),


                    /* RESPONSE */

                    status:
                        "Pending",

                    acceptedAt:
                        null,

                    resolvedAt:
                        null

                });


            return res.status(201).json({

                success: true,

                message:
                    "Police alert sent successfully.",

                policeAlert

            });

        }

        catch (error) {

            console.log(
                "SEND POLICE ALERT ERROR:",
                error
            );

            next(error);

        }

    };


/* =========================================================
   GET POLICE STATION ALERTS
========================================================= */

export const getPoliceStationAlerts =
    async (req, res, next) => {

        try {

            const {
                policeStationId
            } = req.params;


            if (!policeStationId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Police station ID is required."

                });

            }


            const cleanStationId =
                String(
                    policeStationId
                )
                    .trim()
                    .toUpperCase();


            const alerts =
                await PoliceAlert.find({

                    policeStationId:
                        cleanStationId

                })
                    .sort({

                        createdAt:
                            -1

                    })
                    .lean();


            /*
                Guardian information is already
                stored inside PoliceAlert.

                Therefore no Guardian.findById()
                is required here.
            */

            const normalizedAlerts =
                alerts.map(
                    (alert) => {

                        const guardianPhone =
                            alert.guardianPhone ||
                            "";


                        return {

                            ...alert,

                            guardianName:
                                alert.guardianName ||
                                "",

                            guardianPhone:
                                guardianPhone,

                            /*
                                Keep these aliases because
                                existing Police Portal frontend
                                may read any of them.
                            */

                            guardianMobile:
                                guardianPhone,

                            mobileNumber:
                                guardianPhone,

                            guardianEmail:
                                alert.guardianEmail ||
                                "",

                            deviceId:
                                alert.deviceId ||
                                null

                        };

                    }
                );


            res.set(
                "Cache-Control",
                "no-store"
            );


            return res.status(200).json({

                success: true,

                alerts:
                    normalizedAlerts

            });

        }

        catch (error) {

            console.log(
                "GET POLICE ALERTS ERROR:",
                error
            );

            next(error);

        }

    };


/* =========================================================
   ACCEPT POLICE ALERT
========================================================= */

export const acceptPoliceAlert =
    async (req, res, next) => {

        try {

            const {
                alertId
            } = req.params;


            if (!alertId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Alert ID is required."

                });

            }


            const policeAlert =
                await PoliceAlert.findById(
                    alertId
                );


            if (!policeAlert) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Police alert not found."

                });

            }


            /* ---------------------------------------------
               RESOLVED ALERT
            --------------------------------------------- */

            if (
                policeAlert.status ===
                "Resolved"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Resolved alert cannot be accepted."

                });

            }


            /* ---------------------------------------------
               ALREADY ACCEPTED
            --------------------------------------------- */

            if (
                policeAlert.status ===
                "Accepted"
            ) {

                return res.status(200).json({

                    success: true,

                    message:
                        "Alert is already accepted.",

                    policeAlert

                });

            }


            /* ---------------------------------------------
               ACCEPT
            --------------------------------------------- */

            policeAlert.status =
                "Accepted";


            policeAlert.acceptedAt =
                new Date();


            await policeAlert.save();


            return res.status(200).json({

                success: true,

                message:
                    "Alert accepted successfully.",

                policeAlert

            });

        }

        catch (error) {

            console.log(
                "ACCEPT POLICE ALERT ERROR:",
                error
            );

            next(error);

        }

    };


/* =========================================================
   RESOLVE POLICE ALERT
========================================================= */

export const resolvePoliceAlert =
    async (req, res, next) => {

        try {

            const {
                alertId
            } = req.params;


            if (!alertId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Alert ID is required."

                });

            }


            const policeAlert =
                await PoliceAlert.findById(
                    alertId
                );


            if (!policeAlert) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Police alert not found."

                });

            }


            /* ---------------------------------------------
               ALREADY RESOLVED
            --------------------------------------------- */

            if (
                policeAlert.status ===
                "Resolved"
            ) {

                return res.status(200).json({

                    success: true,

                    message:
                        "Alert is already resolved.",

                    policeAlert

                });

            }


            /* ---------------------------------------------
               MUST ACCEPT FIRST
            --------------------------------------------- */

            if (
                policeAlert.status !==
                "Accepted"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Accept the alert before resolving it."

                });

            }


            /* ---------------------------------------------
               RESOLVE
            --------------------------------------------- */

            policeAlert.status =
                "Resolved";


            policeAlert.resolvedAt =
                new Date();


            await policeAlert.save();


            return res.status(200).json({

                success: true,

                message:
                    "Alert resolved successfully.",

                policeAlert

            });

        }

        catch (error) {

            console.log(
                "RESOLVE POLICE ALERT ERROR:",
                error
            );

            next(error);

        }

    };

    /* =========================================================
   DELETE ONE RESOLVED POLICE ALERT
========================================================= */

export const deletePoliceAlert =
    async (req, res, next) => {

        try {

            const { alertId } = req.params;


            if (!alertId) {

                return res.status(400).json({
                    success: false,
                    message: "Alert ID is required."
                });

            }


            const policeAlert =
                await PoliceAlert.findById(alertId);


            if (!policeAlert) {

                return res.status(404).json({
                    success: false,
                    message: "Police alert not found."
                });

            }


            // Only Resolved alerts can be deleted
            if (policeAlert.status !== "Resolved") {

                return res.status(400).json({
                    success: false,
                    message: "Only resolved alerts can be deleted."
                });

            }


            await PoliceAlert.findByIdAndDelete(alertId);


            return res.status(200).json({

                success: true,

                message:
                    "Resolved alert deleted successfully.",

                deletedAlertId:
                    alertId

            });

        }

        catch (error) {

            console.log(
                "DELETE POLICE ALERT ERROR:",
                error
            );

            next(error);

        }

    };



/* =========================================================
   DELETE ALL RESOLVED ALERTS OF POLICE STATION
========================================================= */

export const deleteAllResolvedPoliceAlerts =
    async (req, res, next) => {

        try {

            const { policeStationId } =
                req.params;


            if (!policeStationId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Police station ID is required."

                });

            }


            const cleanStationId =
                String(policeStationId)
                    .trim()
                    .toUpperCase();


            /*
                IMPORTANT:

                Delete ONLY:
                status = Resolved

                Pending and Accepted
                remain untouched.
            */

            const result =
                await PoliceAlert.deleteMany({

                    policeStationId:
                        cleanStationId,

                    status:
                        "Resolved"

                });


            return res.status(200).json({

                success: true,

                message:
                    "Resolved alert history deleted successfully.",

                deletedCount:
                    result.deletedCount || 0

            });

        }

        catch (error) {

            console.log(
                "DELETE ALL RESOLVED ALERTS ERROR:",
                error
            );

            next(error);

        }

    };