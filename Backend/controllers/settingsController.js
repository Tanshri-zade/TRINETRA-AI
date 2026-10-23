import { Settings } from "../models/settingsModel.js";
import { Guardian } from "../models/guardianModel.js";


// Get settings

export const getSettings = async (req, res, next) => {

    try {

        const { guardianId } = req.params;


        const guardian =
            await Guardian.findById(guardianId)
                .select("-password");


        if (!guardian) {

            return res.status(404).json({
                success: false,
                message: "Guardian not found."
            });

        }


        let settings =
            await Settings.findOne({
                guardianId
            });


        if (!settings) {

            settings =
                await Settings.create({
                    guardianId
                });

        }


        res.status(200).json({

            success: true,

            guardian,

            settings

        });

    }

    catch (error) {

        next(error);

    }

};



// Save / update settings

export const updateSettings = async (req, res, next) => {

    try {

        const { guardianId } = req.params;


        const {

            guardianName,
            guardianMobile,
            guardianEmail,

            theme,
            language,

            emergencyContact,

            notifications,

            safety,

            privacy

        } = req.body;


        const guardian =
            await Guardian.findById(
                guardianId
            );


        if (!guardian) {

            return res.status(404).json({
                success: false,
                message: "Guardian not found."
            });

        }


        // Check email before changing it

        if (
            guardianEmail &&
            guardianEmail !== guardian.email
        ) {

            const existingGuardian =
                await Guardian.findOne({
                    email: guardianEmail
                });


            if (existingGuardian) {

                return res.status(400).json({
                    success: false,
                    message:
                        "This email is already registered."
                });

            }

        }


        // Update guardian account

        if (guardianName !== undefined) {
            guardian.name = guardianName;
        }


        if (guardianMobile !== undefined) {
            guardian.mobile = guardianMobile;
        }


        if (guardianEmail !== undefined) {
            guardian.email = guardianEmail;
        }


        await guardian.save();


        // Build settings update

        const updateData = {};


        if (theme !== undefined) {

            updateData.theme =
                theme;

        }


        if (language !== undefined) {

            updateData.language =
                language;

        }


        if (emergencyContact) {

            if (
                emergencyContact.name !== undefined
            ) {

                updateData[
                    "emergencyContact.name"
                ] =
                    emergencyContact.name;

            }


            if (
                emergencyContact.number !== undefined
            ) {

                updateData[
                    "emergencyContact.number"
                ] =
                    emergencyContact.number;

            }

        }


        if (notifications) {

            if (
                notifications.emergencyAlerts !== undefined
            ) {

                updateData[
                    "notifications.emergencyAlerts"
                ] =
                    notifications.emergencyAlerts;

            }


            if (
                notifications.geofenceAlerts !== undefined
            ) {

                updateData[
                    "notifications.geofenceAlerts"
                ] =
                    notifications.geofenceAlerts;

            }


            if (
                notifications.voiceAlerts !== undefined
            ) {

                updateData[
                    "notifications.voiceAlerts"
                ] =
                    notifications.voiceAlerts;

            }


            if (
                notifications.tamperAlerts !== undefined
            ) {

                updateData[
                    "notifications.tamperAlerts"
                ] =
                    notifications.tamperAlerts;

            }


            if (
                notifications.lowBatteryAlerts !== undefined
            ) {

                updateData[
                    "notifications.lowBatteryAlerts"
                ] =
                    notifications.lowBatteryAlerts;

            }

        }


        if (safety) {

            if (
                safety.defaultSafeZoneRadius !== undefined
            ) {

                updateData[
                    "safety.defaultSafeZoneRadius"
                ] =
                    safety.defaultSafeZoneRadius;

            }


            if (
                safety.policeConfirmation !== undefined
            ) {

                updateData[
                    "safety.policeConfirmation"
                ] =
                    safety.policeConfirmation;

            }


            if (
                safety.locationSharing !== undefined
            ) {

                updateData[
                    "safety.locationSharing"
                ] =
                    safety.locationSharing;

            }
            if (safety.minBpm !== undefined) {
                updateData["safety.minBpm"] =
                    safety.minBpm;
            }

            if (safety.maxBpm !== undefined) {
                updateData["safety.maxBpm"] =
                    safety.maxBpm;
            }



        }


        if (privacy) {

            if (
                privacy.locationHistory !== undefined
            ) {

                updateData[
                    "privacy.locationHistory"
                ] =
                    privacy.locationHistory;

            }


            if (
                privacy.alertHistory !== undefined
            ) {

                updateData[
                    "privacy.alertHistory"
                ] =
                    privacy.alertHistory;

            }

        }


        const settings =
            await Settings.findOneAndUpdate(

                {
                    guardianId
                },

                {
                    $set: updateData
                },

                {
                    new: true,
                    upsert: true,
                    runValidators: true
                }

            );


        res.status(200).json({

            success: true,

            message:
                "Settings saved successfully.",

            guardian: {
                _id: guardian._id,
                name: guardian.name,
                email: guardian.email,
                mobile: guardian.mobile
            },

            settings

        });

    }

    catch (error) {

        next(error);

    }

};