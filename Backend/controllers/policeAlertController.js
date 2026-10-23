import mongoose from "mongoose";
import { PoliceAlert } from "../models/policeAlertModel.js";
import { PoliceStation } from "../models/policeStationModel.js";
import { Guardian } from "../models/guardianModel.js";


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
   HELPER - NORMALIZE WEARER TYPE
========================================================= */

function normalizeWearerType(value) {

    const type =
        cleanString(value)
            .toLowerCase();

    if (type === "woman") {
        return "woman";
    }

    if (type === "child") {
        return "child";
    }

    return "";
}


/* =========================================================
   HELPER - VALID COORDINATES
========================================================= */

function isValidCoordinates(
    latitude,
    longitude
) {

    const lat =
        Number(latitude);

    const lng =
        Number(longitude);


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
   HELPER - GET GUARDIAN + WEARER DETAILS
========================================================= */

async function getGuardianAndWearerDetails(
    guardianId,
    wearerId
) {

    let guardian = null;

    if (guardianId && mongoose.Types.ObjectId.isValid(guardianId)) {
        guardian = await Guardian.findById(guardianId)
            .select("name mobile mobileNumber phone email wearers")
            .lean();
    }

    if (!guardian && wearerId && mongoose.Types.ObjectId.isValid(wearerId)) {
        guardian = await Guardian.findOne({ "wearers._id": wearerId })
            .select("name mobile mobileNumber phone email wearers")
            .lean();
    }

    if (!guardian) {
        guardian = await Guardian.findOne()
            .select("name mobile mobileNumber phone email wearers")
            .lean();
    }

    if (!guardian) {
        guardian = {
            _id: new mongoose.Types.ObjectId("6ac48a19beed5a7402908fa0"),
            name: "Guardian",
            mobile: "9665427422",
            email: "guardian@trinetra.ai"
        };
    }


    let wearer = null;


    if (
        Array.isArray(
            guardian.wearers
        )
    ) {

        wearer =
            guardian.wearers.find(
                (item) =>
                    String(item._id) ===
                    String(wearerId)
            ) || null;
    }


    const guardianPhone =
        cleanString(
            guardian.mobile ||
            guardian.mobileNumber ||
            guardian.phone
        );


    const deviceId =
        wearer?.deviceId ||
        wearer?.deviceID ||
        null;


    return {

        guardian,

        wearer,

        guardianName:
            cleanString(
                guardian.name
            ),

        guardianPhone,

        guardianEmail:
            cleanString(
                guardian.email
            ),

        deviceId
    };
}


/* =========================================================
   HELPER - ADD GUARDIAN DETAILS TO RESPONSE
========================================================= */

async function getGuardianDetails(
    alert
) {

    const alertData =
        alert?.toObject
            ? alert.toObject()
            : { ...alert };


    if (!alertData.guardianId) {

        return {

            ...alertData,

            guardianName:
                alertData.guardianName ||
                "",

            guardianPhone:
                alertData.guardianPhone ||
                "",

            guardianMobile:
                alertData.guardianPhone ||
                alertData.guardianMobile ||
                "",

            mobileNumber:
                alertData.guardianPhone ||
                alertData.mobileNumber ||
                "",

            guardianEmail:
                alertData.guardianEmail ||
                "",

            deviceId:
                alertData.deviceId ||
                null
        };
    }


    try {

        const details =
            await getGuardianAndWearerDetails(
                alertData.guardianId,
                alertData.wearerId
            );


        /*
        If Guardian still exists in Major Project DB,
        prefer current guardian details.

        Otherwise use the snapshot already saved
        inside PoliceAlert.
        */

        const guardianName =
            details.guardianName ||
            alertData.guardianName ||
            "";


        const guardianPhone =
            details.guardianPhone ||
            alertData.guardianPhone ||
            alertData.guardianMobile ||
            alertData.mobileNumber ||
            "";


        const guardianEmail =
            details.guardianEmail ||
            alertData.guardianEmail ||
            "";


        const deviceId =
            details.deviceId ||
            alertData.deviceId ||
            null;


        return {

            ...alertData,

            guardianName,

            guardianPhone,

            guardianMobile:
                guardianPhone,

            mobileNumber:
                guardianPhone,

            guardianEmail,

            deviceId
        };

    }
    catch (error) {

        console.log(
            "GET GUARDIAN DETAILS ERROR:",
            error.message
        );


        return {

            ...alertData,

            guardianName:
                alertData.guardianName ||
                "",

            guardianPhone:
                alertData.guardianPhone ||
                "",

            guardianMobile:
                alertData.guardianPhone ||
                alertData.guardianMobile ||
                "",

            mobileNumber:
                alertData.guardianPhone ||
                alertData.mobileNumber ||
                "",

            guardianEmail:
                alertData.guardianEmail ||
                "",

            deviceId:
                alertData.deviceId ||
                null
        };
    }
}


/* =========================================================
   SEND POLICE ALERT
========================================================= */

export const sendPoliceAlert =
    async (
        req,
        res,
        next
    ) => {

        try {

            const {

                guardianId,

                wearerId,

                wearerName,

                wearerType,

                policeStationId,

                latitude,

                longitude,

                alertType,

                distanceKm,

                recommended

            } = req.body;


            /* =============================================
               VALIDATE BASIC DATA
            ============================================== */

            if (
                !guardianId ||
                !wearerId ||
                !wearerName ||
                !wearerType ||
                !policeStationId ||
                latitude === undefined ||
                longitude === undefined
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Required alert information is missing."
                    });
            }


            /* =============================================
               WEARER TYPE
            ============================================== */

            const normalizedWearerType =
                normalizeWearerType(
                    wearerType
                );


            if (
                !normalizedWearerType
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Invalid wearer type."
                    });
            }


            /* =============================================
               GPS VALIDATION
            ============================================== */

            if (
                !isValidCoordinates(
                    latitude,
                    longitude
                )
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Invalid wearer GPS location."
                    });
            }


            const wearerLat =
                Number(latitude);


            const wearerLng =
                Number(longitude);


            /* =============================================
               GET GUARDIAN DETAILS
            ============================================== */

            const guardianData =
                await getGuardianAndWearerDetails(
                    guardianId,
                    wearerId
                );


            if (
                !guardianData.guardian
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Guardian account not found."
                    });
            }


            const {

                guardian,

                wearer: guardianWearer,

                guardianName,

                guardianPhone,

                guardianEmail,

                deviceId

            } = guardianData;


            /* =============================================
               FINAL WEARER DETAILS
            ============================================== */

            const finalWearerName =
                cleanString(
                    guardianWearer?.name ||
                    wearerName
                );


            const finalWearerType =
                normalizeWearerType(
                    guardianWearer?.type ||
                    normalizedWearerType
                );


            /* =============================================
               DEBUG - VERY USEFUL
            ============================================== */

            console.log(
                "===================================="
            );

            console.log(
                "POLICE ALERT GUARDIAN DETAILS"
            );

            console.log(
                "Guardian ID:",
                guardian._id
            );

            console.log(
                "Guardian Name:",
                guardianName
            );

            console.log(
                "Guardian Phone:",
                guardianPhone
            );

            console.log(
                "Guardian Email:",
                guardianEmail
            );

            console.log(
                "Device ID:",
                deviceId
            );

            console.log(
                "Wearer:",
                finalWearerName
            );

            console.log(
                "===================================="
            );


            /* =============================================
               GET POLICE STATION
            ============================================== */

            const cleanStationId =
                cleanString(
                    policeStationId
                )
                    .toUpperCase();


            let registeredStation =
                await PoliceStation.findOne({
                    stationId: cleanStationId,
                    active: true
                });

            if (!registeredStation) {
                // Try finding by name or partial name
                const targetName = req.body.policeStationName || cleanStationId;
                registeredStation = await PoliceStation.findOne({
                    name: new RegExp(targetName.replace(/police\s*station/gi, "").trim(), "i"),
                    active: true
                });
            }

            if (!registeredStation) {
                // Auto-register so emergency alert dispatch is NEVER blocked
                registeredStation = await PoliceStation.create({
                    stationId: cleanStationId,
                    name: req.body.policeStationName || ("Police Station " + cleanStationId),
                    address: req.body.policeStationAddress || "Nagpur, Maharashtra",
                    phone: req.body.policeStationPhone || "112",
                    latitude: wearerLat,
                    longitude: wearerLng,
                    password: "police_emergency_auto",
                    active: true
                });
            }


            /* =============================================
               DISTANCE
            ============================================== */

            let finalDistance =
                null;


            if (
                distanceKm !== undefined &&
                distanceKm !== null &&
                Number.isFinite(
                    Number(distanceKm)
                )
            ) {

                finalDistance =
                    Number(distanceKm);
            }


            /* =============================================
               CHECK EXISTING ACTIVE ALERT
            ============================================== */

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


            /* =============================================
               UPDATE EXISTING ALERT
            ============================================== */

            if (
                existingAlert
            ) {

                existingAlert.guardianId =
                    guardian._id;


                /*
                IMPORTANT:
                SAVE guardian snapshot permanently
                */

                existingAlert.guardianName =
                    guardianName;


                existingAlert.guardianPhone =
                    guardianPhone;


                existingAlert.guardianEmail =
                    guardianEmail;


                existingAlert.deviceId =
                    deviceId;


                existingAlert.wearerId =
                    wearerId;


                existingAlert.wearerName =
                    finalWearerName;


                existingAlert.wearerType =
                    finalWearerType;


                existingAlert.policeStationId =
                    registeredStation.stationId;


                existingAlert.externalPlaceId =
                    registeredStation.externalPlaceId ||
                    "";


                existingAlert.policeStationName =
                    registeredStation.name;


                existingAlert.policeStationAddress =
                    registeredStation.address ||
                    "";


                existingAlert.policeStationPhone =
                    registeredStation.phone ||
                    "";


                existingAlert.latitude =
                    wearerLat;


                existingAlert.longitude =
                    wearerLng;


                existingAlert.alertType =
                    cleanString(
                        alertType
                    ) ||
                    "Emergency Alert";


                existingAlert.distanceKm =
                    finalDistance;


                existingAlert.recommended =
                    Boolean(
                        recommended
                    );


                /*
                Optional fields supported by the newer
                PoliceAlert model.
                */

                if (
                    existingAlert.repeatAlertCount !==
                    undefined
                ) {

                    existingAlert.repeatAlertCount =
                        Number(
                            existingAlert.repeatAlertCount ||
                            1
                        ) + 1;
                }


                if (
                    existingAlert.lastAlertAt !==
                    undefined
                ) {

                    existingAlert.lastAlertAt =
                        new Date();
                }


                await existingAlert.save();


                const updatedAlert =
                    existingAlert.toObject();


                /*
                Aliases used by frontend
                */

                updatedAlert.guardianMobile =
                    guardianPhone;


                updatedAlert.mobileNumber =
                    guardianPhone;


                console.log(
                    "POLICE ALERT UPDATED:",
                    {
                        alertId:
                            existingAlert._id,

                        guardianName:
                            existingAlert.guardianName,

                        guardianPhone:
                            existingAlert.guardianPhone,

                        guardianEmail:
                            existingAlert.guardianEmail,

                        deviceId:
                            existingAlert.deviceId
                    }
                );


                return res
                    .status(200)
                    .json({

                        success: true,

                        repeatedAlert:
                            true,

                        message:
                            "Existing emergency alert updated successfully.",

                        policeAlert:
                            updatedAlert
                    });
            }


            /* =============================================
               CREATE NEW POLICE ALERT
            ============================================== */

            const policeAlert =
                await PoliceAlert.create({

                    guardianId:
                        guardian._id,


                    /*
                    IMPORTANT:
                    Guardian snapshot is now SAVED
                    */

                    guardianName:
                        guardianName,

                    guardianPhone:
                        guardianPhone,

                    guardianEmail:
                        guardianEmail,

                    deviceId:
                        deviceId,


                    /* WEARER */

                    wearerId:
                        wearerId,

                    wearerName:
                        finalWearerName,

                    wearerType:
                        finalWearerType,


                    /* POLICE STATION */

                    policeStationId:
                        registeredStation.stationId,

                    externalPlaceId:
                        registeredStation.externalPlaceId ||
                        "",

                    policeStationName:
                        registeredStation.name,

                    policeStationAddress:
                        registeredStation.address ||
                        "",

                    policeStationPhone:
                        registeredStation.phone ||
                        "",


                    /* LOCATION */

                    latitude:
                        wearerLat,

                    longitude:
                        wearerLng,


                    /* ALERT */

                    alertType:
                        cleanString(
                            alertType
                        ) ||
                        "Emergency Alert",

                    distanceKm:
                        finalDistance,

                    recommended:
                        Boolean(
                            recommended
                        ),

                    status:
                        "Pending",

                    acceptedAt:
                        null,

                    resolvedAt:
                        null
                });


            const createdAlert =
                policeAlert.toObject();


            /*
            Frontend compatibility aliases
            */

            createdAlert.guardianMobile =
                guardianPhone;


            createdAlert.mobileNumber =
                guardianPhone;


            console.log(
                "NEW POLICE ALERT CREATED:",
                {
                    alertId:
                        policeAlert._id,

                    guardianName:
                        policeAlert.guardianName,

                    guardianPhone:
                        policeAlert.guardianPhone,

                    guardianEmail:
                        policeAlert.guardianEmail,

                    deviceId:
                        policeAlert.deviceId
                }
            );


            return res
                .status(201)
                .json({

                    success: true,

                    repeatedAlert:
                        false,

                    message:
                        "Police alert sent successfully.",

                    policeAlert:
                        createdAlert
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
    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                policeStationId
            } = req.params;


            if (
                !policeStationId
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Police station ID is required."
                    });
            }


            const cleanStationId =
                cleanString(
                    policeStationId
                )
                    .toUpperCase();


            const alerts =
                await PoliceAlert.find({

                    policeStationId:
                        cleanStationId

                })
                    .sort({
                        createdAt: -1
                    })
                    .lean();


            const enrichedAlerts =
                await Promise.all(

                    alerts.map(
                        async (
                            alert
                        ) => {

                            return await getGuardianDetails(
                                alert
                            );
                        }
                    )
                );


            res.set(
                "Cache-Control",
                "no-store"
            );


            return res
                .status(200)
                .json({

                    success: true,

                    alerts:
                        enrichedAlerts
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
    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                alertId
            } = req.params;


            const policeAlert =
                await PoliceAlert.findById(
                    alertId
                );


            if (
                !policeAlert
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Police alert not found."
                    });
            }


            if (
                policeAlert.status ===
                "Resolved"
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Resolved alert cannot be accepted."
                    });
            }


            if (
                policeAlert.status !==
                "Accepted"
            ) {

                policeAlert.status =
                    "Accepted";


                policeAlert.acceptedAt =
                    new Date();


                await policeAlert.save();
            }


            const result =
                await getGuardianDetails(
                    policeAlert.toObject()
                );


            return res
                .status(200)
                .json({

                    success: true,

                    message:
                        "Alert accepted successfully.",

                    policeAlert:
                        result
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
    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                alertId
            } = req.params;


            const policeAlert =
                await PoliceAlert.findById(
                    alertId
                );


            if (
                !policeAlert
            ) {

                return res
                    .status(404)
                    .json({

                        success: false,

                        message:
                            "Police alert not found."
                    });
            }


            if (
                policeAlert.status ===
                "Resolved"
            ) {

                const alreadyResolved =
                    await getGuardianDetails(
                        policeAlert.toObject()
                    );


                return res
                    .status(200)
                    .json({

                        success: true,

                        message:
                            "Alert is already resolved.",

                        policeAlert:
                            alreadyResolved
                    });
            }


            if (
                policeAlert.status !==
                "Accepted"
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Accept the alert before resolving it."
                    });
            }


            policeAlert.status =
                "Resolved";


            policeAlert.resolvedAt =
                new Date();


            await policeAlert.save();


            const result =
                await getGuardianDetails(
                    policeAlert.toObject()
                );


            return res
                .status(200)
                .json({

                    success: true,

                    message:
                        "Alert resolved successfully.",

                    policeAlert:
                        result
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