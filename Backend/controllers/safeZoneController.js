import { SafeZone } from "../models/safeZoneModel.js";
import { Location } from "../models/locationModel.js";
import { Monitoring } from "../models/monitoringModel.js";

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// SAVE OR UPDATE SAFE ZONE
export const saveSafeZone = async (req, res) => {
    try {
        const {
            guardianId,
            wearerId,
            name,
            latitude,
            longitude,
            radius,
            active
        } = req.body;

        if (
            !guardianId ||
            !wearerId ||
            latitude === undefined ||
            longitude === undefined ||
            radius === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "All safe-zone details are required."
            });
        }

        const lat = Number(latitude);
        const lng = Number(longitude);
        const zoneRadius = Number(radius);
        const zoneActive = active !== undefined ? Boolean(active) : true;

        if (
            isNaN(lat) ||
            isNaN(lng) ||
            isNaN(zoneRadius)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid safe-zone values."
            });
        }

        const safeZone = await SafeZone.findOneAndUpdate(
            {
                guardianId: guardianId,
                wearerId: wearerId
            },
            {
                guardianId: guardianId,
                wearerId: wearerId,
                name: name || "Home",
                latitude: lat,
                longitude: lng,
                radius: zoneRadius,
                active: zoneActive
            },
            {
                new: true,
                upsert: true
            }
        );

        // Immediately update Location & Monitoring geofence status if current wearer location exists
        try {
            const currentLocation = await Location.findOne({ wearerId }).sort({ updatedAt: -1 });
            if (currentLocation && currentLocation.latitude !== undefined && currentLocation.longitude !== undefined) {
                const curLat = Number(currentLocation.latitude);
                const curLng = Number(currentLocation.longitude);
                if (Number.isFinite(curLat) && Number.isFinite(curLng)) {
                    const dist = calculateDistanceMeters(lat, lng, curLat, curLng);
                    const isInside = dist <= zoneRadius;
                    const geofenceStatus = zoneActive ? (isInside ? "Inside" : "Outside") : "Not Configured";

                    await Location.updateOne(
                        { _id: currentLocation._id },
                        { $set: { insideSafeZone: zoneActive ? isInside : null } }
                    );

                    await Monitoring.updateOne(
                        { wearerId },
                        { $set: { geofenceStatus } }
                    );
                }
            }
        } catch (syncErr) {
            console.error("SafeZone location sync error:", syncErr);
        }

        res.status(200).json({
            success: true,
            message: "Safe zone saved successfully.",
            safeZone: safeZone
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message || "Unable to save safe zone."
        });
    }
};

// GET SAVED SAFE ZONE
export const getSafeZone = async (req, res) => {
    try {
        const { wearerId } = req.params;

        let safeZone = await SafeZone.findOne({ wearerId });
        if (!safeZone) {
            safeZone = await SafeZone.findOne({ guardianId: wearerId });
        }
        if (!safeZone) {
            safeZone = await SafeZone.findOne().sort({ updatedAt: -1 });
        }

        if (!safeZone) {
            return res.status(404).json({
                success: false,
                message: "Safe zone not configured."
            });
        }

        res.status(200).json({
            success: true,
            safeZone: safeZone
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch safe zone."
        });
    }
};