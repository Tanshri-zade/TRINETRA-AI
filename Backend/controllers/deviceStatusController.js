import { DeviceStatus } from "../models/deviceStatusModel.js";


// Update device status

export const updateDeviceStatus = async (
    req,
    res,
    next
) => {

    try {

        const {
            wearerId,
            deviceId,
            battery,
            heartRate,
            gpsStatus,
            gsmStatus,
            microphoneStatus,
            sosButtonStatus,
            tamperStatus
        } = req.body;


        if (!wearerId) {

            return res.status(400).json({
                success: false,
                message: "Wearer ID is required."
            });

        }


        const deviceStatus =
            await DeviceStatus.findOneAndUpdate(

                {
                    wearerId
                },

                {
                    wearerId,
                    deviceId,
                    battery,
                    heartRate,
                    gpsStatus,
                    gsmStatus,
                    microphoneStatus,
                    sosButtonStatus,
                    tamperStatus,
                    lastSeen: new Date()
                },

                {
                    new: true,
                    upsert: true
                }

            );


        res.status(200).json({

            success: true,

            message:
                "Device status updated successfully.",

            deviceStatus

        });

    }

    catch (error) {

        next(error);

    }

};


// Get latest device status

export const getDeviceStatus = async (
    req,
    res,
    next
) => {

    try {

        const {
            wearerId
        } = req.params;


        let deviceStatus =
            await DeviceStatus.findOne({
                wearerId
            });

        if (!deviceStatus) {
            deviceStatus = await DeviceStatus.findOne().sort({ updatedAt: -1, lastSeen: -1 });
        }

        if (!deviceStatus) {
            return res.status(200).json({
                success: true,
                deviceStatus: null
            });
        }


        res.status(200).json({

            success: true,

            deviceStatus

        });

    }

    catch (error) {

        next(error);

    }

};