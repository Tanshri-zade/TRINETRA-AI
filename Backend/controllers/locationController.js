import { Location } from "../models/locationModel.js";
import { LocationHistory } from "../models/locationHistoryModel.js";
import { SafeZone } from "../models/safeZoneModel.js";
import { Monitoring } from "../models/monitoringModel.js";


// ======================================================
// SETTINGS
// ======================================================

// Around 25 metres.
// GPS ke small fluctuations ko movement nahi maana jayega.
const LOCATION_CHANGE_DISTANCE_METERS = 25;


// ======================================================
// CALCULATE DISTANCE BETWEEN TWO GPS POINTS
// ======================================================

function calculateDistanceMeters(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius = 6371000;


    const toRadians = (degree) =>
        degree * Math.PI / 180;


    const dLat =
        toRadians(lat2 - lat1);

    const dLon =
        toRadians(lon2 - lon1);


    const firstLat =
        toRadians(lat1);

    const secondLat =
        toRadians(lat2);


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(firstLat) *
        Math.cos(secondLat) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;
}


// ======================================================
// SAVE / UPDATE LOCATION
// ======================================================

export const updateLocation = async (req, res) => {

    try {

        console.log(
            "NEW GPS DATA RECEIVED:",
            req.body
        );


        const {
            wearerId,
            latitude,
            longitude,
            deviceId
        } = req.body;


        // --------------------------------------------------
        // VALIDATION
        // --------------------------------------------------

        if (
            !wearerId ||
            latitude === undefined ||
            longitude === undefined
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Wearer ID and GPS coordinates are required."

            });

        }


        const lat =
            Number(latitude);

        const lng =
            Number(longitude);


        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid GPS coordinates."

            });

        }


        const now =
            new Date();


        // --------------------------------------------------
        // GET PREVIOUS LATEST LOCATION
        // --------------------------------------------------

        const previousLocation =
            await Location.findOne({
                wearerId: wearerId
            }).lean();


        // --------------------------------------------------
        // CALCULATE GEOFENCE / SAFE ZONE STATUS
        // --------------------------------------------------

        let insideSafeZone = null;
        let geofenceStatus = "Not Configured";

        const zone = await SafeZone.findOne({
            wearerId: wearerId,
            active: true
        });

        if (zone) {
            const distToZone = calculateDistanceMeters(
                Number(zone.latitude),
                Number(zone.longitude),
                lat,
                lng
            );
            insideSafeZone = distToZone <= Number(zone.radius);
            geofenceStatus = insideSafeZone ? "Inside" : "Outside";
        }


        // --------------------------------------------------
        // UPDATE LATEST LOCATION
        // --------------------------------------------------

        const location =
            await Location.findOneAndUpdate(

                {
                    wearerId: wearerId
                },

                {
                    $set: {

                        wearerId:
                            wearerId,

                        latitude:
                            lat,

                        longitude:
                            lng,

                        insideSafeZone:
                            insideSafeZone,

                        deviceId:
                            deviceId || null,

                        updatedAt:
                            now

                    }
                },

                {
                    new: true,
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true
                }

            );


        // Update monitoring document coordinates & geofence
        try {
            await Monitoring.findOneAndUpdate(
                { wearerId: wearerId },
                {
                    $set: {
                        latitude: lat,
                        longitude: lng,
                        geofenceStatus: geofenceStatus,
                        updatedAt: now
                    }
                }
            );
        } catch (_) {}


        // --------------------------------------------------
        // LOCATION HISTORY
        // --------------------------------------------------

        let currentHistory =
            await LocationHistory.findOne({

                wearerId:
                    wearerId,

                isCurrent:
                    true

            }).sort({
                createdAt: -1
            });


        // --------------------------------------------------
        // FIRST LOCATION
        // --------------------------------------------------

        if (!currentHistory) {

            currentHistory =
                await LocationHistory.create({

                    wearerId:
                        wearerId,

                    latitude:
                        lat,

                    longitude:
                        lng,

                    deviceId:
                        deviceId || null,

                    arrivedAt:
                        now,

                    lastSeenAt:
                        now,

                    durationSeconds:
                        0,

                    isCurrent:
                        true

                });


            console.log(
                "FIRST LOCATION HISTORY CREATED:",
                currentHistory._id
            );

        }


        else {

            // --------------------------------------------------
            // CALCULATE DISTANCE FROM CURRENT HISTORY LOCATION
            // --------------------------------------------------

            const distance =
                calculateDistanceMeters(

                    Number(
                        currentHistory.latitude
                    ),

                    Number(
                        currentHistory.longitude
                    ),

                    lat,
                    lng

                );


            console.log(
                "DISTANCE FROM CURRENT LOCATION:",
                distance.toFixed(2),
                "meters"
            );


            // --------------------------------------------------
            // SAME PLACE
            // --------------------------------------------------

            if (
                distance <
                LOCATION_CHANGE_DISTANCE_METERS
            ) {

                const arrivedTime =
                    new Date(
                        currentHistory.arrivedAt
                    ).getTime();


                const durationSeconds =
                    Math.max(
                        0,
                        Math.floor(
                            (
                                now.getTime() -
                                arrivedTime
                            ) / 1000
                        )
                    );


                currentHistory.lastSeenAt =
                    now;


                currentHistory.durationSeconds =
                    durationSeconds;


                currentHistory.deviceId =
                    deviceId ||
                    currentHistory.deviceId ||
                    null;


                await currentHistory.save();


                console.log(
                    "WEARER STILL AT SAME LOCATION:",
                    {
                        distanceMeters:
                            distance.toFixed(2),

                        durationSeconds:
                            durationSeconds
                    }
                );

            }


            // --------------------------------------------------
            // WEARER MOVED TO ANOTHER LOCATION
            // --------------------------------------------------

            else {

                const arrivedTime =
                    new Date(
                        currentHistory.arrivedAt
                    ).getTime();


                const durationSeconds =
                    Math.max(
                        0,
                        Math.floor(
                            (
                                now.getTime() -
                                arrivedTime
                            ) / 1000
                        )
                    );


                // Close previous location

                currentHistory.lastSeenAt =
                    now;

                currentHistory.leftAt =
                    now;

                currentHistory.durationSeconds =
                    durationSeconds;

                currentHistory.isCurrent =
                    false;


                await currentHistory.save();


                console.log(
                    "PREVIOUS LOCATION CLOSED:",
                    {
                        latitude:
                            currentHistory.latitude,

                        longitude:
                            currentHistory.longitude,

                        durationSeconds:
                            durationSeconds
                    }
                );


                // Start new location

                currentHistory =
                    await LocationHistory.create({

                        wearerId:
                            wearerId,

                        latitude:
                            lat,

                        longitude:
                            lng,

                        deviceId:
                            deviceId || null,

                        arrivedAt:
                            now,

                        lastSeenAt:
                            now,

                        durationSeconds:
                            0,

                        isCurrent:
                            true

                    });


                console.log(
                    "NEW LOCATION HISTORY CREATED:",
                    currentHistory._id
                );

            }

        }


        // --------------------------------------------------
        // RESPONSE
        // --------------------------------------------------

        console.log(
            "LOCATION UPDATED:",
            {
                wearerId:
                    location.wearerId,

                latitude:
                    location.latitude,

                longitude:
                    location.longitude,

                updatedAt:
                    location.updatedAt
            }
        );


        return res.status(200).json({

            success: true,

            message:
                "Location updated successfully.",

            location:
                location,

            tracking: {

                historyId:
                    currentHistory?._id || null,

                arrivedAt:
                    currentHistory?.arrivedAt || null,

                lastSeenAt:
                    currentHistory?.lastSeenAt || null,

                durationSeconds:
                    currentHistory?.durationSeconds || 0,

                isCurrent:
                    currentHistory?.isCurrent ?? true

            }

        });

    }

    catch (error) {

        console.log(
            "UPDATE LOCATION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to update location."

        });

    }

};


// ======================================================
// GET LATEST LOCATION
// ======================================================

export const getLatestLocation = async (req, res) => {

    try {

        const {
            wearerId
        } = req.params;


        if (!wearerId) {

            return res.status(400).json({

                success: false,

                message:
                    "Wearer ID is required."

            });

        }


        let location =
            await Location
                .findOne({
                    wearerId:
                        wearerId
                })
                .sort({
                    updatedAt: -1,
                    createdAt: -1
                })
                .lean();

        if (!location) {
            location = await Location.findOne().sort({ updatedAt: -1, createdAt: -1 }).lean();
        }

        if (!location) {
            return res.status(404).json({
                success: false,
                message:
                    "Location not available yet."
            });
        }


        const targetWearerId = location.wearerId || wearerId;

        // Current location history
        let currentHistory =
            await LocationHistory
                .findOne({
                    wearerId:
                        targetWearerId,
                    isCurrent:
                        true
                })
                .sort({
                    createdAt: -1
                })
                .lean();

        if (!currentHistory) {
            currentHistory =
                await LocationHistory
                    .findOne({
                        wearerId:
                            targetWearerId
                    })
                    .sort({
                        createdAt: -1
                    })
                    .lean();
        }


        // Most recent previous location
        let recentLocation =
            await LocationHistory
                .findOne({
                    wearerId:
                        targetWearerId,
                    isCurrent:
                        false
                })
                .sort({
                    leftAt: -1,
                    updatedAt: -1,
                    createdAt: -1
                })
                .lean();

        if (!recentLocation) {
            const previousEntries = await LocationHistory.find({
                wearerId: targetWearerId
            })
            .sort({ createdAt: -1 })
            .limit(2)
            .lean();

            if (previousEntries && previousEntries.length > 1) {
                recentLocation = previousEntries[1];
            }
        }


        console.log(
            "LATEST LOCATION SENT:",
            {
                wearerId:
                    location.wearerId,

                latitude:
                    location.latitude,

                longitude:
                    location.longitude,

                updatedAt:
                    location.updatedAt
            }
        );


        return res.status(200).json({

            success: true,

            location:
                location,

            currentLocation:
                currentHistory || null,

            recentLocation:
                recentLocation || null

        });

    }

    catch (error) {

        console.log(
            "GET LOCATION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to fetch location."

        });

    }

};